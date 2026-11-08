/**
 * 流程中心的流程：Worker 第一次启动时发布；发起中心按分类列出。
 */
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { expense } from './expense';
import { leave } from './leave';
import { purchase } from './purchase';

/** 发起中心里的一个流程 */
export interface ProcessEntry {
  readonly definition: ProcessDefinition;
  /** 分类 */
  readonly category: string;
  /** 一句话说明 */
  readonly description: string;
}

export const PROCESSES: readonly ProcessEntry[] = [
  {
    definition: leave,
    category: '人事',
    description: '年假、病假、事假、调休；超过 3 天给部门负责人',
  },
  {
    definition: expense,
    category: '财务',
    description: '出差的费用报销：财务核定金额，超过 5000 给总经理，审完推 ERP 付款',
  },
  {
    definition: purchase,
    category: '采购',
    description: '物料采购：负责人审批时选采购员，超过 5 万给总经理',
  },
];

/** 按流程的键找 */
export const processOf = (key: string) => PROCESSES.find((p) => p.definition.key === key);
