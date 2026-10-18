/**
 * 标签页（WAI-ARIA 的 Tabs 模式），复合组件：Tabs（状态）> TabList（role="tablist"）> Tab（role="tab"），
 * 加上与每个 Tab 对应的 TabPanel（role="tabpanel"）。各层都是独立的组件，可以自由排版、各自加属性。
 *
 *   <Tabs value={_bind(tab)}>
 *     <TabList aria-label="订单">
 *       <Tab value="all">全部</Tab>
 *       <Tab value="paid">已付款</Tab>
 *     </TabList>
 *     <TabPanel value="all">…</TabPanel>
 *     <TabPanel value="paid">…</TabPanel>
 *   </Tabs>
 *
 * 键盘：标签之间用方向键移动（漫游焦点，整组一个 Tab 位置），Home / End 到两端；
 * activation="automatic"（默认）时焦点移到哪个标签就切换到哪个，"manual" 时按 Enter / 空格才切换。
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount, useId, type VNodeChild } from 'vue';
import { useDefaults } from '../config/defaults';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { rippleHostStyles, useRipple } from '../utils/ripple';
import { rovingFocus } from '../utils/roving-focus';
import { focusRingStyles } from '../utils/styles';
import { fontSizeStyles, type TextSize } from '../utils/typography';

/** 标签的排列方向 */
export interface TabsOrientations {
  /** 横排（默认），左右键切换 */
  horizontal: unknown;
  /** 竖排（标签在左侧），上下键切换 */
  vertical: unknown;
}

/** 焦点移动时是否同时切换 */
export interface TabsActivations {
  /** 焦点移到哪个标签就显示哪个面板（默认）：面板内容轻量时用 */
  automatic: unknown;
  /** 方向键只移动焦点，按 Enter / 空格才切换：切换面板代价大（要请求数据）时用 */
  manual: unknown;
}

/** 标签的样式 */
export interface TabsVariants {
  /** 下划线（默认）：当前标签下方一条品牌色的线 */
  line: unknown;
  /** 浅色底：当前标签有浅色底，像分段控件 */
  soft: unknown;
}

/** Tabs 的外观选项；可以用 createUi / Provider 的 defaults.Tabs 统一改默认值 */
export interface TabsOptions {
  /** 样式，默认 line */
  variant?: keyof TabsVariants;
  /** 字号档位，不写时继承 */
  size?: TextSize;
}

interface TabsState {
  readonly value: string | undefined;
  readonly orientation: keyof TabsOrientations;
  readonly activation: keyof TabsActivations;
  readonly variant: keyof TabsVariants;
  readonly lazy: boolean;
  readonly ripple: boolean | undefined;
  select(value: string): void;
  /** 标签与面板的 id，互相引用 */
  id(part: 'tab' | 'panel', value: string): string;
  /** 登记标签（按渲染顺序），没有选中值时选第一个；返回注销函数 */
  register(value: string): () => void;
}

const TabsContext = createContext<TabsState>('Tabs');

/** 值里的空格等字符不能出现在 id 里 */
const idSafe = (value: string) => value.replace(/[^\w-]/g, '_');

// ─────────────── Tabs ───────────────

/** 未声明的属性落到外层 div 上 */
export interface TabsProps extends PartProps<'div'>, TabsOptions {
  /** 当前标签的 value：父级写 value={_bind(x)}；不写时默认第一个标签 */
  value?: string;
  /** 方向，默认 horizontal */
  orientation?: keyof TabsOrientations;
  /** 焦点移动时是否同时切换，默认 automatic */
  activation?: keyof TabsActivations;
  /** 面板第一次显示时才渲染，之后切走也保留（面板内容重时用） */
  lazy?: boolean;
  /** 标签按下时的波纹；不写时沿用全局配置 */
  ripple?: boolean;
  children?: VNodeChild;
}

const rootStyles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_md' },
  vertical: { flexDirection: 'row', alignItems: 'flex-start' },
});

