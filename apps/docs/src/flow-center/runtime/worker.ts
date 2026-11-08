/**
 * 流程中心的 Worker：PGlite（数据存 IndexedDB，刷新不丢）+ 引擎都在这里，页面经客户端调用（servePort），主线程只渲染。
 * 第一次打开时建表、同步组织、发布流程、写种子（backend.ts），进度报给页面。
 * 演示身份与时钟由页面的消息改；每 5 秒跑一次到点的作业。
 */
/// <reference lib="webworker" />
import { PGlite } from '@electric-sql/pglite';
import { listen, pglite } from '@zerodep-dev/easy-query-ts-pg/pglite';
import {
  FLOW_CHANNEL,
  FlowError,
  flowEndpoint,
  servePort,
  type Actor,
  type FlowEndpoint,
  type FlowEngine,
} from '@zerodep-dev/flow-ts-engine';
import type { OrgDirectory } from '@zerodep-dev/flow-ts-engine/org';
import { DEFAULT_ACTOR } from '../domain/org';
import { runScenarios, simulate } from '@zerodep-dev/flow-ts-engine/testing';
import type { FlowProject } from '@zerodep-dev/flow-ts-model';
import { createBackend, definitionKey, prepare, trialOptions } from './backend';
import type { Business } from '../domain/business';
import {
  isDemoMessage,
  type FromWorker,
  type ToWorker,
  type WorkerMethod,
  type WorkerMethods,
} from './messages';

declare const self: DedicatedWorkerGlobalScope;

/** IndexedDB 里的库名（PGlite 存成 /pglite/<名字>） */
const DATA_DIR = 'idb://flow-center';
/**
 * 库的结构版本：引擎、组织目录的表加了列时加一。createTables 只建缺的表、不补列，浏览器里存的老库对不上就删了重建
 * （演示数据，不做迁移；服务端部署用 easy-query 的迁移）
 */
const SCHEMA_VERSION = 3;
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
let business: Business | undefined;
let database: PGlite | undefined;

/** 换演示身份：库里没有（或已离职）时回到默认身份；还没启动好时先记下，启动完再换 */
async function useActor(id: string): Promise<void> {
  actorId = id;
  if (!directory) return;
  current = (await directory.actorOf(id)) ?? (await directory.actorOf(DEFAULT_ACTOR))!;
}

/** 存的库是老结构（有流程的表，版本对不上） */
async function outdated(db: PGlite): Promise<boolean> {
  const tables = await db.query<{ name: string }>(
    `SELECT tablename AS name FROM pg_tables
     WHERE schemaname = 'public' AND tablename IN ('flow_work_item', 'demo_schema')`,
  );
  const names = new Set(tables.rows.map((r) => r.name));
  if (!names.has('flow_work_item')) return false;
  if (!names.has('demo_schema')) return true;
  const { rows } = await db.query<{ version: number }>('SELECT version FROM demo_schema');
  return rows[0]?.version !== SCHEMA_VERSION;
}

async function boot(): Promise<void> {
  database = new PGlite(DATA_DIR);
  if (await outdated(database)) {
    await wipe();
    database = new PGlite(DATA_DIR);
  }
  await database.exec(
    `CREATE TABLE IF NOT EXISTS demo_schema (version int);
     DELETE FROM demo_schema;
     INSERT INTO demo_schema VALUES (${SCHEMA_VERSION});`,
  );
  const backend = createBackend(pglite(database), now);
  ({ engine, directory, business } = backend);
  // 收听引擎的广播（推进、作业、发布都随提交发出）：数据变了就告诉页面；同服务端多实例时的接法（core/channels.ts）
  await listen(database, FLOW_CHANNEL, () => endpoint?.changed());
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
  business = undefined;
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
  // 作业改了数据时引擎会广播 FLOW_CHANNEL，下面收听它通知页面
  await engine?.jobs.runDue();
}

/** 改了组织之后：把新的组织发给页面、重算当前身份（角色、部门可能变了），用到名字的列表也跟着刷新 */
async function orgChanged(): Promise<void> {
  post({ demo: 'org', org: await directory!.snapshot() });
  await useActor(actorId);
  endpoint?.changed();
}

/** 被调用的流程（合同调付款）要在试运行的库里：已发布的都先发上去（同键的就是在试的这个，不发旧的） */
async function otherProcesses(project: FlowProject) {
  const key = definitionKey(project);
  const others = (await engine!.versions.catalog())
    .filter((entry) => entry.key !== key)
    .map((entry) => engine!.versions.project(entry.key));
  return Promise.all(others);
}

/** Worker 的方法（页面经 center.call 调用） */
const methods: {
  [M in WorkerMethod]: (
    argument: Parameters<WorkerMethods[M]>[0],
  ) => Promise<ReturnType<WorkerMethods[M]>>;
} = {
  saveDepartment: async (department) => {
    await directory!.saveDepartment(department);
    await orgChanged();
  },
  removeDepartment: async (id) => {
    await directory!.removeDepartment(id);
    await orgChanged();
  },
  saveEmployee: async (employee) => {
    await directory!.saveEmployee(employee);
    await orgChanged();
  },
  saveRole: async (role) => {
    await directory!.saveRole(role);
    await orgChanged();
  },
  actorOf: (id) => directory!.actorOf(id),
  simulate: async ({ project, input }) =>
    simulate(project, {
      ...input,
      processes: await otherProcesses(project),
      options: trialOptions({ directory: directory!, business: business! }),
    }),
  runTests: async ({ project }) =>
    runScenarios(project, {
      options: trialOptions({ directory: directory!, business: business! }),
      processes: await otherProcesses(project),
      actorOf: (id) => directory!.actorOf(id),
    }),
};

async function call({ call, method, argument }: Extract<ToWorker, { demo: 'call' }>) {
  try {
    if (!directory || !engine) throw new Error('流程中心还没启动好');
    const value = await (methods[method] as (argument: unknown) => Promise<unknown>)(argument);
    post({ demo: 'reply', call, value });
  } catch (error) {
    post({
      demo: 'reply',
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
        case 'call':
          await call(message);
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
