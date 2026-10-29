/**
 * 堆叠：各系列在同一类目上依次叠起，正值从 0 往上叠、负值从 0 往下叠（同 d3 的 stackOffsetDiverging）。
 * 柱状图、面积图、组合图的堆叠与十字线圆点、标注圈的位置共用。
 *
 *   stackValues([[3, 5], [2, -1]])   // 系列 0：[[0,3], [0,5]]；系列 1：[[3,5], [-1,0]]
 */

/** 一个系列在一行上叠出的一段 */
export interface StackSegment {
  /** 下沿（负值是靠近 0 的一端以外的那端） */
  low: number;
  /** 上沿 */
  high: number;
  /** 原值；空值是 undefined，这时 low、high 都在当前的正向累计处（高度为 0，面积连续） */
  value: number | undefined;
}

/** values[系列][行] → 每个系列在每一行的一段 */
export function stackValues(
  values: readonly (readonly (number | undefined)[])[],
): StackSegment[][] {
  const rows = Math.max(0, ...values.map((list) => list.length));
  const positive = Array.from({ length: rows }, () => 0);
  const negative = Array.from({ length: rows }, () => 0);
  return values.map((list) =>
    Array.from({ length: rows }, (_, row) => {
      const value = list[row];
      if (value === undefined || !Number.isFinite(value))
        return { low: positive[row]!, high: positive[row]!, value: undefined };
      if (value >= 0) {
        const low = positive[row]!;
        positive[row] = low + value;
        return { low, high: low + value, value };
      }
      const high = negative[row]!;
      negative[row] = high + value;
      return { low: high + value, high, value };
    }),
  );
}
