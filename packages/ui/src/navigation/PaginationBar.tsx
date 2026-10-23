/**
 * 分页栏：表格、列表下方的一整行，起始边是“第 1–20 条，共 320 条”，结束边是页码、每页条数、跳页。
 * 拼的是 Pagination、PageSizeSelect、PageJump，换每页条数时回到第 1 页。
 *
 *   <PaginationBar page={_bind(page)} pageSize={_bind(size)} total={320} />
 *   <PaginationBar page={_bind(tasks.page)} pageSize={_bind(tasks.pageSize)} total={tasks.total} />   接 useTableQuery
 *
 * 占满所在的行；窄于 36em 时不显示跳页，窄于 24em 时总数单独一行。只要其中几样时用 showTotal / showSizeSelect / showJump 关掉，
 * 或者直接并排三个组件。
 *
 * 部件：Root（div）、Total（span）、Controls（div）、Pagination、SizeSelect（PageSizeSelect）、Jump（PageJump）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { clamp } from '../utils/data/number';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { PageJump, type PageJumpProps } from './PageJump';
import { PageSizeSelect, type PageSizeSelectProps } from './PageSizeSelect';
import { Pagination, type PaginationProps } from './Pagination';

/** 当前页显示的是哪几条 */
export interface PageRange {
  /** 第一条的序号，从 1 开始；没有数据时是 0 */
  from: number;
  /** 最后一条的序号 */
  to: number;
  /** 总条数 */
  total: number;
}

/** 未声明的属性落到外层 div 上；分页导航的名称用 propsPagination 的 aria-label */
export interface PaginationBarProps extends PartProps<'div'> {
  /** 当前页，从 1 开始：父级写 page={_bind(x)} */
  page?: number;
  /** 每页条数：父级写 pageSize={_bind(x)}，默认 10 */
  pageSize?: number;
  /** 总条数 */
  total: number;
  /** 每页条数的选项，默认 [10, 20, 50, 100] */
  pageSizeOptions?: readonly number[];
  /** 起始边的总数：默认 true（“第 1–20 条，共 320 条”），也可以给函数自己写 */
  showTotal?: boolean | ((range: PageRange) => VNodeChild);
  /** 每页条数选择，默认 true */
  showSizeSelect?: boolean;
  /** 跳页，默认 true（窄于 36em 时不显示） */
  showJump?: boolean;
  /** 字号档位，各部分随之缩放，默认 sm */
  size?: TextSize;
  /** 总数文字的部件属性 */
  propsTotal?: PartProps<'span'>;
  /** 结束边那一组（页码、条数、跳页）的部件属性 */
  propsControls?: PartProps<'div'>;
  /** 页码（Pagination）的部件属性 */
  propsPagination?: Partial<PaginationProps>;
  /** 每页条数（PageSizeSelect）的部件属性 */
  propsSizeSelect?: Partial<PageSizeSelectProps>;
  /** 跳页（PageJump）的部件属性 */
  propsJump?: Partial<PageJumpProps>;
}

/** PaginationBar 的样式：root、total、controls、jump */
export const paginationBarStyles = stylex.create({
  // 按自己的宽度决定显示什么：放在侧栏、卡片里时也合适
  root: {
    containerType: 'inline-size',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: '_sm',
    columnGap: '_md',
  },
  total: {
    flexBasis: { default: 'auto', '@container (max-width: 24em)': '100%' },
    color: '_textMuted',
    fontVariantNumeric: 'tabular-nums',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: '_sm',
    columnGap: '_md',
    marginInlineStart: 'auto',
  },
  jump: { display: { default: 'inline-flex', '@container (max-width: 36em)': 'none' } },
});

/** 分页栏：总数、页码、每页条数、跳页 */
export const PaginationBar = _component(
  ({
    page = _bindable(1),
    pageSize = _bindable(10),
    total,
    pageSizeOptions,
    showTotal = true,
    showSizeSelect = true,
    showJump = true,
    size = 'sm',
    propsTotal,
    propsControls,
    propsPagination,
    propsSizeSelect,
    propsJump,
    ...rest
  }: PaginationBarProps) => {
    const lang = useLang();
    const pageCount = _derived(Math.max(1, Math.ceil(total / pageSize)));
    // 总数变少（筛选后）时父级的 page 可能超出范围：显示时夹回去，同 Pagination
    const range = _derived.by((): PageRange => {
      const current = clamp(page, 1, pageCount);
      return total === 0
        ? { from: 0, to: 0, total }
        : {
            from: (current - 1) * pageSize + 1,
            to: Math.min(current * pageSize, total),
            total,
          };
    });

    function renderTotal() {
      if (!showTotal) return null;
      const content =
        typeof showTotal === 'function'
          ? showTotal(range)
          : range.total === 0
            ? lang.paginationTotal(0)
            : lang.paginationRange(range.from, range.to, range.total);
      return (
        <span {...mergeAttrs<'span'>({ sx: paginationBarStyles.total }, propsTotal)}>
          {content}
        </span>
      );
    }

    return () => (
      <div {...mergeAttrs<'div'>({ sx: [paginationBarStyles.root, fontSizeStyles[size]] }, rest)}>
        {renderTotal()}
        <div {...mergeAttrs<'div'>({ sx: paginationBarStyles.controls }, propsControls)}>
          <Pagination
            {...mergePartProps<PaginationProps>({ size }, propsPagination)}
            page={_bind(page)}
            total={total}
            pageSize={pageSize}
          />
          {showSizeSelect && (
            <PageSizeSelect
              {...mergePartProps<PageSizeSelectProps>(
                { options: pageSizeOptions },
                propsSizeSelect,
                { onSizeChange: () => (page = 1) },
              )}
              value={_bind(pageSize)}
            />
          )}
          {showJump && pageCount > 1 && (
            <PageJump
              {...mergePartProps<PageJumpProps>(
                { pageCount, size, sx: paginationBarStyles.jump },
                propsJump,
              )}
              page={_bind(page)}
            />
          )}
        </div>
      </div>
    );
  },
);
