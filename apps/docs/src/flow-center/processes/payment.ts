/**
 * 付款申请：财务审核 →（超过 20 万再给总经理）→ 付款（推给 ERP 的异步动作，单笔超过 100 万 ERP 拒收，进“异常”）→
 * 等银行回单（外部消息 bank.receipt：付了或退票，带回的备注写进单据；3 天没回来标超时）。演示里管理员在审批单上“模拟送达”。
 * 可以单独发起（退押金、预付款），合同生效后也按付款计划每一期调用它（合同、收款方、金额由合同带过来）
 */
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { ROLE } from '../domain/org';

export const payment: ProcessDefinition = {
  key: 'payment',
  name: '付款申请',
  title: '付款：{title}',
  summary: ['form.amount', 'form.payee'],
  form: {
    key: 'payment',
    manifest: {
      title: { label: '付款事由', type: 'text', required: true, maxLength: 100 },
      payee: { label: '收款方', type: 'text', required: true, maxLength: 100 },
      amount: { label: '金额', type: 'decimal', required: true, min: '0.01', scale: 2 },
      due: { label: '最晚付款日', type: 'date' },
      contract: { label: '关联合同', type: 'text', maxLength: 100 },
      note: { label: '说明', type: 'text', maxLength: 500 },
    },
  },
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'finance',
      type: 'task',
      name: '财务审核',
      assignees: [{ role: ROLE.finance }],
      due: { days: 1 },
      // 从合同来的：收款方、金额、合同不能在这里改
      form: { fields: { payee: 'readonly', amount: 'readonly', contract: 'readonly' } },
      outcomes: [
        { key: 'approve', label: '审核通过' },
        { key: 'reject', label: '不予付款', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'big', type: 'exclusive', name: '超过 20 万？' },
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
      args: { field: 'amount', limit: 1_000_000 },
      mode: 'async',
      retry: { times: 1 },
    },
    {
      id: 'receipt',
      type: 'receive',
      name: '等银行回单',
      event: 'bank.receipt',
      outcomes: ['paid', 'bounced'],
      due: { days: 3 },
      output: { 'form.note': 'remark' },
    },
    { id: 'paid', type: 'end', name: '已付款', result: 'paid' },
    { id: 'bounced', type: 'end', name: '退票', result: 'bounced' },
    { id: 'rejected', type: 'end', name: '不予付款', result: 'rejected' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'finance' },
    { id: 'e2', from: 'finance', to: 'big', outcome: 'approve' },
    { id: 'e3', from: 'finance', to: 'rejected', outcome: 'reject' },
    {
      id: 'e4',
      from: 'big',
      to: 'ceo',
      label: '超过 20 万',
      when: { field: 'form.amount', op: 'gt', value: '200000' },
    },
    { id: 'e5', from: 'big', to: 'pay', default: true },
    { id: 'e6', from: 'ceo', to: 'pay', outcome: 'approve' },
    { id: 'e7', from: 'ceo', to: 'rejected', outcome: 'reject' },
    { id: 'e8', from: 'pay', to: 'receipt' },
    { id: 'e9', from: 'receipt', to: 'paid', outcome: 'paid' },
    { id: 'e10', from: 'receipt', to: 'bounced', outcome: 'bounced' },
  ],
};
