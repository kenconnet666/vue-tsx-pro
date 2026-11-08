/**
 * 引擎的表（docs/decisions/0001 第 4 节），用 easy-query 的实体写，只认 PostgreSQL（PGlite 同样可用），按 PG 的习惯建：
 * - 主键 bigint 自增；文字一律 text（PG 里 varchar(n) 不更快，长度上限只会误伤）；时刻一律 timestamptz（绝对时刻，不受会话时区影响）；
 * - 状态用 PG 的原生枚举；定义、变量、运行状态、事件数据是 jsonb，候选人与正在处理的节点是 text[]；
 * - 开着的待办、到期的作业是部分索引，候选人与单据数据是 GIN 索引；
 * - 表之间只有逻辑外键（实体的关系），不建库里的外键约束：实例、待办、事件只追加或由引擎自己维护，删数据由归档做。
 * 接入方的数据库里由 `engine.createTables()` 建（开发、测试）或自己的迁移脚本建（生产）
 */
import { col, defineSchema, entity, type Db } from '@zerodep-dev/easy-query-ts';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import type { RunState } from '../runtime/state.ts';

/** 文字列：PG 的 text */
const text = () => col.string().dbType('text');

/** 时刻列：PG 的 timestamptz */
const instant = () => col.datetime({ timeZone: true });

/** 已发布的版本：一行一个版本，发布后不改（只有 enabled 会变）；流程工程的版本带着全部源码与编译结果 */
export const FlowDefinition = entity(
  'flow_definition',
  {
    id: col.bigint().primaryKey().generated(),
    processKey: text(),
    version: col.int(),
    name: text(),
    // json 不是 jsonb：jsonb 按键的长短、字母重排对象的键，单据字段的先后（清单里键的顺序）就丢了
    model: col.json().$type<ProcessDefinition>().dbType('json'),
    enabled: col.boolean(),
    publishedBy: text().nullable(),
    publishedAt: instant(),
    /** 发布说明 */
    note: text().nullable(),
    /** 流程工程的源码（路径 → 源码）；只发布了定义时为空 */
    files: col.json().$type<Record<string, string>>().nullable(),
    /** 编译好的模块（路径 → JS），执行时加载 */
    modules: col.json().$type<Record<string, string>>().nullable(),
  },
  {
    comment: '流程的已发布版本',
    indexes: [{ columns: ['processKey', 'version'], unique: true }],
  },
);

/** 实例的状态 */
export const INSTANCE_STATUSES = [
  /** 发起前存的草稿：不进流程，只有发起人看得到 */
  'draft',
  'active',
  'suspended',
  'completed',
  'terminated',
  'withdrawn',
] as const;

/** 流程实例；rev 每个命令加一（前端据此知道看到的是不是最新） */
export const FlowInstance = entity(
  'flow_instance',
  {
    id: col.bigint().primaryKey().generated(),
    definitionId: col.bigint(),
    processKey: text(),
    version: col.int(),
    businessKey: text().nullable(),
    title: text().nullable(),
    status: col.enum(INSTANCE_STATUSES).native('flow_instance_status'),
    result: text().nullable(),
    /** 正在处理的节点 */
    current: col.array(text()),
    /** 单据的值（流程变量） */
    variables: col.json().$type<Record<string, unknown>>(),
    state: col.json().$type<RunState>(),
    startedBy: text(),
    startedAt: instant(),
    endedAt: instant().nullable(),
    /** 调用它的父实例与节点（调用流程） */
    parentId: col.bigint().nullable(),
    parentNode: text().nullable(),
    /** 调用节点在父实例里的第几轮（退回、跳转后重新进入调用节点时，旧一轮的子实例不算） */
    parentRound: col.int().nullable(),
    rev: col.int(),
  },
  {
    comment: '流程实例',
    indexes: [
      { columns: ['startedBy', 'startedAt'] },
      { columns: ['processKey', 'status'] },
      { columns: ['businessKey'], where: 'business_key IS NOT NULL' },
      { columns: ['parentId'], where: 'parent_id IS NOT NULL' },
      // 按单据字段查（报表、按金额筛待办）：variables @> '{"amount": …}'
      { columns: ['variables'], using: 'gin' },
    ],
  },
);

/** 待办的状态：open 等人处理，waiting 在等加签的人办完，done 处理了，canceled 不用处理了 */
export const WORK_ITEM_STATES = ['open', 'waiting', 'done', 'canceled'] as const;

/** 落到谁：pool 收件箱里等认领，claimed 认领了，direct 直接落到人，designated 收件箱的负责人指定的 */
export const ASSIGNMENTS = ['pool', 'claimed', 'direct', 'designated'] as const;