/** 标签页的状态容器：管理当前值，并把它交给 TabList、Tab、TabPanel */
export const Tabs = _component(
  ({
    value = _bindable<string | undefined>(undefined),
    orientation = 'horizontal',
    activation = 'automatic',
    variant,
    size,
    lazy = false,
    ripple,
    children,
    ...rest
  }: TabsProps) => {
    const defaults = useDefaults('Tabs');
    const baseId = useId();
    let registered = _state.raw<string[]>([]);
    const current = _derived(value ?? registered[0]);

    TabsContext.provide({
      get value() {
        return current;
      },
      get orientation() {
        return orientation;
      },
      get activation() {
        return activation;
      },
      get variant() {
        return variant ?? defaults.variant ?? 'line';
      },
      get lazy() {
        return lazy;
      },
      get ripple() {
        return ripple;
      },
      select: (next) => (value = next),
      id: (part, tab) => `${baseId}-${part}-${idSafe(tab)}`,
      register(tab) {
        registered = [...registered, tab];
        return () => (registered = registered.filter((item) => item !== tab));
      },
    });

    return () => (
      <div
        {...elementProps(
          mergeProps<'div'>(
            {
              sx: [
                rootStyles.root,
                orientation === 'vertical' && rootStyles.vertical,
                (size ?? defaults.size) && fontSizeStyles[(size ?? defaults.size)!],
              ],
            },
            rest,
          ),
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    );
  },
);

// ─────────────── TabList ───────────────

/** 角色、方向由组件管理 */
type ListManaged = 'role' | 'aria-orientation';

/** 未声明的属性落到 role="tablist" 的 div 上；aria-label 是这组标签的名称 */
export interface TabListProps extends PartProps<'div', ListManaged> {
  /** 到两端后是否从另一端继续，默认 true */
  loop?: boolean;
  children?: VNodeChild;
}

const listStyles = stylex.create({
  root: { display: 'flex', flexShrink: 0 },
  line: {
    gap: '_md',
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_borderMuted',
  },
  lineVertical: {
    flexDirection: 'column',
    gap: '_xs',
    borderBottomWidth: 0,
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_borderMuted',
  },
  soft: { gap: '_xs', padding: '_xs', borderRadius: '_md', backgroundColor: '_fill' },
  softVertical: { flexDirection: 'column' },
});

/** 标签列表（role="tablist"）：方向键在标签之间移动 */
export const TabList = _component(({ loop = true, children, ...rest }: TabListProps) => {
  const tabs = TabsContext.inject();
  let list = _state.raw<HTMLElement | null>(null);
  _effect(() =>
    list
      ? rovingFocus(list, { items: '[role="tab"]', orientation: tabs.orientation, loop })
      : undefined,
  );

  return () => {
    const vertical = tabs.orientation === 'vertical';
    return (
      <div
        {...elementProps(
          mergeProps<'div'>(
            {
              sx: [
                listStyles.root,
                tabs.variant === 'line'
                  ? [listStyles.line, vertical && listStyles.lineVertical]
                  : [listStyles.soft, vertical && listStyles.softVertical],
              ],
            },
            rest,
            { ref: _toRef(list), role: 'tablist', 'aria-orientation': tabs.orientation },
          ),
        )}
      >
        {children}
      </div>
    );
  };
});

// ─────────────── Tab ───────────────

/** 角色、选中、关联与可聚焦由组件管理 */
type TabManaged = 'role' | 'aria-selected' | 'aria-controls' | 'id' | 'tabindex' | 'disabled';

/** 未声明的属性落到 role="tab" 的 button 上 */
export interface TabProps extends PartProps<'button', TabManaged> {
  /** 这个标签的值，与对应 TabPanel 的 value 相同 */
  value: string;
  /** 不可用：方向键跳过它 */
  disabled?: boolean;
  children?: VNodeChild;
}

const tabStyles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_sm',
    minHeight: 'max(_sizes.control, _sizes.minTarget)',
    paddingInline: '_md',
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: '_textMuted',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: '_medium',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition:
      'color _durations.sm _easings.standard, background-color _durations.sm _easings.standard',
  },
  hover: { color: { default: null, ':hover': '_text' } },
  // 下划线：当前标签的底边（竖排时是结束边）一条 2px 的品牌色线，压在列表的分隔线上
  line: {
    borderRadius: '_sm',
    marginBottom: 'calc(-1 * _borderWidths.xs)',
    borderBottomWidth: '_sm',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
  },
  lineVertical: {
    justifyContent: 'flex-start',
    marginBottom: 0,
    marginInlineEnd: 'calc(-1 * _borderWidths.xs)',
    borderBottomWidth: 0,
    borderInlineEndWidth: '_sm',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: 'transparent',
  },
  // 写长属性：StyleX 里长属性总是优先于简写，borderColor 盖不过上面的 borderBottomColor
  lineActive: { color: '_text', borderBottomColor: '_accent', borderInlineEndColor: '_accent' },
  soft: { borderRadius: '_sm' },
  softActive: { color: '_text', backgroundColor: '_surface', boxShadow: '_xs' },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
});

