// Embed：定比例的 iframe，title 必填、默认延迟加载；加载完之前是骨架，加载完骨架撤掉
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Embed } from '../Embed';

describe('Embed', () => {
  it('iframe 带 title、src，默认 loading="lazy" 与 referrerpolicy；其余属性落到 iframe 上', async () => {
    const root = mount(() => (
      <Embed src="https://example.com/embed/42" title="产品演示" allow="fullscreen" />
    ));
    await nextTick();
    const frame = root.querySelector('iframe')!;
    expect(frame.getAttribute('title')).toBe('产品演示');
    expect(frame.getAttribute('src')).toBe('https://example.com/embed/42');
    expect(frame.getAttribute('loading')).toBe('lazy');
    expect(frame.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
    expect(frame.getAttribute('allow')).toBe('fullscreen');
    expect(root.querySelector('[data-scope="embed"][data-part="root"]')).not.toBeNull();
  });

  it('加载完之前有骨架；load 之后撤掉并调用 onLoad；换了地址重新显示骨架', async () => {
    const onLoad = vi.fn();
    let src = _state('https://example.com/a');
    const root = mount(() => <Embed src={src} title="报表" onLoad={onLoad} />);
    await nextTick();
    const outer = root.querySelector<HTMLElement>('[data-scope="embed"][data-part="root"]')!;
    const placeholder = () => root.querySelector('[data-part="placeholder"]');
    expect(outer.dataset.state).toBe('loading');
    expect(placeholder()).not.toBeNull();
    root.querySelector('iframe')!.dispatchEvent(new Event('load'));
    await nextTick();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(outer.dataset.state).toBe('loaded');
    expect(placeholder()).toBeNull();
    src = 'https://example.com/b';
    await nextTick();
    await nextTick();
    expect(outer.dataset.state).toBe('loading');
    expect(placeholder()).not.toBeNull();
  });
});
