/**
 * 文字链接。默认带下划线：正文里的链接不能只靠颜色区分（WCAG 1.4.1）。
 *
 *   <Link href="/orders">查看订单</Link>
 *   <Link href="https://example.com" external>帮助文档</Link>   新窗口打开，带图标与读屏提示
 *
 * 按钮样式的链接用 LinkButton。站内链接经 createUi 的 router 不刷新页面地跳转（utils/dom/link.ts）。
 */
import { ArrowUpRight } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { externalLinkAttrs, useRouterLink } from '../utils/dom/link';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { toneStyles, type Tone } from '../utils/style/typography';
import { Icon, type IconProps } from './Icon';
import { VisuallyHidden } from './VisuallyHidden';

/** 链接的下划线 */
export interface LinkUnderlines {
  /** 一直显示：正文里的链接，不能只靠颜色区分（WCAG 1.4.1） */
  always: unknown;
  /** 悬停时才显示：列表、卡片里一眼能看出是链接的地方 */
  hover: unknown;
  /** 不显示：导航菜单等上下文已表明是链接的地方 */
  none: unknown;
}

/** Link 的外观选项：可以在 ComponentDefaults 里统一设置 */
export interface LinkOptions {
  /** 色调，默认 accent（品牌色文字） */
  tone?: Tone;
  /** 下划线，默认 always */
  underline?: keyof LinkUnderlines;
}

/** 未声明的属性落到 <a> 上 */
export interface LinkProps extends PartProps<'a', 'href'>, LinkOptions {
  /** 链接地址；必填：没有地址的“链接”应该用按钮 */
  href: string;
  /** 外部链接：新窗口打开，加 rel="noopener noreferrer"、外链图标与读屏提示 */
  external?: boolean;
  /** 外链图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  children?: VNodeChild;
}

/**
 * 链接的配方：部件 root（a）、icon（外链图标），下划线是档位。色调的文字色来自共用的 toneStyles，
 * 排在配方之前，createUi / Provider 的 styles.Link 能盖过它
 */
export const linkRecipe = css.recipe({
  name: 'Link',
  parts: ['root', 'icon'],
  base: {
    root: {
      borderRadius: '_xs',
      textDecorationThickness: '_xs',
      textUnderlineOffset: '0.2em',
      cursor: 'pointer',
    },
    // 图标跟随文字：不换行到下一行开头
    icon: { marginInlineStart: '0.1em', verticalAlign: '-0.1em' },
  },
  variants: {
    underline: {
      always: { root: { textDecorationLine: 'underline' } },
      hover: { root: { textDecorationLine: { default: 'none', ':hover': 'underline' } } },
      none: { root: { textDecorationLine: 'none' } },
    },
  },
});

/** 链接的部件（createUi / Provider 的 styles.Link 按它定制） */
export type LinkPart = (typeof linkRecipe.parts)[number];

/** 文字链接（a）：品牌色、下划线与焦点环；external 时新窗口打开并带读屏提示 */
export const Link = _component(
  ({ href, tone, underline, external = false, propsIcon, children, ...rest }: LinkProps) => {
    const lang = useLang();
    const router = useRouterLink();
    const appearance = useDefaults('Link', () => ({ tone, underline }), {
      tone: 'accent',
      underline: 'always',
    });
    const recipe = useRecipe(linkRecipe);
    return () => {
      const { tone: shownTone, underline: shownUnderline } = appearance();
      const s = recipe({ underline: shownUnderline, tone: shownTone });
      return (
        <a
          {...mergeAttrs<'a'>(
            { ...s.root, sx: [toneStyles[shownTone], s.root.sx, focusRingStyles.visible] },
            rest,
            external
              ? { href, ...externalLinkAttrs }
              : // 使用方的 onClick 先执行，preventDefault 可以拦下路由跳转（mergeProps 的规则）
                {
                  href: router.href(href),
                  onClick: (event: MouseEvent) => router.onClick(event, href),
                },
          )}
        >
          {children}
          {external && (
            <>
              <Icon {...mergePartProps<IconProps>({ ...s.icon, icon: ArrowUpRight }, propsIcon)} />
              <VisuallyHidden>{lang.linkNewWindow}</VisuallyHidden>
            </>
          )}
        </a>
      );
    };
  },
);
