/**
 * 流程中心的后端：库里的组织（引擎的组织目录）接上引擎，加上第一次打开时的准备——建表、同步组织、发布流程、写种子。
 * Worker 用它；测试在 Node 的 PGlite 上也用它，确认种子在全新的库上走得通。
 */
import {
  createFlowEngine,
  type FlowEngine,
  type FlowEngineOptions,
  type TransformCode,
} from '@zerodep-dev/flow-ts-engine';
import { createOrgDirectory, type OrgDirectory } from '@zerodep-dev/flow-ts-engine/org';
import type { FlowProject } from '@zerodep-dev/flow-ts-model';
import { isAdmin, ORG } from '../domain/org';
import { seed, type TimeTravel } from '../domain/seed';
import { PROCESSES } from '../processes';

export interface Backend {
  readonly directory: OrgDirectory;
  readonly engine: FlowEngine;
}

/**
 * 演示的自动动作：付款推给 ERP。节点的参数说按哪个字段付（field）、ERP 收的单笔上限（limit）：
 * 超过上限时 ERP 拒收，作业失败进异常，管理员重试或跳过
 */
const actions: NonNullable<FlowEngineOptions['extensions']>['actions'] = {
  payout: (context) => {
    const { args } = context;
    const field = typeof args['field'] === 'string' ? args['field'] : 'amount';
    const amount = Number(context.read(field) ?? 0);
    const limit = Number(args['limit'] ?? Infinity);
    if (amount > limit)
      throw new Error(`ERP 拒收：单笔超过 ${(limit / 10_000).toLocaleString()} 万要走线下审批`);
  },
};

/**
 * 流程工程的 .ts 编成引擎链接器认的模块：就在这个线程里编（已经在 Worker 里了，不卡界面），Babel 用到时才加载。
 * 同流程工作室的 compileInPlace
 */
const compileProjectFile: TransformCode = async (source, path) => {
  const { compileInThread } = await import('@zerodep-dev/vue-tsx-pro-tsx/browser-compile');
  return compileInThread(source, { filename: path });
};

/** 引擎的扩展、组织、编译：流程中心与工作室的试运行同一套（试运行另开内存库，组织仍读这份目录的快照） */
export const trialOptions = (directory: OrgDirectory) => ({
  org: directory.org,
  extensions: { resolvers: directory.resolvers, actions },
  transform: compileProjectFile,
});

export function createBackend(adapter: FlowEngineOptions['adapter'], clock: () => Date): Backend {
  const directory = createOrgDirectory({ adapter, isAdmin });
  const engine = createFlowEngine({ adapter, clock, ...trialOptions(directory) });
  return { directory, engine };
}

/** 工程的流程键（process.json 里的 key）；读不出时为空 */
export function definitionKey(project: FlowProject): string | undefined {
  try {
    return (JSON.parse(project.files['process.json'] ?? '') as { key?: string }).key;
  } catch {
    return undefined;
  }
}

export interface PrepareOptions {
  /** 写种子时拨时钟：回到几天前的某个钟点 */
  readonly at: TimeTravel;
  /** 种子写完，时钟回到现在 */
  readonly resume: () => void;
  readonly progress: (step: string, done: number, total: number) => void;
}

/** 缺的表建上；组织是空的才同步，没发布过的流程补发；种子只在第一次打开（重置之后）写 */
export async function prepare(
  { directory, engine }: Backend,
  { at, resume, progress }: PrepareOptions,
): Promise<void> {
  progress('准备数据库', 0, 1);
  await directory.createTables();
  await engine.createTables();
  if ((await directory.snapshot()).employees.length === 0) {
    progress('同步组织', 0, 1);
    await directory.sync(ORG);
  }
  // 没发布过的都发布（文档站加了新流程，老的库也补上）；种子只在第一次写
  const published = new Set((await engine.query.processes()).map((d) => d.key));
  for (const [index, entry] of PROCESSES.entries()) {
    if (published.has(entry.definition.key)) continue;
    progress(`发布流程：${entry.definition.name}`, index, PROCESSES.length);
    await engine.publish(entry.project ?? entry.definition);
  }
  if (published.size > 0) return;
  await seed(engine, {
    actor: async (id) => {
      const actor = await directory.actorOf(id);
      if (!actor) throw new Error(`种子：组织里没有在职的 ${id}`);
      return actor;
    },
    at,
    progress,
  });
  resume();
  // 种子里有到期的、要异步执行的：现在跑一遍（超时、付款失败）
  await engine.jobs.runDue();
}
