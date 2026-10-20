// 日历状态：单选 / 区间 / 多选、区间预览与不可选日期、翻页、三种视图、日期网格的键盘操作（中文、英文、周日开始）
import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { shallowRef } from 'vue';
import { parseIsoDate, type DateLimits, type DateUnit } from '../../utils/data/date';
import {
  handleCalendarKeydown,
  useCalendarState,
  type CalendarSelectionMode,
} from '../calendar-state';

const date = (iso: string) => parseIsoDate(iso)!;
const iso = (dates: readonly CalendarDate[]) => dates.map((item) => item.toString());

function setup({
  mode = 'single',
  selected = [],
  limits = {},
  locale = 'zh-CN',
  firstDayOfWeek,
  unit = 'day',
  visibleMonths = 1,
}: {
  mode?: CalendarSelectionMode;
  selected?: string[];
  limits?: DateLimits;
  locale?: string;
  firstDayOfWeek?: number;
  unit?: DateUnit;
  visibleMonths?: number;
} = {}) {
  const value = shallowRef<readonly CalendarDate[]>(selected.map(date));
  const state = useCalendarState({
    mode: () => mode,
    selected: () => value.value,
    onChange: (next) => (value.value = next),
    today: () => date('2026-10-20'),
    limits: () => limits,
    week: () => ({ locale, firstDayOfWeek }),
    unit: () => unit,
    visibleMonths: () => visibleMonths,
  });
  const press = (key: string, options: KeyboardEventInit = {}, rtl = false) =>
    handleCalendarKeydown(state, new KeyboardEvent('keydown', { key, ...options }), rtl);
  return { state, value: () => iso(value.value), press };
}

describe('选择', () => {
  it('单选：焦点从已选日期开始；点另一天替换，再点同一天不取消', () => {
    const { state, value } = setup({ selected: ['2026-10-05'] });
    expect(state.focused.toString()).toBe('2026-10-05');
    state.activate(date('2026-10-08'));
    expect(value()).toEqual(['2026-10-08']);
    state.activate(date('2026-10-08'));
    expect(value()).toEqual(['2026-10-08']);
  });

  it('多选：每天独立切换', () => {
    const { state, value } = setup({ mode: 'multiple' });
    state.activate(date('2026-10-01'));
    state.activate(date('2026-10-03'));
    state.activate(date('2026-10-01'));
    expect(value()).toEqual(['2026-10-03']);
  });

  it('区间：先点开始，悬停时预览，再点结束（反着点也排好序）', () => {
    const { state, value } = setup({ mode: 'range' });
    state.activate(date('2026-10-15'));
    expect(state.anchor?.toString()).toBe('2026-10-15');
    state.hover(date('2026-10-10'));
    expect(state.range?.start.toString()).toBe('2026-10-10');
    expect(state.cell(date('2026-10-12')).inRange).toBe(true);
    expect(state.cell(date('2026-10-10')).rangeStart).toBe(true);
    state.activate(date('2026-10-10'));
    expect(value()).toEqual(['2026-10-10', '2026-10-15']);
    expect(state.anchor).toBeNull();
  });

  it('区间里不能夹着不可选的日期：选了开始后，越过不可选日期的那一侧都不能选', () => {
    const { state, value } = setup({
      mode: 'range',
      limits: { isUnavailable: (day) => day.toString() === '2026-10-18' },
    });
    state.activate(date('2026-10-15'));
    expect(state.cell(date('2026-10-17')).disabled).toBe(false);
    expect(state.cell(date('2026-10-19')).disabled).toBe(true);
    // 悬停在越界的日期上：预览停在边界
    state.hover(date('2026-10-25'));
    expect(state.range?.end.toString()).toBe('2026-10-17');
    state.activate(date('2026-10-19'));
    expect(value()).toEqual([]);
    state.activate(date('2026-10-17'));
    expect(value()).toEqual(['2026-10-15', '2026-10-17']);
  });

  it('Esc 取消选到一半的区间；没有选到一半时不处理（交给弹层）', () => {
    const { state, press } = setup({ mode: 'range' });
    expect(press('Escape')).toBe(false);
    state.activate(date('2026-10-15'));
    expect(press('Escape')).toBe(true);
    expect(state.anchor).toBeNull();
  });

  it('范围外、不可选的日期不能选；已选的日期不能选时 invalid', () => {
    const limits = {
      min: date('2026-10-10'),
      isUnavailable: (day: CalendarDate) => day.day === 12,
    };
    const { state, value } = setup({ limits, selected: ['2026-10-12'] });
    expect(state.invalid).toBe(true);
    state.activate(date('2026-10-05'));
    expect(value()).toEqual(['2026-10-12']);
    expect(state.cell(date('2026-10-12'))).toMatchObject({ disabled: true, unavailable: true });
  });
});

