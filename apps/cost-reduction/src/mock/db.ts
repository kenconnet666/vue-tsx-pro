/**
 * 假后端的数据库：内存里的几张表与流转模拟的状态，每次改动后存进 localStorage（刷新页面、走流程都接得上），
 * 可以一键恢复成种子数据。存储里放的就是接口上的格式（金额是字符串），读回来时按字段换回 Decimal。
 * 流程的命令经 run() 执行：执行完把新的流转记录回写到任务卡（任务池的节点改字段与状态），再存盘
 */
import { createWorkCalendar } from '@vue-tsx-pro/ui';
import { decodeTask, toDecimal, type Wire } from '../api/wire';
import { TODAY } from '../domain/clock';
import type { Opportunity } from '../domain/ledger/value';
import type { MasterData } from '../domain/master';
import type { ConfirmReturn, CostTask } from '../domain/task/types';
import { processDefinitions } from '../domain/workflow';
import { groupsOf } from '../domain/workflow/groups';
import type { InboxViewer } from '../domain/workflow/inbox';
import { masterSeed } from './seed/master';
import { seedConfirmReturns, seedOpportunities, seedTasks } from './seed/tasks';
import { createDirectory } from './workflow/directory';
import {
  createWorkflowEngine,
  emptyWorkflowState,
  type WorkflowEngine,
  type WorkflowState,
} from './workflow/engine';
import { applyTaskEvents, replayTask } from './workflow/task-flow';

/** 数据库里的表 */
export interface MockTables {
  /** 任务卡 */
  tasks: CostTask[];
  /** 收益认定的退回记录（新的在前） */
  confirmReturns: ConfirmReturn[];
  /** 渠道里的机会 */
  opportunities: Opportunity[];
  /** 流转模拟的状态：流程实例、待办、流转记录 */
  workflow: WorkflowState;
  /** 通知的已读记录：工号 → 读过的通知标识 */
  notificationReads: Record<string, string[]>;
}

/** 假后端的数据库 */
export interface MockDatabase {
  /** 主数据与字典（只读） */
  readonly master: MasterData;
  /** 当前的表 */
  readonly tables: Readonly<MockTables>;
  /** 流转模拟（直接调用不会回写任务卡、不会存盘：命令经 run 执行） */
  readonly workflow: WorkflowEngine;
  /** 执行流程的命令：之后回写任务卡、存盘；返回命令的结果 */
  run<T>(command: (engine: WorkflowEngine) => T): T;
  /** 按编号找任务卡 */
  task(code: string): CostTask | undefined;
  /** 保存任务卡：按编号覆盖，新的放在最前 */
  saveTask(task: CostTask): void;
  /** 删除任务卡；返回删掉的，没有时为 undefined */
  removeTask(code: string): CostTask | undefined;
  /** 记一条收益认定的退回 */
  addConfirmReturn(item: ConfirmReturn): void;
  /** 看收件箱的人：工号、所在的收件箱、负责的收件箱 */
  viewer(user: string): InboxViewer;
  /** 记下一个人读过的通知 */
  markRead(user: string, ids: readonly string[]): void;
  /** 恢复成种子数据 */
  reset(): void;
}

/** 存储的键：表结构变了就换版本，旧数据作废、重新播种 */
const STORAGE_KEY = 'cost-reduction:mock-db:v2';

const calendar = createWorkCalendar();
const directory = createDirectory(masterSeed);

/** 演示的“现在”：日期固定在 TODAY，时刻用真实的（同一天里的先后看得出来） */
const demoNow = () => `${TODAY}T${new Date().toTimeString().slice(0, 8)}`;

