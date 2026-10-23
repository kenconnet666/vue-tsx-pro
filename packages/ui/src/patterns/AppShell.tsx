/**
 * 应用外壳：粘性顶栏、左侧栏（导航）、正文、右侧栏（本页目录），文档站与后台的整页骨架。
 *
 *   <AppShell
 *     brand={<AppShellBrand href="/" icon={Plane}>联合降本管理</AppShellBrand>}
 *     header={<><CommandPalette … /><ThemeSwitcher preference={preference} /></>}
 *     sidebar={<NavList aria-label="文档">…</NavList>}
 *     aside={<TableOfContents items={headings} />}
 *   >
 *     <Prose>…</Prose>
 *   </AppShell>
 *
 * 响应式（宽度按容器档位 sizes.lg / sizes.xl）：
 * - 64rem 以上显示左侧栏；更窄时收进从起始边滑出的 Drawer，顶栏最前面出现打开它的按钮。
 *   抽屉里点了链接（换页）、或窗口变宽时自动关闭。
 * - 80rem 以上显示右侧栏；更窄时不显示（目录这类辅助内容）。
 * 两侧栏粘在顶栏下面，内容多时各自滚动（ScrollArea）。顶栏半透明，滚动的正文从下面透出（backdrop-filter）。
 * 整页与两侧栏都是浮层滚动条（PageScrollbar、ScrollArea）：不占宽度，滚动时出现。
 *
 * 写了 brand 时，侧栏常驻的宽度下品牌这一格与侧栏同宽，侧栏的竖线一直延伸到顶栏顶端，
 * header 的内容从竖线之后开始、与正文的起始边对齐（本页的页签放在这里）。
 *
 * sidebarMode="overlay"：侧栏改为盖在页面上面的抽屉，开不开都不占正文的位置（正文总是整宽，布局不随侧栏变化）。
 * “菜单”按钮固定在顶栏品牌格的结束边，开关都是它（aria-expanded）；抽屉从顶栏下面弹出、盖在正文上。
 * 抽屉结束边可以拖动调整宽度（ResizeHandle，也能聚焦后用 ← / →，双击回到初始宽度），父级写 sidebarWidth={_bind(x)} 记住；
 * 顶栏的品牌格按初始宽度，拖动时不变。焦点在抽屉里时按 Esc 收起、焦点回到“菜单”；窄屏时点了链接也收起。
 * 拖到比 160px 窄时侧栏变紧凑：里面的 NavList 只显示图标（名称在提示里），小节标题只剩图标（NavCompactContext）。
 *
 * 品牌格里一般放 AppShellBrand：品牌色的标志与产品名，点了回首页；自己的标志图写在它的 logo 里。
 *
 * 几种布局与区域：
 * - nav：顶栏里品牌后面的导航（NavBar）。只有 nav 时是顶部导航布局，和 sidebar 一起时是混合布局（顶栏一级、侧栏二级）。
 * - tabs：正文上面的页签区（PageTabs，和路由同步用 useRouteTabs）；footer：正文下面的页脚，内容少时也贴着底部。
 * - sidebarCollapsible：docked 侧栏底部有“收起侧栏”，收起后只剩图标栏（宽屏时；导航变紧凑、分组悬停弹出，
 *   品牌格只剩标志），父级写 sidebarCollapsed={_bind(x)} 记住。
 *
 * 自带 SkipLink（跳到正文）；顶栏的高度经 layoutVars.stickyOffset 交给里面的标题，锚点跳转后不被顶栏挡住。
 */
