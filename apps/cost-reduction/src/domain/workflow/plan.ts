/**
 * 渠道二：项目团队方案（DESIGN.md §3.2）。预审不值得做直接终止，不进供应商评估、不占设计资源；
 * 供应商不接受则退回原编制人调整，第 2 次不接受后提级项目团队；方案需求归属不明由 PEMO 判断后派，不退回
 */

import type { ProcessDefinition } from '@vue-tsx-pro/ui/workflow';

/** 方案卡的状态 */
export interface PlanStatuses {
  /** 待派单 */
  dispatching: unknown;
  /** 方案编制中 */
  drafting: unknown;
  /** 预审中 */
  reviewing: unknown;
  /** 供应商评估中 */
  evaluating: unknown;
  /** 待确认 */
  confirming: unknown;
  /** 已转任务 */
  converted: unknown;
  /** 已终止 */
  terminated: unknown;
}

/** 方案卡的状态 */
export type PlanStatus = keyof PlanStatuses;

/** 渠道二的流程 */
export const planProcess: ProcessDefinition = {
  key: 'plan',
  name: '渠道二 · 项目团队方案',
  version: 1,
  lanes: [
    { id: 'pemo', name: 'PEMO', group: 'pemo' },
    { id: 'product', name: '产品团队' },
    { id: 'cost', name: '成本团队', group: 'cost' },
    { id: 'supplier', name: '供应商' },
    { id: 'project', name: '项目团队', group: 'project' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '收需求', lane: 'pemo', meta: { status: 'dispatching' } },
    {
      id: 'dispatch',
      type: 'task',
      name: '收需求派单',
      lane: 'pemo',
      due: { workdays: 2 },
      meta: { status: 'dispatching' },
      outcomes: [{ key: 'dispatch', label: '派单', fields: ['productGroup'] }],
    },
    {
      id: 'draft',
      type: 'task',
      name: '出技术方案',
      lane: 'product',
      assignee: { type: 'pool', group: { var: 'productGroup' } },
      due: { workdays: 15 },
      form: 'plan',
      meta: { status: 'drafting' },
      outcomes: [{ key: 'submit', label: '提交方案' }],
    },
    {
      id: 'prereview',
      type: 'task',
      name: '内部预审',
      lane: 'cost',
      due: { workdays: 10 },
      meta: { status: 'reviewing' },
      outcomes: [
        { key: 'worth', label: '值得做', comment: 'optional' },
        {
          key: 'notWorth',
          label: '不值得做',
          kind: 'terminate',
          comment: 'required',
          fields: ['rejectReason'],
        },
      ],
    },
    {
      id: 'supplierReview',
      type: 'task',
      name: '供应商评估',
      lane: 'supplier',
      assignee: { type: 'user', user: { var: 'supplierAccount' } },
      due: { workdays: 15 },
      meta: { status: 'evaluating' },
      outcomes: [
        { key: 'accept', label: '接受' },
        { key: 'reject', label: '不接受', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'rounds', type: 'exclusive', name: '第几次', meta: { status: 'evaluating' } },
    {
      id: 'decide',
      type: 'task',
      name: '项目团队决策',
      lane: 'project',
      due: { workdays: 5 },
      meta: { status: 'evaluating' },
      outcomes: [
        { key: 'continue', label: '继续推进', comment: 'required' },
        { key: 'stop', label: '终止', kind: 'terminate', comment: 'required' },
      ],
    },
    {
      id: 'confirm',
      type: 'task',
      name: '确认',
      lane: 'pemo',
      due: { workdays: 5 },
      meta: { status: 'confirming' },
      outcomes: [{ key: 'confirm', label: '确认', attachments: 'required' }],
    },
    {
      id: 'convert',
      type: 'task',
      name: '转任务',
      lane: 'pemo',
      assignee: { type: 'sameAs', node: 'confirm' },
      due: { workdays: 3 },
      meta: { status: 'confirming' },
      outcomes: [{ key: 'convert', label: '建任务卡' }],
    },
    {
      id: 'converted',
      type: 'end',
      name: '已转任务',
      lane: 'pemo',
      result: 'converted',
      meta: { status: 'converted' },
    },
    {
      id: 'terminated',
      type: 'end',
      name: '已终止',
      lane: 'cost',
      result: 'terminated',
      terminate: true,
      meta: { status: 'terminated' },
    },
  ],
  edges: [
    { id: 'received', from: 'start', to: 'dispatch' },
    { id: 'dispatched', from: 'dispatch', to: 'draft', outcome: 'dispatch' },
    { id: 'submitted', from: 'draft', to: 'prereview', outcome: 'submit' },
    { id: 'worth', from: 'prereview', to: 'supplierReview', outcome: 'worth' },
    { id: 'not-worth', from: 'prereview', to: 'terminated', outcome: 'notWorth' },
    { id: 'accepted', from: 'supplierReview', to: 'confirm', outcome: 'accept' },
    {
      id: 'rejected',
      from: 'supplierReview',
      to: 'rounds',
      outcome: 'reject',
      effects: [{ increment: 'rejections' }],
    },
    {
      id: 'escalate',
      from: 'rounds',
      to: 'decide',
      kind: 'escalate',
      label: '第 2 次不接受',
      when: { var: 'rejections', op: 'gte', value: 2 },
    },
    { id: 'adjust', from: 'rounds', to: 'draft', default: true, kind: 'return', label: '退回调整' },
    { id: 'continue', from: 'decide', to: 'confirm', outcome: 'continue' },
    { id: 'stop', from: 'decide', to: 'terminated', outcome: 'stop' },
    { id: 'confirmed', from: 'confirm', to: 'convert', outcome: 'confirm' },
    { id: 'convert-done', from: 'convert', to: 'converted', outcome: 'convert' },
  ],
};
