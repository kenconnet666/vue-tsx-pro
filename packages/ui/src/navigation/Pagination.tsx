/**
 * 分页（nav > ul）：上一页、页码、省略号、下一页，当前页带 aria-current="page"。
 * 页码序列用 utils/pagination.ts（项数固定，翻页时按钮不跳动）；按钮用 Button / IconButton，文案取语言包。
 *
 *   <Pagination page={_bind(page)} total={320} pageSize={20} />
 *   <Pagination page={page} pageCount={12} href={(n) => `/articles?page=${n}`} />   渲染为链接（可分享、可被收录）
 */
import { ChevronLeft, ChevronRight, Ellipsis } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Button, type ButtonProps } from '../base/Button';
import { Icon } from '../base/Icon';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { LinkButton, type LinkButtonProps } from '../base/LinkButton';
import { useLang } from '../config/context';
import { paginationItems } from '../utils/pagination';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { listStyles } from '../utils/styles';
import type { TextSize } from '../utils/typography';

/** 未声明的属性落到 nav 上；aria-label 默认取语言包（分页） */
export interface PaginationProps extends PartProps<'nav'> {
  /** 当前页，从 1 开始：父级写 page={_bind(x)} */
  page?: number;
  /** 总页数；不写时按 total 与 pageSize 算 */
  pageCount?: number;
  /** 总条数：给了就能算页数，showTotal 时显示“共 n 条” */
  total?: number;
  /** 每页条数，默认 10 */
  pageSize?: number;
  /** 当前页左右各显示几页，默认 1 */
  siblings?: number;
  /** 首尾各固定显示几页，默认 1 */
  boundaries?: number;
  /** 显示总条数（需要 total） */
  showTotal?: boolean;
  /** 给了就渲染为链接：每页的地址 */
  href?: (page: number) => string;
  /** 字号档位，按钮随之缩放，默认 sm */
  size?: TextSize;
  /** 列表（ul）的部件属性 */
  propsList?: PartProps<'ul'>;
  /** 每一项（li，包着按钮或省略号）的部件属性 */
  propsItem?: PartProps<'li'>;
  /** 页码按钮的部件属性（按钮或链接按钮），可以按页计算 */
  propsPage?:
    | Partial<ButtonProps & LinkButtonProps>
    | ((page: number) => Partial<ButtonProps & LinkButtonProps>);
  /** 上一页、下一页按钮的部件属性 */
  propsStep?: Partial<IconButtonProps>;
  /** 省略号的部件属性 */
  propsEllipsis?: PartProps<'span'>;
  /** 总条数文字的部件属性 */
  propsTotal?: PartProps<'span'>;
}

const styles = stylex.create({
  root: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '_md' },
  list: { display: 'flex', alignItems: 'center', gap: '_xs' },
  // 页码按钮等宽，翻页时位置不晃
  page: { minWidth: 'max(_sizes.control, _sizes.minTarget)', paddingInline: '_xs' },
  ellipsis: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 'max(_sizes.control, _sizes.minTarget)',
    color: '_textMuted',
  },
  total: { color: '_textMuted' },
  tabular: { fontVariantNumeric: 'tabular-nums' },
});

/** 分页：上一页、页码、省略号、下一页 */
export const Pagination = _component(
  ({
    page = _bindable(1),
    pageCount,
    total,
    pageSize = 10,
    siblings = 1,
    boundaries = 1,
    showTotal = false,
    href,
    size = 'sm',
    propsList,
    propsItem,
    propsPage,
    propsStep,
    propsEllipsis,
    propsTotal,
    ...rest
  }: PaginationProps) => {
    const lang = useLang();
    const count = _derived(Math.max(1, pageCount ?? Math.ceil((total ?? 0) / pageSize)));

    function go(target: number) {
      page = Math.min(count, Math.max(1, target));
    }

    /** 一个页码：当前页是实底，其余是 ghost；有 href 时是链接 */
    function pageButton(target: number) {
      const current = target === page;
      const own = typeof propsPage === 'function' ? propsPage(target) : propsPage;
      const shared = mergeProps<ButtonProps & LinkButtonProps>(
        {
          sx: [styles.page, styles.tabular],
          size,
          variant: current ? 'soft' : 'ghost',
          tone: current ? 'accent' : 'neutral',
          'aria-label': lang.pageLabel(target),
        },
        own,
        { 'aria-current': current ? 'page' : undefined },
      );
      return href ? (
        <LinkButton
          {...mergePartProps<LinkButtonProps>(
            shared as LinkButtonProps,
            {},
            {
              href: href(target),
              onClick: () => go(target),
            },
          )}
        >
          {target}
        </LinkButton>
      ) : (
        <Button
          {...mergePartProps<ButtonProps>(shared as ButtonProps, {}, { onClick: () => go(target) })}
        >
          {target}
        </Button>
      );
    }

    /** 上一页、下一页：到头时不可用 */
    function stepButton(direction: -1 | 1) {
      const target = page + direction;
      const disabled = target < 1 || target > count;
      return (
        <IconButton
          {...mergePartProps<IconButtonProps>(
            {
              size,
              variant: 'ghost',
              tone: 'neutral',
              icon: direction < 0 ? ChevronLeft : ChevronRight,
              propsIcon: { flipInRtl: true },
              'aria-label': direction < 0 ? lang.previousPage : lang.nextPage,
            },
            propsStep,
            { disabled, onClick: () => go(target) },
          )}
        />
      );
    }

    return () => (
      <nav
        {...elementProps(
          mergeProps<'nav'>({ sx: styles.root, 'aria-label': lang.pagination }, rest),
        )}
      >
        <ul {...elementProps(mergeProps<'ul'>({ sx: [listStyles.reset, styles.list] }, propsList))}>
          <li {...elementProps(mergeProps<'li'>({}, propsItem))}>{stepButton(-1)}</li>
          {paginationItems({ page, pageCount: count, siblings, boundaries }).map((item) => (
            <li key={item} {...elementProps(mergeProps<'li'>({}, propsItem))}>
              {typeof item === 'number' ? (
                pageButton(item)
              ) : (
                <span
                  {...elementProps(
                    mergeProps<'span'>({ sx: styles.ellipsis }, propsEllipsis, {
                      'aria-hidden': true,
                    }),
                  )}
                >
                  <Icon icon={Ellipsis} />
                </span>
              )}
            </li>
          ))}
          <li {...elementProps(mergeProps<'li'>({}, propsItem))}>{stepButton(1)}</li>
        </ul>
        {showTotal && total != null && (
          <span
            {...elementProps(
              mergeProps<'span'>({ sx: [styles.total, styles.tabular] }, propsTotal),
            )}
          >
            {lang.paginationTotal(total)}
          </span>
        )}
      </nav>
    );
  },
);