/**
 * 待办：单表加状态，不拆历史表。收件箱的候选存成标记数组（`user:1001`、`role:finance`、`department:d1`、`group:岗位:p1`），
 * 查待办是 `candidates && 这个人的标记`，走 GIN 索引不连表；改派、加签只改这一列
 */
export const FlowWorkItem = entity(
  'flow_work_item',
  {
    id: col.bigint().primaryKey().generated(),
    instanceId: col.bigint(),
    node: text(),
    nodeName: text(),
    /** 这个节点第几轮（退回、循环后再到这里加一） */
    round: col.int(),
    state: col.enum(WORK_ITEM_STATES).native('flow_work_item_state'),
    assignment: col.enum(ASSIGNMENTS).native('flow_assignment'),
    /** 处理人；收件箱里还没人认领时为空 */
    assignee: text().nullable(),
    /** 怎样来的：start、forward、return、transfer…… */
    arrival: text(),
    /** 会签：同一节点同一轮的待办是一组，seq 是第几个参与人 */
    signGroup: text().nullable(),
    signSeq: col.int().nullable(),
    createdAt: instant(),
    dueAt: instant().nullable(),
    completedAt: instant().nullable(),
    completedBy: text().nullable(),
    outcome: text().nullable(),
    comment: text().nullable(),
    /** 收件箱的候选标记；直接落到人的待办是空数组 */
    candidates: col.array(text()),
    /** 收件箱的负责人：很久没人认领、或被指定的人申请改派时由他指定承办人 */
    designator: text().nullable(),
    /** 在等负责人指定（他的“待我指定”）；申请改派时处理人不变，重新指定之前仍由他处理 */
    awaitingDesignation: col.boolean(),
    /** 票签的票数：只有 votes 规则的会签待办有，别处为空 */
    weight: col.int().nullable(),
    /** 上次催办的时刻：同一份待办一小时内只催一次 */
    remindedAt: instant().nullable(),
    /** 转办、改派：从谁手里交过来的 */
    fromUser: text().nullable(),
    /** 代理：本该是谁的（他设了代理，到达时交给了代理人 assignee，docs/decisions/0010 第 3 节） */
    proxyFor: text().nullable(),
    /** 加签、委托：是哪一份待办加的（arrival 是 delegate、addSign.before / after） */
    parentItemId: col.bigint().nullable(),
    /** 后加签：处理人选的结果先挂在这里，加签的人都办完才生效 */
    pendingOutcome: text().nullable(),
    /** 处理前暂存的单据值与意见（只有处理人看得到，处理完清掉） */
    draft: col
      .json()
      .$type<{ values: Record<string, unknown>; comment: string | null }>()
      .nullable(),
  },
  {
    comment: '待办',
    indexes: [
      { columns: ['instanceId'] },
      { columns: ['assignee'], where: "state = 'open'" },
      { columns: ['candidates'], using: 'gin', where: "state = 'open'" },
      { columns: ['completedBy', 'completedAt'], where: "state = 'done'" },
      { columns: ['designator'], where: 'awaiting_designation' },
      { columns: ['parentItemId'], where: 'parent_item_id IS NOT NULL' },
    ],
  },
);

/** 流转记录：只追加 */
export const FlowEvent = entity(
  'flow_event',
  {
    id: col.bigint().primaryKey().generated(),
    instanceId: col.bigint(),
    workItemId: col.bigint().nullable(),
    type: text(),
    at: instant(),
    actor: text().nullable(),
    node: text().nullable(),
    edge: text().nullable(),
    outcome: text().nullable(),
    comment: text().nullable(),
    data: col.json().$type<Record<string, unknown>>().nullable(),
  },
  // 时间线按实例取、按编号排：一个索引两件事都管
  { comment: '流转记录（只追加）', indexes: [{ columns: ['instanceId', 'id'] }] },
);

/** 作业的状态 */
export const JOB_STATES = ['pending', 'failed'] as const;

/** 作业：定时、时限、提醒、异步的自动节点；多个进程用 FOR UPDATE SKIP LOCKED 各抢各的，租约过期的可以再抢 */
export const FlowJob = entity(
  'flow_job',
  {
    id: col.bigint().primaryKey().generated(),
    kind: text(),
    instanceId: col.bigint(),
    workItemId: col.bigint().nullable(),
    /** 排它时节点在第几轮：节点重新到达后，旧的作业不再生效 */
    node: text().nullable(),
    round: col.int().nullable(),
    dueAt: instant(),
    payload: col.json().$type<Record<string, unknown>>(),
    attempts: col.int(),
    state: col.enum(JOB_STATES).native('flow_job_state'),
    lockedBy: text().nullable(),
    lockedUntil: instant().nullable(),
    lastError: text().nullable(),
  },
  {
    comment: '作业（定时、时限、提醒、异步动作）',
    indexes: [
      { columns: ['dueAt'], where: "state = 'pending'" },
      { columns: ['instanceId'] },
      { columns: ['id'], where: "state = 'failed'", name: 'flow_job_failed_idx' },
    ],
  },
);

