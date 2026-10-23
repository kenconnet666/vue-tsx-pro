// Ellipsis：没截断时是普通文字；截断时能聚焦、有提示（expandable 时换成展开按钮），展开后显示全部
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Ellipsis } from '../Ellipsis';

// happy-dom 没有布局：data-overflow 的元素当作内容比盒子宽、高
afterEach(() => vi.restoreAllMocks());
function stubOverflow() {
  const size = (base: number) =>
    function (this: HTMLElement) {
      return this.closest('[data-overflow]') ? base * 2 : base;
    };
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(size(100));
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(size(40));
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
}

beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
  await Promise.resolve();
  await nextTick();
};

describe('Ellipsis', () => {
  it('没截断：普通文字，不能聚焦、没有提示', async () => {
    stubOverflow();
    const root = mount(() => <Ellipsis>短名称</Ellipsis>);
    await flush();
    const text = root.querySelector<HTMLElement>('span > span')!;
    expect(text.hasAttribute('tabindex')).toBe(false);
    expect(text.hasAttribute('aria-describedby')).toBe(false);
    expect(root.firstElementChild!.hasAttribute('data-truncated')).toBe(false);
  });

  it('截断：文字能聚焦、经 aria-describedby 关联全文的提示', async () => {
    stubOverflow();
    const root = mount(() => (
      <Ellipsis data-overflow="">杭州远山精密机械有限公司（萧山二厂）</Ellipsis>
    ));
    await flush();
    const text = root.querySelector<HTMLElement>('[tabindex="0"]')!;
    expect(text).not.toBeNull();
    const tip = document.getElementById(text.getAttribute('aria-describedby')!)!;
    expect(tip.getAttribute('role')).toBe('tooltip');
    expect(tip.textContent).toBe('杭州远山精密机械有限公司（萧山二厂）');
  });

  it('expandable：截断时后面是“展开”（不再给提示），展开后是“收起”', async () => {
    stubOverflow();
    const root = mount(() => (
      <Ellipsis data-overflow="" lines={3} expandable>
        很长的描述……
      </Ellipsis>
    ));
    await flush();
    expect(root.querySelector('[tabindex="0"]')).toBeNull();
    const toggle = root.querySelector('button')!;
    expect(toggle.textContent).toBe('展开');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    await flush();
    expect(toggle.textContent).toBe('收起');
    expect(root.firstElementChild!.hasAttribute('data-expanded')).toBe(true);
  });
});
