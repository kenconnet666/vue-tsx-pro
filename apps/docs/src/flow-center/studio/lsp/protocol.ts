/** 页面与语言服务 Worker 之间的消息：LSP 的消息原样转发（JSON 文字），另有启动与同步工程文件 */

/** 页面 → Worker */
export type ToLsp =
  /** 下载 wasm（gzip 过的）并启动语言服务 */
  | { readonly kind: 'start'; readonly url: string }
  /** 一条发给语言服务的 LSP 消息 */
  | { readonly kind: 'message'; readonly message: string }
  /** 工程的全部文件（路径相对工程根）：写进工作区，改过的、删掉的告诉语言服务 */
  | { readonly kind: 'files'; readonly files: Readonly<Record<string, string>> };

/** Worker → 页面 */
export type FromLsp =
  | { readonly kind: 'ready' }
  /** 语言服务发来的一条 LSP 消息 */
  | { readonly kind: 'message'; readonly message: string }
  /** 下载、启动失败，或语言服务退出了 */
  | { readonly kind: 'error'; readonly message: string };
