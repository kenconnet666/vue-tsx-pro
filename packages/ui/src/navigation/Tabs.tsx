/**
 * 标签页（WAI-ARIA 的 Tabs 模式），复合组件：Tabs（状态）> TabList（role="tablist"）> Tab（role="tab"），
 * 加上与每个 Tab 对应的 TabPanel（role="tabpanel"）。各层都是独立的组件，可以自由排版、各自加属性。
 *
 *   <Tabs _value={tab}>
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
import { ChevronDown, ChevronLeft, ChevronRight, Plus, X } from '@lucide/icons';
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { nextTick, onBeforeUnmount, useId, watch, type VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { useActiveIndicator } from '../utils/motion/active-indicator';
import { useLazyContent } from '../utils/motion/presence';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Menu, MenuRadioGroup, MenuRadioItem } from '../overlay/Menu';
import { plainText } from '../utils/data/text';
import { announce } from '../utils/dom/announcer';
import { inlineArrows, isRtl } from '../utils/dom/direction';
import { batchLayout } from '../utils/dom/layout-batch';
import { startMove } from '../utils/dom/move';
import { useResizeObserver } from '../utils/dom/resize';
import { rovingFocus } from '../utils/dom/roving-focus';
import { focusRingStyles } from '../utils/style/styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { t } from '../config/theme/tokens';

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
  /**
   * 登记标签（按渲染顺序）与它的文字，没有选中值时选第一个；返回注销函数
   * （参数是注销时各标签显示的顺序，关掉当前标签时按它选旁边的）
   */
  register(value: string, label: () => string): (order?: readonly string[]) => void;
  /** 标签的文字（“全部标签页”菜单用） */
  label(value: string): string;
  /** 登记面板；返回注销函数 */
  registerPanel(value: string): () => void;
  /** 这个标签有没有对应的面板：只当导航用的标签（没有 TabPanel）不写 aria-controls */
  hasPanel(value: string): boolean;
  /** 登记了的标签，按渲染顺序 */
  readonly values: readonly string[];
  /** 正在拖动的标签 */
  readonly dragging: string | undefined;
  /** 开始、结束拖动 */
  setDragging(value: string | undefined): void;
  /** 关闭了有焦点的标签：等选中的标签换好之后，把焦点交给它 */
  refocus(): void;
}

/** Tabs 的上下文：自定义的标签或面板可以 inject 它 */
export const TabsContext = createContext<TabsState>('Tabs');

/** 值里的空格等字符不能出现在 id 里 */
const idSafe = (value: string) => value.replace(/[^\w-]/g, '_');

// ─────────────── Tabs ───────────────

