/**
 * 流程中心的后端：库里的组织（引擎的组织目录）接上引擎，加上第一次打开时的准备——建表、同步组织、发布流程、写种子。
 * Worker 用它；测试在 Node 的 PGlite 上也用它，确认种子在全新的库上走得通。
 */
import {
  createFlowEngine,
  type FlowEngine,
  type FlowEngineOptions,
} from '@zerodep-dev/flow-ts-engine';
import { createOrgDirectory, type OrgDirectory } from '@zerodep-dev/flow-ts-engine/org';
import { ORG, ROLE } from '../domain/org';
import { seed, type TimeTravel } from '../domain/seed';
import { PROCESSES } from '../processes';

export interface Backend {
  readonly directory: OrgDirectory;
  readonly engine: FlowEngine;
}

/** 演示的自动动作：付款推给 ERP，单笔核定超过 2 万时 ERP 拒收（作业失败进异常） */
const actions = {
  payout: ({ variables }: { variables: Readonly<Record<string, unknown>> }) => {
    if (Number(variables['approved'] ?? 0) > 20_000)
      throw new Error('ERP 拒收：单笔超过 2 万要走线下审批');
  },
};

export function createBackend(adapter: FlowEngineOptions['adapter'], clock: () => Date): Backend {
  // 总经理能做管理员的事（干预流程、处理异常）
  const directory = createOrgDirectory({ adapter, isAdmin: (e) => e.roles.includes(ROLE.ceo) });
  const engine = createFlowEngine({
    adapter,
    clock,
    org: directory.org,
    extensions: { resolvers: directory.resolvers, actions },
  });
  return { directory, engine };
}

export interface PrepareOptions {
  /** 写种子时拨时钟：回到几天前的某个钟点 */
  readonly at: TimeTravel;
  /** 种子写完，时钟回到现在 */
  readonly resume: () => void;
  readonly progress: (step: string, done: number, total: number) => void;
}

/** 缺的表建上；组织、流程是空的才写（第一次打开、重置之后），有了流程就不再写种子 */
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
  if ((await engine.query.processes()).length > 0) return;
  for (const [index, entry] of PROCESSES.entries()) {
    progress(`发布流程：${entry.definition.name}`, index, PROCESSES.length);
    await engine.publish(entry.definition);
  }
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
