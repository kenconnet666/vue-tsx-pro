/**
 * 跳到正文的链接（WCAG 2.4.1 跳过重复内容）：页面第一个可聚焦元素，平时看不见，Tab 聚焦时出现在左上角。
 * AppShell 已经自带；不用 AppShell 时放在页面最前面：
 *
 *   <SkipLink href="#main" />
 *   …
 *   <main id="main" tabindex={-1}>…</main>
 *
 * 点击时直接把焦点移到目标上（不改地址栏的 hash，不经过路由）：之后再按 Tab 从正文继续。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';

/** 未声明的属性落到 a 上 */
export interface SkipLinkProps extends PartProps<'a', 'href'> {
  /** 目标（正文容器）的锚点，如 #main；目标要能聚焦（tabindex="-1"） */
  href: `#${string}`;
  /** 链接文字，默认取语言包（跳到正文） */
  children?: VNodeChild;
}

/** SkipLink 的样式：root */
export const skipLinkStyles = stylex.create({
  // 移出视口而不是 display: none：读屏照常能读到，Tab 能聚焦
  root: {
    position: 'fixed',
    insetBlockStart: '_sm',
    insetInlineStart: '_sm',
    // 盖在粘性顶栏之上
    zIndex: 100,
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderRadius: '_md',
    backgroundColor: '_surfaceRaised',
    boxShadow: '_lg',
    color: '_accentText',
    fontWeight: '_medium',
    textDecoration: 'none',
    // 移出视口之外再透明：阴影不会从顶边漏出来
    opacity: { default: 0, ':focus': 1 },
    translate: { default: '0 calc(-100% - 1em)', ':focus': 'none' },
    transition:
      'translate _durations.sm _easings.standard, opacity _durations.sm _easings.standard',
  },
});

/** 跳到正文的链接（a）：Tab 聚焦时出现 */
export const SkipLink = _component(({ href, children, ...rest }: SkipLinkProps) => {
  const lang = useLang();
  function onClick(event: MouseEvent) {
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.scrollIntoView({ block: 'start' });
  }
  return () => (
    <a
      {...mergeAttrs<'a'>({ sx: [skipLinkStyles.root, focusRingStyles.visible] }, rest, {
        href,
        onClick,
      })}
    >
      {children ?? lang.skipToContent}
    </a>
  );
});
