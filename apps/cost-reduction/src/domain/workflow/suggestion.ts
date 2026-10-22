/**
 * 渠道一：供应商建议（DESIGN.md §3.1）。齐全后技术评估与收益测算并行、不互为前置；协商最多 3 轮，
 * 第 3 次异议后提级 PEMO 裁决；协商超时视为无异议；产品团队退单只能退回 PEMO 重派
 */
import type { ProcessDefinition } from '@vue-tsx-pro/ui';

/** 建议卡的状态 */
export interface SuggestionStatuses {
  /** 待受理 */
  received: unknown;
  /** 评估中 */
  evaluating: unknown;
  /** 协商中 */
  negotiating: unknown;
  /** 已立项 */
  approved: unknown;
  /** 暂无法实施（进储备库） */
  shelved: unknown;
  /** 已退回（补充材料） */
  returned: unknown;
  /** 已撤回 */
  withdrawn: unknown;
}

/** 建议卡的状态 */
export type SuggestionStatus = keyof SuggestionStatuses;

/** 渠道一的流程 */
export const suggestionProcess: ProcessDefinition = {
  key: 'suggestion',
  name: '渠道一 · 供应商建议',
  version: 1,
  lanes: [
    { id: 'supplier', name: '供应商' },
    { id: 'cost', name: '成本团队', group: 'cost' },
    { id: 'pemo', name: 'PEMO', group: 'pemo' },
    { id: 'product', name: '产品团队' },
  ],
  nodes: [
    {
      id: 'start',
      type: 'start',
      name: '填表提交',
      lane: 'supplier',
      meta: { status: 'received' },
    },
    {
      id: 'check',
      type: 'task',
      name: '齐全性检查',
      lane: 'cost',
      due: { workdays: 2 },
      meta: { status: 'received' },
      outcomes: [
        { key: 'pass', label: '齐全' },
        { key: 'back', label: '退回补充', kind: 'return', comment: 'required' },
      ],
    },
    {
      id: 'supplement',
      type: 'task',
      name: '补充材料',
      lane: 'supplier',
      assignee: { type: 'initiator' },
      meta: { status: 'returned' },
      outcomes: [
        { key: 'resubmit', label: '重新提交', attachments: 'optional' },
        { key: 'withdraw', label: '撤回', kind: 'terminate', comment: 'optional' },
      ],
    },
    { id: 'fork', type: 'parallel', name: '并行启动', meta: { status: 'evaluating' } },
    {
      id: 'dispatch',
      type: 'task',
      name: '派单',
      lane: 'pemo',
      due: { workdays: 2 },
      meta: { status: 'evaluating' },
      outcomes: [{ key: 'dispatch', label: '派单', fields: ['productGroup'] }],
    },
    {
      id: 'evaluate',
      type: 'task',
      name: '技术评估',
      lane: 'product',
      assignee: { type: 'pool', group: { var: 'productGroup' } },
      due: { workdays: 15 },
      form: 'evaluation',
      meta: { status: 'evaluating' },
      outcomes: [
        { key: 'feasible', label: '可行', comment: 'optional' },
        {
          key: 'infeasible',
          label: '不可行',
          kind: 'reject',
          comment: 'required',
          fields: ['rejectReason', 'reviveCondition'],
        },
        { key: 'decline', label: '退单', kind: 'return', comment: 'required' },
      ],
    },
    {
      id: 'estimate',
      type: 'task',
      name: '收益测算',
      lane: 'cost',
      due: { workdays: 10 },
      form: 'estimate',
      meta: { status: 'evaluating' },
      outcomes: [{ key: 'done', label: '出测算' }],
    },
    { id: 'join', type: 'parallel', name: '汇合', meta: { status: 'negotiating' } },
    {
      id: 'review',
      type: 'task',
      name: '协商与认可',
      lane: 'supplier',
      assignee: { type: 'user', user: { var: 'supplierAccount' } },
      due: { workdays: 10 },
      overdue: { outcome: 'accept' },
      meta: { status: 'negotiating' },
      outcomes: [
        { key: 'accept', label: '认可测算' },
        {
          key: 'object',
          label: '提出异议',
          kind: 'return',
          comment: 'required',
          attachments: 'required',
        },
      ],
    },
    { id: 'rounds', type: 'exclusive', name: '第几轮', meta: { status: 'negotiating' } },
    {
      id: 'reestimate',
      type: 'task',
      name: '再测算',
      lane: 'cost',
      assignee: { type: 'sameAs', node: 'estimate' },
      due: { workdays: 10 },
      form: 'estimate',
      meta: { status: 'negotiating' },
      outcomes: [{ key: 'done', label: '出新一版', comment: 'required' }],
    },
    {
      id: 'arbitrate',
      type: 'task',
      name: '提级裁决',
      lane: 'pemo',
      due: { workdays: 5 },
      meta: { status: 'negotiating' },
      outcomes: [{ key: 'decide', label: '裁决', comment: 'required' }],
    },
    {
      id: 'lock',
      type: 'task',
      name: '锁定 A 值',
      lane: 'cost',
      assignee: { type: 'sameAs', node: 'estimate' },
      due: { workdays: 3 },
      meta: { status: 'negotiating' },
      outcomes: [{ key: 'lock', label: '锁定 A 并立项' }],
    },
    {
      id: 'approved',
      type: 'end',
      name: '已立项',
      lane: 'cost',
      result: 'approved',
      meta: { status: 'approved' },
    },
    {
      id: 'shelved',
      type: 'end',
      name: '暂无法实施',
      lane: 'product',
      result: 'shelved',
      terminate: true,
      meta: { status: 'shelved' },
    },
    {
      id: 'withdrawn',
      type: 'end',
      name: '已撤回',
      lane: 'supplier',
      result: 'withdrawn',
      terminate: true,
      meta: { status: 'withdrawn' },
    },
  ],
  edges: [
    { id: 'submit', from: 'start', to: 'check' },
    { id: 'check-pass', from: 'check', to: 'fork', outcome: 'pass' },
    { id: 'check-back', from: 'check', to: 'supplement', outcome: 'back', kind: 'return' },
    { id: 'resubmit', from: 'supplement', to: 'check', outcome: 'resubmit' },
    { id: 'withdraw', from: 'supplement', to: 'withdrawn', outcome: 'withdraw' },
    { id: 'fork-dispatch', from: 'fork', to: 'dispatch' },
    { id: 'fork-estimate', from: 'fork', to: 'estimate' },
    { id: 'dispatched', from: 'dispatch', to: 'evaluate', outcome: 'dispatch' },
    { id: 'feasible', from: 'evaluate', to: 'join', outcome: 'feasible' },
    { id: 'infeasible', from: 'evaluate', to: 'shelved', outcome: 'infeasible' },
    { id: 'decline', from: 'evaluate', to: 'dispatch', outcome: 'decline', kind: 'return' },
    { id: 'estimated', from: 'estimate', to: 'join', outcome: 'done' },
    { id: 'joined', from: 'join', to: 'review' },
    { id: 'accept', from: 'review', to: 'lock', outcome: 'accept' },
    {
      id: 'object',
      from: 'review',
      to: 'rounds',
      outcome: 'object',
      effects: [{ increment: 'objections' }],
    },
    {
      id: 'escalate',
      from: 'rounds',
      to: 'arbitrate',
      kind: 'escalate',
      label: '第 3 次异议',
      when: { var: 'objections', op: 'gte', value: 3 },
    },
    { id: 'next-round', from: 'rounds', to: 'reestimate', default: true, label: '再测算' },
    { id: 'reestimated', from: 'reestimate', to: 'review', outcome: 'done' },
    { id: 'arbitrated', from: 'arbitrate', to: 'lock', outcome: 'decide' },
    { id: 'locked', from: 'lock', to: 'approved', outcome: 'lock' },
  ],
};
