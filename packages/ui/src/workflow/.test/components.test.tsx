// 流程图的排布（列按最长路径、往回的边走上沿、泳道的高度）；FlowDiagram 的节点状态、连线种类、点选；
// useWorkflowTimeline 写成的 Timeline 各项：文案、隐藏到达、意见与附件，Timeline 的 reverse 新的在前；ApprovalActions 不要求填写的直接提交、要求的不直接提交
import { _component } from '@vue-tsx-pro/tsx';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { ApprovalActions } from '../ApprovalActions';
import { FlowDiagram } from '../FlowDiagram';
import { layoutProcess } from '../layout';
import { processProgress, type WorkflowEvent } from '../runtime';
import { Timeline } from '../../display/Timeline';
import { useWorkflowTimeline, type WorkflowTimelineOptions } from '../timeline';
import { negotiation } from './fixtures';

describe('layoutProcess', () => {
  const layout = layoutProcess(negotiation);
  const node = (id: string) => layout.nodes.find((item) => item.id === id)!;

  it('沿着往右的边列数递增；往回的边（再一轮测算）标为 back，走上沿', () => {
    expect(node('start').column).toBe(0);
    expect(node('estimate').column).toBe(1);
    expect(node('review').column).toBe(2);
    expect(node('rounds').column).toBe(3);
    const back = layout.edges.find((edge) => edge.id === 'e6')!;
    expect(back.back).toBe(true);
    // 起点上边出、终点上边进，中间一段在两条泳道里靠上那条的上沿
    expect(back.points[0]!.y).toBe(node('rounds').y);
    expect(back.points.at(-1)!.y).toBe(node('estimate').y);
    expect(back.points[1]!.y).toBeLessThan(node('estimate').y);
  });

  it('泳道按定义的先后，节点落在自己的泳道里（没写泳道的网关跟着上游）；往右的边从右边出、左边进', () => {
    expect(layout.lanes.map((lane) => lane.id)).toEqual(['supplier', 'cost', 'pemo']);
    expect(node('rounds').lane).toBe('supplier');
    for (const item of layout.nodes) {
      const lane = layout.lanes.find((band) => band.id === item.lane)!;
      expect(item.y).toBeGreaterThanOrEqual(lane.y);
      expect(item.y + item.height).toBeLessThanOrEqual(lane.y + lane.height);
    }
    const forward = layout.edges.find((edge) => edge.id === 'e2')!;
    expect(forward.points[0]!.x).toBe(node('estimate').x + node('estimate').width);
    expect(forward.points.at(-1)!.x).toBe(node('review').x);
    expect(layout.height).toBe(layout.lanes.reduce((sum, lane) => sum + lane.height, 0));
  });
});

describe('FlowDiagram', () => {
  const progress = processProgress({ status: 'active', active: ['review'] }, [
    { type: 'started', node: 'start', edge: 'e1' },
    { type: 'completed', node: 'estimate', edge: 'e2' },
  ]);

  it('节点带状态（data-state、读屏名称）；走过的连线、退回与提级的连线分别标出', () => {
    const root = mount(() => (
      <FlowDiagram definition={negotiation} progress={progress} aria-label="协商流程" />
    ));
    const node = (id: string) => root.querySelector(`[data-node="${id}"]`)!;
    expect(node('estimate').getAttribute('data-state')).toBe('done');
    expect(node('review').getAttribute('data-state')).toBe('active');
    expect(node('review').getAttribute('aria-label')).toBe('协商与认可：处理中');
    expect(node('arbitrate').getAttribute('data-state')).toBe('pending');
    expect(root.querySelector('[data-edge="e2"]')!.getAttribute('data-state')).toBe('traversed');
    expect(root.querySelector('[data-edge="e6"]')!.getAttribute('marker-end')).toMatch(
      /-return\)$/,
    );
    expect(root.querySelector('[data-edge="e5"]')!.getAttribute('marker-end')).toMatch(
      /-escalate\)$/,
    );
    // 有几个出边的人工节点，连线上写处理结果的名字
    expect(root.textContent).toContain('提出异议');
    expect(root.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe(
      '协商，正在处理：协商与认可',
    );
  });

  it('selectable：节点是按钮，点了写回 selected；校验出问题的节点标红', async () => {
    const Host = _component(() => {
      let picked = _state<string | null>('review');
      return () => (
        <>
          <FlowDiagram
            definition={negotiation}
            selectable
            selected={_bind(picked)}
            problems={[{ severity: 'error', code: 'x', message: '坏了', node: 'arbitrate' }]}
          />
          <output>{picked}</output>
        </>
      );
    });
    const root = mount(() => <Host />);
    const review = root.querySelector<HTMLButtonElement>('button[data-node="review"]')!;
    expect(review.getAttribute('aria-pressed')).toBe('true');
    root.querySelector<HTMLButtonElement>('button[data-node="estimate"]')!.click();
    await nextTick();
    expect(root.querySelector('output')!.textContent).toBe('estimate');
    expect(root.querySelector('[data-node="arbitrate"]')!.getAttribute('data-state')).toBe(
      'invalid',
    );
  });
});

