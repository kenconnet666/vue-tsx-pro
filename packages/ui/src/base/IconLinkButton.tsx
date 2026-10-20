/**
 * 只有图标的链接（a）：外观同 IconButton（宽高相等、默认 ghost），行为同 LinkButton（站内链接经 router 跳转）。
 * 顶栏里的仓库、社交账号链接这类“点了去别处”的图标用它；类型上必须给 aria-label。
 *
 *   <IconLinkButton href="https://github.com/…" external icon={Github} aria-label="GitHub 仓库" />
 */
import { _component } from '@vue-tsx-pro/tsx';
import { useLang } from '../config/context';
import { useRouterLink } from '../utils/dom/link';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  buttonContent,
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
    propsIcon,
    onClick,
    ...rest
  }: IconLinkButtonProps) => {
    const lang = useLang();
    const router = useRouterLink();
    const appearance = useButtonAppearance(() => ({ variant, tone, size, radius }), 'ghost');
    const behavior = useButtonBehavior(
      () => ({ disabled, loading: false, focusableWhenDisabled: true, ripple }),
      () => (event) => {
        (onClick as ((event: MouseEvent) => void) | undefined)?.(event);
        router.onClick(event);
      },
    );

    return () => (
      <a
        {...mergeAttrs<'a'>(
          {
            sx: buttonSx(appearance(), { disabled, square: true }),
            ...(external && { target: '_blank', rel: 'noopener noreferrer' }),
          },
          rest,
          {
            ...behavior(),
            href: disabled ? undefined : href,
            role: disabled ? 'link' : undefined,
            'aria-label': external ? `${label}${lang.linkNewWindow}` : label,
          },
        )}
      >
        {buttonContent({ icon, propsIcon }, { loading: false })}
      </a>
    );
  },
);
