/**
 * 导航栏：页面顶部的一条，中间标题，左边返回，右边操作。H5 页面用；小程序有原生的导航栏，自定义导航栏（navigationStyle: custom）时也可以用它。
 *
 *   <NavBar title="订单详情" leftArrow onClickLeft={() => history.back()} />
 *   <NavBar title="购物车" right="编辑" onClickRight={edit} fixed placeholder />
 *
 * fixed 时固定在顶部并让出刘海屏的安全区；placeholder 在原位置留出同样高的空，下面的内容不被盖住。
 */
import { ChevronLeft } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到根元素（div）上 */
export interface NavBarProps extends PartProps<'div', 'title' | 'placeholder'> {
  /** 标题 */
  title?: VNodeChild;
  /** 左边显示返回箭头 */
  leftArrow?: boolean;
  /** 左边的文字（箭头后面） */
  left?: VNodeChild;
  /** 右边的内容（文字、图标按钮） */
  right?: VNodeChild;
  /** 固定在页面顶部 */
  fixed?: boolean;
  /** 固定时在原位置留出同样高的空 */
  placeholder?: boolean;
  /**
   * 底部的细线
   * @default true
   */
  border?: boolean;
  /** 点了左边 */
  onClickLeft?: (event: Event) => void;
  /** 点了右边 */
  onClickRight?: (event: Event) => void;
  /** 左边按钮的部件属性 */
  propsLeft?: PartProps<'button'>;
  /** 右边按钮的部件属性 */
  propsRight?: PartProps<'button'>;
}

/** NavBar 的样式：root、fixed、border、bar、title、side、left、right、placeholder */
export const navBarStyles = css.create({
  root: { backgroundColor: '_surface', color: '_text' },
  fixed: {
    position: 'fixed',
    insetBlockStart: 0,
    insetInline: 0,
    zIndex: 1000,
    paddingBlockStart: 'env(safe-area-inset-top)',
  },
  border: {
    borderBlockEndWidth: '_hairline',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
  },
  bar: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '3.15em',
    fontSize: '_md',
  },
  title: {
    maxWidth: '60%',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontSize: '_lg',
    fontWeight: '_semibold',
  },
  side: {
    position: 'absolute',
    insetBlock: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.15em',
    margin: 0,
    paddingBlock: 0,
    paddingInline: '_lg',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: '_accentText', ':active': '_accentActive' },
    fontFamily: 'inherit',
    fontSize: 'inherit',
    cursor: 'pointer',
  },
  left: { insetInlineStart: 0 },
  right: { insetInlineEnd: 0 },
  arrow: { fontSize: '1.4em', marginInlineStart: '-0.3em' },
  placeholder: { height: 'calc(3.15em + env(safe-area-inset-top))', fontSize: '_md' },
});

/** 导航栏（div > 左 + 标题 + 右） */
export const NavBar = _component(
  ({
    title,
    leftArrow = false,
    left,
    right,
    fixed = false,
    placeholder = false,
    border = true,
    onClickLeft,
    onClickRight,
    propsLeft,
    propsRight,
    ...rest
  }: NavBarProps) =>
    () => {
      const bar = (
        <div
          {...mergeAttrs<'div'>(
            { sx: [navBarStyles.root, fixed && navBarStyles.fixed, border && navBarStyles.border] },
            rest,
          )}
        >
          <div {...mergeAttrs<'div'>({ sx: navBarStyles.bar })}>
            {(leftArrow || hasContent(left)) && (
              <button
                {...mergeAttrs<'button'>(
                  { sx: [navBarStyles.side, navBarStyles.left] },
                  propsLeft,
                  {
                    type: 'button',
                    onClick: (event: Event) => onClickLeft?.(event),
                  },
                )}
              >
                {leftArrow && <Icon icon={ChevronLeft} sx={navBarStyles.arrow} />}
                {left}
              </button>
            )}
            {hasContent(title) && (
              <div {...mergeAttrs<'div'>({ sx: navBarStyles.title })} role="heading" aria-level={1}>
                {title}
              </div>
            )}
            {hasContent(right) && (
              <button
                {...mergeAttrs<'button'>(
                  { sx: [navBarStyles.side, navBarStyles.right] },
                  propsRight,
                  {
                    type: 'button',
                    onClick: (event: Event) => onClickRight?.(event),
                  },
                )}
              >
                {right}
              </button>
            )}
          </div>
        </div>
      );
      return fixed && placeholder
        ? [<div {...mergeAttrs<'div'>({ sx: navBarStyles.placeholder })} />, bar]
        : bar;
    },
);
