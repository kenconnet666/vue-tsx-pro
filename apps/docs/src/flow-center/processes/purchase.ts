/**
 * 采购申请：部门负责人审批 →（金额超过 5 万再给总经理）→ 采购执行。采购员由上一步的审批人从采购部里选一位（pick）：
 * 审批时就看到“同意后到采购执行，要选一位采购员”
 */
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { ROLE } from '../domain/org';

export const purchase: ProcessDefinition = {
  key: 'purchase',
  name: '采购申请',
  title: '采购：{title}',
  summary: ['form.amount', 'form.supplier'],
  form: {
    key: 'purchase',
    manifest: {
      title: { label: '采购什么', type: 'text', required: true, maxLength: 100 },
      supplier: { label: '供应商', type: 'select', options: { source: 'suppliers' } },
      items: {
        label: '物料明细',
        type: 'list',
        minItems: 1,
        fields: {
          material: { label: '物料', type: 'text', required: true },
          quantity: { label: '数量', type: 'number', required: true, integer: true, min: 1 },
          price: { label: '单价', type: 'decimal', required: true, min: '0', scale: 2 },
        },
      },
      amount: { label: '预计总额', type: 'decimal', required: true, min: '0', scale: 2 },
      needBy: { label: '需要日期', type: 'date' },
      reason: { label: '用途', type: 'text', maxLength: 500 },
    },
  },
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'head',
      type: 'task',
      name: '部门负责人审批',
      assignees: [{ resolver: 'departmentHead' }],
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'big', type: 'exclusive', name: '超过 5 万？' },
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
      id: 'buyer',
      type: 'task',
      name: '采购执行',
      assignees: [{ pick: { from: [{ role: ROLE.purchasing }], max: 1 } }],
      outcomes: [{ key: 'approve', label: '已下单' }],
    },
    { id: 'ordered', type: 'end', name: '已下单', result: 'ordered' },
    { id: 'rejected', type: 'end', name: '不采购', result: 'rejected' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'head' },
    { id: 'e2', from: 'head', to: 'big', outcome: 'approve' },
    { id: 'e3', from: 'head', to: 'rejected', outcome: 'reject' },
    {
      id: 'e4',
      from: 'big',
      to: 'ceo',
      label: '超过 5 万',
      when: { field: 'form.amount', op: 'gt', value: '50000' },
    },
    { id: 'e5', from: 'big', to: 'buyer', default: true },
    { id: 'e6', from: 'ceo', to: 'buyer', outcome: 'approve' },
    { id: 'e7', from: 'ceo', to: 'rejected', outcome: 'reject' },
    { id: 'e8', from: 'buyer', to: 'ordered', outcome: 'approve' },
  ],
};