describe('翻页与视图', () => {
  it('焦点移出当前页时翻页；并排两个月时往前移出，焦点所在的月排在最后', () => {
    const { state } = setup({ visibleMonths: 2, selected: ['2026-10-01'] });
    expect(iso(state.months)).toEqual(['2026-10-01', '2026-11-01']);
    state.focus(date('2026-11-30'));
    expect(state.page.toString()).toBe('2026-10-01');
    state.focus(date('2026-12-01'));
    expect(iso(state.months)).toEqual(['2026-12-01', '2027-01-01']);
    state.focus(date('2026-11-30'));
    expect(iso(state.months)).toEqual(['2026-10-01', '2026-11-01']);
  });

  it('翻页按钮一次翻并排的月数；整页在可选范围外时不能翻', () => {
    const { state } = setup({
      visibleMonths: 2,
      limits: { min: date('2026-09-15'), max: date('2026-12-10') },
    });
    expect(state.canTurnPage(-1)).toBe(true);
    state.turnPage(-1);
    expect(iso(state.months)).toEqual(['2026-08-01', '2026-09-01']);
    // 焦点夹到可选范围内
    expect(state.focused.toString()).toBe('2026-09-15');
    expect(state.canTurnPage(-1)).toBe(false);
    state.turnPage(1);
    state.turnPage(1);
    expect(iso(state.months)).toEqual(['2026-12-01', '2027-01-01']);
    expect(state.canTurnPage(1)).toBe(false);
  });

  it('年 → 月 → 日：在粗的视图里点一格是进到这一格，焦点保留原来的日', () => {
    const { state, value } = setup({ selected: ['2026-10-20'] });
    state.setView('year');
    expect(state.page.toString()).toBe('2020-01-01');
    expect(state.cell(date('2019-01-01')).outside).toBe(true);
    state.activate(date('2028-01-01'));
    expect([state.view, state.focused.toString()]).toEqual(['month', '2028-10-20']);
    state.activate(date('2028-02-01'));
    expect([state.view, state.focused.toString()]).toEqual(['day', '2028-02-20']);
    expect(value()).toEqual(['2026-10-20']);
  });

  it('选择粒度是月（MonthPicker）：月份视图里点一格就是选中，不能切到日视图', () => {
    const { state, value } = setup({ unit: 'month' });
    expect(state.view).toBe('month');
    state.setView('day');
    expect(state.view).toBe('month');
    state.activate(date('2026-03-01'));
    expect(value()).toEqual(['2026-03-01']);
    expect(state.cell(date('2026-03-01')).selected).toBe(true);
    expect(state.cell(date('2026-10-01')).today).toBe(true);
  });
});

describe('键盘', () => {
  it('方向键一天、一周；从右到左排版时左右反过来', () => {
    const { state, press } = setup({ selected: ['2026-10-20'] });
    press('ArrowRight');
    expect(state.focused.toString()).toBe('2026-10-21');
    press('ArrowDown');
    expect(state.focused.toString()).toBe('2026-10-28');
    press('ArrowRight', {}, true);
    expect(state.focused.toString()).toBe('2026-10-27');
  });

  it('Page Up / Down 一个月，加 Shift 一年；月末夹到下个月的最后一天', () => {
    const { state, press } = setup({ selected: ['2026-01-31'] });
    press('PageDown');
    expect(state.focused.toString()).toBe('2026-02-28');
    press('PageDown', { shiftKey: true });
    expect(state.focused.toString()).toBe('2027-02-28');
    expect(state.page.toString()).toBe('2027-02-01');
  });

  it.each([
    ['zh-CN', undefined, '2026-10-19', '2026-10-25'],
    ['en-US', undefined, '2026-10-18', '2026-10-24'],
    ['zh-CN', 0, '2026-10-18', '2026-10-24'],
  ])('Home / End 到这周两端（%s，firstDayOfWeek=%s）', (locale, firstDayOfWeek, home, end) => {
    const { state, press } = setup({ selected: ['2026-10-20'], locale, firstDayOfWeek });
    press('Home');
    expect(state.focused.toString()).toBe(home);
    press('End');
    expect(state.focused.toString()).toBe(end);
  });

  it('不越过最小最大日期；Enter / 空格选中', () => {
    const { state, press, value } = setup({ limits: { max: date('2026-10-22') } });
    press('ArrowDown');
    expect(state.focused.toString()).toBe('2026-10-22');
    press(' ');
    expect(value()).toEqual(['2026-10-22']);
    expect(press('a')).toBe(false);
  });

  it('月份视图：←→ 一个月，↑↓ 三个月，Home / End 到 1 月 / 12 月，Page 一年', () => {
    const { state, press } = setup({ unit: 'month', selected: ['2026-05-01'] });
    press('ArrowDown');
    expect(state.focused.month).toBe(8);
    press('End');
    expect(state.focused.month).toBe(12);
    press('ArrowRight');
    expect(state.focused.toString()).toBe('2027-01-01');
    expect(state.page.year).toBe(2027);
    press('PageUp');
    expect(state.focused.year).toBe(2026);
  });

  it('年份视图：Home / End 到十年的两端，Page 十年', () => {
    const { state, press } = setup({ unit: 'year', selected: ['2026-01-01'] });
    press('Home');
    expect(state.focused.year).toBe(2020);
    press('End');
    expect(state.focused.year).toBe(2029);
    press('PageDown');
    expect([state.focused.year, state.page.year]).toEqual([2039, 2030]);
  });
});
