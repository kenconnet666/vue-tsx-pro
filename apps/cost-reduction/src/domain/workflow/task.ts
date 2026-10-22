/**
 * 任务池（DESIGN.md §3.3）：PEMO 管进度、成本团队管金额，两条线不交叉。状态只进不跳，唯一的回退是验证不达标
 * 从待认定退回方案设计；验证达标判断的依据是成本团队出具的验证窗结论；每个里程碑都要上传交付证据；
 * 关闭须验证窗结论、收益认定意见、商务谈定记录三项齐全。暂停、终止是流程实例的挂起与终止，不是节点
 */
import type { ProcessDefinition, ProcessInstance, WorkItem } from '@vue-tsx-pro/ui';
import type { TaskStatus } from '../task/types';

/** 任务池的流程 */
export const taskProcess: ProcessDefinition = {
  key: 'task',
  name: '任务池',
  version: 1,
  lanes: [
    { id: 'pemo', name: 'PEMO', group: 'pemo' },
    { id: 'product', name: '产品团队' },
    { id: 'cost', name: '成本团队', group: 'cost' },
    { id: 'business', name: '商务（线下）', group: 'business' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '进任务池', lane: 'pemo', meta: { status: 'pending' } },
    {
      id: 'create',
      type: 'task',
      name: '建任务卡',
      lane: 'pemo',
      due: { workdays: 3 },
      form: 'task',
      meta: { status: 'pending' },
      outcomes: [{ key: 'create', label: '建卡并启动', fields: ['owner'] }],
    },
    {
      id: 'design',
      type: 'task',
      name: '方案设计',
      lane: 'product',
      assignee: { type: 'user', user: { var: 'owner' } },
      due: { var: 'designDue' },
      meta: { status: 'designing', milestone: '方案确定' },
      outcomes: [{ key: 'done', label: '方案确定', attachments: 'required' }],
    },
    {
      id: 'verify',
      type: 'task',
      name: '验证实施',
      lane: 'product',
      assignee: { type: 'user', user: { var: 'owner' } },
      due: { var: 'verifyDue' },
      meta: { status: 'verifying', milestone: '验证完成' },
      outcomes: [{ key: 'done', label: '验证完成', attachments: 'required' }],
    },
    {
      id: 'conclusion',
      type: 'task',
      name: '验证窗结论',
      lane: 'cost',
      due: { workdays: 5 },
      meta: { status: 'verifying' },
      outcomes: [
        {
          key: 'issue',
          label: '出验证窗结论',
          attachments: 'required',
          fields: ['verifyWindow', 'verdict'],
        },
      ],
    },
    {
      id: 'judge',
      type: 'task',
      name: '验证达标判断',
      lane: 'pemo',
      due: { workdays: 5 },
      meta: { status: 'awaiting' },
      outcomes: [
        { key: 'pass', label: '达标' },
        { key: 'fail', label: '不达标，退回方案设计', kind: 'return', comment: 'required' },
      ],
    },
    {
      id: 'confirm',
      type: 'task',
      name: '收益认定',
      lane: 'cost',
      due: { workdays: 10 },
      meta: { status: 'awaiting', milestone: '收益确认' },
      outcomes: [
        { key: 'lock', label: '认定并锁定 A', fields: ['a'] },
        { key: 'unpriced', label: '挂账待定', kind: 'reject', comment: 'required' },
      ],
    },
    {
      id: 'pricing',
      type: 'task',
      name: '定价',
      lane: 'cost',
      assignee: { type: 'sameAs', node: 'confirm' },
      meta: { status: 'unpriced' },
      outcomes: [{ key: 'priced', label: '完成定价', comment: 'required' }],
    },
    {
      id: 'negotiate',
      type: 'task',
      name: '商务洽谈',
      lane: 'business',
      offline: true,
      due: { days: 60 },
      meta: { status: 'negotiating' },
      outcomes: [
        {
          key: 'record',
          label: '回填商务结果',
          attachments: 'required',
          fields: ['b', 'contractNo', 'terms'],
        },
      ],
    },
    {
      id: 'judgeDeal',
      type: 'task',
      name: '商务谈定判断',
      lane: 'pemo',
      due: { workdays: 3 },
      meta: { status: 'negotiating' },
      outcomes: [
        { key: 'settled', label: '谈定' },
        { key: 'unsettled', label: '未谈定，继续洽谈', kind: 'return', comment: 'required' },
      ],
    },
    {
      id: 'close',
      type: 'task',
      name: '关闭归档',
      lane: 'pemo',
      due: { workdays: 3 },
      meta: { status: 'realized' },
      outcomes: [{ key: 'close', label: '关闭归档' }],
    },
    {
      id: 'closed',
      type: 'end',
      name: '关闭',
      lane: 'pemo',
      result: 'closed',
      meta: { status: 'closed' },
    },
  ],
  edges: [
    { id: 'entered', from: 'start', to: 'create' },
    { id: 'created', from: 'create', to: 'design', outcome: 'create' },
    { id: 'designed', from: 'design', to: 'verify', outcome: 'done' },
    { id: 'verified', from: 'verify', to: 'conclusion', outcome: 'done' },
    { id: 'concluded', from: 'conclusion', to: 'judge', outcome: 'issue' },
    { id: 'passed', from: 'judge', to: 'confirm', outcome: 'pass' },
    { id: 'failed', from: 'judge', to: 'design', outcome: 'fail', kind: 'return' },
    { id: 'locked', from: 'confirm', to: 'negotiate', outcome: 'lock' },
    { id: 'unpriced', from: 'confirm', to: 'pricing', outcome: 'unpriced' },
    { id: 'priced', from: 'pricing', to: 'confirm', outcome: 'priced' },
    { id: 'recorded', from: 'negotiate', to: 'judgeDeal', outcome: 'record' },
    { id: 'settled', from: 'judgeDeal', to: 'close', outcome: 'settled' },
    { id: 'unsettled', from: 'judgeDeal', to: 'negotiate', outcome: 'unsettled', kind: 'return' },
    { id: 'closed', from: 'close', to: 'closed', outcome: 'close' },
  ],
};

/** 节点 → 任务状态（节点的 meta.status） */
const nodeStatus = new Map(
  taskProcess.nodes.flatMap((node) =>
    node.meta?.status ? [[node.id, node.meta.status as TaskStatus] as const] : [],
  ),
);

/**
 * 任务卡的状态：由流程走到哪个节点决定。暂停是实例挂起、终止是实例被终止；
 * 认定后商务还没认领是“已认定”，认领后是“商务洽谈中”
 */
export function taskStatusOf(
  instance: Pick<ProcessInstance, 'status' | 'active' | 'result'>,
  openItems: readonly Pick<WorkItem, 'node' | 'assignment'>[],
): TaskStatus {
  if (instance.status === 'suspended') return 'paused';
  if (instance.status === 'terminated') return 'terminated';
  if (instance.status === 'completed') return 'closed';
  const node = instance.active[0];
  if (node === 'negotiate')
    return openItems.some((item) => item.node === 'negotiate' && item.assignment === 'pool')
      ? 'confirmed'
      : 'negotiating';
  return (node && nodeStatus.get(node)) || 'pending';
}