/** 种子数据：任务卡、退回记录、机会；每张任务卡按里程碑的日期把流程回放一遍 */
function seed(): MockTables {
  const tasks = seedTasks();
  const workflow = emptyWorkflowState();
  let clock = `${TODAY}T09:00:00`;
  const engine = createWorkflowEngine(workflow, {
    definitions: processDefinitions,
    directory,
    calendar,
    now: () => clock,
  });
  const actors = { pemo: 'E40287', cost: 'E50913', business: 'E31056' };
  for (const task of tasks)
    replayTask(engine, task, (iso) => (clock = iso), {
      ...actors,
      // 成本团队两人轮流：收件箱里看得出谁处理的
      cost: task.code.endsWith('1') || task.code.endsWith('3') ? 'E50377' : actors.cost,
    });
  return {
    tasks,
    confirmReturns: seedConfirmReturns(tasks),
    opportunities: seedOpportunities(),
    workflow,
    notificationReads: {},
  };
}

/** 读存储里的表；没有、读不了或格式不对时为 null */
function load(storage: Storage | null): MockTables | null {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    if (!text) return null;
    const saved = JSON.parse(text) as Wire<MockTables>;
    return {
      tasks: saved.tasks.map(decodeTask),
      confirmReturns: saved.confirmReturns,
      opportunities: saved.opportunities.map((item) => ({
        ...item,
        expected: toDecimal(item.expected),
      })),
      workflow: saved.workflow as WorkflowState,
      // 加这张表之前存的数据没有它：从空的开始
      notificationReads: saved.notificationReads ?? {},
    };
  } catch {
    return null;
  }
}

/** 浏览器里的 localStorage；隐私模式、测试环境里拿不到时为 null（只在内存里） */
function defaultStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** 建数据库：storage 不写时用 localStorage，传 null 只放在内存里（测试） */
export function createDatabase(storage: Storage | null = defaultStorage()): MockDatabase {
  let tables = load(storage) ?? seed();
  const engineFor = (state: WorkflowState) =>
    createWorkflowEngine(state, {
      definitions: processDefinitions,
      directory,
      calendar,
      now: demoNow,
    });
  let engine = engineFor(tables.workflow);
  const persist = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(tables));
    } catch {
      // 存储满了或被禁用：只在这次打开的页面里有效
    }
  };
  const upsert = (list: readonly CostTask[], task: CostTask) => {
    const index = list.findIndex((item) => item.code === task.code);
    return index < 0
      ? [task, ...list]
      : list.map((item, position) => (position === index ? task : item));
  };

  return {
    master: masterSeed,
    get tables() {
      return tables;
    },
    get workflow() {
      return engine;
    },
    run(command) {
      const before = tables.workflow.events.length;
      try {
        return command(engine);
      } finally {
        // 命令中途出错时，已经发生的流转（如自动推进的前几步）照样回写
        const changed = applyTaskEvents(engine, tables.workflow.events.slice(before), tables.tasks);
        if (changed.length)
          tables = {
            ...tables,
            tasks: changed.reduce((list, task) => upsert(list, task), tables.tasks),
          };
        persist();
      }
    },
    task: (code) => tables.tasks.find((item) => item.code === code),
    saveTask(task) {
      tables = { ...tables, tasks: upsert(tables.tasks, task) };
      persist();
    },
    removeTask(code) {
      const removed = tables.tasks.find((item) => item.code === code);
      if (!removed) return undefined;
      tables = { ...tables, tasks: tables.tasks.filter((item) => item.code !== code) };
      persist();
      return removed;
    },
    addConfirmReturn(item) {
      tables = { ...tables, confirmReturns: [item, ...tables.confirmReturns] };
      persist();
    },
    viewer(user) {
      const person = masterSeed.people.find((item) => item.id === user);
      return {
        user,
        groups: person ? groupsOf(person, masterSeed.teams) : [],
        leads: person?.leads ?? [],
      };
    },
    markRead(user, ids) {
      const read = new Set([...(tables.notificationReads[user] ?? []), ...ids]);
      tables = { ...tables, notificationReads: { ...tables.notificationReads, [user]: [...read] } };
      persist();
    },
    reset() {
      tables = seed();
      engine = engineFor(tables.workflow);
      storage?.removeItem(STORAGE_KEY);
    },
  };
}
