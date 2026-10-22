// 流程定义：条件求值、变量改动、取值、结构索引、按处理结果找出边；流转记录推出流程图进度
import { describe, expect, it } from 'vitest';
import {
  applyProcessEffects,
  evaluateProcessCondition,
  nextProcessEdge,
  processGraph,
  resolveProcessValue,
} from '../definition';
import { processProgress, workItemOutcomes } from '../runtime';
import { negotiation } from './fixtures';

describe('evaluateProcessCondition', () => {
  const vars = { round: 2, team: 'fc', amount: '12.5', tags: [], due: '2026-10-21' };

  it('比较：数字与能读成数字的文字按数值，ISO 日期按文字先后；没有值时大小比较不成立', () => {
    expect(evaluateProcessCondition({ var: 'round', op: 'lt', value: 3 }, vars)).toBe(true);
    expect(evaluateProcessCondition({ var: 'amount', op: 'gt', value: 9 }, vars)).toBe(true);
    expect(evaluateProcessCondition({ var: 'due', op: 'lte', value: '2026-10-21' }, vars)).toBe(
      true,
    );
    expect(evaluateProcessCondition({ var: 'missing', op: 'lt', value: 3 }, vars)).toBe(false);
    expect(evaluateProcessCondition({ var: 'team', op: 'in', value: ['fc', 'zt'] }, vars)).toBe(
      true,
    );
  });

  it('exists：空字符串、空数组、没有都算没有；all / any / not 组合', () => {
    expect(evaluateProcessCondition({ var: 'tags', op: 'exists' }, vars)).toBe(false);
    expect(evaluateProcessCondition({ var: 'team', op: 'exists' }, vars)).toBe(true);
    expect(
      evaluateProcessCondition(
        {
          all: [
            { var: 'team', op: 'eq', value: 'fc' },
            { not: { var: 'round', op: 'gte', value: 3 } },
          ],
        },
        vars,
      ),
    ).toBe(true);
    expect(
      evaluateProcessCondition(
        {
          any: [
            { var: 'team', op: 'eq', value: 'zt' },
            { var: 'tags', op: 'exists' },
          ],
        },
        vars,
      ),
    ).toBe(false);
  });
});

describe('applyProcessEffects / resolveProcessValue', () => {
  it('按顺序改，不改原对象；increment 把没有的当作 0', () => {
    const before = { round: 1 };
    const after = applyProcessEffects(
      [{ increment: 'round' }, { increment: 'count', by: 2 }, { set: 'locked', value: true }],
      before,
    );
    expect(after).toEqual({ round: 2, count: 2, locked: true });
    expect(before).toEqual({ round: 1 });
  });

  it('变量引用取流程变量，直接写的原样返回', () => {
    expect(resolveProcessValue({ var: 'supplier' }, { supplier: 'S01' })).toBe('S01');
    expect(resolveProcessValue('cost', {})).toBe('cost');
  });
});

describe('processGraph / nextProcessEdge', () => {
  const graph = processGraph(negotiation);

  it('按标识找节点与泳道，出边与入边按定义的先后；同一个定义只建一次', () => {
    expect(graph.node('review')?.name).toBe('协商与认可');
    expect(graph.lane('cost')?.group).toBe('cost');
    expect(graph.outgoing('review').map((edge) => edge.id)).toEqual(['e3', 'e4']);
    expect(graph.incoming('estimate').map((edge) => edge.id)).toEqual(['e1', 'e6']);
    expect(graph.start?.id).toBe('start');
    expect(processGraph(negotiation)).toBe(graph);
  });

  it('人工节点按处理结果走；排他网关按条件走，都不满足走默认边', () => {
    expect(nextProcessEdge(graph, 'review', 'accept', {})?.id).toBe('e3');
    expect(nextProcessEdge(graph, 'review', 'object', {})?.id).toBe('e4');
    expect(nextProcessEdge(graph, 'rounds', null, { round: 2 })?.id).toBe('e6');
    expect(nextProcessEdge(graph, 'rounds', null, { round: 3 })?.id).toBe('e5');
    expect(nextProcessEdge(graph, 'estimate', 'done', {})?.id).toBe('e2');
  });
});

describe('processProgress / workItemOutcomes', () => {
  it('处理过的节点是 done、正在处理的是 active，走过的连线（含退回）都标出', () => {
    const progress = processProgress({ status: 'active', active: ['estimate'] }, [
      { type: 'started', node: 'start', edge: 'e1' },
      { type: 'completed', node: 'estimate', edge: 'e2' },
      { type: 'completed', node: 'review', edge: 'e4' },
      { type: 'arrived', node: 'rounds', edge: 'e6' },
    ]);
    expect(progress.nodes).toEqual({ start: 'done', estimate: 'active', review: 'done' });
    expect([...progress.edges]).toEqual(['e1', 'e2', 'e4', 'e6']);
  });

  it('结束了的实例不标 active；待办的按钮取自节点的处理结果', () => {
    const progress = processProgress({ status: 'completed', active: ['review'] }, [
      { type: 'ended', node: 'end', edge: null },
    ]);
    expect(progress.nodes).toEqual({ end: 'done' });
    expect(workItemOutcomes(negotiation, { node: 'review' }).map((item) => item.key)).toEqual([
      'accept',
      'object',
    ]);
    expect(workItemOutcomes(negotiation, { node: 'rounds' })).toEqual([]);
  });
});
