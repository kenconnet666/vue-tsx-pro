/**
 * 流程中心的 Worker：PGlite（数据存 IndexedDB，刷新不丢）+ 引擎都在这里，页面经客户端调用（servePort），主线程只渲染。
 * 第一次打开时建表、发布流程、写种子，进度报给页面；演示身份与时钟由页面的消息改；每 5 秒跑一次到点的作业。
 */
/// <reference lib="webworker" />
import { PGlite } from '@electric-sql/pglite';
import { pglite } from '@zerodep-dev/easy-query-ts-pg/pglite';
import {
  createFlowEngine,
  flowEndpoint,
  servePort,
  type Actor,
  type FlowEndpoint,
  type FlowEngine,
} from '@zerodep-dev/flow-ts-engine';
import { actorOf, org, personOf, resolvers } from '../domain/org';
import { seed } from '../domain/seed';
import { PROCESSES } from '../processes';
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

let current: Actor = actorOf(personOf('1003')!);
let engine: FlowEngine | undefined;
let database: PGlite | undefined;

/** 演示的自动动作：付款推给 ERP，单笔核定超过 2 万时 ERP 拒收（作业失败进异常） */
const actions = {
  payout: ({ variables }: { variables: Readonly<Record<string, unknown>> }) => {
    if (Number(variables['approved'] ?? 0) > 20_000)
      throw new Error('ERP 拒收：单笔超过 2 万要走线下审批');
  },
};

async function boot(): Promise<void> {
  database = new PGlite(DATA_DIR);
  engine = createFlowEngine({
    adapter: pglite(database),
    clock: now,
    org,
    extensions: { resolvers, actions },
  });
  post({ demo: 'progress', step: '准备数据库', done: 0, total: 1 });
  await engine.createTables();
  if ((await engine.query.processes()).length === 0) {
    for (const [index, entry] of PROCESSES.entries()) {
      post({
        demo: 'progress',
        step: `发布流程：${entry.definition.name}`,
        done: index,
        total: PROCESSES.length,
      });
      await engine.publish(entry.definition);
    }
    const ready = engine;
    await seed(
      ready,
      (daysAgo, hour = 10) => {
        const at = new Date(Date.now() + offset);
        at.setDate(at.getDate() - daysAgo);
        at.setHours(hour, 0, 0, 0);
        fixed = at;
      },
      (step, done, total) => post({ demo: 'progress', step, done, total }),
    );
    fixed = null;
    // 种子里有到期的、要异步执行的：现在跑一遍（超时、付款失败）
    await ready.jobs.runDue();
  }
  post({ demo: 'ready', now: now().toISOString(), offset });
}

/** 删库：关掉 PGlite，删 IndexedDB 里的库 */
async function wipe(): Promise<void> {
  await database?.close();
  database = undefined;
  engine = undefined;
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

self.addEventListener('message', (event: MessageEvent) => {
  const data: unknown = event.data;
  if (!isDemoMessage(data)) return;
  const message = data as ToWorker;
  void (async () => {
    try {
      switch (message.demo) {
        case 'init':
          current = actorOf(personOf(message.actor) ?? personOf('1003')!);
          offset = message.offset;
          await boot();
          serve();
          setInterval(() => void runJobs().catch(() => {}), JOB_INTERVAL);
          break;
        case 'actor':
          current = actorOf(personOf(message.actor) ?? personOf('1003')!);
          break;
        case 'advance':
          offset += message.by;
          await runJobs();
          post({ demo: 'clock', now: now().toISOString(), offset });
          // 时间变了：期限、超时的显示都要重算
          endpoint?.changed();
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
