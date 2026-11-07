// 列虚拟化：按滚动位置算出跳过的列段；两端的固定列总在；中间夹着固定列时不虚拟化
import { describe, expect, it } from 'vitest';
import { columnSkips, type DataTableColumn } from '../columns';

const columns = (count: number, sticky: Record<number, 'start' | 'end'> = {}) =>
  Array.from({ length: count }, (_, index): DataTableColumn<unknown> => ({
    key: `c${index}`,
    header: `${index}`,
    sticky: sticky[index],
  }));
const width = () => 100;

describe('columnSkips', () => {
  it('开头：只留前面看得见的列与 overscan', () => {
    expect(columnSkips(columns(50), width, { offset: 0, width: 400, overscan: 2 })).toEqual([
      { from: 6, to: 50 },
    ]);
  });

  it('滚到中间：前后各跳过一段；leading（勾选列）算在前面', () => {
    expect(
      columnSkips(columns(50), width, { offset: 2040, width: 400, leading: 40, overscan: 1 }),
    ).toEqual([
      { from: 0, to: 19 },
      { from: 25, to: 50 },
    ]);
  });

  it('两端的固定列总在；中间夹着固定列时不虚拟化', () => {
    expect(
      columnSkips(columns(30, { 0: 'start', 29: 'end' }), width, {
        offset: 0,
        width: 300,
        overscan: 0,
      }),
    ).toEqual([{ from: 3, to: 29 }]);
    expect(columnSkips(columns(30, { 10: 'start' }), width, { offset: 0, width: 300 })).toEqual([]);
  });

  it('滚到最后：前面跳过，后面不剩', () => {
    expect(columnSkips(columns(50), width, { offset: 4600, width: 400, overscan: 0 })).toEqual([
      { from: 0, to: 46 },
    ]);
  });
});
