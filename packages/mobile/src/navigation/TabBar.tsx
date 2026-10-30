/**
 * 标签栏：页面底部的一排入口（首页、分类、购物车、我的），图标加文字，选中的用主色，可带徽标。
 *
 *   <TabBar _value={tab}>
 *     <TabBarItem name="home" icon={House}>首页</TabBarItem>
 *     <TabBarItem name="cart" icon={ShoppingCart} badge={3}>购物车</TabBarItem>
 *   </TabBar>
 *
 * 默认固定在底部、让出全面屏的安全区，并在原位置留出同样高的空。小程序也有原生的 tabBar（app.json），
 * 这一个是页面里自己画的，样式与 H5 一致。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { Badge } from '../display/Badge';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 标签栏提供给各项的 */
interface TabBarState {
  readonly value: string | undefined;
  select(name: string): void;
}

const TabBarContext = createContext<TabBarState>('TabBar');

/** 未声明的属性落到栏（div）上 */
export interface TabBarProps extends Omit<PartProps<'div', 'role' | 'placeholder'>, 'onChange'> {
  /** 选中的项；双向绑定写 `_value={x}` */
  _value?: string;
  /**
   * 固定在页面底部
   * @default true
   */
  fixed?: boolean;
  /**
   * 固定时在原位置留出同样高的空
   * @default true
   */
  placeholder?: boolean;
  /**
   * 顶部的细线
   * @default true
   */
  border?: boolean;
  /** 换了一项 */
  onChange?: (name: string) => void;
  /** 各个 TabBarItem */
  children?: VNodeChild;
}

/** TabBar、TabBarItem 的样式 */
export const tabBarStyles = css.create({
  root: {
    boxSizing: 'content-box',
    display: 'flex',
    height: '3.5em',
    paddingBlockEnd: 'env(safe-area-inset-bottom)',
    backgroundColor: '_surface',
    fontSize: '_md',
  },
  fixed: { position: 'fixed', insetBlockEnd: 0, insetInline: 0, zIndex: 1000 },
  border: {
    borderBlockStartWidth: '_hairline',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_border',
  },
  placeholder: { height: 'calc(3.5em + env(safe-area-inset-bottom))', fontSize: '_md' },
  item: {
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.2em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: '_textMuted', '[aria-selected="true"]': '_accentText' },
    fontFamily: 'inherit',
    fontSize: '_xs',
    cursor: 'pointer',
    userSelect: 'none',
  },
  icon: { fontSize: '1.65em' },
});

/** 标签栏（div[role=tablist]） */
export const TabBar = _component(
  ({
    _value: value = _bindable<string | undefined>(undefined),
    fixed = true,
    placeholder = true,
    border = true,
    onChange,
    children,
    ...rest
  }: TabBarProps) => {
    TabBarContext.provide({
      get value() {
        return value;
      },
      select(name) {
        if (name === value) return;
        value = name;
        onChange?.(name);
      },
    });
    return () => {
      const bar = (
        <div
          {...mergeAttrs<'div'>(
            { sx: [tabBarStyles.root, fixed && tabBarStyles.fixed, border && tabBarStyles.border] },
            rest,
            { role: 'tablist' },
          )}
        >
          {children}
        </div>
      );
      return fixed && placeholder
        ? [<div {...mergeAttrs<'div'>({ sx: tabBarStyles.placeholder })} />, bar]
        : bar;
    };
  },
);

/** 未声明的属性落到按钮上 */
export interface TabBarItemProps extends PartProps<
  'button',
  'role' | 'aria-selected' | 'type' | 'name'
> {
  /** 名字：选中的状态按它记 */
  name: string;
  /** 图标 */
  icon?: IconData;
  /** 选中时的图标（不给时用 icon，只换成主色） */
  activeIcon?: IconData;
  /** 图标右上角的徽标：数字、文字，true 是小红点 */
  badge?: number | string | boolean;
  /** 文字 */
  children?: VNodeChild;
}

/** 标签栏的一项（button[role=tab]） */
export const TabBarItem = _component(
  ({ name, icon, activeIcon, badge, children, ...rest }: TabBarItemProps) => {
    const bar = TabBarContext.inject();
    return () => {
      const selected = bar.value === name;
      const current = (selected && activeIcon) || icon;
      const glyph = current && <Icon icon={current} sx={tabBarStyles.icon} />;
      return (
        <button
          {...mergeAttrs<'button'>({ sx: tabBarStyles.item }, rest, {
            type: 'button',
            role: 'tab',
            'aria-selected': selected ? 'true' : 'false',
            onClick: () => bar.select(name),
          })}
        >
          {glyph &&
            (badge === undefined || badge === false ? (
              glyph
            ) : (
              <Badge content={badge === true ? undefined : badge} dot={badge === true}>
                {glyph}
              </Badge>
            ))}
          {hasContent(children) && <span>{children}</span>}
        </button>
      );
    };
  },
);
