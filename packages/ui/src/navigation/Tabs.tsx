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
 *
 * line 样式的下划线是 TabList 里的一个指示条（Indicator）：跟着当前标签走（useActiveIndicator：
 * 切换时用 Anime.js 滑过去，时长取主题，减少动态效果时直接到位；尺寸变化时直接对齐）。
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount, useId, type VNodeChild } from 'vue';
import { useDefaults } from '../config/defaults';
import { useActiveIndicator } from '../utils/motion/active-indicator';
import { useLazyContent } from '../utils/motion/presence';
import { mergeAttrs, type PartProps } from '../utils/props';
import { rippleHostStyles, useRipple } from '../utils/dom/ripple';
import { rovingFocus } from '../utils/dom/roving-focus';
import { focusRingStyles } from '../utils/style/styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

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

/** Tabs 交给 TabList、Tab、TabPanel 的状态 */
export interface TabsState {
  /** 当前标签的值 */
  readonly value: string | undefined;
  /** 横排或竖排 */
  readonly orientation: keyof TabsOrientations;
  /** 方向键移动焦点时是否同时切换 */
  readonly activation: keyof TabsActivations;
  /** 样式 */
  readonly variant: keyof TabsVariants;
  /** 面板第一次显示时才渲染 */
  readonly lazy: boolean;
  /** 波纹；不写时沿用配置 */
  readonly ripple: boolean | undefined;
  /** 切换到某个标签 */
  select(value: string): void;
  /** 标签与面板的 id，互相引用 */
  id(part: 'tab' | 'panel', value: string): string;
  /** 登记标签（按渲染顺序），没有选中值时选第一个；返回注销函数 */
  register(value: string): () => void;
}

/** Tabs 的上下文：自定义的标签或面板可以 inject 它 */
export const TabsContext = createContext<TabsState>('Tabs');

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

/** Tabs 的样式：root、vertical */
export const tabsStyles = stylex.create({
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
    const appearance = useDefaults('Tabs', () => ({ variant, size }), { variant: 'line' });
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
        return appearance().variant;
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
        {...mergeAttrs<'div'>(
          {
            sx: [
              tabsStyles.root,
              orientation === 'vertical' && tabsStyles.vertical,
              appearance().size && fontSizeStyles[appearance().size!],
            ],
          },
          rest,
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
export type TabListManaged = 'role' | 'aria-orientation';

/** 未声明的属性落到 role="tablist" 的 div 上；aria-label 是这组标签的名称 */
export interface TabListProps extends PartProps<'div', TabListManaged> {
  /** 到两端后是否从另一端继续，默认 true */
  loop?: boolean;
  /** line 样式的下划线指示条的部件属性 */
  propsIndicator?: PartProps<'span'>;
  children?: VNodeChild;
}

/** Tabs 的样式：root、line、lineVertical、soft、softVertical、indicator、indicatorVertical */
export const tabListStyles = stylex.create({
  root: { display: 'flex', flexShrink: 0 },
  // 指示条按标签的 offsetLeft / offsetTop 定位，列表要是它的定位容器
  line: {
    position: 'relative',
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
  // 一条 2px 的品牌色线，压在列表的分隔线上；位置与长度由脚本写（transform 与 width/height）
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 'calc(-1 * _borderWidths.xs)',
    width: 0,
    height: '_borderWidths.sm',
    borderRadius: '_sm',
    backgroundColor: '_accent',
    pointerEvents: 'none',
  },
  indicatorVertical: {
    left: 'auto',
    bottom: 'auto',
    top: 0,
    insetInlineEnd: 'calc(-1 * _borderWidths.xs)',
    width: '_borderWidths.sm',
    height: 0,
  },
});

/** 标签列表（role="tablist"）：方向键在标签之间移动 */
export const TabList = _component(
  ({ loop = true, propsIndicator, children, ...rest }: TabListProps) => {
    const tabs = TabsContext.inject();
    let list = _state.raw<HTMLElement | null>(null);
    let indicator = _state.raw<HTMLElement | null>(null);
    _effect(() =>
      list
        ? rovingFocus(list, { items: '[role="tab"]', orientation: tabs.orientation, loop })
        : undefined,
    );

    useActiveIndicator(() => ({
      container: list,
      indicator,
      active: '[role="tab"][aria-selected="true"]',
      axis: tabs.orientation,
      value: tabs.value,
    }));

    return () => {
      const vertical = tabs.orientation === 'vertical';
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                tabListStyles.root,
                tabs.variant === 'line'
                  ? [tabListStyles.line, vertical && tabListStyles.lineVertical]
                  : [tabListStyles.soft, vertical && tabListStyles.softVertical],
              ],
            },
            rest,
            { ref: _toRef(list), role: 'tablist', 'aria-orientation': tabs.orientation },
          )}
        >
          {children}
          {tabs.variant === 'line' && (
            <span
              {...mergeAttrs<'span'>(
                { sx: [tabListStyles.indicator, vertical && tabListStyles.indicatorVertical] },
                propsIndicator,
                { ref: _toRef(indicator), 'aria-hidden': true },
              )}
            />
          )}
        </div>
      );
    };
  },
);

