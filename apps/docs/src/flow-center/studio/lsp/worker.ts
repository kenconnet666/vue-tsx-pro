/**
 * 工作室的语言服务 Worker：浏览器里的 TypeScript 7（tsgo-wasm，与仓库的 typescript 同一个提交）跑 `tsc --lsp --stdio`。
 * 文件系统是内存的（memfs.ts）：工作区里先放好依赖包（library.ts），工程的文件由页面同步进来；
 * LSP 的消息按 Content-Length 分帧，经标准输入输出与页面往返。
 */
/// <reference lib="webworker" />
import { Go } from './go-runtime.js';
import { libraryFiles, WORKSPACE } from './library';
import { createMemFs, createPath, createProcess } from './memfs';
import type { FromLsp, ToLsp } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const post = (message: FromLsp) => self.postMessage(message);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// 标准输出里拼出一条条 LSP 消息
let pending = new Uint8Array(0);
function onStdout(bytes: Uint8Array) {
  const merged = new Uint8Array(pending.length + bytes.length);
  merged.set(pending);
  merged.set(bytes, pending.length);
  pending = merged;
  for (;;) {
    const text = decoder.decode(pending.subarray(0, Math.min(pending.length, 256)));
    const headerEnd = text.indexOf('\r\n\r\n');
    if (headerEnd < 0) return;
    const length = Number(/Content-Length: *(\d+)/i.exec(text.slice(0, headerEnd))?.[1]);
    const start = encoder.encode(text.slice(0, headerEnd + 4)).length;
    if (pending.length < start + length) return;
    post({ kind: 'message', message: decoder.decode(pending.subarray(start, start + length)) });
    pending = pending.subarray(start + length);
  }
}

// 标准错误攒着（留最近的一段）：语言服务退出时连同原因报给页面
let stderr = '';
const memfs = createMemFs({
  onStdout,
  onStderr: (text) => {
    stderr = (stderr + text).slice(-8000);
    console.warn(text);
  },
});
for (const [path, content] of Object.entries(libraryFiles())) memfs.writeFile(path, content);

/** 发给语言服务：加上 Content-Length 头写进标准输入 */
function send(message: string) {
  const body = encoder.encode(message);
  memfs.feed(encoder.encode(`Content-Length: ${body.length}\r\n\r\n`));
  memfs.feed(body);
}

/** 工程的文件：写进工作区；改过已有的、删掉的告诉语言服务（它自己不盯文件） */
const known = new Set<string>();
function syncFiles(files: Readonly<Record<string, string>>, started: boolean) {
  const changes: { uri: string; type: number }[] = [];
  for (const [name, content] of Object.entries(files)) {
    const path = `${WORKSPACE}/${name}`;
    memfs.writeFile(path, content);
    changes.push({ uri: `file://${path}`, type: known.has(name) ? 2 : 1 });
    known.add(name);
  }
  for (const name of [...known].filter((name) => !(name in files))) {
    memfs.removeFile(`${WORKSPACE}/${name}`);
    known.delete(name);
    changes.push({ uri: `file://${WORKSPACE}/${name}`, type: 3 });
  }
  if (started && changes.length > 0)
    send(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'workspace/didChangeWatchedFiles',
        params: { changes },
      }),
    );
}

let started = false;

async function start(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`下载 TypeScript 失败：HTTP ${response.status}`);
  // 发的是 gzip 过的（Cloudflare Pages 单个文件不能超过 25MB）。有的托管会加 Content-Encoding、浏览器已经解开了：
  // 看文件头（gzip 是 1f 8b）再决定解不解
  const raw = await response.arrayBuffer();
  const head = new Uint8Array(raw, 0, 2);
  const bytes =
    head[0] === 0x1f && head[1] === 0x8b
      ? await new Response(
          new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip')),
        ).arrayBuffer()
      : raw;
  const go = new Go();
  // Go 的 syscall 读这三个全局对象（同 Node 里的 fs、process、path）
  const process = createProcess(WORKSPACE);
  Object.assign(globalThis, { fs: memfs.fs, process, path: createPath(process.cwd) });
  go.argv = ['tsc', '--lsp', '--stdio'];
  go.env = {};
  go.exit = (code) =>
    post({ kind: 'error', message: `语言服务退出了（${code}）：${stderr.trim().slice(0, 1200)}` });
  const { instance } = await WebAssembly.instantiate(bytes, go.importObject);
  void go.run(instance);
  started = true;
  post({ kind: 'ready' });
}

self.addEventListener('message', (event: MessageEvent<ToLsp>) => {
  const message = event.data;
  switch (message.kind) {
    case 'start':
      start(message.url).catch((error: unknown) =>
        post({ kind: 'error', message: error instanceof Error ? error.message : String(error) }),
      );
      break;
    case 'message':
      send(message.message);
      break;
    case 'files':
      syncFiles(message.files, started);
      break;
  }
});
