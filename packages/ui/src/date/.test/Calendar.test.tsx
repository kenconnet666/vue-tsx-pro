// Calendar、RangeCalendar：网格结构与读屏名称、点选与键盘、并排几个月、不可选日期、周数、自定义格子、月份与年份视图、中英文
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { enUS } from '../../config/lang/en-US';
import { mount } from '../../utils/.test/mount';
import type { DateRange } from '../../utils/data/date';
import { Calendar } from '../Calendar';
import { RangeCalendar } from '../RangeCalendar';

// 今天固定为 2026-10-20（周二）
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 20, 12));
});
afterEach(() => vi.useRealTimers());

const button = (root: HTMLElement, date: string) =>
  root.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)!;
/** 读屏念的名称：按钮里去掉 aria-hidden 部分的文字 */
const nameOf = (element: HTMLElement) => {
  const copy = element.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
  return copy.textContent;
};
const key = async (root: HTMLElement, name: string, options: KeyboardEventInit = {}) => {
  const target = (document.activeElement as HTMLElement) ?? root.querySelector('[data-focused]');
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, ...options }));
  await nextTick();
  await nextTick();
};
const focused = (root: HTMLElement) =>
  root.querySelector('[data-focused]')?.getAttribute('data-date');

describe('Calendar', () => {
  it('网格：星期表头取自 Intl（zh-CN 周一开始）；格子的读屏名称是完整日期，今天加前缀', async () => {
    let value = _state<string | null>('2026-10-20');
    const root = mount(() => <Calendar value={_bind(value)} aria-label="出发日期" />);
    const grid = root.querySelector('[role="grid"]')!;
    expect(grid.getAttribute('aria-label')).toBe('2026年10月');
    const weekdays = [...root.querySelectorAll('thead th')].map((th) => th.textContent);
    expect(weekdays).toEqual(['一', '二', '三', '四', '五', '六', '日']);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(6);
    const selected = button(root, '2026-10-20');
    expect(selected.closest('td')!.getAttribute('aria-selected')).toBe('true');
    expect(selected.tabIndex).toBe(0);
    expect(nameOf(selected)).toBe('今天，2026年10月20日星期二');
    expect(button(root, '2026-10-21').tabIndex).toBe(-1);
    // 补齐的上一个月的日期变淡，但能点
    expect(button(root, '2026-09-28').hasAttribute('data-outside')).toBe(true);
    button(root, '2026-10-08').click();
    await nextTick();
    expect(value).toBe('2026-10-08');
  });

  it('键盘：方向键移动焦点并聚焦新格子，跨月时翻页', async () => {
    const root = mount(() => <Calendar value="2026-10-31" />);
    button(root, '2026-10-31').focus();
    await key(root, 'ArrowRight');
    expect(focused(root)).toBe('2026-11-01');
    expect(root.querySelector('[role="grid"]')!.getAttribute('aria-label')).toBe('2026年11月');
    expect(document.activeElement).toBe(button(root, '2026-11-01'));
    await key(root, 'PageUp', { shiftKey: true });
    expect(focused(root)).toBe('2025-11-01');
  });

  it('en-US：一周从周日开始，英文的月份与按钮名称', () => {
    const root = mount(() => (
      <Provider lang={enUS}>
        <Calendar value="2026-10-20" />
      </Provider>
    ));
    expect(root.querySelector('thead th')!.textContent).toBe('S');
    expect(root.querySelector('thead th')!.getAttribute('title')).toBe('Sunday');
    expect(root.querySelector('[role="grid"]')!.getAttribute('aria-label')).toBe('October 2026');
    expect(nameOf(button(root, '2026-10-20'))).toBe('Today, Tuesday, October 20, 2026');
    const labels = [...root.querySelectorAll('button[aria-label]')].map((b) =>
      b.getAttribute('aria-label'),
    );
    expect(labels).toContain('Previous month');
  });

  it('firstDayOfWeek 覆盖语言惯例：中文也可以从周日开始', () => {
    const root = mount(() => <Calendar value="2026-10-20" firstDayOfWeek={0} />);
    expect(root.querySelector('thead th')!.textContent).toBe('日');
  });

  it('最小最大日期与不可选日期：不能选，翻页按钮到头不可用', async () => {
    let value = _state<string | null>(null);
    const root = mount(() => (
      <Calendar
        value={_bind(value)}
        defaultFocused="2026-10-15"
        min="2026-10-10"
        max="2026-10-25"
        isDateUnavailable={(date) => date === '2026-10-18'}
      />
    ));
    const [previous, next] = root.querySelectorAll<HTMLButtonElement>(
      '[aria-label="上个月"], [aria-label="下个月"]',
    );
    expect([previous!.disabled, next!.disabled]).toEqual([true, true]);
    expect(button(root, '2026-10-05').getAttribute('aria-disabled')).toBe('true');
    expect(button(root, '2026-10-18').hasAttribute('data-unavailable')).toBe(true);
    button(root, '2026-10-18').click();
    button(root, '2026-10-05').click();
    await nextTick();
    expect(value).toBeNull();
  });

  it('多选：每天独立切换；网格 aria-multiselectable', async () => {
    let value = _state<string[]>([]);
    const root = mount(() => (
      <Calendar selectionMode="multiple" value={_bind(value)} defaultFocused="2026-10-01" />
    ));
    expect(root.querySelector('[role="grid"]')!.getAttribute('aria-multiselectable')).toBe('true');
    button(root, '2026-10-02').click();
    await nextTick();
    button(root, '2026-10-09').click();
    await nextTick();
    button(root, '2026-10-02').click();
    await nextTick();
    expect(value).toEqual(['2026-10-09']);
  });

  it('并排两个月：每月一张网格，补齐的日期留空，翻页按钮只在两端', () => {
    const root = mount(() => <Calendar value="2026-10-20" visibleMonths={2} />);
    const grids = root.querySelectorAll('[role="grid"]');
    expect([...grids].map((grid) => grid.getAttribute('aria-label'))).toEqual([
      '2026年10月',
      '2026年11月',
    ]);
    expect(root.querySelectorAll('[data-date="2026-10-31"]')).toHaveLength(1);
    expect(root.querySelectorAll('[aria-label="上个月"]')).toHaveLength(1);
  });

  it('周数与自定义格子', () => {
    const root = mount(() => (
      <Calendar value="2026-10-20" showWeekNumbers>
        {(date, cell) => (cell.selected ? `✓${date.slice(8)}` : date.slice(8))}
      </Calendar>
    ));
    const rowHeader = root.querySelector('tbody th')!;
    expect(rowHeader.getAttribute('aria-label')).toBe('第 40 周');
    // 自定义内容跟在完整日期后面一起念
    expect(nameOf(button(root, '2026-10-20'))).toBe('今天，2026年10月20日星期二✓20');
  });

  it('标题切到月份视图、再到年份视图；点年份、月份逐级回到日期', async () => {
    let value = _state<string | null>('2026-10-20');
    const root = mount(() => <Calendar value={_bind(value)} />);
    const heading = () => root.querySelector<HTMLButtonElement>('[aria-label^="选择"]');
    expect(heading()!.getAttribute('aria-label')).toBe('选择月份：2026年10月');
    heading()!.click();
    await nextTick();
    expect(root.firstElementChild!.getAttribute('data-view')).toBe('month');
    expect(button(root, '2026-03-01').querySelector('[aria-hidden]')!.textContent).toBe('3月');
    expect(nameOf(button(root, '2026-03-01'))).toBe('2026年3月');
    heading()!.click();
    await nextTick();
    expect(root.querySelector('[role="grid"]')!.getAttribute('aria-label')).toBe('2020年 – 2029年');
    // 年份视图是最粗的：标题只是文字
    expect(heading()).toBeNull();
    button(root, '2028-01-01').click();
    await nextTick();
    button(root, '2028-02-01').click();
    await nextTick();
    expect(root.firstElementChild!.getAttribute('data-view')).toBe('day');
    expect(focused(root)).toBe('2028-02-20');
    expect(value).toBe('2026-10-20');
  });

  it('granularity="month"：直接是月份视图，点一个月就选中', async () => {
    let value = _state<string | null>(null);
    const root = mount(() => (
      <Calendar granularity="month" value={_bind(value)} defaultFocused="2026-10-01" />
    ));
    button(root, '2026-04-01').click();
    await nextTick();
    expect(value).toBe('2026-04-01');
  });
});