/**
 * 通知：站内信箱兼发件箱（docs/decisions/0010）。与推进同一个事务写入，所以“提交了才有通知”；
 * readAt 是收件人读过，sentAt 是外部投递（邮件、IM，引擎选项的 notifications.deliver）送到了，没送到的到点作业重试。
 * 只存事件与当时的标题、环节名，文案由界面按事件拼（语言包）；流程配了模板时 message 是渲染好的文字
 */
export const FlowNotification = entity(
  'flow_notification',
  {
    id: col.bigint().primaryKey().generated(),
    recipient: text(),
    /** 到达、退回、催办、快到期、超时、抄送、结束（模型包的 NotifyEvent） */
    event: text(),
    instanceId: col.bigint(),
    workItemId: col.bigint().nullable(),
    node: text().nullable(),
    nodeName: text().nullable(),
    processKey: text(),
    /** 当时实例的标题 */
    title: text().nullable(),
    /** 流程配了模板时渲染好的文字 */
    message: text().nullable(),
    /** 谁的动作引起的（催办的人、抄送的人）；作业、系统引起的为空 */
    sender: text().nullable(),
    createdAt: instant(),
    readAt: instant().nullable(),
    sentAt: instant().nullable(),
    attempts: col.int(),
    lastError: text().nullable(),
  },
  {
    comment: '通知（站内信箱兼发件箱）',
    indexes: [
      { columns: ['recipient', 'id'] },
      { columns: ['recipient'], where: 'read_at IS NULL' },
      { columns: ['id'], where: 'sent_at IS NULL' },
    ],
  },
);

/**
 * 代理规则（docs/decisions/0010 第 3 节）：principal 不在的这段时间（startsAt 到 endsAt，结束为空是一直到撤销），
 * 这些流程（processKeys 为空是全部）新到他手上的待办交给 agent
 */
export const FlowProxy = entity(
  'flow_proxy',
  {
    id: col.bigint().primaryKey().generated(),
    principal: text(),
    agent: text(),
    processKeys: col.array(text()),
    startsAt: instant(),
    endsAt: instant().nullable(),
    note: text().nullable(),
    createdAt: instant(),
    /** 谁设的（本人，或替他设的管理员） */
    createdBy: text(),
    cancelledAt: instant().nullable(),
  },
  {
    comment: '代理规则',
    indexes: [
      { columns: ['principal'], where: 'cancelled_at IS NULL' },
      { columns: ['agent'], where: 'cancelled_at IS NULL' },
    ],
  },
);

/** 抄送 */
export const FlowCc = entity(
  'flow_cc',
  {
    id: col.bigint().primaryKey().generated(),
    instanceId: col.bigint(),
    /** 抄送节点；手动抄送时为空 */
    node: text().nullable(),
    recipient: text(),
    /** 谁抄送的；抄送节点时为空 */
    sender: text().nullable(),
    message: text().nullable(),
    at: instant(),
    readAt: instant().nullable(),
  },
  { comment: '抄送', indexes: [{ columns: ['recipient', 'id'] }, { columns: ['instanceId'] }] },
);

/** 引擎的 schema；关联是逻辑外键（只在查询里导航，库里不建约束） */
export const flowSchema = defineSchema(
  {
    FlowDefinition,
    FlowInstance,
    FlowWorkItem,
    FlowEvent,
    FlowJob,
    FlowCc,
    FlowNotification,
    FlowProxy,
  },
  {
    FlowInstance: (r) => ({
      definition: r.one('FlowDefinition', { from: 'definitionId', to: 'id' }),
      parent: r.one('FlowInstance', { from: 'parentId', to: 'id' }),
    }),
    FlowWorkItem: (r) => ({
      instance: r.one('FlowInstance', { from: 'instanceId', to: 'id' }),
      parentItem: r.one('FlowWorkItem', { from: 'parentItemId', to: 'id' }),
    }),
    FlowEvent: (r) => ({ instance: r.one('FlowInstance', { from: 'instanceId', to: 'id' }) }),
    FlowJob: (r) => ({ instance: r.one('FlowInstance', { from: 'instanceId', to: 'id' }) }),
    FlowCc: (r) => ({ instance: r.one('FlowInstance', { from: 'instanceId', to: 'id' }) }),
    FlowNotification: (r) => ({
      instance: r.one('FlowInstance', { from: 'instanceId', to: 'id' }),
    }),
  },
);

/** 引擎用的 Db */
export type FlowDb = Db<typeof flowSchema>;
