// 测试共用的流程定义
import type { ProcessDefinition } from '../definition';

/** 协商：供应商认可就锁定；有异议回到测算，第 3 轮之后提级 */
export const negotiation: ProcessDefinition = {
  key: 'negotiation',
  name: '协商',
  version: 1,
  lanes: [
    { id: 'supplier', name: '供应商' },
    { id: 'cost', name: '财务部', group: 'cost' },
    { id: 'pmo', name: 'PMO', group: 'pmo' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '开始', lane: 'cost' },
    {
      id: 'estimate',
      type: 'task',
      name: '费用核算',
      lane: 'cost',
      outcomes: [{ key: 'done', label: '出核算' }],
    },
    {
      id: 'review',
      type: 'task',
      name: '协商与认可',
      lane: 'supplier',
      assignee: { type: 'user', user: { var: 'supplier' } },
      due: { workdays: 10 },
      overdue: { outcome: 'accept' },
      outcomes: [
        { key: 'accept', label: '认可' },
        { key: 'object', label: '提出异议', kind: 'return', comment: 'required' },
      ],
    },
    { id: 'rounds', type: 'exclusive', name: '轮次' },
    {
      id: 'arbitrate',
      type: 'task',
      name: '提级裁决',
      lane: 'pmo',
      outcomes: [{ key: 'decide', label: '裁决' }],
    },
    { id: 'end', type: 'end', name: '锁定 A', result: 'locked' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'estimate' },
    { id: 'e2', from: 'estimate', to: 'review' },
    { id: 'e3', from: 'review', to: 'end', outcome: 'accept' },
    {
      id: 'e4',
      from: 'review',
      to: 'rounds',
      outcome: 'object',
      effects: [{ increment: 'round' }],
    },
    {
      id: 'e5',
      from: 'rounds',
      to: 'arbitrate',
      kind: 'escalate',
      when: { var: 'round', op: 'gte', value: 3 },
    },
    { id: 'e6', from: 'rounds', to: 'estimate', kind: 'return', default: true },
    { id: 'e7', from: 'arbitrate', to: 'end' },
  ],
};
