// FlowDesigner：点节点打开属性面板，改名称、时限单位、超时提醒写回定义；取变量的处理人只读；
// 有错误时不能发布、问题点一下选中节点；发布收到版本加一的定义
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { mount } from '../../utils/.test/mount';
import type { ProcessDefinition } from '../definition';
import { FlowDesigner } from '../FlowDesigner';
import { negotiation } from './fixtures';

beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

function render(definition: ProcessDefinition, onPublish?: (flow: ProcessDefinition) => unknown) {
  const state = reactive({ definition, selected: null as string | null });
  const root = mount(() => (
    <FlowDesigner
      _definition={_bind(state.definition)}
      _selected={_bind(state.selected)}
      onPublish={onPublish}
    />
  ));
  const panel = () => root.querySelector('section[aria-label="节点属性"]')!;
  const node = (id: string) => root.querySelector<HTMLButtonElement>(`button[data-node="${id}"]`)!;
  const nodeOf = (id: string) => state.definition.nodes.find((item) => item.id === id)!;
  return { root, state, panel, node, nodeOf };
}

describe('FlowDesigner', () => {
  it('没选节点时是提示；点节点打开它的属性，取流程变量的处理人只显示变量名', async () => {
    const { panel, node } = render(negotiation);
    expect(panel().textContent).toContain('点流程图上的一个节点');
    node('review').click();
    await flush();
    expect(panel().textContent).toContain('协商与认可');
    expect(panel().textContent).toContain('取流程变量 supplier');
    expect(panel().textContent).toContain('认可提出异议');
  });

  it('改名称、时限单位、超时提醒都写回一份新的定义', async () => {
    const { state, panel, node, nodeOf } = render(negotiation);
    node('review').click();
    await flush();
    const name = panel().querySelector<HTMLInputElement>('input[type="text"], input:not([type])')!;
    name.value = '供应商确认';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    expect(nodeOf('review').name).toBe('供应商确认');
    expect(state.definition).not.toBe(negotiation);

    const days = [...panel().querySelectorAll('button')].find((b) => b.textContent === '自然日')!;
    days.click();
    await flush();
    expect(nodeOf('review')).toMatchObject({ due: { days: 10 } });

    const remind = panel().querySelector<HTMLInputElement>('input[role="switch"]')!;
    remind.click();
    await flush();
    expect(nodeOf('review')).toMatchObject({ overdue: { outcome: 'accept', remind: true } });
  });

  it('有错误时不能发布；点一个问题选中对应的节点', async () => {
    // 去掉提级裁决的出边：裁决之后走不下去
    const broken: ProcessDefinition = {
      ...negotiation,
      edges: negotiation.edges.filter((edge) => edge.id !== 'e7'),
    };
    const { root, state } = render(broken, () => {});
    const publish = [...root.querySelectorAll('button')].find((b) => b.textContent === '发布 v2')!;
    expect(publish.disabled).toBe(true);
    expect(root.textContent).toContain('个错误');
    const problem = root.querySelector<HTMLButtonElement>('ul[aria-label="校验问题"] button')!;
    problem.click();
    await flush();
    expect(state.selected).toBe('arbitrate');
  });

  it('没有改动时不能发布；改了之后发布收到版本加一的定义，成功后草稿的版本跟着加一', async () => {
    const onPublish = vi.fn(() => Promise.resolve());
    const { root, state, node, panel } = render(negotiation, onPublish);
    const publish = () =>
      [...root.querySelectorAll('button')].find((b) => b.textContent?.startsWith('发布 v'))!;
    expect(root.textContent).toContain('校验通过');
    expect(publish().disabled).toBe(true);

    node('review').click();
    await flush();
    panel().querySelector<HTMLInputElement>('input[role="switch"]')!.click();
    await flush();
    expect(root.textContent).toContain('有未发布的修改');
    expect(publish().disabled).toBe(false);
    publish().click();
    await flush();
    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'negotiation', version: 2 }),
    );
    expect(state.definition.version).toBe(2);
    expect(publish().textContent).toBe('发布 v3');
    expect(publish().disabled).toBe(true);
    expect(root.textContent).not.toContain('有未发布的修改');
  });
});
