/**
 * 降 DMC 实施审批（DESIGN.md §3.4，1013 的审批链）：节点就是 DMC 实施节点（策划、ECP 批准、MI 批准、
 * DMC 收益影响评估），完成日期回填到实施节点；之后是涉及供应商的并行会签（一家不同意就退回）、降本审核与财务确认。
 * 每个节点都能驳回到上一节点（落到原处理人），处理人在“流程配置”里可调
 */

import type { ProcessDefinition, ProcessEdge, ProcessTaskNode } from '@vue-tsx-pro/ui/workflow';

/** 审批链的一个节点：标识、名称、默认的收件箱、对应的完成形式 */
const chain = [
  { id: 'planning', name: '降本策划', group: 'product:ZT', form: '实施' },
  { id: 'ecp', name: 'ECP 批准', group: 'product:QY', form: 'ECP 批准' },
  { id: 'mi', name: 'MI 批准', group: 'product:QY', form: 'MI 批准' },
  { id: 'impact', name: 'DMC 收益影响评估', group: 'product:ZT', form: '文件' },
  { id: 'suppliers', name: '供应商收益评估', group: null, form: null },
  { id: 'audit', name: '降本审核', group: 'product:ZT', form: null },
  { id: 'finance', name: '降本确认', group: 'finance', form: null },
] as const;

const lanes = [
  { id: 'zt', name: '总体技术集成团队', group: 'product:ZT' },
  { id: 'qy', name: '起落架液压系统集成团队', group: 'product:QY' },
  { id: 'supplier', name: '供应商' },
  { id: 'finance', name: '总部财务部', group: 'finance' },
];

const laneOf = (group: string | null) =>
  group === null ? 'supplier' : lanes.find((lane) => lane.group === group)!.id;

const nodes: ProcessTaskNode[] = chain.map((step, index) => ({
  id: step.id,
  type: 'task',
  name: step.name,
  lane: laneOf(step.group),
  due: { workdays: 10 },
  meta: step.form ? { dmcForm: step.form } : undefined,
  ...(step.group === null
    ? { multi: { participants: { var: 'supplierAccounts' }, complete: 'all' } }
    : { assignee: { type: 'pool', group: step.group } }),
  outcomes: [
    { key: 'approve', label: step.group === null ? '同意' : '通过', comment: 'optional' },
    ...(index > 0
      ? [
          {
            key: 'reject',
            label: '驳回',
            kind: 'return' as const,
            comment: 'required' as const,
            veto: true,
          },
        ]
      : []),
  ],
}));

const edges: ProcessEdge[] = [
  { id: 'begin', from: 'start', to: chain[0].id },
  ...chain.flatMap((step, index): ProcessEdge[] => {
    const next = chain[index + 1]?.id ?? 'end';
    const forward: ProcessEdge = {
      id: `${step.id}-ok`,
      from: step.id,
      to: next,
      outcome: 'approve',
    };
    if (index === 0) return [forward];
    return [
      forward,
      {
        id: `${step.id}-back`,
        from: step.id,
        to: chain[index - 1]!.id,
        outcome: 'reject',
        kind: 'return',
      },
    ];
  }),
];

/** 降 DMC 实施审批的流程 */
export const dmcProcess: ProcessDefinition = {
  key: 'dmc-implementation',
  name: '降 DMC 实施审批',
  version: 1,
  lanes,
  nodes: [
    { id: 'start', type: 'start', name: '发起', lane: 'zt' },
    ...nodes,
    { id: 'end', type: 'end', name: '确认完成', lane: 'finance', result: 'confirmed' },
  ],
  edges,
};
