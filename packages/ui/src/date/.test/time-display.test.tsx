// 显示时间的组件：DateTime、RelativeTime、Countdown，共用的时钟（useNow）与时刻换算（toInstant、relativeUnit）
import { CalendarDateTime, parseZonedDateTime } from '@internationalized/date';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { relativeUnit, toInstant } from '../../utils/data/date';
import { Countdown, countdownParts } from '../Countdown';
import { DateTime } from '../DateTime';
import { RelativeTime } from '../RelativeTime';

const NOW = Date.parse('2026-10-21T08:00:00Z');

describe('时刻与相对时间的单位', () => {
  it('toInstant：带时区的照原样；不带时区的按给定时区的墙上时间', () => {
    expect(toInstant('2026-10-21T08:00:00Z')).toBe(NOW);
    expect(toInstant('2026-10-21T16:00', 'Asia/Shanghai')).toBe(NOW);
    expect(toInstant(new CalendarDateTime(2026, 10, 21, 16), 'Asia/Shanghai')).toBe(NOW);
    expect(toInstant(parseZonedDateTime('2026-10-21T16:00[Asia/Shanghai]'), 'UTC')).toBe(NOW);
    expect(toInstant('not a date')).toBeNaN();
  });

  it('relativeUnit：45 秒以内用秒，45 分钟以内用分……；0 不带负号', () => {
    expect(relativeUnit(-30_000)).toEqual({ value: -30, unit: 'second' });
    expect(relativeUnit(-50_000)).toEqual({ value: -1, unit: 'minute' });
    expect(relativeUnit(3 * 3600_000)).toEqual({ value: 3, unit: 'hour' });
    expect(relativeUnit(-86_400_000)).toEqual({ value: -1, unit: 'day' });
    expect(relativeUnit(-400 * 86_400_000)).toEqual({ value: -1, unit: 'year' });
    expect(Object.is(relativeUnit(-100).value, 0)).toBe(true);
  });
});

describe('DateTime', () => {
  it('time 元素：datetime 写机器可读的值；只有日期时不显示时间', () => {
    const root = mount(() => [
      <DateTime value="2026-10-20" />,
      <DateTime value="2026-10-20" dateStyle="full" />,
      <DateTime value={new CalendarDateTime(2026, 10, 20, 14, 30)} />,
    ]);
    const times = [...root.querySelectorAll('time')];
    expect(times.map((time) => time.getAttribute('datetime'))).toEqual([
      '2026-10-20',
      '2026-10-20',
      '2026-10-20T14:30:00',
    ]);
    expect(times.map((time) => time.textContent)).toEqual([
      '2026年10月20日',
      '2026年10月20日星期二',
      '2026年10月20日 14:30',
    ]);
  });
});

describe('RelativeTime 与 Countdown（假时钟）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('RelativeTime：措辞用 numeric auto；跨过阈值换单位；threshold 以外写日期；title 是完整的日期时间', async () => {
    const root = mount(() => [
      <RelativeTime value={new Date(NOW - 30_000)} />,
      <RelativeTime value={new Date(NOW - 86_400_000)} />,
      <RelativeTime value={new Date(NOW - 10 * 86_400_000)} threshold={{ days: 7 }} />,
    ]);
    const [recent, yesterday, old] = [...root.querySelectorAll('time')];
    expect(recent!.textContent).toBe('30秒钟前');
    expect(yesterday!.textContent).toBe('昨天');
    expect(old!.textContent).toMatch(/^2026年10月\d+日$/);
    expect(recent!.getAttribute('title')).toMatch(/^2026年10月21日星期三/);
    // 秒级每秒更新：20 秒后过了 45 秒，换成分钟
    vi.advanceTimersByTime(20_000);
    await nextTick();
    expect(recent!.textContent).toBe('1分钟前');
  });

  it('Countdown：时:分:秒，超过一天加天数；到点停在 0、onEnd 只调用一次', async () => {
    const ended = vi.fn();
    const root = mount(() => [
      <Countdown to={new Date(NOW + 3_000)} onEnd={ended} />,
      <Countdown to={new Date(NOW + 2 * 86_400_000 + 3_723_000)} />,
      <Countdown to={new Date(NOW + 90 * 60_000)} precision="minute" />,
      <Countdown to={new Date(NOW + 3_000)}>{({ seconds }) => `还剩 ${seconds} 秒`}</Countdown>,
    ]);
    const timers = [...root.querySelectorAll('[role="timer"]')];
    expect(timers.map((timer) => timer.textContent)).toEqual([
      '00:00:03',
      '2天 01:02:03',
      '01:30',
      '还剩 3 秒',
    ]);
    vi.advanceTimersByTime(5_000);
    await nextTick();
    expect(timers[0]!.textContent).toBe('00:00:00');
    expect(timers[3]!.textContent).toBe('还剩 0 秒');
    vi.advanceTimersByTime(5_000);
    await nextTick();
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('countdownParts：按精度向上取整，到点才是 0', () => {
    expect(countdownParts(400, 'second')).toMatchObject({ seconds: 1, ended: false });
    expect(countdownParts(61_000, 'minute')).toMatchObject({ minutes: 2, seconds: 0 });
    expect(countdownParts(-5, 'second')).toMatchObject({ total: 0, seconds: 0, ended: true });
  });
});
