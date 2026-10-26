/**
 * 翻页导航：文章末尾的“上一篇 / 下一篇”，两张链接卡片。
 *
 *   <Pager previous={{ href: '/button', label: 'Button' }} next={{ href: '/dialog', label: 'Dialog' }} />
 *
 * 链接带 rel="prev" / rel="next"；站内链接经 createUi 的 router 不刷新页面地跳转（useRouterLink）。
 * 页码式的分页用 Pagination。
 */
import { ArrowLeft, ArrowRight } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useLang } from '../config/context';
import { useRouterLink } from '../utils/dom/link';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { interactionTransitions } from '../utils/style/transitions';

/** 一侧的链接 */
export interface PagerLink {
  /** 地址 */
  href: string;
  /** 文章标题 */
  label: VNodeChild;
}

/** 未声明的属性落到 nav 上 */
export interface PagerProps extends PartProps<'nav'> {
  /** 上一篇；第一篇没有 */
  previous?: PagerLink;
  /** 下一篇；最后一篇没有 */
  next?: PagerLink;
  /** 两个链接（a）的部件属性 */
  propsLink?: PartProps<'a'>;
}

/** Pager 的样式：root、link、next、hint、label、arrow */
export const pagerStyles = css.create({
  // 够宽时两列；只有下一篇时它仍在结束边那一列
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
    gap: '_md',
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_xs',
    padding: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: { default: '_border', ':hover': '_accent' },
    borderRadius: '_md',
    color: '_text',
    textDecoration: 'none',
  },
  next: { gridColumnEnd: '-1', alignItems: 'flex-end', textAlign: 'end' },
  hint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    color: '_textMuted',
    fontSize: '_sm',
  },
  label: { color: '_accentText', fontWeight: '_medium' },
  // 从右到左排版时“上一篇”在右边：箭头跟着掉头
  arrow: { scale: { default: null, ':dir(rtl)': '-1 1' } },
});

/** 翻页导航（nav）：上一篇、下一篇 */
export const Pager = _component(({ previous, next, propsLink, ...rest }: PagerProps) => {
  const lang = useLang();
  const router = useRouterLink();

  function renderLink(link: PagerLink, direction: 'prev' | 'next') {
    const isNext = direction === 'next';
    return (
      <a
        {...mergeAttrs<'a'>(
          {
            sx: [
              pagerStyles.link,
              isNext && pagerStyles.next,
              focusRingStyles.visible,
              interactionTransitions.colors,
            ],
          },
          propsLink,
          {
            href: router.href(link.href),
            rel: direction,
            onClick: (event: MouseEvent) => router.onClick(event, link.href),
          },
        )}
      >
        <span {...mergeAttrs<'span'>({ sx: pagerStyles.hint })}>
          {!isNext && <Icon icon={ArrowLeft} sx={pagerStyles.arrow} />}
          {isNext ? lang.pagerNext : lang.pagerPrevious}
          {isNext && <Icon icon={ArrowRight} sx={pagerStyles.arrow} />}
        </span>
        <span {...mergeAttrs<'span'>({ sx: pagerStyles.label })}>{link.label}</span>
      </a>
    );
  }

  return () => (
    <nav {...mergeAttrs<'nav'>({ sx: pagerStyles.root, 'aria-label': lang.pagerLabel }, rest)}>
      {previous && renderLink(previous, 'prev')}
      {next && renderLink(next, 'next')}
    </nav>
  );
});
