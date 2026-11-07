// Tooltip、HoverCard：提示是触发器的描述（aria-describedby）；指针停留 delay 后才显示，触屏不显示，Esc 隐藏
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { HoverCard } from '../HoverCard';
import { Tooltip } from '../Tooltip';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const enter = (element: Element, pointerType = 'mouse') =>
  element.dispatchEvent(new PointerEvent('pointerenter', { pointerType }));
const escape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

describe('Tooltip', () => {
  it('触发器以提示为描述；指针停留 delay 后显示，Esc 隐藏', async () => {
    const root = mount(() => (
      <Tooltip delay={300} trigger={(props) => <button {...props} aria-label="复制" />}>
        复制（Ctrl+C）
      </Tooltip>
    ));
    await nextTick();
    const button = root.querySelector('button')!;
    const tip = document.getElementById(button.getAttribute('aria-describedby')!)!;
    expect(tip.getAttribute('role')).toBe('tooltip');
    expect(tip.textContent).toBe('复制（Ctrl+C）');

    enter(button);
    await vi.advanceTimersByTimeAsync(200);
    expect(tip.dataset.state).toBe('closed');
    await vi.advanceTimersByTimeAsync(150);
    expect(tip.dataset.state).toBe('open');

    escape();
    await nextTick();
    expect(tip.dataset.state).toBe('closed');
  });

  it('触屏不显示（没有悬停）', async () => {
    const root = mount(() => (
      <Tooltip delay={0} trigger={(props) => <button {...props} aria-label="复制" />}>
        复制
      </Tooltip>
    ));
    await nextTick();
    const button = root.querySelector('button')!;
    enter(button, 'touch');
    await vi.advanceTimersByTimeAsync(100);
    expect(document.getElementById(button.getAttribute('aria-describedby')!)!.dataset.state).toBe(
      'closed',
    );
  });
});

describe('HoverCard', () => {
  it('停留后打开，卡片里可以放链接；Esc 关闭', async () => {
    let open = false;
    const root = mount(() => (
      <HoverCard
        delay={400}
        onOpenChange={(next) => (open = next)}
        trigger={(props) => (
          <a {...props} href="#ada">
            @ada
          </a>
        )}
      >
        <a href="#profile">查看资料</a>
      </HoverCard>
    ));
    await nextTick();
    enter(root.querySelector('a[href="#ada"]')!);
    await vi.advanceTimersByTimeAsync(400);
    expect(open).toBe(true);
    const card = document.querySelector<HTMLElement>('[data-state="open"]')!;
    expect(card.querySelector('a[href="#profile"]')).not.toBeNull();

    escape();
    await nextTick();
    expect(open).toBe(false);
  });
});
