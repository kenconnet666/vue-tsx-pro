/**
 * 文字链接。默认带下划线：正文里的链接不能只靠颜色区分（WCAG 1.4.1）。
 *
 *   <Link href="/orders">查看订单</Link>
 *   <Link href="https://example.com" external>帮助文档</Link>   新窗口打开，带图标与读屏提示
 *
 * 按钮样式的链接用 LinkButton。站内链接经 createUi 的 router 不刷新页面地跳转（utils/dom/link.ts）。
 */
import { ArrowUpRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
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

/** Link 的样式：root、always、hover、none、icon */
export const linkStyles = css.create({
  root: {
    borderRadius: '_xs',
    textDecorationThickness: '_xs',
    textUnderlineOffset: '0.2em',
    cursor: 'pointer',
  },
  always: { textDecorationLine: 'underline' },
  hover: { textDecorationLine: { default: 'none', ':hover': 'underline' } },
  none: { textDecorationLine: 'none' },
  // 图标跟随文字：不换行到下一行开头
  icon: { marginInlineStart: '0.1em', verticalAlign: '-0.1em' },
});

/** 文字链接（a）：品牌色、下划线与焦点环；external 时新窗口打开并带读屏提示 */
export const Link = _component(
  ({ href, tone, underline, external = false, propsIcon, children, ...rest }: LinkProps) => {
    const lang = useLang();
    const router = useRouterLink();
    const appearance = useDefaults('Link', () => ({ tone, underline }), {
      tone: 'accent',
      underline: 'always',
    });
    return () => (
      <a
        {...mergeAttrs<'a'>(
          {
            sx: [
              linkStyles.root,
              focusRingStyles.visible,
              toneStyles[appearance().tone],
              linkStyles[appearance().underline],
            ],
          },
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
            <Icon
              {...mergePartProps<IconProps>({ icon: ArrowUpRight, sx: linkStyles.icon }, propsIcon)}
            />
            <VisuallyHidden>{lang.linkNewWindow}</VisuallyHidden>
          </>
        )}
      </a>
    );
  },
);
