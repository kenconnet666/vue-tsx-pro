/**
 * 图表的比例尺与刻度：数值 → 像素的线性比例尺，“好看”的刻度与取整的范围（d3-array 的 ticks、d3-scale 的 nice 的精简版），
 * 时间刻度（月初、周、日、整点，同 d3 的 scaleTime().ticks）。
 *
 *   const y = linearScale(niceDomain([0, 236]), [200, 0]);   // 数值轴：0 在下沿
 *   linearTicks(0, 250, 5)                                  // [0, 50, 100, 150, 200, 250]
 *   timeTicks(start, end, 6)                                // 跨几个月时是各月的 1 日
 */

/** 线性比例尺：数值 → 坐标，invert 反过来 */
export interface LinearScale {
  /** 数值换成坐标 */
  (value: number): number;
  /** 数值的范围 [起, 止] */
  readonly domain: readonly [number, number];
  /** 坐标的范围 [起, 止]（数值轴的起点通常在下方，坐标是从大到小） */
  readonly range: readonly [number, number];
  /** 坐标换回数值 */
  invert(position: number): number;
}

/** 线性比例尺；domain 两端相同时取中间的坐标 */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const scale = ((value: number) =>
    span === 0 ? (r0 + r1) / 2 : r0 + ((value - d0) / span) * (r1 - r0)) as LinearScale;
  return Object.assign(scale, {
    domain,
    range,
    invert: (position: number) => (r1 === r0 ? d0 : d0 + ((position - r0) / (r1 - r0)) * span),
  });
}

// 步长取 1、2、5 乘 10 的幂：误差超过这几个界时换大一档（同 d3-array）
const E10 = Math.sqrt(50);
const E5 = Math.sqrt(10);
const E2 = Math.sqrt(2);

/**
 * 刻度的整数区间 [i1, i2] 与步长：inc 为正时刻度是 i × inc；为负时是 i / -inc
 * （小数步长用除法表示，0.1 × 3 这类乘法会带进浮点误差）
 */
function tickSpec(start: number, stop: number, count: number): [number, number, number] {
  const step = (stop - start) / Math.max(0, count);
  const power = Math.floor(Math.log10(step));
  const error = step / 10 ** power;
  const factor = error >= E10 ? 10 : error >= E5 ? 5 : error >= E2 ? 2 : 1;
  let i1: number;
  let i2: number;
  let inc: number;
  if (power < 0) {
    inc = 10 ** -power / factor;
    i1 = Math.round(start * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start) i1 += 1;
    if (i2 / inc > stop) i2 -= 1;
    inc = -inc;
  } else {
    inc = 10 ** power * factor;
    i1 = Math.round(start / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start) i1 += 1;
    if (i2 * inc > stop) i2 -= 1;
  }
  if (i2 < i1 && count >= 0.5 && count < 2) return tickSpec(start, stop, count * 2);
  return [i1, i2, inc];
}

/** 约 count 格的刻度步长：正数是步长本身，负数 -k 表示步长 1 / k（同 d3 的 tickIncrement） */
export function tickIncrement(start: number, stop: number, count: number): number {
  return tickSpec(start, stop, count)[2];
}

/** [start, stop] 里约 count 格的“好看”刻度：1、2、5 乘 10 的幂的整数倍，从小到大 */
export function linearTicks(start: number, stop: number, count = 5): number[] {
  if (!(count > 0) || !Number.isFinite(start) || !Number.isFinite(stop)) return [];
  if (start === stop) return [start];
  const [low, high] = start < stop ? [start, stop] : [stop, start];
  const [i1, i2, inc] = tickSpec(low, high, count);
  if (!(i2 >= i1)) return [];
  return Array.from({ length: i2 - i1 + 1 }, (_, i) =>
    inc < 0 ? (i1 + i) / -inc : (i1 + i) * inc,
  );
}

/** 范围的两端扩到刻度上（同 d3 的 linear.nice）：[0, 236] → [0, 250] */
export function niceDomain(domain: readonly [number, number], count = 5): [number, number] {
  let [start, stop] = domain[0] <= domain[1] ? domain : [domain[1], domain[0]];
  let previous: number | undefined;
  for (let guard = 0; guard < 10; guard += 1) {
    const step = tickIncrement(start, stop, count);
    if (step === previous || !Number.isFinite(step)) break;
    if (step > 0) {
      start = Math.floor(start / step) * step;
      stop = Math.ceil(stop / step) * step;
    } else if (step < 0) {
      start = Math.ceil(start * step) / step;
      stop = Math.floor(stop * step) / step;
    } else break;
    previous = step;
  }
  return [start, stop];
}

