/**
 * 弦图的布局：节点排成一圈，每个节点一段弧（长短按流入加流出的总量），每条流向一根弦，
 * 起点一端在起点节点的弧上、终点一端在终点节点的弧上，宽度都按流量（d3-chord 的 chordDirected，ISC）。
 * 角度从 12 点钟方向顺时针（弧度），与 arcPath、ribbonPath 一致。
 *
 *   const { groups, chords } = chordLayout(3, [{ source: 0, target: 1, value: 5 }], 0.04);
 *   groups[0].start、end；chords[0].source（[起, 止]）、target
 */

/** 一条流向：起点、终点是节点的序号 */
export interface ChordInputLink {
  /** 起点节点的序号 */
  source: number;
  /** 终点节点的序号 */
  target: number;
  /** 流量，大于 0 */
  value: number;
}

/** 一个节点的弧 */
export interface ChordGroup {
  /** 节点的序号 */
  index: number;
  /** 起始角 */
  start: number;
  /** 结束角 */
  end: number;
  /** 流入加流出的总量 */
  value: number;
}

/** 一根弦 */
export interface ChordLink {
  /** 在输入里的位置 */
  index: number;
  /** 起点节点上的一段 [起始角, 结束角] */
  source: [number, number];
  /** 终点节点上的一段 */
  target: [number, number];
  /** 流量 */
  value: number;
}

/** 弦图的布局；count 是节点数，padAngle 是相邻两段弧之间的空隙（弧度） */
export function chordLayout(
  count: number,
  links: readonly ChordInputLink[],
  padAngle: number,
): { groups: ChordGroup[]; chords: ChordLink[] } {
  const totals = Array.from({ length: count }, () => 0);
  for (const link of links) {
    totals[link.source]! += link.value;
    totals[link.target]! += link.value;
  }
  const sum = totals.reduce((a, b) => a + b, 0);
  const k = sum > 0 ? Math.max(0, Math.PI * 2 - padAngle * count) / sum : 0;
  const chords: ChordLink[] = links.map((link, index) => ({
    index,
    source: [0, 0],
    target: [0, 0],
    value: link.value,
  }));
  const groups: ChordGroup[] = [];
  let angle = 0;
  for (let node = 0; node < count; node += 1) {
    const start = angle;
    // 先排流入（按起点从后往前），再排流出（按终点从前往后）：相邻节点之间的弦不交叉
    for (let other = count - 1; other >= 0; other -= 1)
      links.forEach((link, index) => {
        if (link.target !== node || link.source !== other) return;
        chords[index]!.target = [angle, (angle += link.value * k)];
      });
    for (let other = 0; other < count; other += 1)
      links.forEach((link, index) => {
        if (link.source !== node || link.target !== other) return;
        chords[index]!.source = [angle, (angle += link.value * k)];
      });
    groups.push({ index: node, start, end: angle, value: totals[node]! });
    angle += padAngle;
  }
  return { groups, chords };
}
