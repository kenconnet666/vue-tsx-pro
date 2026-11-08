/**
 * 页面与 Worker 之间演示用的消息（引擎的调用另走客户端的端口协议，带 flow 标记）：
 * 页面让 Worker 启动、换演示身份、拨时钟、重置；Worker 报启动的进度、准备好了、现在几点。
 */

/** 页面 → Worker */
export type ToWorker =
  /** 启动：用这个身份、时钟偏移（毫秒，快进过的） */
  | { readonly demo: 'init'; readonly actor: string; readonly offset: number }
  /** 换演示身份 */
  | { readonly demo: 'actor'; readonly actor: string }
  /** 时钟往后拨（毫秒），拨完跑到点的作业 */
  | { readonly demo: 'advance'; readonly by: number }
  /** 删掉演示数据重来 */
  | { readonly demo: 'reset' };

/** Worker → 页面 */
export type FromWorker =
  /** 启动的进度：第一次打开要建表、发布流程、写种子 */
  | {
      readonly demo: 'progress';
      readonly step: string;
      readonly done: number;
      readonly total: number;
    }
  /** 准备好了 */
  | { readonly demo: 'ready'; readonly now: string; readonly offset: number }
  /** 时钟变了（拨过、作业跑过） */
  | { readonly demo: 'clock'; readonly now: string; readonly offset: number }
  /** 启动失败 */
  | { readonly demo: 'error'; readonly message: string };

/** 是演示的消息（不是引擎的） */
export const isDemoMessage = (data: unknown): data is ToWorker | FromWorker =>
  typeof data === 'object' && data !== null && 'demo' in data;
