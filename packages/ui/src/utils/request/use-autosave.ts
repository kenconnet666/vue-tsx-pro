/**
 * 自动保存：内容改了停一会儿就存（编辑器的草稿、长表单）。只在内容和上次存的（或载入时的）不一样时才存；
 * 别人先存过（冲突）时停下来，等使用方决定载入别人的还是放弃。
 *
 *   const autosave = useAutosave({
 *     content: () => JSON.stringify(definition),
 *     save: (content) => api.post('/drafts/save', { content, rev }),
 *     isConflict: (error) => error instanceof HttpError && error.code === 'app.concurrent-modification',
 *   });
 *   autosave.start();          // 编辑器载入好了：现在的内容是基准，之后改了才存
 *   autosave.status.state      // idle | saving | saved | conflict | failed
 *   autosave.start();          // 发布、放弃、载入别人的之后再调一次：清掉状态，现在的内容是新的基准
 */
import { onBeforeUnmount, shallowReactive, watch } from 'vue';

/** useAutosave 的选项 */
export interface AutosaveOptions<Saved> {
  /** 现在的内容；和基准相同（===）时不存。对象请给序列化后的文字 */
  content: () => string;
  /** 存一份；抛错时状态是 failed（isConflict 认出的是 conflict） */
  save: (content: string) => Promise<Saved>;
  /** 改完停多久再存（毫秒），默认 2000 */
  delay?: number;
  /** 认出冲突（别人先存过）：之后不再自动存，直到再 start */
  isConflict?: (error: unknown) => boolean;
  /** 现在能不能存（比如还没填标识）；不给时总能存 */
  enabled?: () => boolean;
}

/** 自动保存现在怎样 */
export interface AutosaveStatus<Saved> {
  /** idle 没改过；saving 正在存；saved 存好了；conflict 别人先存过，我的没存；failed 存的时候出错 */
  state: 'idle' | 'saving' | 'saved' | 'conflict' | 'failed';
  /** 最近一次存好的结果 */
  saved: Saved | null;
  /** 最近一次失败、冲突的错误（冲突时从里面取是谁先存的） */
  error: unknown;
}

/** useAutosave 的结果 */
export interface Autosave<Saved> {
  /** 状态（响应式） */
  readonly status: AutosaveStatus<Saved>;
  /** 开始（或重新开始）：清掉状态与计时，现在的内容是基准，之后改了才存；saved 是载入时已有的那份 */
  start(saved?: Saved | null): void;
  /** 有改动时马上存（离开页面前、手动保存） */
  flush(): Promise<void>;
  /** 停下：不再自动存，直到 start */
  stop(): void;
}

/** 内容改了停一会儿就存（在 setup 里调用；组件卸载时停下） */
export function useAutosave<Saved>(options: AutosaveOptions<Saved>): Autosave<Saved> {
  const delay = options.delay ?? 2000;
  const status = shallowReactive<AutosaveStatus<Saved>>({ state: 'idle', saved: null, error: null });
  // 和这份内容一样时不用存：载入时的、刚存过的；null 是还没开始
  let baseline: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function flush() {
    clearTimeout(timer);
    const content = options.content();
    if (baseline === null || content === baseline || status.state === 'conflict' || options.enabled?.() === false) return;
    status.state = 'saving';
    try {
      status.saved = await options.save(content);
      baseline = content;
      status.error = null;
      status.state = 'saved';
    } catch (error) {
      status.error = error;
      status.state = options.isConflict?.(error) ? 'conflict' : 'failed';
    }
  }

  function start(saved: Saved | null = null) {
    clearTimeout(timer);
    baseline = options.content();
    Object.assign(status, { state: 'idle', saved, error: null });
  }

  watch(options.content, () => {
    if (baseline === null) return;
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), delay);
  });
  onBeforeUnmount(() => clearTimeout(timer));

  return {
    status,
    start,
    flush,
    stop() {
      clearTimeout(timer);
      baseline = null;
    },
  };
}