/** 时间刻度的单位 */
type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

/** 可选的间隔：单位、几个单位一格、大约多少毫秒（同 d3 的 tickIntervals） */
const TIME_INTERVALS: readonly (readonly [TimeUnit, number, number])[] = [
  ['second', 1, SECOND],
  ['second', 5, 5 * SECOND],
  ['second', 15, 15 * SECOND],
  ['second', 30, 30 * SECOND],
  ['minute', 1, MINUTE],
  ['minute', 5, 5 * MINUTE],
  ['minute', 15, 15 * MINUTE],
  ['minute', 30, 30 * MINUTE],
  ['hour', 1, HOUR],
  ['hour', 3, 3 * HOUR],
  ['hour', 6, 6 * HOUR],
  ['hour', 12, 12 * HOUR],
  ['day', 1, DAY],
  ['day', 2, 2 * DAY],
  ['week', 1, WEEK],
  ['month', 1, MONTH],
  ['month', 3, 3 * MONTH],
  ['year', 1, YEAR],
];

/** 本地时间里这个单位的起点：月取 1 日 0 点、周取周日 0 点 */
function floorTime(date: Date, unit: TimeUnit): Date {
  const result = new Date(date);
  if (unit === 'second') result.setMilliseconds(0);
  else if (unit === 'minute') result.setSeconds(0, 0);
  else if (unit === 'hour') result.setMinutes(0, 0, 0);
  else {
    result.setHours(0, 0, 0, 0);
    if (unit === 'week') result.setDate(result.getDate() - result.getDay());
    if (unit === 'month') result.setDate(1);
    if (unit === 'year') result.setMonth(0, 1);
  }
  return result;
}

/** 往后数一个单位（按日历走：跨夏令时、大小月都对） */
function nextTime(date: Date, unit: TimeUnit): Date {
  const result = new Date(date);
  if (unit === 'second') result.setSeconds(result.getSeconds() + 1);
  else if (unit === 'minute') result.setMinutes(result.getMinutes() + 1);
  else if (unit === 'hour') result.setHours(result.getHours() + 1);
  else if (unit === 'day') result.setDate(result.getDate() + 1);
  else if (unit === 'week') result.setDate(result.getDate() + 7);
  else if (unit === 'month') result.setMonth(result.getMonth() + 1);
  else result.setFullYear(result.getFullYear() + 1);
  return result;
}

/** 几个单位一格时按哪个字段取整：每 3 个月取 1、4、7、10 月，每 6 小时取 0、6、12、18 点 */
function timeField(date: Date, unit: TimeUnit): number {
  if (unit === 'second') return date.getSeconds();
  if (unit === 'minute') return date.getMinutes();
  if (unit === 'hour') return date.getHours();
  if (unit === 'day') return date.getDate() - 1;
  if (unit === 'month') return date.getMonth();
  if (unit === 'year') return date.getFullYear();
  return 0;
}

/** [start, stop]（毫秒）之间约 count 个整齐的时间刻度：整秒、整分、整点、日、周日、月初、年初（本地时间） */
export function timeTicks(start: number, stop: number, count = 6): Date[] {
  if (!Number.isFinite(start) || !Number.isFinite(stop) || stop < start) return [];
  const target = (stop - start) / count;
  const index = TIME_INTERVALS.findIndex(([, , duration]) => duration > target);
  let unit: TimeUnit;
  let every: number;
  if (index < 0) {
    // 比一年还长：年份按“好看”的步长
    unit = 'year';
    every = Math.max(1, tickIncrement(start / YEAR, stop / YEAR, count));
  } else if (index === 0) {
    unit = 'second';
    every = 1;
  } else {
    // 取与目标间隔之比更接近 1 的那一档
    const [before, after] = [TIME_INTERVALS[index - 1]!, TIME_INTERVALS[index]!];
    [unit, every] = target / before[2] < after[2] / target ? before : after;
  }
  const ticks: Date[] = [];
  for (let date = floorTime(new Date(start), unit); date.getTime() <= stop;) {
    if (date.getTime() >= start && timeField(date, unit) % every === 0) ticks.push(date);
    date = nextTime(date, unit);
  }
  return ticks;
}
