// layoutLayers：按从根走过去的最长步数分列；绕回去的线不算；分叉的上下排开；已有位置的用自己的
import { describe, expect, it } from 'vitest';
import { layoutLayers } from '../layout';

const box = (id: string, x: number | null = null, y: number | null = null) => ({
  id,
  width: 140,
  height: 52,
  x,
  y,
});
const line = (from: string, to: string) => ({ from, to });

describe('layoutLayers', () => {
  it('按步数从左往右分列，绕回去的线（环）不算步数', () => {
    const placed = layoutLayers(
      [box('s'), box('a'), box('b'), box('end')],
      [line('s', 'a'), line('a', 'b'), line('b', 'a'), line('b', 'end')],
      { roots: ['s'] },
    );
    const xs = placed.map((p) => p.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(new Set(xs).size).toBe(4);
  });

  it('同一列上下排开、在最高的列里居中；已有位置的不动；小的节点在格子里居中', () => {
    const placed = Object.fromEntries(
      layoutLayers(
        [
          box('s'),
          box('left'),
          box('right'),
          box('fixed', 500, 20),
          { id: 'small', width: 100, height: 40 },
        ],
        [line('s', 'left'), line('s', 'right'), line('left', 'fixed'), line('fixed', 'small')],
        { roots: ['s'] },
      ).map((p) => [p.id, p]),
    );
    expect(placed['left']!.x).toBe(placed['right']!.x);
    expect(placed['left']!.y).not.toBe(placed['right']!.y);
    expect(placed['s']!.y).toBe((placed['left']!.y + placed['right']!.y) / 2);
    expect(placed['fixed']).toMatchObject({ x: 500, y: 20 });
    expect(placed['small']!.x).toBe(32 + 3 * 190 + 20);
  });
});
