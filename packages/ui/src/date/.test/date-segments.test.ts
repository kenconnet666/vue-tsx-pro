// 分段输入：段的顺序按语言、逐段输入与自动跳段、↑↓ 回绕、Backspace、12 / 24 小时制、填全才写回
import { describe, expect, it } from 'vitest';
import { shallowRef } from 'vue';
import {
  handleSegmentKeydown,
  useDateSegments,
  type DateFieldValues,
  type DateSegmentType,
} from '../date-segments';

type Field = Exclude<DateSegmentType, 'dayPeriod'>;

function setup({
  fields = ['year', 'month', 'day'] as Field[],
  locale = 'zh-CN',
  hourCycle,
  value = null,
}: {
  fields?: Field[];
  locale?: string;
  hourCycle?: 'h12' | 'h23';
  value?: DateFieldValues | null;
} = {}) {
  const current = shallowRef<DateFieldValues | null>(value);
  const changes: (DateFieldValues | null)[] = [];
  const state = useDateSegments({
    fields: () => fields,
    locale: () => locale,
    hourCycle: () => hourCycle,
    value: () => current.value,
    onChange: (next) => {
      changes.push(next);
      current.value = next;
    },
    placeholderValue: () => ({ year: 2026, month: 10, day: 20, hour: 14, minute: 30, second: 0 }),
    placeholders: () => ({ year: '年', month: '月', day: '日' }),
  });
  const press = (key: string, rtl = false) =>
    handleSegmentKeydown(state, new KeyboardEvent('keydown', { key }), rtl);
  const texts = () => state.segments.map((segment) => segment.text).join('');
  return { state, press, texts, value: () => current.value, changes };
}

describe('段的顺序与显示', () => {
  it.each([
    ['zh-CN', ['year', 'month', 'day'], '年/月/日'],
    ['en-US', ['month', 'day', 'year'], '月/日/年'],
    ['de-DE', ['day', 'month', 'year'], '日.月.年'],
  ])('%s', (locale, order, text) => {
    const { state, texts } = setup({ locale });
    expect(state.editable.map((segment) => segment.type)).toEqual(order);
    expect(texts()).toBe(text);
    expect(state.editable.every((segment) => segment.placeholder)).toBe(true);
  });

  it('段的名称取自 Intl.DisplayNames', () => {
    expect(setup().state.editable.map((segment) => segment.label)).toEqual(['年', '月', '日']);
    expect(setup({ locale: 'en-US' }).state.editable.map((segment) => segment.label)).toEqual([
      'month',
      'day',
      'year',
    ]);
  });

  it('已有的值补零显示', () => {
    expect(setup({ value: { year: 2026, month: 5, day: 1 } }).texts()).toBe('2026/05/01');
  });

  it('时间：zh-CN 默认 24 小时制，en-US 默认 12 小时制并加上上午 / 下午', () => {
    const zh = setup({ fields: ['hour', 'minute'], value: { hour: 14, minute: 5 } });
    expect(zh.texts()).toBe('14:05');
    const en = setup({
      fields: ['hour', 'minute'],
      locale: 'en-US',
      value: { hour: 14, minute: 5 },
    });
    expect(en.state.editable.map((segment) => segment.type)).toEqual([
      'hour',
      'minute',
      'dayPeriod',
    ]);
    // en-US 的时间与 AM / PM 之间是窄不换行空格（U+202F）
    expect(en.texts()).toBe('2:05 PM');
    const h12 = setup({
      fields: ['hour', 'minute'],
      hourCycle: 'h12',
      value: { hour: 9, minute: 0 },
    });
    expect(h12.texts()).toBe('上午9:00');
  });
});

