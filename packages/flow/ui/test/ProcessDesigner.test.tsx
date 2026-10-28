// 设计器：选模板、加环节、点环节改名、切到代码、试运行拿到定义
import { describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { ProcessDesigner } from '../src/index.ts';

function mount(onSimulate = vi.fn()) {
  const host = document.createElement('div');
  document.body.append(host);
  const definition = ref<ProcessDefinition | null>(null);
  createApp(
    defineComponent({
      setup: () => () =>
        h(ProcessDesigner as never, {
          _definition: definition.value,
          'onUpdate:_definition': (value: ProcessDefinition) => (definition.value = value),
          onSimulate,
        }),
    }),
  ).mount(host);
  return { host, definition, onSimulate };
}

const button = (host: HTMLElement, text: string) =>
  [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;

describe('ProcessDesigner', () => {
  it('从模板起步，加审批环节，点环节改名', async () => {
    const { host, definition } = mount();
    expect(host.textContent).toContain('先选一个最接近的模板');
    button(host, '用这个模板').click();
    await nextTick();
    expect(definition.value?.key).toBe('leave');
    const before = definition.value!.nodes.length;

    host
      .querySelector<SVGGElement>('[data-node="manager"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    button(host, '加审批环节').click();
    await nextTick();
    expect(definition.value!.nodes.length).toBe(before + 1);

    const added = definition.value!.nodes.find((n) => n.name === '新的审批')!;
    host
      .querySelector<SVGGElement>(`[data-node="${added.id}"]`)!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    const name = host.querySelector<HTMLInputElement>('[aria-label="环节设置"] input')!;
    name.value = '总监审批';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    expect(definition.value!.nodes.some((n) => n.name === '总监审批')).toBe(true);
    expect(host.textContent).toContain('没有问题');
  });

  it('切到代码看得到定义；试运行拿到当前的定义', async () => {
    const { host, onSimulate } = mount();
    button(host, '用这个模板').click();
    await nextTick();
    button(host, '切到代码').click();
    await nextTick();
    const code = host.querySelector<HTMLTextAreaElement>('textarea')!;
    expect(JSON.parse(code.value).key).toBe('leave');
    button(host, '切回设计').click();
    await nextTick();
    button(host, '试运行').click();
    expect(onSimulate.mock.calls[0]![0].key).toBe('leave');
  });
});