/** 标签（role="tab" 的 button） */
export const Tab = _component(
  ({ value, disabled = false, onClick, onFocus, children, ...rest }: TabProps) => {
    const tabs = TabsContext.inject();
    onBeforeUnmount(tabs.register(_untrack(value)));
    const onRipple = useRipple(() => tabs.ripple);

    return () => {
      const selected = tabs.value === value;
      const vertical = tabs.orientation === 'vertical';
      return (
        <button
          {...elementProps(
            mergeProps<'button'>(
              {
                sx: [
                  tabStyles.root,
                  focusRingStyles.visible,
                  rippleHostStyles.host,
                  tabStyles.hover,
                  tabs.variant === 'line'
                    ? [
                        tabStyles.line,
                        vertical && tabStyles.lineVertical,
                        selected && tabStyles.lineActive,
                      ]
                    : [tabStyles.soft, selected && tabStyles.softActive],
                  disabled && tabStyles.disabled,
                ],
                type: 'button',
              },
              rest,
              {
                role: 'tab',
                id: tabs.id('tab', value),
                'aria-selected': selected,
                'aria-controls': tabs.id('panel', value),
                disabled,
                onClick: (event: MouseEvent) => {
                  (onClick as ((event: MouseEvent) => void) | undefined)?.(event);
                  if (!event.defaultPrevented) tabs.select(value);
                },
                onFocus: (event: FocusEvent) => {
                  (onFocus as ((event: FocusEvent) => void) | undefined)?.(event);
                  if (tabs.activation === 'automatic') tabs.select(value);
                },
                onPointerdown: onRipple,
                onKeydown: onRipple,
              },
            ),
          )}
          data-state={selected ? 'active' : 'inactive'}
          data-disabled={disabled || undefined}
        >
          {children}
        </button>
      );
    };
  },
);

// ─────────────── TabPanel ───────────────

/** 角色、关联与显示由组件管理 */
type PanelManaged = 'role' | 'id' | 'aria-labelledby' | 'hidden';

/** 未声明的属性落到 role="tabpanel" 的 div 上 */
export interface TabPanelProps extends PartProps<'div', PanelManaged> {
  /** 对应标签的 value */
  value: string;
  children?: VNodeChild;
}

const panelStyles = stylex.create({
  root: { flexGrow: 1, minWidth: 0, borderRadius: '_sm' },
});

/** 标签面板（role="tabpanel"）：只显示当前标签的那一个 */
export const TabPanel = _component(({ value, children, ...rest }: TabPanelProps) => {
  const tabs = TabsContext.inject();
  // 显示过：lazy 时从这以后一直渲染内容
  let visited = _state(false);
  _effect.pre(() => {
    if (tabs.value === value) visited = true;
  });

  return () => {
    const selected = tabs.value === value;
    return (
      <div
        {...elementProps(
          mergeProps<'div'>(
            // 面板本身可聚焦：里面没有可聚焦元素时，键盘用户也能 Tab 到内容
            { sx: [panelStyles.root, focusRingStyles.visible], tabindex: 0 },
            rest,
            {
              role: 'tabpanel',
              id: tabs.id('panel', value),
              'aria-labelledby': tabs.id('tab', value),
              hidden: !selected,
            },
          ),
        )}
        data-state={selected ? 'active' : 'inactive'}
      >
        {(!tabs.lazy || selected || visited) && children}
      </div>
    );
  };
});