describe('RangeCalendar', () => {
  it('先点开始、悬停预览、再点结束；选到一半时提示选结束日期', async () => {
    let value = _state<DateRange<string> | null>(null);
    const picks: DateRange<string>[] = [];
    const root = mount(() => (
      <RangeCalendar
        value={_bind(value)}
        defaultFocused="2026-10-01"
        onPick={(range) => picks.push(range)}
      />
    ));
    button(root, '2026-10-15').click();
    await nextTick();
    expect(button(root, '2026-10-15').getAttribute('aria-describedby')).toBeTruthy();
    expect(root.textContent).toContain('请选择结束日期');
    button(root, '2026-10-12').dispatchEvent(new PointerEvent('pointerenter'));
    await nextTick();
    expect(button(root, '2026-10-13').closest('td')!.hasAttribute('data-in-range')).toBe(true);
    button(root, '2026-10-12').click();
    await nextTick();
    expect(value).toEqual({ start: '2026-10-12', end: '2026-10-15' });
    expect(picks).toHaveLength(1);
    expect(button(root, '2026-10-14').closest('td')!.getAttribute('aria-selected')).toBe('true');
  });

  it('区间里不能夹着不可选的日期', async () => {
    let value = _state<DateRange<string> | null>(null);
    const root = mount(() => (
      <RangeCalendar
        value={_bind(value)}
        defaultFocused="2026-10-01"
        isDateUnavailable={(date) => date === '2026-10-18'}
      />
    ));
    button(root, '2026-10-15').click();
    await nextTick();
    expect(button(root, '2026-10-20').getAttribute('aria-disabled')).toBe('true');
    button(root, '2026-10-20').click();
    await nextTick();
    expect(value).toBeNull();
  });
});
