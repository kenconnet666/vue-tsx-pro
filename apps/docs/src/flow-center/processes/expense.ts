/**
 * 出差报销：上级审批 → 财务审核（核定金额只有财务能改、能退回到前面任一步）→ 核定超过 5000 再给总经理 → 付款（推给 ERP 的异步动作，
 * 单笔核定超过 2 万时 ERP 拒收，作业失败进“异常”，管理员重试或跳过）
 */
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { ROLE } from '../domain/org';

export const expense: ProcessDefinition = {
  key: 'expense',
  name: '出差报销',
  title: '报销：{title}',
  summary: ['form.amount', 'form.city'],
  form: {
    key: 'expense',
    manifest: {
      title: { label: '出差事由', type: 'text', required: true, maxLength: 100 },
      city: { label: '目的地', type: 'text', required: true },
      from: { label: '出发', type: 'date', required: true },
      to: { label: '返回', type: 'date', required: true },
      lines: {
        label: '费用明细',
        type: 'list',
        minItems: 1,
        fields: {
          item: { label: '项目', type: 'text', required: true },
          on: { label: '日期', type: 'date' },
          cost: { label: '金额', type: 'decimal', required: true, min: '0', scale: 2 },
        },
      },
      amount: { label: '报销合计', type: 'decimal', required: true, min: '0', scale: 2 },
      approved: { label: '核定金额', type: 'decimal', min: '0', scale: 2 },
      invoices: { label: '发票', type: 'file', maxCount: 10 },
    },
  },
  nodes: [
    // 发起时看不到核定金额
    { id: 'start', type: 'start', name: '提交', form: { fields: { approved: 'hidden' } } },
    {
      id: 'manager',
      type: 'task',
      name: '上级审批',
      assignees: [{ resolver: 'manager' }],
      form: { fields: { approved: 'hidden' } },
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    {
      id: 'finance',
      type: 'task',
      name: '财务审核',
      assignees: [{ role: ROLE.finance }],
      due: { days: 2 },
      form: { fields: { approved: 'required' } },
      outcomes: [
        { key: 'approve', label: '审核通过' },
        { key: 'back', label: '退回修改', kind: 'return', target: 'choose', comment: 'required' },
        { key: 'reject', label: '不予报销', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'big', type: 'exclusive', name: '核定超过 5000？' },
    {
      id: 'ceo',
      type: 'task',
      name: '总经理审批',
      assignees: [{ role: ROLE.ceo }],
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    {
      id: 'pay',
      type: 'service',
      name: '付款（推 ERP）',
      action: 'payout',
      // 个人报销：ERP 单笔只收 2 万以内
      args: { field: 'approved', limit: 20_000 },
      mode: 'async',
      retry: { times: 1 },
    },
    { id: 'paid', type: 'end', name: '已付款', result: 'paid' },
    { id: 'rejected', type: 'end', name: '不予报销', result: 'rejected' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'manager' },
    { id: 'e2', from: 'manager', to: 'finance', outcome: 'approve' },
    { id: 'e3', from: 'manager', to: 'rejected', outcome: 'reject' },
    { id: 'e4', from: 'finance', to: 'big', outcome: 'approve' },
    { id: 'e5', from: 'finance', to: 'rejected', outcome: 'reject' },
    {
      id: 'e6',
      from: 'big',
      to: 'ceo',
      label: '超过 5000',
      when: { field: 'form.approved', op: 'gt', value: '5000' },
    },
    { id: 'e7', from: 'big', to: 'pay', default: true },
    { id: 'e8', from: 'ceo', to: 'pay', outcome: 'approve' },
    { id: 'e9', from: 'ceo', to: 'rejected', outcome: 'reject' },
    { id: 'e10', from: 'pay', to: 'paid' },
  ],
};