describe('输入', () => {
  it('逐段输入：年满 4 位跳段；月打 1 等第二位、打 3 直接跳；填全才写回', () => {
    const { state, value, changes } = setup();
    state.setFocused('year');
    state.type('2026');
    expect(state.focusedSegment).toBe('month');
    state.type('1');
    expect(state.focusedSegment).toBe('month');
    state.type('1');
    expect(state.focusedSegment).toBe('day');
    expect(value()).toBeNull();
    state.type('5');
    expect(value()).toEqual({ year: 2026, month: 11, day: 5 });
    expect(changes).toHaveLength(1);
  });

  it('打了这一位就超出范围：从这一位重新开始；0 先记着等下一位', () => {
    const { state, texts } = setup({ value: { year: 2026, month: 1, day: 1 } });
    state.setFocused('month');
    state.type('0');
    expect(texts()).toBe('2026/0/01');
    state.type('9');
    expect(state.focusedSegment).toBe('day');
    state.type('4');
    state.type('5');
    // 45 超出 9 月的 30 天：5 重新开始，5 * 10 > 30 直接填好
    expect(texts()).toBe('2026/09/05');
  });

  it('全角数字、阿拉伯-印度数字也能输入', () => {
    const { state, value } = setup();
    state.setFocused('year');
    state.type('２０２６');
    state.type('\u0661\u0662'); // 阿拉伯-印度数字 12
    state.type('3');
    expect(value()).toEqual({ year: 2026, month: 12, day: 3 });
  });

  it('日超过这个月的天数：写回时取最后一天', () => {
    const { state, value } = setup({ value: { year: 2026, month: 1, day: 31 } });
    state.setFocused('month');
    state.type('2');
    expect(value()).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it('12 小时制：打 a / p 切换上午下午；改时保留上午下午', () => {
    const { state, value } = setup({
      fields: ['hour', 'minute'],
      locale: 'en-US',
      value: { hour: 9, minute: 15 },
    });
    state.setFocused('dayPeriod');
    state.type('p');
    expect(value()).toEqual({ hour: 21, minute: 15 });
    state.setFocused('hour');
    state.type('11');
    expect(value()).toEqual({ hour: 23, minute: 15 });
    state.setFocused('hour');
    state.type('12');
    expect(value()?.hour).toBe(12);
  });
});

describe('键盘', () => {
  it('↑↓ 加减并回绕；空段从起点（现在）开始；Home / End', () => {
    const { state, press, texts } = setup();
    state.setFocused('month');
    press('ArrowUp');
    expect(texts()).toBe('年/10/日');
    press('ArrowUp');
    press('ArrowUp');
    expect(texts()).toBe('年/12/日');
    press('ArrowUp');
    expect(texts()).toBe('年/01/日');
    press('ArrowDown');
    press('PageUp');
    expect(texts()).toBe('年/02/日');
    press('End');
    expect(texts()).toBe('年/12/日');
    press('Home');
    expect(texts()).toBe('年/01/日');
  });

  it('←→ 换段，从右到左排版时反过来', () => {
    const { state, press } = setup();
    state.setFocused('month');
    press('ArrowRight');
    expect(state.focusedSegment).toBe('day');
    press('ArrowRight', true);
    expect(state.focusedSegment).toBe('month');
    expect(press('x')).toBe(false);
  });

  it('Backspace 删一位；删空后回到上一段；填好的值删掉一段时写回 null', () => {
    const { state, press, value, texts } = setup({ value: { year: 2026, month: 10, day: 20 } });
    state.setFocused('day');
    press('Backspace');
    // 删剩的一位还在输入中：显示原样，接着打可以补成两位
    expect(texts()).toBe('2026/10/2');
    press('Backspace');
    expect(texts()).toBe('2026/10/日');
    expect(value()).toBeNull();
    press('Backspace');
    expect(state.focusedSegment).toBe('month');
  });

  it('外部改值时以外部为准；clear 清空所有段', () => {
    const { state, texts } = setup({ value: { year: 2026, month: 10, day: 20 } });
    state.clear();
    expect(texts()).toBe('年/月/日');
  });
});