/** 用 useWorkflowTimeline 写成各项，交给 Timeline（新的在前） */
const WorkflowRecords = _component(({ events, definition, actorName }: WorkflowTimelineOptions) => {
  const records = useWorkflowTimeline(() => ({ events, definition, actorName }));
  return () => <Timeline items={records.value} reverse />;
});

describe('useWorkflowTimeline', () => {
  const event = (partial: Partial<WorkflowEvent>): WorkflowEvent => ({
    id: partial.id ?? Math.random().toString(),
    instanceId: 'pi-1',
    type: 'completed',
    at: '2026-10-21T09:30:00',
    actor: 'E1',
    node: null,
    workItem: null,
    edge: null,
    outcome: null,
    comment: '',
    attachments: [],
    ...partial,
  });

  it('处理写成“谁 · 节点：结果”，退回类的着黄色；意见与附件在说明里；到达不显示；新的在前', () => {
    const root = mount(() => (
      <WorkflowRecords
        definition={negotiation}
        actorName={(id) => ({ E1: '王晴', S1: '供应商甲' })[id] ?? id}
        events={[
          event({ id: 'a', type: 'arrived', node: 'review' }),
          event({ id: 'b', node: 'estimate', outcome: 'done', at: '2026-10-20T10:00:00' }),
          event({
            id: 'c',
            actor: 'S1',
            node: 'review',
            outcome: 'object',
            comment: '单价偏高',
            attachments: ['报价单.pdf'],
          }),
          event({ id: 'd', type: 'claimed', node: 'arbitrate', actor: 'system' }),
        ]}
      />
    ));
    const items = [...root.querySelectorAll('ol > li')].map((item) => item.textContent);
    expect(items).toHaveLength(3);
    expect(items[0]).toContain('系统 认领了 提级裁决');
    expect(items[1]).toContain('供应商甲 · 协商与认可：提出异议');
    expect(items[1]).toContain('单价偏高');
    expect(items[1]).toContain('报价单.pdf');
    expect(items[2]).toContain('王晴 · 收益测算：出测算');
    expect(items[2]).toContain('10-20 10:00');
  });
});

describe('ApprovalActions', () => {
  it('不要求填写的结果直接提交；要求意见的先弹对话框，不直接提交', async () => {
    const onComplete = vi.fn();
    const review = negotiation.nodes.find((node) => node.id === 'review')!;
    const outcomes = review.type === 'task' ? review.outcomes : [];
    const root = mount(() => (
      <ApprovalActions node="协商与认可" outcomes={outcomes} onComplete={onComplete} />
    ));
    const button = (key: string) =>
      root.querySelector<HTMLButtonElement>(`button[data-outcome="${key}"]`)!;
    expect(button('accept').textContent).toBe('认可');
    button('accept').click();
    await nextTick();
    expect(onComplete).toHaveBeenCalledWith({ outcome: 'accept', comment: '', attachments: [] });
    button('object').click();
    await nextTick();
    // 对话框在 happy-dom 里不完整，填写与提交在浏览器里验证
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
