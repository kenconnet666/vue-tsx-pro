// validateProcess：合法的流程没有问题；结构上的错误（走不下去）与警告（多半画漏）各自报出，带上节点或连线
import { describe, expect, it } from 'vitest';
import type { ProcessDefinition, ProcessNode } from '../definition';
import { validateProcess } from '../validate';
import { negotiation } from './fixtures';

/** 在合法流程上改一处 */
const variant = (
  change: (flow: { nodes: ProcessNode[]; edges: ProcessDefinition['edges'][number][] }) => void,
) => {
  const flow = { ...negotiation, nodes: [...negotiation.nodes], edges: [...negotiation.edges] };
  change(flow);
  return validateProcess(flow);
};

const codes = (problems: ReturnType<typeof validateProcess>) => problems.map((item) => item.code);

describe('validateProcess', () => {
  it('合法的流程没有问题', () => {
    expect(validateProcess(negotiation)).toEqual([]);
  });

  it('处理结果没有出边、出边指向不存在的结果、超时结果不存在：错误，指出节点或连线', () => {
    const problems = variant((flow) => {
      flow.edges = flow.edges.filter((edge) => edge.id !== 'e3');
      flow.edges.push({ id: 'x1', from: 'review', to: 'end', outcome: 'maybe' });
    });
    expect(problems).toContainEqual(
      expect.objectContaining({ severity: 'error', code: 'outcome-unrouted', node: 'review' }),
    );
    expect(problems).toContainEqual(
      expect.objectContaining({ code: 'edge-unknown-outcome', edge: 'x1' }),
    );
    const overdue = variant((flow) => {
      flow.nodes = flow.nodes.map((node) =>
        node.id === 'review' && node.type === 'task'
          ? { ...node, overdue: { outcome: 'x' } }
          : node,
      );
    });
    expect(codes(overdue)).toEqual(['overdue-unknown-outcome']);
  });

  it('人工节点没有处理人：既没写 assignee，泳道也没有岗位收件箱', () => {
    const problems = variant((flow) => {
      flow.nodes = flow.nodes.map((node) =>
        node.id === 'review' && node.type === 'task' ? { ...node, assignee: undefined } : node,
      );
    });
    expect(problems).toEqual([
      expect.objectContaining({ code: 'task-no-assignee', node: 'review' }),
    ]);
    // 会签：处理人是参与人列表
    const multi = variant((flow) => {
      flow.nodes = flow.nodes.map((node) =>
        node.id === 'review' && node.type === 'task'
          ? {
              ...node,
              assignee: undefined,
              multi: { participants: { var: 'suppliers' }, complete: 'all' },
            }
          : node,
      );
    });
    expect(multi).toEqual([]);
  });

  it('开始节点有入边、结束节点有出边、连到不存在的节点、标识重复', () => {
    const problems = variant((flow) => {
      flow.edges.push({ id: 'x1', from: 'arbitrate', to: 'start' });
      flow.edges.push({ id: 'x2', from: 'end', to: 'ghost' });
      flow.edges.push({ id: 'e1', from: 'start', to: 'estimate' });
    });
    expect(codes(problems)).toEqual(
      expect.arrayContaining([
        'start-incoming',
        'end-outgoing',
        'edge-unknown-node',
        'edge-duplicate',
      ]),
    );
  });

  it('没有开始或结束；走不到结束的节点是错误，从开始走不到的节点是警告', () => {
    expect(
      codes(variant((flow) => (flow.nodes = flow.nodes.filter((node) => node.type !== 'start')))),
    ).toContain('start-missing');
    const problems = variant((flow) => {
      flow.nodes.push({
        id: 'orphan',
        type: 'task',
        name: '孤立',
        lane: 'cost',
        outcomes: [{ key: 'ok', label: '好' }],
      });
      flow.edges.push({ id: 'x1', from: 'orphan', to: 'end' });
      flow.nodes.push({ id: 'loop', type: 'exclusive', name: '死循环' });
      flow.edges = flow.edges.map((edge) => (edge.id === 'e7' ? { ...edge, to: 'loop' } : edge));
      flow.edges.push({ id: 'x2', from: 'loop', to: 'arbitrate' });
    });
    expect(problems).toContainEqual(
      expect.objectContaining({ severity: 'warning', code: 'node-unreachable', node: 'orphan' }),
    );
    expect(problems).toContainEqual(
      expect.objectContaining({ severity: 'error', code: 'node-dead-end', node: 'arbitrate' }),
    );
  });

  it('排他网关：多条默认边是错误，多条出边里没条件的是警告；并行网关不分叉也不汇合是警告', () => {
    const problems = variant((flow) => {
      flow.edges = flow.edges.map((edge) =>
        edge.id === 'e5' ? { ...edge, when: undefined } : edge,
      );
    });
    expect(problems).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'gateway-edge-unconditional',
        edge: 'e5',
      }),
    ]);
    expect(
      codes(
        variant(
          (flow) =>
            (flow.edges = flow.edges.map((edge) => ({ ...edge, default: edge.from === 'rounds' }))),
        ),
      ),
    ).toContain('gateway-multiple-default');
    expect(
      codes(
        variant((flow) => {
          flow.nodes = flow.nodes.map((node) =>
            node.id === 'rounds' ? { ...node, type: 'parallel' as const } : node,
          );
          flow.edges = flow.edges.filter((edge) => edge.id !== 'e5');
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        'parallel-useless',
        'parallel-edge-condition',
        'edge-default-not-exclusive',
      ]),
    );
  });
});
