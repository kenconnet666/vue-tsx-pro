// CodeGroup：标签页切换几段代码；选中的可以双向绑定
import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { mount } from '../../utils/.test/mount';
import { CodeGroup } from '../CodeGroup';

const items = [
  { label: 'pnpm', code: 'pnpm add x' },
  { label: 'npm', code: 'npm i x' },
];
const visibleCode = (root: Element) =>
  [...root.querySelectorAll('[role="tabpanel"]')]
    .filter((panel) => !(panel as HTMLElement).hidden)
    .map((panel) => panel.querySelector('code')?.textContent);

describe('CodeGroup', () => {
  it('默认显示第一段，点标签切换，选中的值写回', async () => {
    const selected = ref<string>();
    const root = mount(() => <CodeGroup items={items} _value={selected.value} />);
    expect(visibleCode(root)).toEqual(['pnpm add x']);
    expect(root.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('pnpm / npm');
    root.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1]!.click();
    await nextTick();
    expect(selected.value).toBe('npm');
    expect(visibleCode(root)).toEqual(['npm i x']);
  });
});
