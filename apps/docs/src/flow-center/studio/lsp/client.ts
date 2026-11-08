/**
 * 工作室的语言服务（页面这一头）：第一次用到时建 Worker、下载并启动浏览器里的 TypeScript 7（worker.ts）；
 * 编辑器经 @codemirror/lsp-client 接上它——补全、悬停、诊断、跳转定义。工程的文件改了就同步过去。
 * 整个流程中心共用一个（换流程时同步新的文件）。
 */
import type { Extension } from '@codemirror/state';
import { linter, type Diagnostic } from '@codemirror/lint';
import {
  languageServerExtensions,
  LSPClient,
  LSPPlugin,
  type Transport,
} from '@codemirror/lsp-client';
import { shallowReactive } from 'vue';
import { tsgoBuild, tsgoWasmUrl } from 'virtual:tsgo-wasm';
import { WORKSPACE } from './library';
import type { FromLsp, ToLsp } from './protocol';

/** 语言服务的状态（编辑器旁边显示） */
export const lspState = shallowReactive({
  status: 'idle' as 'idle' | 'loading' | 'ready' | 'error',
  message: '',
  build: tsgoBuild,
});

let service: { client: LSPClient; worker: Worker } | undefined;

function startService() {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const send = (message: ToLsp) => worker.postMessage(message);
  const handlers = new Set<(message: string) => void>();
  const transport: Transport = {
    send: (message) => send({ kind: 'message', message }),
    subscribe: (handler) => void handlers.add(handler),
    unsubscribe: (handler) => void handlers.delete(handler),
  };
  const client = new LSPClient({
    rootUri: `file://${WORKSPACE}/`,
    extensions: languageServerExtensions(),
  });
  worker.addEventListener('message', (event: MessageEvent<FromLsp>) => {
    const message = event.data;
    if (message.kind === 'message') for (const handler of handlers) handler(message.message);
    else if (message.kind === 'ready') {
      lspState.status = 'ready';
      client.connect(transport);
    } else {
      lspState.status = 'error';
      lspState.message = message.message;
    }
  });
  lspState.status = 'loading';
  send({ kind: 'start', url: tsgoWasmUrl });
  return { client, worker };
}

/** 工程的文件同步给语言服务（第一次调用时启动它） */
export function syncLanguageService(files: Readonly<Record<string, string>>): void {
  service ??= startService();
  service.worker.postMessage({ kind: 'files', files } satisfies ToLsp);
}

/** LSP 的一条诊断（textDocument/diagnostic 的结果里） */
interface LspDiagnostic {
  readonly range: {
    readonly start: { line: number; character: number };
    readonly end: { line: number; character: number };
  };
  /** 1 错误、2 警告、3 信息、4 提示 */
  readonly severity?: number;
  readonly message: string;
}

const SEVERITY = { 1: 'error', 2: 'warning', 3: 'info', 4: 'hint' } as const;

/**
 * 诊断：TypeScript 7 的 LSP 只给拉取式的（textDocument/diagnostic），@codemirror/lsp-client 只认推送的；
 * 停手半秒后把改动同步过去、要这个文件的诊断，换成编辑器的标记
 */
const pullDiagnostics = (uri: string) =>
  linter(
    async (view) => {
      const plugin = LSPPlugin.get(view);
      if (!plugin || lspState.status !== 'ready') return [];
      plugin.client.sync();
      const doc = plugin.syncedDoc;
      const result = await plugin.client.request<
        { textDocument: { uri: string } },
        { items?: readonly LspDiagnostic[] } | null
      >('textDocument/diagnostic', { textDocument: { uri } });
      return (result?.items ?? []).map((item): Diagnostic => ({
        from: plugin.fromPosition(item.range.start, doc),
        to: plugin.fromPosition(item.range.end, doc),
        severity: SEVERITY[(item.severity ?? 1) as keyof typeof SEVERITY],
        message: item.message,
      }));
    },
    { delay: 500 },
  );

/** 编辑这个文件时挂到编辑器上的扩展（补全、悬停、跳转，加上诊断）；不是 TS 文件时没有 */
export function languageServicePlugin(path: string): Extension {
  if (!/\.tsx?$/.test(path)) return [];
  service ??= startService();
  const uri = `file://${WORKSPACE}/${path}`;
  return [
    service.client.plugin(uri, path.endsWith('.tsx') ? 'typescriptreact' : 'typescript'),
    pullDiagnostics(uri),
  ];
}
