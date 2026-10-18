/**
 * 文字链接。默认带下划线：正文里的链接不能只靠颜色区分（WCAG 1.4.1）。
 *
 *   <Link href="/orders">查看订单</Link>
 *   <Link href="https://example.com" external>帮助文档</Link>   新窗口打开，带图标与读屏提示
 *
 * 按钮样式的链接用 LinkButton（以后实现），不是 Link。
 */
import { ArrowUpRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/styles';
import { toneStyles, type Tone } from '../utils/typography';
import { Icon } from './Icon';
import { VisuallyHidden } from './VisuallyHidden';

/** 未声明的属性落到 <a> 上 */
export interface LinkProps extends PartProps<'a', 'href'> {
  href: string;
  /** 色调，默认 accent（品牌色文字） */
  tone?: Tone;
  /** 下划线：always（默认）、hover 时才显示、none（只用于导航等上下文已表明是链接的地方） */
  underline?: 'always' | 'hover' | 'none';
  /** 外部链接：新窗口打开，加 rel="noopener noreferrer"、外链图标与读屏提示 */
  external?: boolean;
  children?: VNodeChild;
}

const styles = stylex.create({
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

export const Link = _component(
  ({
    href,
    tone = 'accent',
    underline = 'always',
    external = false,
    children,
    ...rest
  }: LinkProps) => {
    const lang = useLang();
    return () => (
      <a
        {...elementProps(
          mergeProps<'a'>(
            { sx: [styles.root, focusRingStyles.visible, toneStyles[tone], styles[underline]] },
            rest,
            external ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href },
          ),
        )}
      >
        {children}
        {external && (
          <>
            <Icon icon={ArrowUpRight} sx={styles.icon} />
            <VisuallyHidden>{lang.linkNewWindow}</VisuallyHidden>
          </>
        )}
      </a>
    );
  },
);
