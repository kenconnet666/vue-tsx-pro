// computePlacement：浮层贴着锚点的位置——十二种位置、放不下时翻到对侧、两侧都放不下时选空间大的、
// 沿对齐方向挪回视口、从右到左镜像、箭头对准锚点、这一侧能用的高度
import { describe, expect, it } from 'vitest';
import { computePlacement, type FloatingPlacement, type PlacementInput } from '../floating';

const viewport = { left: 0, top: 0, width: 1000, height: 800 };
/** 视口正中的锚点：100 × 40，四周都放得下 */
const center = { left: 450, top: 380, width: 100, height: 40 };

function place(overrides: Partial<PlacementInput> = {}) {
  return computePlacement({
    anchor: center,
    width: 200,
    height: 120,
    viewport,
    placement: 'bottom-start',
    gap: 6,
    rtl: false,
    padding: 8,
    ...overrides,
  });
}

describe('computePlacement', () => {
  it('十二种位置：主方向隔开 gap，start / center / end 对齐锚点的起始边、中间、结束边', () => {
    const at = (placement: FloatingPlacement) => {
      const { x, y } = place({ placement });
      return [x, y];
    };
    // 下方：顶边在锚点底边下面 6px
    expect(at('bottom-start')).toEqual([450, 426]);
    expect(at('bottom')).toEqual([400, 426]);
    expect(at('bottom-end')).toEqual([350, 426]);
    // 上方：底边在锚点顶边上面 6px
    expect(at('top-start')).toEqual([450, 254]);
    expect(at('top')).toEqual([400, 254]);
    expect(at('top-end')).toEqual([350, 254]);
    // 右侧：start 对齐顶边，end 对齐底边
    expect(at('right-start')).toEqual([556, 380]);
    expect(at('right')).toEqual([556, 340]);
    expect(at('right-end')).toEqual([556, 300]);
    expect(at('left-start')).toEqual([244, 380]);
    expect(at('left')).toEqual([244, 340]);
    expect(at('left-end')).toEqual([244, 300]);
  });

  it('从右到左排版：上下弹出时 start / end 镜像，左右弹出时不变', () => {
    expect(place({ placement: 'bottom-start', rtl: true }).x).toBe(350);
    expect(place({ placement: 'bottom-end', rtl: true }).x).toBe(450);
    expect(place({ placement: 'bottom', rtl: true }).x).toBe(400);
    expect(place({ placement: 'right-start', rtl: true }).y).toBe(380);
  });

  it('这一侧放不下时翻到对侧；对齐方式不变', () => {
    // 锚点贴着视口底边：下方只剩 20px
    const low = { ...center, top: 740 };
    const flipped = place({ anchor: low, placement: 'bottom-end' });
    expect(flipped.side).toBe('top');
    expect(flipped.align).toBe('end');
    expect(flipped.y).toBe(740 - 6 - 120);
    // 锚点贴着右边：右侧放不下，换到左侧
    const right = { ...center, left: 880 };
    expect(place({ anchor: right, placement: 'right' }).side).toBe('left');
    // 放得下就不翻
    expect(place({ placement: 'top' }).side).toBe('top');
  });

  it('两侧都放不下：选空间大的一侧（而不是固定回到想要的那一侧）', () => {
    // 高 600 的列表，锚点偏上：上方只有 180，下方有 580
    const anchor = { ...center, top: 200 };
    expect(place({ anchor, height: 600, placement: 'top-start' }).side).toBe('bottom');
    // 锚点偏下：上方空间大
    const lower = { ...center, top: 560 };
    expect(place({ anchor: lower, height: 600, placement: 'bottom-start' }).side).toBe('top');
  });

  it('crossAxisFallback：主方向与对侧都放不下时，再试垂直的两侧（先下后上）', () => {
    // 宽 900 的引导卡片放在锚点右侧、左侧都放不下
    const wide = { width: 900, height: 120, placement: 'right' as const };
    expect(place({ ...wide }).side).toBe('right');
    expect(place({ ...wide, crossAxisFallback: true }).side).toBe('bottom');
    // 下方也放不下时到上方
    const low = { ...center, top: 700 };
    expect(place({ ...wide, anchor: low, crossAxisFallback: true }).side).toBe('top');
  });

  it('沿对齐的方向挪回视口：不超出边缘留的距离；比视口还宽时贴着起始边', () => {
    // 锚点靠右，bottom-start 的浮层会伸出右边
    const right = { ...center, left: 900 };
    expect(place({ anchor: right }).x).toBe(1000 - 8 - 200);
    const left = { ...center, left: 0 };
    expect(place({ anchor: left, placement: 'bottom-end' }).x).toBe(8);
    expect(place({ width: 1200 }).x).toBe(8);
    // 左右弹出时挪的是上下
    const top = { ...center, top: 0 };
    expect(place({ anchor: top, placement: 'right' }).y).toBe(8);
  });

  it('视口不从 0 开始（手机上键盘弹出、双指放大后的可见区域）：按可见的那一块算', () => {
    const visible = { left: 0, top: 300, width: 1000, height: 300 };
    // 可见区域是 300–600：下方只剩 180，上方 80 —— 都放不下高 200 的，下方空间大
    const result = place({ viewport: visible, height: 200, placement: 'top' });
    expect(result.side).toBe('bottom');
    expect(result.availableHeight).toBe(600 - 8 - 426);
  });

  it('availableHeight：上下弹出是锚点到视口边缘（留出距离）之间的高度，左右弹出是整个视口', () => {
    expect(place({ placement: 'bottom' }).availableHeight).toBe(800 - 8 - 426);
    expect(place({ placement: 'top' }).availableHeight).toBe(380 - 6 - 8);
    expect(place({ placement: 'right' }).availableHeight).toBe(800 - 16);
  });

  it('箭头：对准锚点的中间；浮层被挪动后仍指着锚点，但不画到浮层两端的圆角外', () => {
    const arrow = { size: 10, padding: 10 };
    // 居中：箭头在浮层正中
    expect(place({ placement: 'bottom', arrow }).arrowX).toBe(95);
    // start 对齐：锚点中心在浮层里的 50px 处
    expect(place({ placement: 'bottom-start', arrow }).arrowX).toBe(45);
    // 小锚点贴着右边：浮层被挪回来，箭头最多到离末端 10px
    const corner = { left: 985, top: 380, width: 10, height: 10 };
    expect(place({ anchor: corner, placement: 'bottom', arrow }).arrowX).toBe(200 - 10 - 10);
    // 左右弹出时给的是纵向位置
    const side = place({ placement: 'right', arrow });
    expect(side.arrowY).toBe(55);
    expect(side.arrowX).toBeUndefined();
  });
});
