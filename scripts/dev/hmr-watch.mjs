/**
 * 连上文档站开发服务器的 HMR 通道，只在编译出错、恢复、断线时各打印一行：交给后台监视（Claude Code 的 Monitor）
 * 盯着，有事才通知，不用轮询日志。
 *
 * 用法：node scripts/dev/hmr-watch.mjs [http://localhost:5174]
 */
const origin = process.argv[2] ?? 'http://localhost:5174';
const say = (line) => process.stdout.write(line.replace(/\s+/g, ' ').slice(0, 600) + '\n');

/** HMR 的 WebSocket 要带上 /@vite/client 里的 wsToken */
async function token() {
  const code = await (await fetch(`${origin}/@vite/client`)).text();
  return code.match(/wsToken\s*=\s*"([^"]*)"/)?.[1] ?? '';
}

let lastError = '';
let open = false;
async function connect() {
  let ws;
  try {
    ws = new WebSocket(`${origin.replace('http', 'ws')}/?token=${await token()}`, 'vite-hmr');
  } catch {
    return setTimeout(connect, 3000);
  }
  ws.onmessage = ({ data }) => {
    const payload = JSON.parse(data);
    if (payload.type === 'error') {
      const { message, id, loc, plugin } = payload.err;
      const where = loc ? `${loc.file ?? id}:${loc.line}:${loc.column}` : (id ?? '');
      const line = `[hmr error] ${plugin ?? ''} ${where} — ${message}`;
      if (line !== lastError) say(line);
      lastError = line;
    } else if (payload.type === 'update' || payload.type === 'full-reload') {
      if (lastError) say('[hmr] recovered');
      lastError = '';
    }
  };
  ws.onopen = () => {
    if (!open) say('[hmr] connected');
    open = true;
  };
  // 连上之后的第一次断开才算一件事，之后的重试不出声
  ws.onclose = () => {
    if (open) say('[hmr] socket closed, retrying');
    open = false;
    setTimeout(connect, 3000);
  };
  ws.onerror = () => {};
}
void connect();
