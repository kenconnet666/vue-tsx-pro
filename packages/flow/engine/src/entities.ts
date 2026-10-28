/**
 * 引擎的表（docs/decisions/0001 第 4 节），用 easy-query 的实体写。主键自增，时间按 UTC，JSON 列存定义、变量与运行状态。
 * 接入方的数据库里由 `engine.createTables()` 建（开发、测试）或自己的迁移脚本建（生产）
 */
import { col, defineSchema, entity, type Db } from '@zerodep-dev/easy-query-ts';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import type { RunState } from './state.ts';

/** 已发布的版本：一行一个版本，发布后不改 */
export const FlowDefinition = entity('flow_definition', {
  id: col.bigint().primaryKey().generated(),
  processKey: col.string(100),
  version: col.int(),
  name: col.string(200),
  model: col.json().$type<ProcessDefinition>(),
  enabled: col.boolean(),
  publishedBy: col.string(64).nullable(),
  publishedAt: col.datetime(),
});

/** 实例的状态 */
export const INSTANCE_STATUSES = [
  'active',
  'suspended',
  'completed',
  'terminated',
  'withdrawn',
] as const;

/** 流程实例；rev 每个命令加一（前端据此知道看到的是不是最新） */
export const FlowInstance = entity('flow_instance', {
  id: col.bigint().primaryKey().generated(),
  definitionId: col.bigint(),
  processKey: col.string(100),
  version: col.int(),
  businessKey: col.string(100).nullable(),
  title: col.string(500).nullable(),
  status: col.enum(INSTANCE_STATUSES),
  result: col.string(100).nullable(),
  /** 正在处理的节点 */
  current: col.json().$type<string[]>(),
  variables: col.json().$type<Record<string, unknown>>(),
  state: col.json().$type<RunState>(),
  startedBy: col.string(64),
  startedAt: col.datetime(),
  endedAt: col.datetime().nullable(),
  /** 调用它的父实例与节点（调用流程） */
  parentId: col.bigint().nullable(),
  parentNode: col.string(100).nullable(),
  rev: col.int(),
});

/** 待办的状态：open 等人处理，waiting 依次会签还没轮到，done 处理了，canceled 不用处理了 */
export const WORK_ITEM_STATES = ['open', 'waiting', 'done', 'canceled'] as const;

/** 落到谁：pool 收件箱里等认领，claimed 认领了，direct 直接落到人 */
export const ASSIGNMENTS = ['pool', 'claimed', 'direct'] as const;

/** 待办：单表加状态，不拆历史表 */
export const FlowWorkItem = entity('flow_work_item', {
  id: col.bigint().primaryKey().generated(),
  instanceId: col.bigint(),
  node: col.string(100),
  nodeName: col.string(200),
  /** 这个节点第几轮（退回、循环后再到这里加一） */
  round: col.int(),
  state: col.enum(WORK_ITEM_STATES),
  assignment: col.enum(ASSIGNMENTS),
  /** 处理人；收件箱里还没人认领时为空 */
  assignee: col.string(64).nullable(),
  /** 怎样来的：start、forward、return、transfer…… */
  arrival: col.string(30),
  /** 会签：同一节点同一轮的待办是一组，seq 是第几个参与人 */
  signGroup: col.string(150).nullable(),
  signSeq: col.int().nullable(),
  createdAt: col.datetime(),
  dueAt: col.datetime().nullable(),
  completedAt: col.datetime().nullable(),
  completedBy: col.string(64).nullable(),
  outcome: col.string(100).nullable(),
  comment: col.string(2000).nullable(),
});

/** 候选的种类 */
export const CANDIDATE_KINDS = ['user', 'role', 'department', 'group'] as const;

/** 谁能认领一个待办：人、角色、部门或接入方扩展的种类（group 的值写成“种类:编号”） */
export const FlowCandidate = entity('flow_candidate', {
  id: col.bigint().primaryKey().generated(),
  workItemId: col.bigint(),
  kind: col.enum(CANDIDATE_KINDS),
  value: col.string(100),
});

/** 流转记录：只追加 */
export const FlowEvent = entity('flow_event', {
  id: col.bigint().primaryKey().generated(),
  instanceId: col.bigint(),
  workItemId: col.bigint().nullable(),
  type: col.string(50),
  at: col.datetime(),
  actor: col.string(64).nullable(),
  node: col.string(100).nullable(),
  edge: col.string(100).nullable(),
  outcome: col.string(100).nullable(),
  comment: col.string(2000).nullable(),
  data: col.json().$type<Record<string, unknown>>().nullable(),
});

/** 作业：定时、时限、提醒、异步的自动节点；抢占靠带条件的更新 */
export const FlowJob = entity('flow_job', {
  id: col.bigint().primaryKey().generated(),
  kind: col.string(30),
  instanceId: col.bigint(),
  workItemId: col.bigint().nullable(),
  /** 排它时节点在第几轮：节点重新到达后，旧的作业不再生效 */
  node: col.string(100).nullable(),
  round: col.int().nullable(),
  dueAt: col.datetime(),
  payload: col.json().$type<Record<string, unknown>>(),
  attempts: col.int(),
  state: col.enum(['pending', 'failed'] as const),
  lockedBy: col.string(100).nullable(),
  lockedUntil: col.datetime().nullable(),
  lastError: col.string(2000).nullable(),
});

/** 抄送 */
export const FlowCc = entity('flow_cc', {
  id: col.bigint().primaryKey().generated(),
  instanceId: col.bigint(),
  node: col.string(100),
  recipient: col.string(64),
  at: col.datetime(),
  readAt: col.datetime().nullable(),
});

/** 引擎的 schema */
export const flowSchema = defineSchema(
  { FlowDefinition, FlowInstance, FlowWorkItem, FlowCandidate, FlowEvent, FlowJob, FlowCc },
  {
    FlowWorkItem: (r) => ({
      candidates: r.many('FlowCandidate', { from: 'id', to: 'workItemId' }),
      instance: r.one('FlowInstance', { from: 'instanceId', to: 'id' }),
    }),
  },
);

/** 引擎用的 Db */
export type FlowDb = Db<typeof flowSchema>;
