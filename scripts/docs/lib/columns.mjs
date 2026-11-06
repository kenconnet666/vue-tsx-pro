// 文档页两列示例的平衡（review.mjs 报出、balance-columns.mjs 照着改 docs.tsx 共用）：
// 两列各自的示例（id 与高度）→ 让底边最齐的一种挪法。每页在代码里写定左右列（apps/docs/src/site/Examples.tsx），
// 这里只挑改动小的挪法：长的那列末尾连着的几个整体挪到短的那列末尾，或长的那列里任意一个挪到短的那列末尾——
// 各列里示例的先后不变，本页目录的顺序不乱

/** 两列底边差多少以内算齐（px，约一个小示例的高度） */
export const COLUMN_SLACK = 160;

/** 一列的高度：示例的高度加上它们之间的间距 */
const heightOf = (items, gap) =>
  items.reduce((sum, item) => sum + item.height, 0) + gap * Math.max(0, items.length - 1);

/**
 * 两列 → 最好的挪法；已经齐了、或挪了也好不了多少时为 null。
 * 返回 { ids（要挪的示例，按原来的先后）, from（'left' | 'right'）, before, after（挪前、挪后的底边差） }
 */
export function bestMove({ left, right, gap }) {
  const before = Math.abs(heightOf(left, gap) - heightOf(right, gap));
  if (before <= COLUMN_SLACK) return null;
  const [tall, short, from] =
    heightOf(left, gap) >= heightOf(right, gap) ? [left, right, 'left'] : [right, left, 'right'];
  const candidates = [];
  // 末尾连着的 k 个整体挪过去（长的那列至少留一个）
  for (let k = 1; k < tall.length; k++) candidates.push(tall.slice(-k));
  // 任意一个挪过去
  for (const item of tall.slice(0, -1)) candidates.push([item]);
  // 左列第一个是整页的开头（基础用法），不挪
  const opener = left[0];
  for (let index = candidates.length - 1; index >= 0; index--)
    if (candidates[index].includes(opener)) candidates.splice(index, 1);
  let best = null;
  for (const moved of candidates) {
    const rest = tall.filter((item) => !moved.includes(item));
    const after = Math.abs(heightOf(rest, gap) - heightOf([...short, ...moved], gap));
    if (!best || after < best.after)
      best = { ids: moved.map((item) => item.id), from, before, after };
  }
  // 好得不多（不到半个余量）就不挪：省得为几十像素改代码
  return best && best.after < before - COLUMN_SLACK / 2 ? best : null;
}
