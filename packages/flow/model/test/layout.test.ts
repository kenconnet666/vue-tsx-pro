// 自动布局：按最长前进路径分列，汇合在所有分支之后；退回不参与分列；定义里的坐标优先
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { autoLayout, type ProcessDefinition } from '../src/index.ts';
import { readSpec } from './spec.ts';

const parallel = readSpec<ProcessDefinition>('scenarios/processes/contract-parallel.json');
const reimburse = readSpec<ProcessDefinition>('scenarios/processes/reimburse.json');

describe('autoLayout', () => {
  it('并行：两条分支同一列、上下排开，汇合在它们之后', () => {
    const { nodes } = autoLayout(parallel);
    const fork = parallel.nodes.find((n) => n.type === 'parallel')!.id;
    const branches = parallel.edges.filter((e) => e.from === fork).map((e) => nodes.get(e.to)!);
    assert.equal(branches.length, 2);
    assert.equal(branches[0]!.column, branches[1]!.column);
    assert.notEqual(branches[0]!.y, branches[1]!.y);
    const join = parallel.edges.find(
      (e) => e.from === parallel.edges.find((x) => x.from === fork)!.to,
    )!.to;
    assert.ok(nodes.get(join)!.column > branches[0]!.column);
  });

  it('退回的连线不参与分列：开始在第 0 列，结束在最后', () => {
    const { nodes, width } = autoLayout(reimburse);
    assert.equal(nodes.get('start')!.column, 0);
    const end = reimburse.nodes.find((n) => n.type === 'end')!.id;
    assert.equal(nodes.get(end)!.column, Math.max(...[...nodes.values()].map((p) => p.column)));
    assert.ok(width > 0);
  });

  it('定义里写了坐标的节点用它', () => {
    const { nodes } = autoLayout({ ...reimburse, layout: { nodes: { start: { x: 10, y: 20 } } } });
    assert.deepEqual([nodes.get('start')!.x, nodes.get('start')!.y], [10, 20]);
  });
});
