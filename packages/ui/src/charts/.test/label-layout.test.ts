// 点标注的避让：默认放在下方；挤了换方位、退到外一圈画引线、仍放不下就不显示；优先级高的先放；尽量不压区域名
import { describe, expect, it } from 'vitest';
import { placeLabels, rectsOverlap, type LabelAnchor } from '../label-layout';

const anchor = (x: number, y: number, extra: Partial<LabelAnchor> = {}): LabelAnchor => ({
  x,
  y,
  radius: 4,
  width: 40,
  height: 12,
  ...extra,
});

describe('placeLabels', () => {
  it('不挤时放在标记下方，居中，离标记 gap', () => {
    const [placement] = placeLabels([anchor(100, 100)]);
    expect(placement).toEqual({ box: { x: 80, y: 107, width: 40, height: 12 }, leader: false });
  });

  it('两个点上下挨着：先放的在下方，后放的换到别的方位，标签互不重叠、不压标记', () => {
    const anchors = [anchor(100, 100), anchor(100, 116)];
    const placements = placeLabels(anchors);
    const [first, second] = placements.map((item) => item!.box);
    expect(rectsOverlap(first!, second!)).toBe(false);
    for (const item of anchors) {
      const marker = { x: item.x - 4, y: item.y - 4, width: 8, height: 8 };
      expect(rectsOverlap(first!, marker) || rectsOverlap(second!, marker)).toBe(false);
    }
  });

  it('优先级高的先挑位置：数值大的点拿到下方', () => {
    const placements = placeLabels([anchor(100, 100), anchor(100, 116, { priority: 10 })]);
    expect(placements[1]!.box.y).toBe(116 + 4 + 3);
  });

  it('紧挨着一圈都被占了就往外退并画引线；范围里放不下就不显示', () => {
    // 中间的点四周 8 个方位都被别的点的标记挡住
    const around = [-1, 0, 1].flatMap((dx) =>
      [-1, 0, 1].map((dy) => anchor(100 + dx * 30, 100 + dy * 16, { width: 20, radius: 6 })),
    );
    const placements = placeLabels(around, { bounds: { x: 0, y: 0, width: 300, height: 300 } });
    expect(placements.some((item) => item?.leader)).toBe(true);
    const tight = placeLabels([anchor(100, 100)], {
      bounds: { x: 90, y: 90, width: 20, height: 20 },
    });
    expect(tight).toEqual([null]);
  });

  it('能避开时不压区域名，避不开时照样放', () => {
    const name = { x: 80, y: 105, width: 40, height: 14 };
    const [moved] = placeLabels([anchor(100, 100)], { soft: [name] });
    expect(rectsOverlap(moved!.box, name)).toBe(false);
    expect(moved!.leader).toBe(false);
    const everywhere = { x: 0, y: 0, width: 300, height: 300 };
    const [kept] = placeLabels([anchor(100, 100)], { soft: [everywhere] });
    expect(kept!.box.y).toBe(107);
  });
});