import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen } from '@lucide/icons';
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { useMessages } from '../config/lang/messages';
import { patternsMessages } from './messages';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { NavCompactContext } from '../navigation/NavList';
import { SkipLink } from '../navigation/SkipLink';
import { PageScrollbar } from '../layout/PageScrollbar';
import { ResizeHandle, type ResizeHandleProps } from '../layout/ResizeHandle';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { Drawer, type DrawerProps } from '../overlay/Drawer';
import { useMediaQuery } from '../utils/dom/media-query';
import { toElement } from '../utils/dom/element';
import { useRouterLink } from '../utils/dom/link';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { breakpoints } from '../config/theme/tokens.stylex';
import { focusRingStyles } from '../utils/style/styles';
import { layoutVars } from '../utils/style/vars.stylex';
import { t } from '../config/theme/tokens';

/** 顶栏高度：也是两侧栏粘住的位置、标题跳转时让开的距离 */
const HEADER_HEIGHT = '3rem';
/** 左侧栏的宽度：顶栏的品牌格与它同宽 */
const SIDEBAR_WIDTH = '16rem';
/** 侧栏收起成图标栏时的宽度 */
const RAIL_WIDTH = '3.5rem';
/** 抽屉式侧栏的默认宽度与可以拖动的范围（px） */
const OVERLAY_WIDTH = 256;
// 最窄可以收到只剩滚动条那么宽
const OVERLAY_MIN_WIDTH = 16;
const OVERLAY_MAX_WIDTH = 480;
// 比它窄时侧栏只放得下图标：导航变紧凑
const OVERLAY_COMPACT_WIDTH = 160;
// 运行时判断侧栏是否常驻（useMediaQuery 要的是不带 @media 的查询）
const WIDE_QUERY = breakpoints.lg.replace('@media ', '');

/** 左侧栏的形式 */
export interface AppShellSidebarModes {
  /** 宽屏时占一列、窄屏时收进抽屉（默认） */
  docked: unknown;
  /** 各宽度都是盖在页面上面的抽屉，不占正文的位置，可以收起、拖动宽度 */
  overlay: unknown;
}

/** 未声明的属性落到外层 div 上 */
export interface AppShellProps extends PartProps<'div'> {
  /** 顶栏起始边的品牌（标志与产品名）：有侧栏时这一格与侧栏同宽，侧栏的竖线延伸到顶 */
  brand?: VNodeChild;
  /** 顶栏的内容：搜索、本页的页签、主题切换…（没写 brand 时标志也放这里） */
  header?: VNodeChild;
  /** 左侧栏：站点导航；窄屏时收进抽屉 */
  sidebar?: VNodeChild;
  /** 右侧栏：本页目录等辅助内容；较窄时不显示 */
  aside?: VNodeChild;
  /** 顶栏里品牌后面的导航（NavBar）：只有它时是顶部导航布局，和 sidebar 一起时是混合布局（顶栏一级、侧栏二级） */
  nav?: VNodeChild;
  /** 正文上面的页签区（PageTabs：打开过的页面） */
  tabs?: VNodeChild;
  /** 正文下面的页脚（版权、备案号、版本） */
  footer?: VNodeChild;
  /** docked 侧栏底部有“收起侧栏”按钮：收起后只剩图标栏（导航变紧凑，分组的子项悬停弹出） */
  sidebarCollapsible?: boolean;
  /** docked 侧栏收起了：父级可以写 sidebarCollapsed={_bind(x)} 记住 */
  sidebarCollapsed?: boolean;
  /** 左侧栏的形式，默认 docked */
  sidebarMode?: keyof AppShellSidebarModes;
  /** 侧栏抽屉是否打开（docked 时只在窄屏有抽屉）：父级可以写 sidebarOpen={_bind(x)} */
  sidebarOpen?: boolean;
  /**
   * overlay 抽屉的宽度（px），默认 256，范围 16–480（窄到几乎只剩滚动条；比 160 窄时导航只显示图标）：
   * 父级写 sidebarWidth={_bind(x)} 记住拖动后的宽度
   */
  sidebarWidth?: number;
  /** 页面最前面的“跳到正文”链接，默认 true */
  skipLink?: boolean;
  /** 整页用浮层滚动条（PageScrollbar：不占宽度，滚动时出现），默认 true */
  pageScrollbar?: boolean;
  /** 顶栏（header）的部件属性 */
  propsHeader?: PartProps<'header'>;
  /** 品牌格（div）的部件属性 */
  propsBrand?: PartProps<'div'>;
  /** 顶栏里 header 内容那一格（div）的部件属性 */
  propsHeaderContent?: PartProps<'div'>;
  /** 顶栏下面的主体（侧栏、正文、右栏的栅格）的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 左侧栏（div）的部件属性 */
  propsSidebar?: PartProps<'div'>;
  /** 左侧栏里的滚动区域的部件属性（docked 的侧栏与 overlay 的抽屉共用） */
  propsSidebarScroll?: Partial<ScrollAreaProps>;
  /** 正文（main）的部件属性 */
  propsMain?: PartProps<'main'>;
  /** 顶栏里导航那一格的部件属性 */
  propsNav?: PartProps<'div'>;
  /** 页签区的部件属性 */
  propsTabs?: PartProps<'div'>;
  /** 页脚（footer）的部件属性 */
  propsFooter?: PartProps<'footer'>;
  /** “收起侧栏”按钮的部件属性 */
  propsCollapse?: Partial<IconButtonProps>;
  /** 右侧栏（aside）的部件属性 */
  propsAside?: PartProps<'aside'>;
  /** 右侧栏里的滚动区域的部件属性 */
  propsAsideScroll?: Partial<ScrollAreaProps>;
  /** docked 时窄屏打开侧栏的按钮的部件属性 */
  propsMenuButton?: Partial<IconButtonProps>;
  /** overlay 时品牌格里开关抽屉的“菜单”按钮的部件属性 */
  propsSidebarToggle?: Partial<ButtonProps>;
  /** overlay 抽屉宽度调整手柄的部件属性 */
  propsResizeHandle?: Partial<ResizeHandleProps>;
  /** 窄屏时的侧栏抽屉的部件属性 */
  propsDrawer?: Partial<DrawerProps>;
  /** 正文 */
  children?: VNodeChild;
}

