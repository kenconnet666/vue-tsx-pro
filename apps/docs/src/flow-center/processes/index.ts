/**
 * 流程中心的流程：Worker 第一次启动时按这里的先后发布（被调用的付款在合同前面）；发起中心按分类列出。
 */
import type { FlowProject, ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { contract, contractProject } from './contract';
import { expense } from './expense';
import { leave } from './leave';
import { payment } from './payment';
import { purchase } from './purchase';

/** 发起中心里的一个流程 */
export interface ProcessEntry {
  readonly definition: ProcessDefinition;
  /** 分类 */
  readonly category: string;
  /** 一句话说明 */
  readonly description: string;
  /** 写成流程工程的：发布这个（Worker 里编译），definition 只给页面显示 */
  readonly project?: FlowProject;
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
    definition: payment,
    category: '财务',
    description: '对外付款：财务审核，超过 20 万给总经理，审完推 ERP；合同生效后按计划自动发起',
  },
  {
    definition: purchase,
    category: '采购',
    description: '物料采购：负责人审批时选采购员，超过 5 万给总经理',
  },
  {
    definition: contract,
    project: contractProject,
    category: '法务',
    description: '合同：法务会签与财务审核同时进行，超过 10 万给总经理，归档后按付款计划逐期付款',
  },
];

/** 按流程的键找 */
export const processOf = (key: string) => PROCESSES.find((p) => p.definition.key === key);
