/**
 * 请假：直属上级审批；超过 3 天再给一级部门负责人（就是上级时跳过）；最后人事备案。上级是发起人自己时（总经理请假）自动跳过
 */
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { ROLE } from '../domain/org';

const decide = [
  { key: 'approve', label: '同意' },
  { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
] as const;

export const leave: ProcessDefinition = {
  key: 'leave',
  name: '请假',
  title: '{kind}：{days} 天',
  summary: ['form.kind', 'form.days', 'form.from'],
  settings: { autoSkip: { initiator: true } },
  form: {
    key: 'leave',
    manifest: {
      kind: {
        label: '类型',
        type: 'select',
        required: true,
        options: [
          { value: '年假', label: '年假' },
          { value: '病假', label: '病假' },
          { value: '事假', label: '事假' },
          { value: '调休', label: '调休' },
        ],
      },
      days: { label: '天数', type: 'decimal', required: true, min: '0.5', max: '30', scale: 1 },
      from: { label: '开始', type: 'date', required: true },
      to: { label: '结束', type: 'date', required: true },
      reason: { label: '事由', type: 'text', required: true, maxLength: 200 },
      handover: { label: '工作交接给', type: 'people', max: 1, types: ['user'] },
    },
  },
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'manager',
      type: 'task',
      name: '上级审批',
      assignees: [{ resolver: 'manager' }],
      due: { days: 1 },
      reminders: [{ before: { hours: 4 } }],
      outcomes: [...decide],
    },
    { id: 'long', type: 'exclusive', name: '超过 3 天？' },
    {
      id: 'head',
      type: 'task',
      name: '一级部门负责人审批',
      // 一级部门（研发中心、财务部……）的负责人；就是刚批过的上级时自动跳过
      assignees: [{ resolver: 'departmentHead', args: { level: 1 } }],
      autoSkip: { sameAsPrevious: true },
      outcomes: [...decide],
    },
    {
      id: 'record',
      type: 'task',
      name: '人事备案',
      assignees: [{ role: ROLE.hr }],
      outcomes: [{ key: 'approve', label: '已备案' }],
    },
    { id: 'approved', type: 'end', name: '准假', result: 'approved' },
    { id: 'rejected', type: 'end', name: '不准', result: 'rejected' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'manager' },
    { id: 'e2', from: 'manager', to: 'long', outcome: 'approve' },
    { id: 'e3', from: 'manager', to: 'rejected', outcome: 'reject' },
    {
      id: 'e4',
      from: 'long',
      to: 'head',
      label: '超过 3 天',
      when: { field: 'form.days', op: 'gt', value: '3' },
    },
    { id: 'e5', from: 'long', to: 'record', default: true },
    { id: 'e6', from: 'head', to: 'record', outcome: 'approve' },
    { id: 'e7', from: 'head', to: 'rejected', outcome: 'reject' },
    { id: 'e8', from: 'record', to: 'approved', outcome: 'approve' },
  ],
};