/** AppShell 交给里面的部件的状态：侧栏收起时品牌只剩标志 */
export interface AppShellState {
  /** docked 侧栏收起成了图标栏（宽屏时） */
  collapsed: () => boolean;
}

/** AppShell 的上下文：AppShellBrand 据此在侧栏收起时只显示标志；不在 AppShell 里时为 null */
export const AppShellContext = createContext<AppShellState | null>('AppShell');

// StyleX 要求 createTheme 的结果赋给变量；导出是为了防止组件库构建时被内联（见 config/theme/dark.ts）。
// 主题不是样式，类型上不在 StyleXStyles 里；StyleX 把它当作一个 class 合并
/** 外壳把顶栏高度交给里面的标题与粘性侧栏 */
export const appShellOffset = stylex.createTheme(layoutVars, { stickyOffset: HEADER_HEIGHT });

/** AppShell 的样式：root、header、menuButton、body、sidebar、main、aside 等 */
export const appShellStyles = stylex.create({
  // 整页的界面基准文字（同 Provider）：没有 Provider 时页面是浏览器默认的 16px，与组件的 md 档位对不上
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    color: '_text',
    fontSize: '_md',
    lineHeight: '_normal',
  },
  header: {
    position: 'sticky',
    top: 0,
    // 盖住滚动的正文与粘性侧栏；低于浮层（顶层渲染）与 SkipLink
    zIndex: 10,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '_md',
    height: HEADER_HEIGHT,
    flexShrink: 0,
    paddingInline: '_lg',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
    backgroundColor: '_surfaceTranslucent',
    backdropFilter: 'blur(12px) saturate(1.5)',
  },
  menuButton: { display: { default: 'inline-flex', [breakpoints.lg]: 'none' }, flexShrink: 0 },
  // 有品牌格与侧栏：宽屏时品牌格贴着起始边；品牌格与内容之间隔开正文的内边距，内容与正文的起始边对齐
  headerWithBrand: {
    paddingInlineStart: { default: null, [breakpoints.lg]: 0 },
    columnGap: { default: null, [breakpoints.lg]: '_xl' },
  },
  brand: { display: 'flex', alignItems: 'center', gap: '_sm', flexShrink: 0, minWidth: 0 },
  // 宽屏时与侧栏同宽，结束边的竖线与侧栏的竖线接上
  brandRail: {
    alignSelf: { default: null, [breakpoints.lg]: 'stretch' },
    boxSizing: 'border-box',
    width: { default: null, [breakpoints.lg]: SIDEBAR_WIDTH },
    paddingInline: { default: null, [breakpoints.lg]: '_lg' },
    borderInlineEndWidth: { default: null, [breakpoints.lg]: '_xs' },
    borderInlineEndStyle: { default: null, [breakpoints.lg]: 'solid' },
    borderInlineEndColor: { default: null, [breakpoints.lg]: '_border' },
  },
  headerContent: { display: 'flex', alignItems: 'center', gap: '_md', flexGrow: 1, minWidth: 0 },
  body: { display: 'grid', flexGrow: 1, gridTemplateColumns: 'minmax(0, 1fr)' },
  withSidebar: {
    gridTemplateColumns: { default: null, [breakpoints.lg]: `${SIDEBAR_WIDTH} minmax(0, 1fr)` },
  },
  withAside: { gridTemplateColumns: { default: null, [breakpoints.xl]: 'minmax(0, 1fr) 14rem' } },
  // 一个属性上两个断点：窄的一档用 lgOnly，不和 xl 重叠（见 breakpoints 的说明）
  withBoth: {
    gridTemplateColumns: {
      default: null,
      [breakpoints.lgOnly]: `${SIDEBAR_WIDTH} minmax(0, 1fr)`,
      [breakpoints.xl]: `${SIDEBAR_WIDTH} minmax(0, 1fr) 14rem`,
    },
  },
  // 两侧栏：粘在顶栏下面、占满剩下的视口高度，内容多时各自滚动，滚到头不带动页面
  rail: {
    position: 'sticky',
    top: layoutVars.stickyOffset,
    boxSizing: 'border-box',
    height: `calc(100dvh - ${layoutVars.stickyOffset})`,
  },
  // 侧栏里的滚动区域：浮层滚动条，滚到头不带动页面；内边距放在内容层上，滚动条贴着侧栏边缘
  railScroll: { height: '_full' },
  railViewport: { overscrollBehavior: 'contain' },
  sidebar: {
    display: { default: 'none', [breakpoints.lg]: 'block' },
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_border',
  },
  sidebarContent: { paddingBlock: '_xl', paddingInline: '_md' },
  // 紧凑的侧栏：两边只留一点，图标居中
  sidebarContentCompact: { paddingInline: '_xs' },
  aside: { display: { default: 'none', [breakpoints.xl]: 'block' } },
  asideContent: { paddingBlock: '_xl', paddingInline: '_lg' },
  // 正文由 SkipLink 聚焦（tabindex=-1）：不显示焦点框
  main: { minWidth: 0, paddingBlock: '_xl', paddingInline: '_xl', outlineStyle: 'none' },
  // overlay：从顶栏下面弹出、盖在正文上（低于顶栏与顶层渲染的浮层）；从起始边滑入，收起后不显示（inert，不能聚焦）。
  // 打开时 translate 是 none：否则抽屉会成为里面 fixed 元素的包含块（同 Drawer）
  overlay: {
    position: 'fixed',
    top: HEADER_HEIGHT,
    bottom: 0,
    insetInlineStart: 0,
    zIndex: 9,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 'calc(100vw - 3rem)',
    // 拖得很窄时内容裁在抽屉里，不溢出到正文上
    overflow: 'hidden',
    backgroundColor: '_surface',
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_border',
    boxShadow: '_lg',
    // 收起：滑出去之后再隐藏（visibility 延迟到滑完）
    visibility: 'hidden',
    translate: { default: '-100% 0', ':dir(rtl)': '100% 0' },
    transition: `translate ${t.durations.md} ${t.easings.exit}, visibility 0s linear ${t.durations.md}`,
  },
  // 打开：立刻可见，再滑进来
  overlayOpen: {
    visibility: 'visible',
    translate: 'none',
    transition: `translate ${t.durations.lg} ${t.easings.enter}, visibility 0s`,
  },
  overlayScroll: { flexGrow: 1, minHeight: 0 },
  // overlay 时顶栏的品牌格：宽屏时按抽屉的初始宽度，“菜单”在它的结束边
  brandOverlay: {
    alignSelf: { default: null, [breakpoints.lg]: 'stretch' },
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    paddingInlineStart: { default: null, [breakpoints.lg]: '_lg' },
    paddingInlineEnd: { default: null, [breakpoints.lg]: '_sm' },
    borderInlineEndWidth: { default: null, [breakpoints.lg]: '_xs' },
    borderInlineEndStyle: { default: null, [breakpoints.lg]: 'solid' },
    borderInlineEndColor: { default: null, [breakpoints.lg]: '_border' },
  },
  toggle: { flexShrink: 0 },
  // 侧栏收起成图标栏：栅格的第一列、品牌格都变窄，品牌只剩标志
  withSidebarCollapsed: {
    gridTemplateColumns: { default: null, [breakpoints.lg]: `${RAIL_WIDTH} minmax(0, 1fr)` },
  },
  withBothCollapsed: {
    gridTemplateColumns: {
      default: null,
      [breakpoints.lgOnly]: `${RAIL_WIDTH} minmax(0, 1fr)`,
      [breakpoints.xl]: `${RAIL_WIDTH} minmax(0, 1fr) 14rem`,
    },
  },
  brandRailCollapsed: {
    width: { default: null, [breakpoints.lg]: RAIL_WIDTH },
    justifyContent: { default: null, [breakpoints.lg]: 'center' },
    paddingInline: { default: null, [breakpoints.lg]: '_xs' },
  },
  // 有收起按钮的侧栏：滚动区域占满剩下的高度，按钮在最下面
  sidebarColumn: {
    display: { default: 'none', [breakpoints.lg]: 'flex' },
    flexDirection: 'column',
  },
  sidebarScroll: { flexGrow: 1, minHeight: 0, height: 'auto' },
  collapseBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
    padding: '_sm',
    borderBlockStartWidth: '_xs',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_borderMuted',
  },
  collapseBarCollapsed: { justifyContent: 'center' },
  // 顶栏的导航：占品牌与右边工具之间的位置；有导航时右边的工具按内容宽、靠结束边
  nav: { display: 'flex', alignItems: 'center', alignSelf: 'stretch', flexGrow: 1, minWidth: 0 },
  headerContentAfterNav: { flexGrow: 0, justifyContent: 'flex-end' },
  // 正文那一列：页签区、正文、页脚上下排，页脚在内容少时也贴着底部
  column: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  mainGrow: { flexGrow: 1 },
  tabs: { paddingBlockStart: '_sm', paddingInline: '_xl' },
  footer: {
    paddingBlock: '_lg',
    paddingInline: '_xl',
    borderBlockStartWidth: '_xs',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_borderMuted',
    color: '_textMuted',
    fontSize: '_sm',
  },
});

