/**
 * 失效推送的服务端（见 invalidation.ts）：记下连着的浏览器，publish 的标签合并后以 SSE 事件推出去。
 * 事件编号是 `启动标记-序号`：浏览器重连时带上 Last-Event-ID，同一次启动、还在保留范围里的补发，否则发 reset。
 * 多实例部署时由消息通道驱动（easy-query-ts-cache 的 createBus），每个实例推给连着自己的浏览器：
 *
 *   await bus.subscribe((message) => hub.publish(message.tables), () => hub.reset());
 */

/** createInvalidationHub 的选项 */
export interface InvalidationHubOptions {
  /** 保留最近多少条事件给重连补发，默认 500 */
  history?: number;
  /** 多久发一次心跳注释（毫秒），免得代理把空闲的连接断掉；默认 25 秒 */
  heartbeat?: number;
}

/** 失效推送的服务端 */
export interface InvalidationHub {
  /** 报出改了的标签（表名）：同一轮事件循环里报的合成一条，推给所有连着的浏览器 */
  publish(tags: readonly string[]): void;
  /** 说不清漏了哪些（上游的消息通道断过）：连着的浏览器全部失效，之后重连带来的旧编号也按 reset 处理 */
  reset(): void;
  /** 一个浏览器的 SSE 连接（createRenderer 在 GET /_invalidation 上调用它） */
  connect(request: Request): Response;
}

interface Sent {
  readonly seq: number;
  readonly text: string;
}

const encoder = new TextEncoder();

/** 建一个失效推送（每个服务端进程一个） */
export function createInvalidationHub(options: InvalidationHubOptions = {}): InvalidationHub {
  const { history = 500, heartbeat = 25_000 } = options;
  // 每次启动（与每次 reset）不同：重连带来的编号是之前的，说明中间可能漏了
  const started = Date.now().toString(36);
  let resets = 0;
  let epoch = started;
  const clients = new Set<(text: string) => void>();
  const sent: Sent[] = [];
  let seq = 0;
  let pending: Set<string> | undefined;

  const frame = (id: number, tags: readonly string[]) =>
    `id: ${epoch}-${id}\ndata: ${JSON.stringify(tags)}\n\n`;

  function flush() {
    const tags = [...pending!];
    pending = undefined;
    const item = { seq: ++seq, text: frame(seq, tags) };
    sent.push(item);
    if (sent.length > history) sent.shift();
    for (const send of clients) send(item.text);
  }

  /** 重连时要补发的：同一次启动、还在保留范围里时是错过的那些，否则 reset */
  function catchUp(lastEventId: string | null): string {
    if (!lastEventId) return '';
    const [lastEpoch, lastSeq] = lastEventId.split('-');
    const after = Number(lastSeq);
    const oldest = sent[0]?.seq ?? seq + 1;
    if (lastEpoch !== epoch || !Number.isInteger(after) || after < oldest - 1) {
      return resetFrame();
    }
    return sent
      .filter((item) => item.seq > after)
      .map((item) => item.text)
      .join('');
  }

  const resetFrame = () => `id: ${epoch}-${seq}\nevent: reset\ndata: \n\n`;

  return {
    reset() {
      epoch = `${started}x${++resets}`;
      sent.length = 0;
      const text = resetFrame();
      for (const send of clients) send(text);
    },
    publish(tags) {
      if (tags.length === 0) return;
      if (!pending) {
        pending = new Set();
        queueMicrotask(flush);
      }
      for (const tag of tags) pending.add(tag);
    },
    connect(request) {
      let send: ((text: string) => void) | undefined;
      let timer: ReturnType<typeof setInterval> | undefined;
      const close = () => {
        if (send) clients.delete(send);
        clearInterval(timer);
      };
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          send = (text) => controller.enqueue(encoder.encode(text));
          // 先发一行注释：响应头立刻发出，浏览器的 EventSource 进入 open
          send(`: connected\n\n${catchUp(request.headers.get('last-event-id'))}`);
          clients.add(send);
          timer = setInterval(() => send!(': ping\n\n'), heartbeat);
          request.signal.addEventListener('abort', () => {
            close();
            try {
              controller.close();
            } catch {
              // 已经被 cancel 关掉了
            }
          });
        },
        cancel: close,
      });
      return new Response(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          // nginx 默认缓冲代理的响应，SSE 要关掉
          'x-accel-buffering': 'no',
        },
      });
    },
  };
}
