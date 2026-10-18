// 高度过渡、页内搜索展开在真实浏览器里的效果见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Collapse } from '../Collapse';

/** 收起后的隐藏方式：支持 until-found 的浏览器用它，否则用 inert */
const isHidden = (el: Element) =>
  el.getAttribute('hidden') === 'until-found' || el.hasAttribute('inert');

describe('Collapse', () => {
  it('收起时隐藏内容（until-found 或 inert），展开后去掉', async () => {
    let open = _state(false);
    const root = mount(() => <Collapse open={_bind(open)}>内容</Collapse>).firstElementChild!;
    await nextTick();
    expect(isHidden(root)).toBe(true);
    expect(root.textContent).toBe('内容');

    open = true;
    await nextTick();
    expect(isHidden(root)).toBe(false);
  });

  it('页内搜索命中（beforematch）时展开并写回 open', async () => {
    let open = _state(false);
    const root = mount(() => <Collapse open={_bind(open)}>内容</Collapse>).firstElementChild!;
    root.dispatchEvent(new Event('beforematch'));
    await nextTick();
    expect(open).toBe(true);
    expect(isHidden(root)).toBe(false);
  });

  it('属性落到外层，propsContent 落到内容层', () => {
    const root = mount(() => (
      <Collapse open data-x="1" propsContent={{ class: 'inner' }}>
        内容
      </Collapse>
    )).firstElementChild!;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('data-x')).toBe('1');
    expect(root.firstElementChild!.classList.contains('inner')).toBe(true);
  });

  it('lazy：第一次展开时才渲染内容，之后收起也保留', async () => {
    let open = _state(false);
    const root = mount(() => (
      <Collapse open={_bind(open)} lazy>
        内容
      </Collapse>
    )).firstElementChild!;
    expect(root.textContent).toBe('');
    open = true;
    await nextTick();
    expect(root.textContent).toBe('内容');
    open = false;
    await nextTick();
    expect(root.textContent).toBe('内容');
  });
});
