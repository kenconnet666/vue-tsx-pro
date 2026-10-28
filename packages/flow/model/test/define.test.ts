// defineProcess：原样返回，类型从字面量推出节点、处理结果、流程变量
import { describe, expectTypeOf, it } from 'vitest';
import {
  defineProcess,
  validateProcess,
  type NodeIdOf,
  type OrgId,
  type OutcomeOf,
  type TaskIdOf,
  type VariablesOf,
} from '../src/index.ts';

const purchase = defineProcess({
  key: 'purchase',
  name: '采购申请',
  variables: [
    { name: 'amount', type: 'number' },
    { name: 'supplier', type: 'text' },
    { name: 'reviewers', type: 'people' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '发起' },
    {
      id: 'manager',
      type: 'task',
      name: '部门经理',
      assignees: [{ initiator: true }],
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'reject', label: '驳回', kind: 'reject' },
      ],
    },
    { id: 'end', type: 'end', name: '结束' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'manager' },
    { id: 'e2', from: 'manager', to: 'end' },
  ],
});

describe('defineProcess', () => {
  it('原样返回，定义照常通过校验', () => {
    expectTypeOf(purchase.key).toEqualTypeOf<'purchase'>();
    const problems = validateProcess(purchase);
    if (problems.some((problem) => problem.severity === 'error'))
      throw new Error(JSON.stringify(problems));
  });

  it('推出节点、人工节点与处理结果', () => {
    expectTypeOf<NodeIdOf<typeof purchase>>().toEqualTypeOf<'start' | 'manager' | 'end'>();
    expectTypeOf<TaskIdOf<typeof purchase>>().toEqualTypeOf<'manager'>();
    expectTypeOf<OutcomeOf<typeof purchase, 'manager'>>().toEqualTypeOf<'approve' | 'reject'>();
  });

  it('推出流程变量的类型', () => {
    expectTypeOf<VariablesOf<typeof purchase>>().toEqualTypeOf<{
      amount?: number;
      supplier?: string;
      reviewers?: OrgId[];
    }>();
  });
});
