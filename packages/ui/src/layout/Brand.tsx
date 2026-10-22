/**
 * 品牌：应用外壳顶栏起始边的标志与产品名，点了回首页（走路由适配）。放在 AppShell 的 brand 里。
 *
 *   <AppShell brand={<Brand href="/" icon={Plane}>联合降本管理</Brand>} … />
 *
 * 标志是品牌色的图标（装饰，对读屏隐藏），名字就是链接的名称；也可以用 logo 放一张图代替图标。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { useRouterLink } from '../utils/dom/link';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';

/** 未声明的属性落到链接（a）上 */
export interface BrandProps extends PartProps<'a', 'href'> {
  /** 点了去哪儿，一般是首页 */
  href: string;
  /** 标志的图标（品牌色） */
  icon?: IconData;
  /** 标志的图片等，写了时不画 icon */
  logo?: VNodeChild;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 产品名 */
  children?: VNodeChild;
}

/** Brand 的样式：root、mark */
export const brandStyles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    flexShrink: 0,
    color: '_text',
    textDecoration: 'none',
    fontWeight: '_semibold',
    fontSize: '_lg',
    borderRadius: '_sm',
  },
  mark: { color: '_accentText' },
});

/** 品牌：标志与产品名，链到首页 */
export const Brand = _component(
  ({ href, icon, logo, propsIcon, children, ...rest }: BrandProps) => {
    const router = useRouterLink();
    return () => (
      <a
        {...mergeAttrs<'a'>({ sx: [brandStyles.root, focusRingStyles.visible] }, rest, {
          href: router.href(href),
          onClick: (event: MouseEvent) => router.onClick(event, href),
        })}
      >
        {logo ??
          (icon && (
            <Icon {...mergePartProps<IconProps>({ icon, sx: brandStyles.mark }, propsIcon)} />
          ))}
        {children}
      </a>
    );
  },
);