/** AppShell 的动态样式：抽屉的宽度、宽屏时品牌格的宽度（px） */
export const appShellDynamicStyles = stylex.create({
  width: (px: number) => ({ width: px }),
  brandWidth: (px: number) => ({ width: { default: null, [breakpoints.lg]: px } }),
});

/** 应用外壳：粘性顶栏、左侧栏、正文、右侧栏；窄屏时左侧栏收进抽屉 */
export const AppShell = _component(
  ({
    brand,
    header,
    sidebar,
    aside,
    nav,
    tabs,
    footer,
    sidebarMode = 'docked',
    sidebarOpen = _bindable(false),
    sidebarWidth = _bindable(OVERLAY_WIDTH),
    sidebarCollapsible = false,
    sidebarCollapsed = _bindable(false),
    skipLink = true,
    pageScrollbar = true,
    propsHeader,
    propsBrand,
    propsSidebar,
    propsMain,
    propsAside,
    propsMenuButton,
    propsSidebarToggle,
    propsResizeHandle,
    propsDrawer,
    propsHeaderContent,
    propsBody,
    propsSidebarScroll,
    propsAsideScroll,
    propsNav,
    propsTabs,
    propsFooter,
    propsCollapse,
    children,
    ...rest
  }: AppShellProps) => {
    const messages = useMessages('patterns', patternsMessages);
    const id = useId();
    const mainId = `${id}-main`;
    const sidebarId = `${id}-sidebar`;
    const overlay = () => sidebarMode === 'overlay';
    const docked = () => hasContent(sidebar) && !overlay();
    const wide = useMediaQuery(WIDE_QUERY);
    // docked 的侧栏收起成图标栏：只在宽屏（窄屏时侧栏在抽屉里，抽屉总是完整的）
    const collapsed = () => docked() && sidebarCollapsible && sidebarCollapsed && wide.value;
    const compact = () => (overlay() && sidebarWidth < OVERLAY_COMPACT_WIDTH) || collapsed();
    NavCompactContext.provide(compact);
    AppShellContext.provide({ collapsed });
    // docked：变宽后侧栏已经显示出来，抽屉没必要再开着
    watch(wide, (isWide) => {
      if (isWide && !overlay()) sidebarOpen = false;
    });
    // 抽屉里点了链接（通常是换页）：关闭抽屉；overlay 在宽屏时不关（挡不住正文的主要部分，常要连着换几页）
    function closeOnNavigate(event: MouseEvent) {
      if (overlay() && wide.value) return;
      if (event.target instanceof Element && event.target.closest('a[href]')) sidebarOpen = false;
    }

    // overlay：品牌格按初始宽度，拖动抽屉时不变；双击手柄回到它
    // 记住的宽度是拖窄后的紧凑宽度时，品牌格与双击回到的宽度按默认宽度（品牌格太窄会和顶栏的内容叠在一起）
    const remembered = _untrack(sidebarWidth);
    const initialWidth = remembered < OVERLAY_COMPACT_WIDTH ? OVERLAY_WIDTH : remembered;
    // Esc 收起：焦点在抽屉里，收起后它不能聚焦了，回到“菜单”
    let toggleButton = _state.raw<HTMLElement | null>(null);
    function onOverlayKeydown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      sidebarOpen = false;
      toggleButton?.focus();
    }

    /** overlay 的“菜单”：开关抽屉，图标随开关切换 */
    const sidebarToggle = () => (
      <Button
        {...mergePartProps<ButtonProps>(
          {
            variant: 'ghost',
            tone: 'neutral',
            size: 'sm',
            icon: sidebarOpen ? PanelLeftClose : PanelLeftOpen,
            sx: appShellStyles.toggle,
          },
          propsSidebarToggle,
          {
            ref: (element: unknown) => (toggleButton = toElement(element)),
            'aria-expanded': sidebarOpen,
            'aria-controls': sidebarId,
            onClick: () => (sidebarOpen = !sidebarOpen),
          },
        )}
      >
        {messages.navigationMenu}
      </Button>
    );

    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [appShellStyles.root, appShellOffset as unknown as StyleXStyles] },
          rest,
        )}
      >
        {skipLink && <SkipLink href={`#${mainId}`} />}
        {pageScrollbar && <PageScrollbar />}
        <header
          {...mergeAttrs<'header'>(
            {
              sx: [
                appShellStyles.header,
                hasContent(brand) && hasContent(sidebar) && appShellStyles.headerWithBrand,
              ],
            },
            propsHeader,
          )}
        >
          {hasContent(sidebar) && !overlay() && (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  sx: appShellStyles.menuButton,
                  icon: MenuIcon,
                  'aria-label': messages.navigationOpen,
                },
                propsMenuButton,
                { 'aria-expanded': sidebarOpen, onClick: () => (sidebarOpen = true) },
              )}
            />
          )}
          {hasContent(brand) && (
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    appShellStyles.brand,
                    hasContent(sidebar) &&
                      (overlay()
                        ? [
                            appShellStyles.brandOverlay,
                            appShellDynamicStyles.brandWidth(initialWidth),
                          ]
                        : [
                            appShellStyles.brandRail,
                            collapsed() && appShellStyles.brandRailCollapsed,
                          ]),
                  ],
                },
                propsBrand,
              )}
            >
              {brand}
              {hasContent(sidebar) && overlay() && sidebarToggle()}
            </div>
          )}
          {!hasContent(brand) && hasContent(sidebar) && overlay() && sidebarToggle()}
          {hasContent(nav) && (
            <div {...mergeAttrs<'div'>({ sx: appShellStyles.nav }, propsNav)}>{nav}</div>
          )}
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  appShellStyles.headerContent,
                  hasContent(nav) && appShellStyles.headerContentAfterNav,
                ],
              },
              propsHeaderContent,
            )}
          >
            {header}
          </div>
        </header>
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                appShellStyles.body,
                docked() && hasContent(aside)
                  ? collapsed()
                    ? appShellStyles.withBothCollapsed
                    : appShellStyles.withBoth
                  : docked()
                    ? collapsed()
                      ? appShellStyles.withSidebarCollapsed
                      : appShellStyles.withSidebar
                    : hasContent(aside) && appShellStyles.withAside,
              ],
            },
            propsBody,
          )}
        >
          {docked() && (
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    appShellStyles.rail,
                    appShellStyles.sidebar,
                    sidebarCollapsible && appShellStyles.sidebarColumn,
                  ],
                },
                propsSidebar,
              )}
            >
              <ScrollArea
                {...mergePartProps<ScrollAreaProps>(
                  {
                    sx: [
                      appShellStyles.railScroll,
                      sidebarCollapsible && appShellStyles.sidebarScroll,
                    ],
                    propsViewport: { sx: appShellStyles.railViewport },
                    propsContent: {
                      sx: [
                        appShellStyles.sidebarContent,
                        collapsed() && appShellStyles.sidebarContentCompact,
                      ],
                    },
                  },
                  propsSidebarScroll,
                )}
              >
                {sidebar}
              </ScrollArea>
              {sidebarCollapsible && (
                <div
                  {...stylex.attrs(
                    appShellStyles.collapseBar,
                    collapsed() && appShellStyles.collapseBarCollapsed,
                  )}
                >
                  <IconButton
                    {...mergePartProps<IconButtonProps>(
                      {
                        icon: sidebarCollapsed ? PanelLeftOpen : PanelLeftClose,
                        size: 'sm',
                        variant: 'ghost',
                        propsIcon: { flipInRtl: true },
                        'aria-label': sidebarCollapsed
                          ? messages.sidebarExpand
                          : messages.sidebarCollapse,
                      },
                      propsCollapse,
                      { onClick: () => (sidebarCollapsed = !sidebarCollapsed) },
                    )}
                  />
                </div>
              )}
            </div>
          )}
          <div {...stylex.attrs(appShellStyles.column)}>
            {hasContent(tabs) && (
              <div {...mergeAttrs<'div'>({ sx: appShellStyles.tabs }, propsTabs)}>{tabs}</div>
            )}
            <main
              {...mergeAttrs<'main'>(
                { sx: [appShellStyles.main, appShellStyles.mainGrow] },
                propsMain,
                {
                  id: mainId,
                  tabindex: -1,
                },
              )}
            >
              {children}
            </main>
            {hasContent(footer) && (
              <footer {...mergeAttrs<'footer'>({ sx: appShellStyles.footer }, propsFooter)}>
                {footer}
              </footer>
            )}
          </div>
          {hasContent(aside) && (
            <aside
              {...mergeAttrs<'aside'>(
                { sx: [appShellStyles.rail, appShellStyles.aside] },
                propsAside,
              )}
            >
              <ScrollArea
                {...mergePartProps<ScrollAreaProps>(
                  {
                    sx: appShellStyles.railScroll,
                    propsViewport: { sx: appShellStyles.railViewport },
                    propsContent: { sx: appShellStyles.asideContent },
                  },
                  propsAsideScroll,
                )}
              >
                {aside}
              </ScrollArea>
            </aside>
          )}
        </div>
        {hasContent(sidebar) && overlay() && (
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  appShellStyles.overlay,
                  sidebarOpen && appShellStyles.overlayOpen,
                  appShellDynamicStyles.width(sidebarWidth),
                ],
              },
              propsSidebar,
              {
                id: sidebarId,
                inert: !sidebarOpen,
                onKeydown: onOverlayKeydown,
                onClick: closeOnNavigate,
              },
            )}
          >
            <ScrollArea
              {...mergePartProps<ScrollAreaProps>(
                {
                  sx: appShellStyles.overlayScroll,
                  propsViewport: { sx: appShellStyles.railViewport },
                  propsContent: {
                    sx: [
                      appShellStyles.sidebarContent,
                      compact() && appShellStyles.sidebarContentCompact,
                    ],
                  },
                },
                propsSidebarScroll,
              )}
            >
              {sidebar}
            </ScrollArea>
            <ResizeHandle
              aria-label={messages.navigationResize}
              {...propsResizeHandle}
              width={sidebarWidth}
              minWidth={OVERLAY_MIN_WIDTH}
              maxWidth={OVERLAY_MAX_WIDTH}
              defaultWidth={initialWidth}
              onWidthChange={(px: number) => (sidebarWidth = px)}
            />
          </div>
        )}
        {docked() && (
          <Drawer
            {...mergePartProps<DrawerProps>(
              { title: messages.navigation, side: 'start' },
              propsDrawer,
              {
                onClick: closeOnNavigate,
              },
            )}
            open={_bind(sidebarOpen)}
          >
            {sidebar}
          </Drawer>
        )}
      </div>
    );
  },
);

