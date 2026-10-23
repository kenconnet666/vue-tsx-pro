// Affix：sticky 与位置；哨兵滚出参照区域时贴住（data-stuck、阴影、onChange）；BackTop：滚过阈值才出现，点了回到顶部
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { hasStyles, mount } from '../../utils/.test/mount';
import { Affix, affixStyles } from '../Affix';
import { BackTop, backTopStyles } from '../BackTop';

afterEach(() => vi.unstubAllGlobals());

interface FakeObserver {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
}

function stubIntersectionObserver() {
  const created: FakeObserver[] = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        created.push({ callback, options });
      }
      observe() {}
      disconnect() {}
    },
  );
  return created;
}

const entry = (isIntersecting: boolean, bottom: number) =>
  ({
    isIntersecting,
    boundingClientRect: { top: bottom, bottom },
    rootBounds: { top: 64, bottom: 800 },
  }) as unknown as IntersectionObserverEntry;

describe('Affix', () => {
  it('哨兵滚到 offsetTop 之上就是贴住：data-stuck、阴影、onChange；滚回来取消', async () => {
    const created = stubIntersectionObserver();
    const onChange = vi.fn();
    const root = mount(() => (
      <Affix offsetTop={64} onChange={onChange}>
        筛选条
      </Affix>
    ));
    await nextTick();
    const sticky = root.querySelector<HTMLElement>('div:not([aria-hidden])')!;
    expect(created[0]!.options?.rootMargin).toBe('-64px 0px 0px 0px');
    created[0]!.callback([entry(false, 10)], {} as IntersectionObserver);
    await nextTick();
    expect(sticky.dataset.stuck).toBe('true');
    expect(hasStyles(sticky, affixStyles.stuck)).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
    created[0]!.callback([entry(true, 200)], {} as IntersectionObserver);
    await nextTick();
    expect(sticky.hasAttribute('data-stuck')).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});

describe('BackTop', () => {
  it('滚过阈值才出现；点了容器回到顶部、焦点移到容器', async () => {
    const scroller = document.createElement('div');
    document.body.append(scroller);
    let top = 0;
    Object.defineProperty(scroller, 'scrollTop', { get: () => top, configurable: true });
    scroller.scrollTo = ((options: ScrollToOptions) => (top = options.top ?? 0)) as never;
    const root = mount(() => <BackTop target={() => scroller} threshold={100} />);
    await nextTick();
    const button = root.querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('回到顶部');
    expect(hasStyles(button, backTopStyles.hidden)).toBe(true);
    top = 300;
    scroller.dispatchEvent(new Event('scroll'));
    await nextTick();
    expect(hasStyles(button, backTopStyles.hidden)).toBe(false);
    button.click();
    expect(top).toBe(0);
    expect(document.activeElement).toBe(scroller);
    scroller.remove();
  });
});
