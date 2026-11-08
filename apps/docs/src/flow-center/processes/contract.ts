/**
 * 合同审批：部门负责人 → 分头会审（并行：法务会签——法务部每个人都要通过；财务审核——财务的收件箱）→ 汇合 →
 * 超过 10 万再给总经理 → 法务盖章归档 → 按付款计划每一期调用一个“付款申请”（不等它们，合同就此生效）。
 * 会审里任何一边不通过，整张合同不通过
 */
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { ROLE } from '../domain/org';

const decide = [
  { key: 'approve', label: '同意' },
  { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
] as const;

export const contract: ProcessDefinition = {
  key: 'contract',
  name: '合同审批',
  title: '合同：{title}',
  summary: ['form.amount', 'form.counterparty'],
  form: {
    key: 'contract',
    manifest: {
      title: { label: '合同名称', type: 'text', required: true, maxLength: 100 },
      counterparty: { label: '相对方', type: 'text', required: true, maxLength: 100 },
      amount: { label: '合同金额', type: 'decimal', required: true, min: '0', scale: 2 },
      signOn: { label: '签订日期', type: 'date' },
      plans: {
        label: '付款计划',
        type: 'list',
        minItems: 1,
        fields: {
          label: { label: '期次', type: 'text', required: true, maxLength: 50 },
          amount: { label: '金额', type: 'decimal', required: true, min: '0.01', scale: 2 },
          due: { label: '付款日', type: 'date' },
        },
      },
      files: { label: '合同文本', type: 'file', maxCount: 5 },
    },
  },
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'head',
      type: 'task',
      name: '部门负责人审批',
      assignees: [{ resolver: 'departmentHead' }],
      outcomes: [...decide],
    },
    { id: 'fork', type: 'parallel', name: '分头会审' },
    {
      id: 'legal',
      type: 'task',
      name: '法务会签',
      multi: { participants: [{ role: ROLE.legal }], complete: 'all' },
      outcomes: [
        { key: 'approve', label: '通过' },
        // 分头会审的区域里不连出去：不通过直接结束整张单（另一边开着的待办一起取消）
        {
          key: 'reject',
          label: '不通过',
          kind: 'terminate',
          result: 'rejected',
          comment: 'required',
        },
      ],
    },
    {
      id: 'finance',
      type: 'task',
      name: '财务审核',
      assignees: [{ role: ROLE.finance }],
      outcomes: [
        { key: 'approve', label: '通过' },
        // 分头会审的区域里不连出去：不通过直接结束整张单（另一边开着的待办一起取消）
        {
          key: 'reject',
          label: '不通过',
          kind: 'terminate',
          result: 'rejected',
          comment: 'required',
        },
      ],
    },
    { id: 'join', type: 'parallel', name: '会审汇合' },
    { id: 'big', type: 'exclusive', name: '超过 10 万？' },
    {
      id: 'ceo',
      type: 'task',
      name: '总经理审批',
      assignees: [{ role: ROLE.ceo }],
      outcomes: [...decide],
    },
    {
      id: 'archive',
      type: 'task',
      name: '盖章归档',
      assignees: [{ role: ROLE.legal }],
      outcomes: [{ key: 'approve', label: '已盖章归档' }],
    },
    {
      id: 'payments',
      type: 'call',
      name: '按计划发起付款',
      process: 'payment',
      forEach: { ref: 'form.plans' },
      as: 'plan',
      input: {
        'form.title': { ref: 'plan.label' },
        'form.amount': { ref: 'plan.amount' },
        'form.due': { ref: 'plan.due' },
        'form.payee': { ref: 'form.counterparty' },
        'form.contract': { ref: 'form.title' },
      },
    },
    { id: 'effective', type: 'end', name: '合同生效', result: 'approved' },
    { id: 'rejected', type: 'end', name: '不通过', result: 'rejected' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'head' },
    { id: 'e2', from: 'head', to: 'fork', outcome: 'approve' },
    { id: 'e3', from: 'head', to: 'rejected', outcome: 'reject' },
    { id: 'e4', from: 'fork', to: 'legal' },
    { id: 'e5', from: 'fork', to: 'finance' },
    { id: 'e6', from: 'legal', to: 'join', outcome: 'approve' },
    { id: 'e8', from: 'finance', to: 'join', outcome: 'approve' },
    { id: 'e10', from: 'join', to: 'big' },
    {
      id: 'e11',
      from: 'big',
      to: 'ceo',
      label: '超过 10 万',
      when: { field: 'form.amount', op: 'gt', value: '100000' },
    },
    { id: 'e12', from: 'big', to: 'archive', default: true },
    { id: 'e13', from: 'ceo', to: 'archive', outcome: 'approve' },
    { id: 'e14', from: 'ceo', to: 'rejected', outcome: 'reject' },
    { id: 'e15', from: 'archive', to: 'payments', outcome: 'approve' },
    { id: 'e16', from: 'payments', to: 'effective' },
  ],
};
