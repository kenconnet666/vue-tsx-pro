/**
 * 只有图标的链接（a）：外观同 IconButton（宽高相等、默认 ghost），行为同 LinkButton（站内链接经 router 跳转）。
 * 顶栏里的仓库、社交账号链接这类“点了去别处”的图标用它；类型上必须给 aria-label。
 *
 *   <IconLinkButton href="https://github.com/…" external icon={Github} aria-label="GitHub 仓库" />
 */
import { _component } from '@vue-tsx-pro/tsx';
import { useLang } from '../config/context';
import { externalLinkAttrs, useRouterLink } from '../utils/dom/link';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  buttonContent,
  buttonPart,
  buttonSx,
  useButtonAppearance,
  useButtonBehavior,
  type ButtonOptions,
} from './button-core';
import type { IconData, IconProps } from './Icon';

/** 地址、不可用与名称由组件管理 */
export type IconLinkButtonManaged = 'href' | 'aria-disabled' | 'role' | 'aria-label';

/** 未声明的属性落到 a 上 */
export interface IconLinkButtonProps
  extends PartProps<'a', IconLinkButtonManaged>, Omit<ButtonOptions, 'loading' | 'propsSpinner'> {
  /** 链接地址 */
  href: string;
  /** 图标：`import { BookOpen } from '@lucide/icons'` */
  icon: IconData;
  /** 链接的无障碍名称（读屏念的），必填 */
  'aria-label': string;
  /** 外部链接：新窗口打开，加 rel="noopener noreferrer"，名称后补上“在新窗口打开” */
  external?: boolean;
  /** 不可用：去掉 href，保留 role="link" 与 aria-disabled（同 LinkButton） */
  disabled?: boolean;
  /**
   * 样式：只有图标时默认不带底色
   * @default 'ghost'
   */
  variant?: ButtonOptions['variant'];
  /**
   * 色调：只有图标时默认中性色（工具栏、卡片上的次要操作）
   * @default 'neutral'
   */
  tone?: ButtonOptions['tone'];
  /** 内容层（包着图标的 span）的部件属性 */
  propsContent?: PartProps<'span'>;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
}

/** 只有图标的链接（a）：外观同 IconButton，行为同 LinkButton */
export const IconLinkButton = _component(
  ({
    href,
    icon,
    'aria-label': label,
    external = false,
    disabled = false,
    variant,
    tone,
    size,
    radius,
    ripple,
    propsContent,
    propsIcon,
    onClick,
    ...rest
  }: IconLinkButtonProps) => {
    const lang = useLang();
    const router = useRouterLink();
    const appearance = useButtonAppearance(
      () => ({ variant, tone, size, radius }),
      'ghost',
      // 只有图标的按钮多是工具栏、卡片角上的次要操作：默认中性色，一排图标不会满屏品牌色
      'neutral',
    );
    const behavior = useButtonBehavior(
      () => ({ disabled, loading: false, focusableWhenDisabled: true, ripple }),
      () => (event) => {
        (onClick as ((event: MouseEvent) => void) | undefined)?.(event);
        router.onClick(event, href);
      },
    );

    return () => (
      <a
        {...mergeAttrs<'a'>(
          {
            ...buttonPart,
            sx: buttonSx(appearance(), { disabled, square: true }),
            ...(external && externalLinkAttrs),
          },
          rest,
          {
            ...behavior(),
            href: disabled ? undefined : router.href(href),
            role: disabled ? 'link' : undefined,
            'aria-label': external ? `${label}${lang.linkNewWindow}` : label,
          },
        )}
      >
        {buttonContent({ icon, propsContent, propsIcon }, { loading: false })}
      </a>
    );
  },
);
