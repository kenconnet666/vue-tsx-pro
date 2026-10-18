/**
 * 分页的页码序列（纯函数，算法同 MUI 的 usePagination）：首尾各留 boundaries 页、当前页左右各留 siblings 页，
 * 中间用省略号；序列长度固定（页数够多时总是 2 × boundaries + 2 × siblings + 3 项），翻页时按钮不跳动。
 *
 *   paginationItems({ page: 6, pageCount: 20 })  // [1, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 20]
 */

/** 省略号：start 在当前页之前，end 在之后（两者都可能出现，作为 key 要区分开） */
export type PaginationEllipsis = 'start-ellipsis' | 'end-ellipsis';

/** paginationItems 的参数 */
export interface PaginationOptions {
  /** 当前页，从 1 开始 */
  page: number;
  /** 总页数 */
  pageCount: number;
  /** 当前页左右各显示几页，默认 1 */
  siblings?: number;
  /** 首尾各固定显示几页，默认 1 */
  boundaries?: number;
}

const range = (from: number, to: number) =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);

/** 要显示的页码与省略号，依次排列 */
export function paginationItems({
  page,
  pageCount,
  siblings = 1,
  boundaries = 1,
}: PaginationOptions): (number | PaginationEllipsis)[] {
  const startPages = range(1, Math.min(boundaries, pageCount));
  const endPages = range(Math.max(pageCount - boundaries + 1, boundaries + 1), pageCount);
  // 当前页这一组的起止：靠近两端时向另一侧多借几页，保持总项数不变
  const siblingsStart = Math.max(
    Math.min(page - siblings, pageCount - boundaries - siblings * 2 - 1),
    boundaries + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblings, boundaries + siblings * 2 + 2),
    endPages.length > 0 ? endPages[0]! - 2 : pageCount - 1,
  );
  // 省略号只代替两页以上；只隔一页时直接显示那一页
  const before =
    siblingsStart > boundaries + 2
      ? ['start-ellipsis' as const]
      : boundaries + 1 < pageCount - boundaries
        ? [boundaries + 1]
        : [];
  const after =
    siblingsEnd < pageCount - boundaries - 1
      ? ['end-ellipsis' as const]
      : pageCount - boundaries > boundaries
        ? [pageCount - boundaries]
        : [];
  return [...startPages, ...before, ...range(siblingsStart, siblingsEnd), ...after, ...endPages];
}
