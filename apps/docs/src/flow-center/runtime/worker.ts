/**
 * 流程中心的 Worker：PGlite（数据存 IndexedDB，刷新不丢）+ 引擎都在这里，页面经客户端调用（servePort），主线程只渲染。
 * 第一次打开时建表、同步组织、发布流程、写种子（backend.ts），进度报给页面。
 * 演示身份与时钟由页面的消息改；每 5 秒跑一次到点的作业。
 */
/// <reference lib="webworker" />
import { PGlite } from '@electric-sql/pglite';
import { pglite } from '@zerodep-dev/easy-query-ts-pg/pglite';
import {
  FlowError,
  flowEndpoint,
  servePort,
  type Actor,
  type FlowEndpoint,
  type FlowEngine,
} from '@zerodep-dev/flow-ts-engine';
import type { OrgDirectory } from '@zerodep-dev/flow-ts-engine/org';
import { DEFAULT_ACTOR } from '../domain/org';
import { createBackend, prepare } from './backend';
import { isDemoMessage, type FromWorker, type ToWorker } from './messages';

declare const self: DedicatedWorkerGlobalScope;

/** IndexedDB 里的库名（PGlite 存成 /pglite/<名字>） */
const DATA_DIR = 'idb://flow-center';
/** 跑到点作业的间隔 */
const JOB_INTERVAL = 5_000;

const post = (message: FromWorker) => self.postMessage(message);

// 时钟：真实时间加上快进的偏移；写种子时钉在过去的某一刻
let offset = 0;
let fixed: Date | null = null;
const now = () => fixed ?? new Date(Date.now() + offset);

let actorId = DEFAULT_ACTOR;
let current: Actor = { id: DEFAULT_ACTOR };
let engine: FlowEngine | undefined;
let directory: OrgDirectory | undefined;
let database: PGlite | undefined;

/** 换演示身份：库里没有（或已离职）时回到默认身份；还没启动好时先记下，启动完再换 */
async function useActor(id: string): Promise<void> {
  actorId = id;
  if (!directory) return;
  current = (await directory.actorOf(id)) ?? (await directory.actorOf(DEFAULT_ACTOR))!;
}

async function boot(): Promise<void> {
  database = new PGlite(DATA_DIR);
  const backend = createBackend(pglite(database), now);
  ({ engine, directory } = backend);
  await prepare(backend, {
    at: (daysAgo, hour = 10) => {
      const at = new Date(Date.now() + offset);
      at.setDate(at.getDate() - daysAgo);
      at.setHours(hour, 0, 0, 0);
      fixed = at;
    },
    resume: () => (fixed = null),
    progress: (step, done, total) => post({ demo: 'progress', step, done, total }),
  });
  await useActor(actorId);
  post({ demo: 'org', org: await backend.directory.snapshot() });
  post({ demo: 'ready', now: now().toISOString(), offset });
}

/** 删库：关掉 PGlite，删 IndexedDB 里的库 */
async function wipe(): Promise<void> {
  await database?.close();
  database = undefined;
  engine = undefined;
  directory = undefined;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(`/pglite/${DATA_DIR.slice('idb://'.length)}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** 端点与端口服务：启动、重置后按新的引擎重建 */
let endpoint: FlowEndpoint | undefined;
let stopServing: (() => void) | undefined;
function serve(): void {
  stopServing?.();
  endpoint = flowEndpoint(engine!, { actor: () => current });
  stopServing = servePort(self, endpoint);
}

/** 跑到点的作业；跑了的话告诉页面数据变了、时钟到了哪 */
async function runJobs(): Promise<void> {
  if (!engine) return;
  const ran = await engine.jobs.runDue();
  if (ran > 0) endpoint?.changed();
}

/** 维护组织：改完把新的组织发给页面、重算当前身份（角色、部门可能变了），用到名字的列表也跟着刷新 */
async function callOrg({ call, method, argument }: Extract<ToWorker, { demo: 'orgCall' }>) {
  try {
    if (!directory) throw new Error('流程中心还没启动好');
    await (directory[method] as (argument: unknown) => Promise<void>)(argument);
    post({ demo: 'orgReply', call });
    post({ demo: 'org', org: await directory.snapshot() });
    await useActor(actorId);
    endpoint?.changed();
  } catch (error) {
    post({
      demo: 'orgReply',
      call,
      error: {
        code: error instanceof FlowError ? error.code : 'internal',
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

self.addEventListener('message', (event: MessageEvent) => {
  const data: unknown = event.data;
  if (!isDemoMessage(data)) return;
  const message = data as ToWorker;
  void (async () => {
    try {
      switch (message.demo) {
        case 'init':
          actorId = message.actor;
          offset = message.offset;
          await boot();
          serve();
          setInterval(() => void runJobs().catch(() => {}), JOB_INTERVAL);
          break;
        case 'actor':
          await useActor(message.actor);
          break;
        case 'advance':
          offset += message.by;
          await runJobs();
          post({ demo: 'clock', now: now().toISOString(), offset });
          // 时间变了：期限、超时的显示都要重算
          endpoint?.changed();
          break;
        case 'orgCall':
          await callOrg(message);
          break;
        case 'reset':
          await wipe();
          offset = 0;
          await boot();
          serve();
          endpoint?.changed();
          break;
      }
    } catch (error) {
      post({ demo: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  })();
});
