/**
 * 外观是按钮的链接（a）：跳转到别的页面时用它，而不是 Button + 点击里跳转（链接能右键、新标签页打开、读屏念“链接”）。
 * 外观与内容排布和 Button 共用（button-styles.ts）；站内链接经 createUi 的 router 不刷新页面地跳转。
 *
 *   <LinkButton href="/orders/new" icon={Plus}>新建订单</LinkButton>
 *   <LinkButton href="https://example.com" external variant="outline">文档</LinkButton>
 */
import { ArrowUpRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { useLang } from '../config/context';
import { useRouterLink } from '../utils/link';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { useRipple } from '../utils/ripple';
import {
  buttonContent,
  buttonSx,
  guardClick,
  useButtonAppearance,
  type ButtonContentOptions,
  type ButtonOptions,
} from './button-styles';
import { VisuallyHidden } from './VisuallyHidden';

/** 地址、不可用与忙碌由组件管理 */
type Managed = 'href' | 'aria-disabled' | 'aria-busy' | 'role';

/** 未声明的属性落到 a 上 */
export interface LinkButtonProps
  extends PartProps<'a', Managed>, ButtonOptions, ButtonContentOptions {
  /** 链接地址 */
  href: string;
  /** 外部链接：新窗口打开，加 rel="noopener noreferrer"、外链图标（没给 iconEnd 时）与读屏提示 */
  external?: boolean;
  /**
   * 不可用：去掉 href（不能点、不能用键盘打开），保留 role="link" 与 aria-disabled，读屏仍知道这里有个链接。
   * 不可用的链接不能聚焦；需要说明原因时把说明写在旁边
   */
  disabled?: boolean;
}

/** 外观是按钮的链接（a）：样式、图标、加载中、波纹与 Button 一致 */
export const LinkButton = _component(
  ({
    href,
    external = false,
    disabled = false,
    variant,
    tone,
    size,
    radius,
    loading = false,
    ripple,
    icon,
    iconEnd,
    fullWidth = false,
    propsContent,
    propsIcon,
    propsIconEnd,
    propsSpinner,
    onClick,
    children,
    ...rest
  }: LinkButtonProps) => {
    const lang = useLang();
    const router = useRouterLink();
    const appearance = useButtonAppearance(() => ({ variant, tone, size, radius }), 'solid');
    const rippleHandlers = useRipple(() => ripple);
    // 加载中、不可用时点击无效；使用方的 onClick 先于路由跳转执行，可以 preventDefault 拦下
    const click = guardClick<MouseEvent>(
      () => loading || disabled,
      () => (event) => {
        // 使用方的 onClick 按元素类型声明，这里的事件就是它
        (onClick as ((event: MouseEvent) => void) | undefined)?.(event);
        router.onClick(event);
      },
    );

    return () => (
      <a
        {...elementProps(
          mergeProps<'a'>(
            {
              sx: buttonSx(appearance(), { disabled, fullWidth }),
              ...(external && { target: '_blank', rel: 'noopener noreferrer' }),
            },
            rest,
            {
              href: disabled ? undefined : href,
              role: disabled ? 'link' : undefined,
              'aria-disabled': disabled || undefined,
              'aria-busy': loading || undefined,
              onClick: click,
              ...rippleHandlers,
            },
          ),
        )}
        data-loading={loading || undefined}
        data-disabled={disabled || undefined}
      >
        {buttonContent(
          {
            icon,
            iconEnd: iconEnd ?? (external ? ArrowUpRight : undefined),
            propsContent,
            propsIcon,
            propsIconEnd,
            children: [children, external && <VisuallyHidden>{lang.linkNewWindow}</VisuallyHidden>],
          },
          { loading, propsSpinner },
        )}
      </a>
    );
  },
);