// ─────────────── Tab ───────────────

/** 角色、选中、关联与可聚焦由组件管理 */
export type TabManaged =
  'role' | 'aria-selected' | 'aria-controls' | 'id' | 'tabindex' | 'disabled';

/** 未声明的属性落到 role="tab" 的 button 上 */
export interface TabProps extends PartProps<'button', TabManaged> {
  /** 这个标签的值，与对应 TabPanel 的 value 相同 */
  value: string;
  /** 不可用：方向键跳过它 */
  disabled?: boolean;
  children?: VNodeChild;
}

/** Tabs 的样式：root、hover、line、lineVertical、lineActive、soft 等 */
export const tabStyles = stylex.create({
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
  // 下划线由 TabList 的指示条画（切换时滑过去），标签自己只变文字颜色
  lineActive: { color: '_text' },
  soft: { borderRadius: '_sm' },
  softActive: { color: '_text', backgroundColor: '_surface', boxShadow: '_xs' },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
});

/** 标签（role="tab" 的 button） */
export const Tab = _component(({ value, disabled = false, children, ...rest }: TabProps) => {
  const tabs = TabsContext.inject();
  onBeforeUnmount(tabs.register(_untrack(value)));
  const rippleHandlers = useRipple(() => tabs.ripple);

  return () => {
    const selected = tabs.value === value;
    const vertical = tabs.orientation === 'vertical';
    return (
      <button
        {...mergeAttrs<'button'>(
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
            // 使用方的 onClick / onFocus 先执行（mergeProps 的规则），onClick 里 preventDefault 可以拦下切换
            onClick: () => tabs.select(value),
            onFocus: () => {
              if (tabs.activation === 'automatic') tabs.select(value);
            },
            ...rippleHandlers,
          },
        )}
        data-state={selected ? 'active' : 'inactive'}
        data-disabled={disabled || undefined}
      >
        {children}
      </button>
    );
  };
});

// ─────────────── TabPanel ───────────────

/** 角色、关联与显示由组件管理 */
export type TabPanelManaged = 'role' | 'id' | 'aria-labelledby' | 'hidden';

/** 未声明的属性落到 role="tabpanel" 的 div 上 */
export interface TabPanelProps extends PartProps<'div', TabPanelManaged> {
  /** 对应标签的 value */
  value: string;
  children?: VNodeChild;
}

/** Tabs 的样式：root */
export const tabPanelStyles = stylex.create({
  root: { flexGrow: 1, minWidth: 0, borderRadius: '_sm' },
});

/** 标签面板（role="tabpanel"）：只显示当前标签的那一个 */
export const TabPanel = _component(({ value, children, ...rest }: TabPanelProps) => {
  const tabs = TabsContext.inject();
  // 显示过：lazy 时从这以后一直渲染内容
  const showContent = useLazyContent(
    () => tabs.value === value,
    () => tabs.lazy,
  );

  return () => {
    const selected = tabs.value === value;
    return (
      <div
        {...mergeAttrs<'div'>(
          { sx: [tabPanelStyles.root, focusRingStyles.visible], tabindex: 0 },
          rest,
          {
            role: 'tabpanel',
            id: tabs.id('panel', value),
            'aria-labelledby': tabs.id('tab', value),
            hidden: !selected,
          },
        )}
        data-state={selected ? 'active' : 'inactive'}
      >
        {showContent() && children}
      </div>
    );
  };
});
