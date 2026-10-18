import { describe, expect, it } from 'vitest';
import { paginationItems } from '../pagination';

describe('paginationItems', () => {
  it.each([
    [1, 1, [1]],
    [1, 5, [1, 2, 3, 4, 5]],
    [4, 7, [1, 2, 3, 4, 5, 6, 7]],
    [1, 20, [1, 2, 3, 4, 5, 'end-ellipsis', 20]],
    [4, 20, [1, 2, 3, 4, 5, 'end-ellipsis', 20]],
    [6, 20, [1, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 20]],
    [17, 20, [1, 'start-ellipsis', 16, 17, 18, 19, 20]],
    [20, 20, [1, 'start-ellipsis', 16, 17, 18, 19, 20]],
  ] as const)('第 %i 页 / 共 %i 页', (page, pageCount, expected) => {
    expect(paginationItems({ page, pageCount })).toEqual(expected);
  });

  it('页数够多时项数固定，翻页时按钮不跳动', () => {
    const lengths = new Set(
      Array.from(
        { length: 50 },
        (_, index) => paginationItems({ page: index + 1, pageCount: 50 }).length,
      ),
    );
    expect([...lengths]).toEqual([7]);
  });

  it('siblings 与 boundaries 可调', () => {
    expect(paginationItems({ page: 10, pageCount: 20, siblings: 2, boundaries: 2 })).toEqual([
      1,
      2,
      'start-ellipsis',
      8,
      9,
      10,
      11,
      12,
      'end-ellipsis',
      19,
      20,
    ]);
  });
});
