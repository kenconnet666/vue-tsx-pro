/**
 * 假后端的数据库：内存里的几张表，每次改动后存进 localStorage（刷新页面、走流程都接得上），可以一键恢复成种子数据。
 * 存储里放的就是接口上的格式（金额是字符串），读回来时按字段换回 Decimal
 */
import { decodeTask, toDecimal, type Wire } from '../api/wire';
import type { MasterData } from '../domain/master';
import type { Opportunity } from '../domain/ledger/value';
import type { ConfirmReturn, CostTask } from '../domain/task/types';
import { masterSeed } from './seed/master';
import { seedConfirmReturns, seedOpportunities, seedTasks } from './seed/tasks';

/** 数据库里的表 */
export interface MockTables {
  /** 任务卡 */
  tasks: CostTask[];
  /** 收益认定的退回记录（新的在前） */
  confirmReturns: ConfirmReturn[];
  /** 渠道里的机会 */
  opportunities: Opportunity[];
}

/** 假后端的数据库 */
export interface MockDatabase {
  /** 主数据与字典（只读） */
  readonly master: MasterData;
  /** 当前的表 */
  readonly tables: Readonly<MockTables>;
  /** 按编号找任务卡 */
  task(code: string): CostTask | undefined;
  /** 保存任务卡：按编号覆盖，新的放在最前 */
  saveTask(task: CostTask): void;
  /** 删除任务卡；返回删掉的，没有时为 undefined */
  removeTask(code: string): CostTask | undefined;
  /** 记一条收益认定的退回 */
  addConfirmReturn(item: ConfirmReturn): void;
  /** 恢复成种子数据 */
  reset(): void;
}

/** 存储的键：表结构变了就换版本，旧数据作废、重新播种 */
const STORAGE_KEY = 'cost-reduction:mock-db:v1';

const seed = (): MockTables => {
  const tasks = seedTasks();
  return { tasks, confirmReturns: seedConfirmReturns(tasks), opportunities: seedOpportunities() };
};

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
  const persist = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(tables));
    } catch {
      // 存储满了或被禁用：只在这次打开的页面里有效
    }
  };
  return {
    master: masterSeed,
    get tables() {
      return tables;
    },
    task: (code) => tables.tasks.find((item) => item.code === code),
    saveTask(task) {
      const index = tables.tasks.findIndex((item) => item.code === task.code);
      tables = {
        ...tables,
        tasks:
          index < 0
            ? [task, ...tables.tasks]
            : tables.tasks.map((item, position) => (position === index ? task : item)),
      };
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
    reset() {
      tables = seed();
      storage?.removeItem(STORAGE_KEY);
    },
  };
}
