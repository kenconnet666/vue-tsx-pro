// 流程图：每个节点、每条连线一份；正在处理的、走过的标出来；点节点报告标识
import { describe, expect, it, vi } from 'vitest';
import { createApp, h } from 'vue';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { ProcessDiagram } from '../src/index.ts';

import purchaseJson from '../../spec/scenarios/processes/purchase.json';

const purchase = purchaseJson as unknown as ProcessDefinition;

function mount(props: Record<string, unknown>) {
  const host = document.createElement('div');
  document.body.append(host);
  createApp({ render: () => h(ProcessDiagram as never, props) }).mount(host);
  return host;
}

describe('ProcessDiagram', () => {
  it('画出每个节点与连线，标出正在处理的与走过的', () => {
    const host = mount({ definition: purchase, current: ['review'], done: ['start', 'submit'] });
    expect(host.querySelectorAll('[data-node]')).toHaveLength(purchase.nodes.length);
    expect(host.querySelectorAll('[data-edge]')).toHaveLength(purchase.edges.length);
    expect(host.querySelector('[data-node="review"]')!.getAttribute('data-state')).toBe('current');
    expect(host.querySelector('[data-node="start"]')!.getAttribute('data-state')).toBe('done');
    expect(host.querySelector('svg')!.getAttribute('aria-label')).toBe('采购申请');
  });

  it('点节点、按回车报告节点标识', () => {
    const onSelect = vi.fn();
    const host = mount({ definition: purchase, onSelect });
    const review = host.querySelector<SVGGElement>('[data-node="review"]')!;
    review.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    review.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSelect.mock.calls).toEqual([['review'], ['review']]);
  });
});