/** 未声明的属性落到外层 div 上 */
export interface TabsProps extends PartProps<'div'>, TabsOptions {
  /** 当前标签的 value：父级写 _value={x}；不写时默认第一个标签 */
  _value?: string;
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
export const tabsStyles = css.create({
  // 能收缩：放在顶栏这类一行里时，列表放不下就在列表里滚动
  root: { display: 'flex', flexDirection: 'column', gap: '_md', minWidth: 0 },
  vertical: { flexDirection: 'row', alignItems: 'flex-start' },
});

/** 标签页的状态容器：管理当前值，并把它交给 TabList、Tab、TabPanel */
export const Tabs = _component(
  ({
    _value: value = _bindable<string | undefined>(undefined),
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
    let panels = _state.raw<string[]>([]);
    let dragging = _state<string | undefined>(undefined);
    // 各标签的文字：读的是 Tab 的子内容，跟着它变
    const labels = new Map<string, () => string>();
    const current = _derived(value ?? registered[0]);
    const tabId = (tab: string) => `${baseId}-tab-${idSafe(tab)}`;

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
      id: (part, tab) => (part === 'tab' ? tabId(tab) : `${baseId}-${part}-${idSafe(tab)}`),
      register(tab, label) {
        registered = [...registered, tab];
        labels.set(tab, label);
        return (order = registered) => {
          registered = registered.filter((item) => item !== tab);
          labels.delete(tab);
          if (current !== tab) return;
          // 关掉的是当前标签（使用方没有另选）：按显示的顺序选它后面的一个，没有时选前面的一个
          const index = order.indexOf(tab);
          const rest = order.filter((item) => item !== tab && registered.includes(item));
          value = rest[Math.min(Math.max(index, 0), rest.length - 1)];
        };
      },
      registerPanel(tab) {
        panels = [...panels, tab];
        return () => (panels = panels.filter((item) => item !== tab));
      },
      hasPanel: (tab) => panels.includes(tab),
      label: (tab) => labels.get(tab)?.() ?? tab,
      get values() {
        return registered;
      },
      get dragging() {
        return dragging;
      },
      setDragging: (next) => (dragging = next),
      refocus: () =>
        void nextTick(() => {
          if (current !== undefined) document.getElementById(tabId(current))?.focus();
        }),
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
  /** 列表末尾的“新建标签页”按钮：点了调用 */
  onAdd?: () => void;
  /**
   * 拖动标签（或在标签上按 Alt + ←→）改变顺序：参数是新的顺序（各标签的 value），使用方按它重排；
   * 不写时不能拖
   */
  onReorder?: (values: string[]) => void;
  /** 标签栏右边“全部标签页”的菜单（标签多、放不下时一眼找到并切过去） */
  showAllMenu?: boolean;
  /** line 样式的下划线指示条的部件属性 */
  propsIndicator?: PartProps<'span'>;
  /** 横排时包着标签列表与右边按钮的那一层的部件属性 */
  propsBar?: PartProps<'div'>;
  /** “新建标签页”按钮的部件属性 */
  propsAdd?: Partial<IconButtonProps>;
  children?: VNodeChild;
}

/** TabList 的样式：bar、barLine、root、scrollable、line、lineVertical、soft、softVertical、indicator、indicatorVertical */
export const tabListStyles = css.create({
  // 横排时包着标签列表与右边的按钮（滚动、全部标签页、新建）：列表按内容宽，放不下时收缩并滚动
  bar: { display: 'flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
  // 横排 line 的分隔线画在整行上：标签少时也铺满（页签区、页面顶部的标签）
  barLine: {
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_borderMuted',
  },
  root: { display: 'flex', flexShrink: 0 },
  // 横排放不下时（顶栏、窄屏）在列表里横向滚动，不盖到旁边的内容上；滚动条藏起来，触控板、拖动照样能滚
  scrollable: {
    flexShrink: 1,
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
  },
  // 指示条按标签的 offsetLeft / offsetTop 定位，列表要是它的定位容器
  line: { position: 'relative', gap: '_md' },
  lineVertical: {
    flexDirection: 'column',
    gap: '_xs',
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
    // 压在列表底边的分隔线上（滚动的列表会裁掉伸出去的部分，所以放在边框内侧）
    bottom: 0,
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
    insetInlineEnd: `calc(-1 * ${t.borderWidths.xs})`,
    width: '_borderWidths.sm',
    height: 0,
  },
});

/** 列表里各标签的 value，按显示的顺序（拖动排序后组件的登记顺序不再是显示顺序） */
const tabOrder = (list: Element | null | undefined) =>
  [...(list?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])].map((tab) => tab.dataset.value!);

/** 标签列表（role="tablist"）：方向键在标签之间移动；横排放不下时有滚动按钮，可以拖动排序、新建 */
export const TabList = _component(
  ({
    loop = true,
    onAdd,
    onReorder,
    showAllMenu = false,
    propsIndicator,
    propsBar,
    propsAdd,
    children,
    ...rest
  }: TabListProps) => {
    const lang = useLang();
    const tabs = TabsContext.inject();
    let list = _state.raw<HTMLElement | null>(null);
    let indicator = _state.raw<HTMLElement | null>(null);
    // 横排放不下时：能不能往前、往后滚（滚动按钮）
    let overflow = _state.raw({ overflowing: false, start: false, end: false });
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

    function measure() {
      batchLayout(() => {
        if (!list || tabs.orientation === 'vertical') return;
        // 从右到左排版时 scrollLeft 是负的：取绝对值就是离起始端多远
        const scrolled = Math.abs(list.scrollLeft);
        const max = list.scrollWidth - list.clientWidth;
        const next = { overflowing: max > 1, start: scrolled > 1, end: scrolled < max - 1 };
        return () => {
          if (Object.entries(next).some(([key, value]) => overflow[key as 'start'] !== value))
            overflow = next;
        };
      });
    }
    useResizeObserver(
      () => (list ? [list, ...list.querySelectorAll<HTMLElement>('[role="tab"]')] : []),
      measure,
    );
    watch(() => tabs.values.length, measure, { flush: 'post' });

    // 切到一个滚到外面的标签（方向键、菜单、程序）：把它滚进来
    watch(
      () => tabs.value,
      (value) => {
        const tab = value === undefined ? null : document.getElementById(tabs.id('tab', value));
        if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
        const outer = list.getBoundingClientRect();
        const inner = tab.getBoundingClientRect();
        if (inner.left < outer.left) list.scrollBy({ left: inner.left - outer.left - 16 });
        else if (inner.right > outer.right) list.scrollBy({ left: inner.right - outer.right + 16 });
      },
      { flush: 'post' },
    );

    /** 滚动按钮：往前（-1）或往后（1）滚大半屏 */
    function scrollBy(direction: 1 | -1) {
      if (!list) return;
      const sign = isRtl(list) ? -direction : direction;
      list.scrollBy({ left: sign * list.clientWidth * 0.8, behavior: 'smooth' });
    }

    /** 把 value 移到 to（按显示的顺序），交给使用方重排；键盘移动时告诉读屏 */
    function moveTab(value: string, to: number, announceMove: boolean) {
      const order = tabOrder(list);
      const from = order.indexOf(value);
      if (!onReorder || from < 0 || to < 0 || to >= order.length || to === from) return;
      const next = order.filter((item) => item !== value);
      next.splice(to, 0, value);
      onReorder(next);
      if (!announceMove) return;
      const label = document.getElementById(tabs.id('tab', value))?.textContent ?? value;
      announce(lang.tabMoved(label, to + 1, order.length));
      // 标签的元素被移动过：焦点放回它上面
      void nextTick(() => document.getElementById(tabs.id('tab', value))?.focus());
    }

    // 拖动排序：越过别的标签的中线就换位（同 Sortable）；触摸时照常横向滚动
    function onPointerdown(event: PointerEvent) {
      const target = event.target as Element;
      const tab = target.closest<HTMLElement>('[role="tab"]');
      if (!onReorder || !tab || !list || event.pointerType === 'touch') return;
      const value = tab.dataset.value!;
      startMove(event, {
        threshold: 4,
        // 标签的元素会被重排：捕获在不动的列表上
        captureTarget: list,
        onMove: ({ clientX }) => {
          tabs.setDragging(value);
          const order = tabOrder(list);
          const from = order.indexOf(value);
          const over = [...list!.querySelectorAll<HTMLElement>('[role="tab"]')].find((item) => {
            const rect = item.getBoundingClientRect();
            return clientX >= rect.left && clientX <= rect.right;
          });
          const to = over ? order.indexOf(over.dataset.value!) : -1;
          if (!over || to === from) return;
          const rect = over.getBoundingClientRect();
          const center = rect.left + rect.width / 2;
          // 按书写方向“越过中线”：往后挪时要过了它的中线，往前挪时要回到中线之前
          const past = isRtl(list!) ? clientX < center : clientX > center;
          if (to > from === past) moveTab(value, to, false);
        },
        onEnd: () => tabs.setDragging(undefined),
      });
    }

    // 键盘替代拖动：在标签上按 Alt + ←→ 往前、往后挪一位（从右到左排版时反过来）
    function onKeydown(event: KeyboardEvent) {
      if (!onReorder || !event.altKey || event.ctrlKey || event.metaKey || !list) return;
      const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');
      const { forward, backward } = inlineArrows(isRtl(list));
      if (!tab || (event.key !== forward && event.key !== backward)) return;
      event.preventDefault();
      const value = tab.dataset.value!;
      const from = tabOrder(list).indexOf(value);
      moveTab(value, from + (event.key === forward ? 1 : -1), true);
    }

    /** “全部标签页”菜单：按显示的顺序（刚加上、还没渲染出来的排在最后）列出标签的文字 */
    function renderAllMenu() {
      const shown = tabOrder(list).filter((value) => tabs.values.includes(value));
      const order = [...shown, ...tabs.values.filter((value) => !shown.includes(value))];
      const items = order.map((value) => ({ value, label: tabs.label(value) }));
      return (
        <Menu
          trigger={(props) => (
            <IconButton
              {...props}
              icon={ChevronDown}
              size="sm"
              variant="ghost"
              aria-label={lang.tabList}
            />
          )}
          placement="bottom-end"
        >
          <MenuRadioGroup
            label={lang.tabList}
            _value={tabs.value ?? ''}
            onUpdate:_value={(next: string) => tabs.select(next)}
          >
            {items.map((item) => (
              <MenuRadioItem key={item.value} value={item.value}>
                {item.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </Menu>
      );
    }

    return () => {
      const vertical = tabs.orientation === 'vertical';
      const tablist = (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                tabListStyles.root,
                !vertical && tabListStyles.scrollable,
                tabs.variant === 'line'
                  ? [tabListStyles.line, vertical && tabListStyles.lineVertical]
                  : [tabListStyles.soft, vertical && tabListStyles.softVertical],
              ],
            },
            rest,
            {
              ref: _toRef(list),
              role: 'tablist',
              'aria-orientation': tabs.orientation,
              onScroll: measure,
              onPointerdown,
              onKeydown,
            },
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
      if (vertical) return tablist;
      // 滚动按钮只给指针用：键盘在标签之间移动时，当前标签会自己滚进来
      const scrollButton = (direction: 1 | -1) =>
        overflow.overflowing && (
          <IconButton
            icon={direction === 1 ? ChevronRight : ChevronLeft}
            propsIcon={{ flipInRtl: true }}
            size="sm"
            variant="ghost"
            tabindex={-1}
            aria-label={direction === 1 ? lang.tabScrollNext : lang.tabScrollPrevious}
            disabled={direction === 1 ? !overflow.end : !overflow.start}
            onClick={() => scrollBy(direction)}
          />
        );
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [tabListStyles.bar, tabs.variant === 'line' && tabListStyles.barLine] },
            propsBar,
          )}
        >
          {scrollButton(-1)}
          {tablist}
          {scrollButton(1)}
          {showAllMenu && renderAllMenu()}
          {onAdd && (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                { icon: Plus, size: 'sm', variant: 'ghost', 'aria-label': lang.tabAdd },
                propsAdd,
                { onClick: onAdd },
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
  /**
   * 可以关闭：标签末尾有关闭按钮，标签上按 Delete、鼠标中键点也关闭。使用方移除这个标签；
   * 关掉的是当前标签时 Tabs 选它后面（没有时前面）的一个，焦点也跟过去
   */
  onClose?: () => void;
  /** 关闭按钮的部件属性 */
  propsClose?: Partial<IconButtonProps>;
  children?: VNodeChild;
}

/** Tabs 的样式：root、hover、line、lineVertical、lineActive、soft 等 */
/**
 * 标签的配方：状态（选中、禁用、拖动中）由 DOM 上的 aria-selected、disabled、data-dragging 决定，
 * 样式、方向、可关闭是档位
 */
export const tabRecipe = css.recipe({
  name: 'Tab',
  parts: ['root', 'closeWrapper', 'close'],
  base: {
    // 去掉按钮默认外观、焦点环、波纹、颜色过渡由 ButtonBase 给出
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '_sm',
      minHeight: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
      paddingInline: '_md',
      color: { default: '_textMuted', _hover: '_text', _selected: '_text' },
      fontWeight: '_medium',
      whiteSpace: 'nowrap',
      borderRadius: '_sm',
      opacity: { default: null, _dragging: 0.6, _disabled: '_disabled' },
    },
    closeWrapper: { display: 'inline-grid', flexShrink: 0 },
    close: { gridArea: '1 / 1', justifySelf: 'end', alignSelf: 'center', marginInlineEnd: '_xs' },
  },
  variants: {
    variant: {
      // 下划线：当前标签的底边（竖排时是结束边）一条 2px 的品牌色线，压在列表的分隔线上；
      // 线由 TabList 的指示条画（切换时滑过去），标签自己只变文字颜色
      line: {
        root: {
          marginBottom: `calc(-1 * ${t.borderWidths.xs})`,
          borderBottomWidth: '_sm',
          borderBottomStyle: 'solid',
          borderBottomColor: 'transparent',
        },
      },
      soft: {
        root: {
          // 未选中时同 ButtonBase 的透明底：条件对象按属性整体覆盖前面的值，default 写 null 会露出原生按钮底色
          backgroundColor: { default: 'transparent', _selected: '_surface' },
          boxShadow: { default: null, _selected: '_xs' },
        },
      },
    },
    orientation: { horizontal: {}, vertical: {} },
    // 可关闭：标签与关闭按钮叠在同一个网格格子里，关闭按钮靠结束端，标签给它留出位置。
    // 不用定位：标签的 offsetParent 还得是列表，下划线指示条按它的 offsetLeft 对齐
    closable: {
      true: { root: { gridArea: '1 / 1', paddingInlineEnd: `calc(${t.space.md} + 1.25em)` } },
    },
  },
  compound: [
    {
      when: { variant: 'line', orientation: 'vertical' },
      root: {
        justifyContent: 'flex-start',
        marginBottom: 0,
        marginInlineEnd: `calc(-1 * ${t.borderWidths.xs})`,
        borderBottomWidth: 0,
        borderInlineEndWidth: '_sm',
        borderInlineEndStyle: 'solid',
        borderInlineEndColor: 'transparent',
      },
    },
  ],
});

/** 标签的部件（createUi / Provider 的 styles.Tab 按它定制） */
export type TabPart = (typeof tabRecipe.parts)[number];

/** 标签（role="tab" 的 button） */
export const Tab = _component(
  ({ value, disabled = false, onClose, propsClose, children, ...rest }: TabProps) => {
    const lang = useLang();
    const tabs = TabsContext.inject();
    const recipe = useRecipe(tabRecipe);
    const unregister = tabs.register(_untrack(value), () => plainText(children) || value);
    onBeforeUnmount(() => {
      const element = document.getElementById(tabs.id('tab', value));
      // 关掉的标签有焦点：等 Tabs 选好旁边的标签再把焦点交过去（元素一移除焦点就丢到 body 上了）
      if (element && element === document.activeElement) tabs.refocus();
      unregister(tabOrder(element?.closest('[role="tablist"]')));
    });

    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'Delete' && onClose && !disabled) {
        event.preventDefault();
        onClose();
      }
    }

    return () => {
      const selected = tabs.value === value;
      const styles = recipe({
        variant: tabs.variant,
        orientation: tabs.orientation,
        closable: !!onClose,
      });
      const tab = (
        <ButtonBase
          {...mergePartProps<ButtonBaseProps>(
            {
              ...styles.root,
              ripple: tabs.ripple,
            },
            rest as Partial<ButtonBaseProps>,
            {
              role: 'tab',
              id: tabs.id('tab', value),
              'aria-selected': selected,
              'aria-controls': tabs.hasPanel(value) ? tabs.id('panel', value) : undefined,
              disabled,
              // 使用方的 onClick / onFocus 先执行（mergeProps 的规则），onClick 里 preventDefault 可以拦下切换
              onClick: () => tabs.select(value),
              onFocus: () => {
                if (tabs.activation === 'automatic') tabs.select(value);
              },
              onKeydown,
              'aria-keyshortcuts': onClose ? 'Delete' : undefined,
              // 鼠标中键关闭（同浏览器的标签页）
              onAuxclick: (event: MouseEvent) => {
                if (event.button === 1 && onClose && !disabled) onClose();
              },
            },
          )}
          data-state={selected ? 'active' : 'inactive'}
          data-value={value}
          data-dragging={tabs.dragging === value || undefined}
        >
          {children}
        </ButtonBase>
      );
      if (!onClose) return tab;
      // 关闭按钮不能放进标签按钮里（按钮里不能有按钮）：一起包在 role="presentation" 里，按钮本身只给指针用（对读屏隐藏）
      return (
        <span role="presentation" {...mergeAttrs<'span'>(styles.closeWrapper)}>
          {tab}
          <IconButton
            {...mergePartProps<IconButtonProps>(
              {
                icon: X,
                size: 'xs',
                variant: 'ghost',
                radius: 'full',
                ...styles.close,
                'aria-label': lang.tabClose(plainText(children) || value),
              },
              propsClose,
              {
                tabindex: -1,
                // 只给指针用：tablist 里只能有标签；键盘、读屏用标签上的 Delete（aria-keyshortcuts）
                'aria-hidden': true,
                disabled,
                // 按下时不把焦点挪到关闭按钮上
                onPointerdown: (event: PointerEvent) => event.preventDefault(),
                onClick: (event: MouseEvent) => {
                  event.stopPropagation();
                  onClose();
                },
              },
            )}
          />
        </span>
      );
    };
  },
);

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
export const tabPanelStyles = css.create({
  root: { flexGrow: 1, minWidth: 0, borderRadius: '_sm' },
});

/** 标签面板（role="tabpanel"）：只显示当前标签的那一个 */
export const TabPanel = _component(({ value, children, ...rest }: TabPanelProps) => {
  const tabs = TabsContext.inject();
  onBeforeUnmount(tabs.registerPanel(_untrack(value)));
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
