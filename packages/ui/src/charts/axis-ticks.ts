/**
 * 双数值轴的刻度对齐（组合图）：主轴按数据取“好看”的刻度，第二数值轴取同样多的格、每格也是好看的步长，
 * 两边的刻度落在同一组网格线上（同 ECharts 的 alignTicks）。第二轴上的值换算到主轴的坐标里画。
 *
 *   const axes = alignedTicks([0, 1280, 960], [0.12, 0.35]);
 *   axes.primary.ticks      // [0, 200, 400, …, 1400]
 *   axes.secondary.ticks    // [0, 0.05, 0.1, …, 0.35]
 *   axes.toPrimary(0.2)     // 第二轴的 0.2 在主轴坐标里的位置
 */
import { linearTicks, niceDomain } from './scale';

/** 一条数值轴：范围与刻度 */
export interface AxisTicks {
  /** 范围 [最小, 最大]，两端都是刻度 */
  domain: [number, number];
  /** 刻度，从小到大 */
  ticks: number[];
}

/** 对齐的两条数值轴 */
export interface AlignedAxes {
  /** 主轴（左侧） */
  primary: AxisTicks;
  /** 第二数值轴（右侧）：刻度数与主轴相同 */
  secondary: AxisTicks;
  /** 第二轴的值换算到主轴的坐标 */
  toPrimary: (value: number) => number;
}

/** 不小于 raw 的“好看”步长：1、2、2.5、5 乘 10 的整数次幂 */
export function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

/** 浮点误差：0.1 + 0.2 这类算出来的刻度取到 12 位有效数字 */
const tidy = (value: number) => Number(value.toPrecision(12));

/**
 * 两组值的对齐刻度：primary、secondary 是两条轴要包含的值（含 0 时从 0 起）。
 * 主轴约 count 格（范围扩到刻度上），第二轴取同样多的格
 */
export function alignedTicks(
  primary: readonly number[],
  secondary: readonly number[],
  count = 5,
): AlignedAxes {
  const finite = (values: readonly number[]) => values.filter(Number.isFinite);
  const p = finite(primary);
  const [p0, p1] = niceDomain([Math.min(...p, 0), Math.max(...p, 0) || 1], count);
  const ticks = linearTicks(p0, p1, count).map(tidy);
  const intervals = Math.max(ticks.length - 1, 1);

  const s = finite(secondary);
  const low = Math.min(...s, 0);
  const high = Math.max(...s, 0) || 1;
  let step = niceStep((high - low) / intervals);
  let start = Math.floor(low / step) * step;
  // 起点向下取整后可能盖不住最大值：换下一档步长
  for (let guard = 0; start + intervals * step < high && guard < 10; guard += 1) {
    step = niceStep(step * 1.01);
    start = Math.floor(low / step) * step;
  }
  const secondaryTicks = Array.from({ length: intervals + 1 }, (_, i) => tidy(start + i * step));
  const s0 = secondaryTicks[0]!;
  const s1 = secondaryTicks.at(-1)!;
  return {
    primary: { domain: [p0, p1], ticks },
    secondary: { domain: [s0, s1], ticks: secondaryTicks },
    toPrimary: (value) => p0 + ((value - s0) / (s1 - s0)) * (p1 - p0),
  };
}
