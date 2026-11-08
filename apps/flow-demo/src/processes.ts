/**
 * 示例的流程：请假（经理审批，超过 3 天再给人事；可以退回给申请人改）；
 * 采购（经理审批限时一天、超时标出来，金额超过 5 万经理与人事会签，最后调用“供应商核实”子流程）
 */
import { defineProcess } from '@zerodep-dev/flow-ts-model';

export const leave = defineProcess({
  key: 'leave',
  name: '请假',
  title: '请假：{reason}（{days} 天）',
  summary: ['days', 'reason'],
  variables: [
    { name: 'days', type: 'number', label: '天数' },
    { name: 'reason', type: 'text', label: '事由' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'manager',
      type: 'task',
      name: '经理审批',
      assignees: [{ role: '1', name: '经理' }],
      returnTo: 'resubmit',
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'back', label: '退回修改', kind: 'return', comment: 'required' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'long', type: 'exclusive', name: '超过 3 天？' },
    {
      id: 'hr',
      type: 'task',
      name: '人事备案',
      assignees: [{ role: '2', name: '人事' }],
      outcomes: [{ key: 'filed', label: '已备案' }],
    },
    {
      id: 'revise',
      type: 'task',
      name: '申请人修改',
      assignees: [{ initiator: true }],
      outcomes: [{ key: 'resubmit', label: '重新提交' }],
    },
    { id: 'approved', type: 'end', name: '通过', result: 'approved' },
    { id: 'rejected', type: 'end', name: '不通过', result: 'rejected' },
  ],
  edges: [
    { id: 'submit', from: 'start', to: 'manager' },
    { id: 'ok', from: 'manager', to: 'long', outcome: 'approve' },
    { id: 'no', from: 'manager', to: 'rejected', outcome: 'reject' },
    { id: 'back', from: 'manager', to: 'revise', outcome: 'back', kind: 'return' },
    { id: 'again', from: 'revise', to: 'manager', outcome: 'resubmit' },
    {
      id: 'many',
      from: 'long',
      to: 'hr',
      when: { field: 'days', op: 'gt', value: 3 },
    },
    { id: 'few', from: 'long', to: 'approved', default: true },
    { id: 'filed', from: 'hr', to: 'approved', outcome: 'filed' },
  ],
});

/** 供应商核实：采购的子流程，人事核对资质；采购单把供应商名传进来 */
export const vendorCheck = defineProcess({
  key: 'vendor-check',
  name: '供应商核实',
  title: '核实供应商：{vendor}',
  summary: ['vendor'],
  variables: [{ name: 'vendor', type: 'text', label: '供应商' }],
  nodes: [
    { id: 'start', type: 'start', name: '开始' },
    {
      id: 'verify',
      type: 'task',
      name: '核对资质',
      assignees: [{ role: '2', name: '人事' }],
      outcomes: [
        { key: 'pass', label: '资质齐全' },
        { key: 'fail', label: '资质不全', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'passed', type: 'end', name: '合格', result: 'approved' },
    { id: 'failed', type: 'end', name: '不合格', result: 'rejected' },
  ],
  edges: [
    { id: 'begin', from: 'start', to: 'verify' },
    { id: 'pass', from: 'verify', to: 'passed', outcome: 'pass' },
    { id: 'fail', from: 'verify', to: 'failed', outcome: 'fail' },
  ],
});

export const purchase = defineProcess({
  key: 'purchase',
  name: '采购',
  title: '采购：{item}（¥{amount}）',
  summary: ['item', 'amount', 'vendor'],
  variables: [
    { name: 'item', type: 'text', label: '物品' },
    { name: 'amount', type: 'number', label: '金额' },
    { name: 'vendor', type: 'text', label: '供应商' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'manager',
      type: 'task',
      name: '经理审批',
      assignees: [{ role: '1', name: '经理' }],
      // 限时一天，过了在待办与审批单上标成超时（不自动处理）
      due: { days: 1 },
      overdue: { action: 'mark' },
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'large', type: 'exclusive', name: '超过 5 万？' },
    {
      id: 'sign',
      type: 'task',
      name: '经理与人事会签',
      // 经理、人事各一份，都同意才通过，有人不同意立即结束
      multi: { participants: [{ role: '1' }, { role: '2' }], complete: 'all' },
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    {
      id: 'vendor',
      type: 'call',
      name: '供应商核实',
      process: 'vendor-check',
      // 子流程结束时，按它的结果（approved / rejected）走出线
      input: { vendor: { ref: 'vendor' } },
    },
    { id: 'approved', type: 'end', name: '通过', result: 'approved' },
    { id: 'rejected', type: 'end', name: '不通过', result: 'rejected' },
  ],
  edges: [
    { id: 'submit', from: 'start', to: 'manager' },
    { id: 'ok', from: 'manager', to: 'large', outcome: 'approve' },
    { id: 'no', from: 'manager', to: 'rejected', outcome: 'reject' },
    { id: 'big', from: 'large', to: 'sign', when: { field: 'amount', op: 'gt', value: 50000 } },
    { id: 'small', from: 'large', to: 'vendor', default: true },
    { id: 'signed', from: 'sign', to: 'vendor', outcome: 'approve' },
    { id: 'vetoed', from: 'sign', to: 'rejected', outcome: 'reject' },
    { id: 'vendorPassed', from: 'vendor', to: 'approved', outcome: 'approved', label: '合格' },
    { id: 'vendorFailed', from: 'vendor', to: 'rejected', outcome: 'rejected', label: '不合格' },
  ],
});

/** 发布的流程：子流程先发布（调用它的流程发布时校验它存在） */
export const processes = [leave, vendorCheck, purchase] as const;