/** 未声明的属性落到链接（a）上 */
export interface AppShellBrandProps extends PartProps<'a', 'href'> {
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

/** AppShellBrand 的样式：root、mark */
export const appShellBrandStyles = stylex.create({
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

/**
 * 外壳顶栏的品牌：品牌色的标志（装饰，对读屏隐藏）与产品名，名字就是链接的名称，点了回首页（走路由适配）。
 * 放在 AppShell 的 brand 里
 */
export const AppShellBrand = _component(
  ({ href, icon, logo, propsIcon, children, ...rest }: AppShellBrandProps) => {
    const router = useRouterLink();
    const shell = AppShellContext.inject(null);
    return () => (
      <a
        {...mergeAttrs<'a'>({ sx: [appShellBrandStyles.root, focusRingStyles.visible] }, rest, {
          href: router.href(href),
          onClick: (event: MouseEvent) => router.onClick(event, href),
        })}
      >
        {logo ??
          (icon && (
            <Icon
              {...mergePartProps<IconProps>({ icon, sx: appShellBrandStyles.mark }, propsIcon)}
            />
          ))}
        {/* 侧栏收起成图标栏时品牌格只放得下标志：产品名留给读屏（仍是链接的名称） */}
        <span {...stylex.attrs(shell?.collapsed() && visuallyHiddenStyles.hidden)}>{children}</span>
      </a>
    );
  },
);
