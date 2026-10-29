/**
 * 点标注的避让：给每个锚点（地图上的地点）找一个不压住别的标签、标记的位置。
 * 参照制图学的点标注（Imhof 的方位优先级）与 ECharts labelLayout 的 moveOverlap、Mapbox 的 variable anchor：
 * 按优先级贪心放置，先试紧挨着标记的 8 个方位，都放不下时一圈圈往外退（默认两圈）、画引线连回标记，仍放不下就不显示。
 * 坐标都是屏幕像素。
 *
 *   const placements = placeLabels(anchors, { bounds: { x: 0, y: 0, width, height }, soft: areaLabelBoxes });
 *   placements[i]   // null 时不显示；否则 box 是标签的矩形，leader 时画引线
 */

/** 矩形：左上角与宽高 */
export interface LabelRect {
  /** 左 */
  x: number;
  /** 上 */
  y: number;
  /** 宽 */
  width: number;
  /** 高 */
  height: number;
}

/** 要标注的点 */
export interface LabelAnchor {
  /** 中心横坐标 */
  x: number;
  /** 中心纵坐标 */
  y: number;
  /** 标记的半径：标签放在它外面 */
  radius: number;
  /** 标签的宽 */
  width: number;
  /** 标签的高 */
  height: number;
  /** 优先级：大的先放（地图按数值），默认 0；相同时按原来的顺序 */
  priority?: number;
}

/** 一个标签放在哪 */
export interface LabelPlacement {
  /** 标签的矩形 */
  box: LabelRect;
  /** 退到了外一圈：画一条引线连回标记 */
  leader: boolean;
}

/** placeLabels 的选项 */
export interface LabelLayoutOptions {
  /** 标签要落在这个范围里（绘图区）；不给时不限 */
  bounds?: LabelRect;
  /** 尽量不压住的矩形（地图上的区域名）：都避不开时可以压住 */
  soft?: readonly LabelRect[];
  /** 标签与标记的间距，默认 3 */
  gap?: number;
  /** 往外退时每圈远多少，默认 16 */
  ring?: number;
  /** 往外退几圈，默认 2 */
  rings?: number;
}

// 方位的优先级：下（地图上地名常见的位置）、上、右、左，然后四个斜角
const directions: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** 两个矩形相交（边贴边不算） */
export function rectsOverlap(a: LabelRect, b: LabelRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

const inside = (box: LabelRect, bounds: LabelRect) =>
  box.x >= bounds.x &&
  box.y >= bounds.y &&
  box.x + box.width <= bounds.x + bounds.width &&
  box.y + box.height <= bounds.y + bounds.height;

/** 锚点在某个方位、某个距离上的标签矩形：标签靠向标记的那条边（或那个角）离标记 distance */
function boxAt(anchor: LabelAnchor, [dx, dy]: readonly [number, number], distance: number) {
  // 斜角按 45° 摆，两个方向各走 distance / √2
  const step = dx && dy ? distance * Math.SQRT1_2 : distance;
  const x = anchor.x + dx * step - (dx === 1 ? 0 : dx === -1 ? anchor.width : anchor.width / 2);
  const y = anchor.y + dy * step - (dy === 1 ? 0 : dy === -1 ? anchor.height : anchor.height / 2);
  return { x, y, width: anchor.width, height: anchor.height };
}

/** 给每个锚点找位置（见文件开头）；返回与 anchors 一一对应 */
export function placeLabels(
  anchors: readonly LabelAnchor[],
  { bounds, soft = [], gap = 3, ring = 16, rings = 2 }: LabelLayoutOptions = {},
): (LabelPlacement | null)[] {
  const markers = anchors.map((anchor) => ({
    x: anchor.x - anchor.radius,
    y: anchor.y - anchor.radius,
    width: anchor.radius * 2,
    height: anchor.radius * 2,
  }));
  const placed: LabelRect[] = [];
  const result: (LabelPlacement | null)[] = anchors.map(() => null);
  const order = anchors
    .map((anchor, index) => ({ index, priority: anchor.priority ?? 0 }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index);

  const free = (box: LabelRect) =>
    (!bounds || inside(box, bounds)) &&
    !markers.some((marker) => rectsOverlap(box, marker)) &&
    !placed.some((other) => rectsOverlap(box, other));

  for (const { index } of order) {
    const anchor = anchors[index]!;
    // 紧挨着一圈，再一圈圈往外；每圈先找不压区域名的，再退而求其次
    for (let level = 0; level <= rings; level++) {
      const distance = anchor.radius + gap + ring * level;
      const leader = level > 0;
      const candidates = directions.map((direction) => boxAt(anchor, direction, distance));
      const box =
        candidates.find((item) => free(item) && !soft.some((rect) => rectsOverlap(item, rect))) ??
        candidates.find(free);
      if (box) {
        placed.push(box);
        result[index] = { box, leader };
        break;
      }
    }
  }
  return result;
}
