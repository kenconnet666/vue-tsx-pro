/**
 * 计划调整（DESIGN.md §3.5）：方案调整、延期须经 PEMO 同意，不得自行改日期。
 * 主办提交调整申请（调整项与原因写在流程变量里）→ PEMO 审批；同意后后端把调整写回任务卡并记变更记录
 */
import type { ProcessDefinition } from '@vue-tsx-pro/ui';

/** 计划调整的流程 */
export const taskChangeProcess: ProcessDefinition = {
  key: 'task-change',
  name: '计划调整',
  version: 1,
  lanes: [
    { id: 'product', name: '主办' },
    { id: 'pemo', name: 'PEMO', group: 'pemo' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '提交申请', lane: 'product' },
    {
      id: 'approve',
      type: 'task',
      name: 'PEMO 审批',
      lane: 'pemo',
      due: { workdays: 3 },
      outcomes: [
        { key: 'agree', label: '同意', comment: 'optional' },
        { key: 'disagree', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'agreed', type: 'end', name: '已调整', lane: 'pemo', result: 'agreed' },
    { id: 'disagreed', type: 'end', name: '未同意', lane: 'pemo', result: 'disagreed' },
  ],
  edges: [
    { id: 'submitted', from: 'start', to: 'approve' },
    { id: 'agree', from: 'approve', to: 'agreed', outcome: 'agree' },
    { id: 'disagree', from: 'approve', to: 'disagreed', outcome: 'disagree' },
  ],
};
