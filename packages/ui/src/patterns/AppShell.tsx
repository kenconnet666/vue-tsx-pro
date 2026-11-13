/**
 * 应用外壳：粘性顶栏、左侧栏（导航）、正文、右侧栏（本页目录），文档站与后台的整页骨架。
 *
 *   <AppShell
 *     brand={<AppShellBrand href="/" icon={Boxes}>采购管理平台</AppShellBrand>}
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
 * 品牌格里一般放 AppShellBrand：品牌色的标志与产品名，点了回首页；自己的标志图写在它的 logo 里。
 *
 * 几种布局与区域：
 * - nav：顶栏里品牌后面的导航（NavBar）。只有 nav 时是顶部导航布局，和 sidebar 一起时是混合布局（顶栏一级、侧栏二级）。
 * - footer：正文下面的页脚，内容少时也贴着底部。
 * - sidebarCollapsible：宽屏时品牌格的结束边有“收起侧栏”按钮，收起后只剩图标栏（导航变紧凑、分组悬停弹出），
 *   品牌格变窄、只放展开按钮（不放标志）；父级写 _sidebarCollapsed={x} 记住。没写 brand 时也有这一格放按钮。
 *
 * 全屏：顶栏结束边有全屏按钮（fullscreenable，默认开，手机宽度不显示），进入后不显示顶栏和左侧栏，正文占满窗口，同时请求浏览器全屏；
 * 右上角留一个退出按钮，Esc 也退出。_fullscreen 可以双向绑定。浏览器不让全屏时（如 iframe 没有 allow="fullscreen"）照样隐藏这两块。
 *
 * 自带 SkipLink（跳到正文）；顶栏的高度经 layoutVars.stickyOffset 交给里面的标题，锚点跳转后不被顶栏挡住。
 */
import { Maximize, Menu as MenuIcon, Minimize, PanelLeftClose, PanelLeftOpen } from '@lucide/icons';
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { cloneVNode, isVNode, onBeforeUnmount, useId, watch, type VNodeChild } from 'vue';
import { useMessages } from '../config/lang/messages';
import { patternsMessages } from './messages';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { NavCompactContext } from '../navigation/NavList';
import { SkipLink } from '../navigation/SkipLink';
import { PageScrollbar } from '../layout/PageScrollbar';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { Drawer, type DrawerProps } from '../overlay/Drawer';
import { useMediaQuery } from '../utils/dom/media-query';
import { useEventListener } from '../utils/dom/event-listener';
import { useRouterLink } from '../utils/dom/link';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { breakpoints } from '../config/theme/tokens';
import { focusRingStyles } from '../utils/style/styles';
import { layoutVars } from '../utils/style/vars';
import { useComponent } from '../config/components';
import { partAttrs, type PartLayer } from '../config/styles';

/** 顶栏高度：也是两侧栏粘住的位置、标题跳转时让开的距离 */
const HEADER_HEIGHT = '3rem';
/** 左侧栏的宽度：顶栏的品牌格与它同宽 */
const SIDEBAR_WIDTH = '16rem';
/** 侧栏收起成图标栏时的宽度 */
const RAIL_WIDTH = '3.5rem';
// 运行时判断侧栏是否常驻（useMediaQuery 要的是不带 @media 的查询）
const WIDE_QUERY = breakpoints.lg.replace('@media ', '');

/**
 * 侧栏内容要同时放进左侧栏和抽屉，第二处用这份不带 el 的副本。
 * Vue 克隆挂载过的 VNode 时会保留 el，水合渲染器（createSSRApp）把带 el 的组件当成“已有 DOM、接管即可”：
 * 它会去接管左侧栏里的 DOM，抽屉里什么也挂不上。
 */
function freshCopy(node: VNodeChild): VNodeChild {
  if (Array.isArray(node)) return node.map(freshCopy);
  if (!isVNode(node)) return node;
  const copy = cloneVNode(node);
  copy.el = null;
  if (Array.isArray(copy.children))
    copy.children = copy.children.map(freshCopy) as typeof copy.children;
  return copy;
}

/** AppShell 的档位（createUi / Provider 的 components.AppShell.defaults：全站的外壳开关） */
export interface AppShellOptions {
  /** 侧栏底部有“收起侧栏”按钮：收起后只剩图标栏（导航变紧凑，分组的子项悬停弹出） */
  sidebarCollapsible?: boolean;
  /**
   * 顶栏结束边的全屏按钮：进入后不显示顶栏和左侧栏，右上角留一个退出按钮
   * @default true
   */
  fullscreenable?: boolean;
  /** 页面最前面的“跳到正文”链接，默认 true */
  skipLink?: boolean;
  /** 整页用浮层滚动条（PageScrollbar：不占宽度，滚动时出现），默认 true */
  pageScrollbar?: boolean;
}

/** 未声明的属性落到外层 div 上 */
export interface AppShellProps extends PartProps<'div'>, AppShellOptions {
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
  /** 正文下面的页脚（版权、备案号、版本） */
  footer?: VNodeChild;
  /** 侧栏收起了：父级可以写 _sidebarCollapsed={x} 记住 */
  _sidebarCollapsed?: boolean;
  /** 窄屏时的侧栏抽屉是否打开：父级可以写 _sidebarOpen={x} */
  _sidebarOpen?: boolean;
  /** 全屏中：父级可以写 _fullscreen={x} */
  _fullscreen?: boolean;
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
  /** 左侧栏里的滚动区域的部件属性 */
  propsSidebarScroll?: Partial<ScrollAreaProps>;
  /** 正文（main）的部件属性 */
  propsMain?: PartProps<'main'>;
  /** 顶栏里导航那一格的部件属性 */
  propsNav?: PartProps<'div'>;
  /** 页脚（footer）的部件属性 */
  propsFooter?: PartProps<'footer'>;
  /** “收起侧栏”按钮的部件属性 */
  propsCollapse?: Partial<IconButtonProps>;
  /** 右侧栏（aside）的部件属性 */
  propsAside?: PartProps<'aside'>;
  /** 右侧栏里的滚动区域的部件属性 */
  propsAsideScroll?: Partial<ScrollAreaProps>;
  /** 窄屏时打开侧栏的按钮的部件属性 */
  propsMenuButton?: Partial<IconButtonProps>;
  /** 全屏按钮的部件属性 */
  propsFullscreenButton?: Partial<IconButtonProps>;
  /** 全屏时右上角退出按钮的部件属性 */
  propsFullscreenExit?: Partial<IconButtonProps>;
  /** 窄屏时的侧栏抽屉的部件属性 */
  propsDrawer?: Partial<DrawerProps>;
  /** 正文 */
  children?: VNodeChild;
}

/** AppShell 交给里面的部件的状态：侧栏收起时品牌只剩标志 */
export interface AppShellState {
  /** 侧栏收起成了图标栏（宽屏时） */
  collapsed: () => boolean;
}

/** AppShell 的上下文：AppShellBrand 据此在侧栏收起时只显示标志；不在 AppShell 里时为 null */
export const AppShellContext = createContext<AppShellState | null>('AppShell');

/** 外壳把顶栏高度交给里面的标题与粘性侧栏 */
export const appShellOffset = css.createTheme(layoutVars, { stickyOffset: HEADER_HEIGHT });

/** 全屏时没有顶栏：标题和粘性侧栏贴着窗口顶端 */
export const appShellFullscreenOffset = css.createTheme(layoutVars, { stickyOffset: '0px' });

// 两侧栏：粘在顶栏下面、占满剩下的视口高度，内容多时各自滚动，滚到头不带动页面
const rail = {
  position: 'sticky',
  top: layoutVars.stickyOffset,
  boxSizing: 'border-box',
  height: `calc(100dvh - ${layoutVars.stickyOffset})`,
} as const;

/**
 * AppShell 的配方（createUi / Provider 的 components.AppShell 按它定制）：root、header、menuButton（窄屏打开抽屉）、brand、nav、
 * headerContent、headerMain（header 的内容）、fullscreenButton、fullscreenExit、body（侧栏、正文、右栏的栅格）、sidebar、
 * sidebarScroll、sidebarContent、collapseButton（品牌格里收起、展开侧栏）、column（正文与页脚）、main、footer、aside、asideScroll、
 * asideContent、drawer。有没有侧栏与右栏、收起、全屏按布局变，叠在部件层之后（appShellStateStyles）
 */
export const appShellRecipe = css.recipe({
  name: 'AppShell',
  parts: [
    'root',
    'header',
    'menuButton',
    'brand',
    'nav',
    'headerContent',
    'headerMain',
    'fullscreenButton',
    'fullscreenExit',
    'body',
    'sidebar',
    'sidebarScroll',
    'sidebarContent',
    'collapseButton',
    'column',
    'main',
    'footer',
    'aside',
    'asideScroll',
    'asideContent',
    'drawer',
  ],
  base: {
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
    brand: { display: 'flex', alignItems: 'center', gap: '_sm', flexShrink: 0, minWidth: 0 },
    // 顶栏的导航：占品牌与右边工具之间的位置；有导航时右边的工具按内容宽、靠结束边
    nav: { display: 'flex', alignItems: 'center', alignSelf: 'stretch', flexGrow: 1, minWidth: 0 },
    headerContent: { display: 'flex', alignItems: 'center', gap: '_md', flexGrow: 1, minWidth: 0 },
    // header 的内容占满剩下的宽度，全屏按钮在最后
    headerMain: { display: 'flex', alignItems: 'center', gap: '_md', flexGrow: 1, minWidth: 0 },
    // 手机上不显示：顶栏放不下，iOS Safari 也不支持页面全屏
    fullscreenButton: {
      display: { default: 'none', [breakpoints.md]: 'inline-flex' },
      flexShrink: 0,
    },
    // 全屏时的退出按钮：贴着窗口右上角（从右到左排版时是左上角），不用时淡一点，不抢正文
    fullscreenExit: {
      position: 'fixed',
      top: '_sm',
      insetInlineEnd: '_lg',
      zIndex: 10,
      backgroundColor: '_surfaceTranslucent',
      opacity: { default: 0.6, _hover: 1, _focusVisible: 1 },
    },
    body: { display: 'grid', flexGrow: 1, gridTemplateColumns: 'minmax(0, 1fr)' },
    sidebar: {
      ...rail,
      display: { default: 'none', [breakpoints.lg]: 'block' },
      borderInlineEndWidth: '_xs',
      borderInlineEndStyle: 'solid',
      borderInlineEndColor: '_border',
    },
    // 侧栏里的滚动区域：浮层滚动条；内边距放在内容层上，滚动条贴着侧栏边缘
    sidebarScroll: { height: '_full' },
    sidebarContent: { paddingBlock: '_xl', paddingInline: '_md' },
    // 收起、展开侧栏的按钮：在品牌格的结束边，只在侧栏常驻的宽屏显示（窄屏时侧栏在抽屉里）
    collapseButton: {
      display: { default: 'none', [breakpoints.lg]: 'inline-flex' },
      flexShrink: 0,
      marginInlineStart: 'auto',
    },
    // 正文那一列：正文、页脚上下排，页脚在内容少时也贴着底部
    column: { display: 'flex', flexDirection: 'column', minWidth: 0 },
    // 正文由 SkipLink 聚焦（tabindex=-1）：不显示焦点框
    main: {
      flexGrow: 1,
      minWidth: 0,
      paddingBlock: '_xl',
      paddingInline: '_xl',
      outlineStyle: 'none',
    },
    footer: {
      paddingBlock: '_lg',
      paddingInline: '_xl',
      borderBlockStartWidth: '_xs',
      borderBlockStartStyle: 'solid',
      borderBlockStartColor: '_borderMuted',
      color: '_textMuted',
      fontSize: '_sm',
    },
    aside: { ...rail, display: { default: 'none', [breakpoints.xl]: 'block' } },
    asideScroll: { height: '_full' },
    asideContent: { paddingBlock: '_xl', paddingInline: '_lg' },
  },
});

/** AppShell 的部件（createUi / Provider 的 components.AppShell.styles 按它定制） */
export type AppShellPart = (typeof appShellRecipe.parts)[number];
type AppShellParts = Readonly<Record<AppShellPart, PartLayer>>;

/** 按布局变的样式，追加在部件层之后：有没有品牌格、侧栏、右栏，收起，全屏（测试要用，不进入口） @internal */
export const appShellStateStyles = css.create({
  // 有品牌格与侧栏：宽屏时品牌格贴着起始边；品牌格与内容之间隔开正文的内边距，内容与正文的起始边对齐
  headerWithBrand: {
    paddingInlineStart: { default: null, [breakpoints.lg]: 0 },
    columnGap: { default: null, [breakpoints.lg]: '_xl' },
  },
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
  // 收起后品牌格只有展开按钮：居中
  collapseButtonCentered: { marginInlineEnd: 'auto' },
  // 没写 brand、只放收起按钮的品牌格：窄屏时侧栏在抽屉里，这一格不显示
  brandOnlyWide: { display: { default: 'none', [breakpoints.lg]: 'flex' } },
  // 侧栏收起成图标栏：栅格的第一列、品牌格都变窄，品牌格只放展开按钮
  brandRailCollapsed: {
    width: { default: null, [breakpoints.lg]: RAIL_WIDTH },
    justifyContent: { default: null, [breakpoints.lg]: 'center' },
    paddingInline: { default: null, [breakpoints.lg]: '_xs' },
  },
  headerContentAfterNav: { flexGrow: 0, justifyContent: 'flex-end' },
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
  // 紧凑的侧栏：两边只留一点，图标居中
  sidebarContentCompact: { paddingInline: '_xs' },
  // 侧栏的滚动区域滚到头不带动页面
  railViewport: { overscrollBehavior: 'contain' },
  // 全屏时不显示：留在 DOM 里，退出后侧栏的滚动位置、展开的分组都还在
  hidden: { display: 'none' },
});

/** 应用外壳：粘性顶栏、左侧栏、正文、右侧栏；窄屏时左侧栏收进抽屉 */
export const AppShell = _component(
  ({
    brand,
    header,
    sidebar,
    aside,
    nav,
    footer,
    _sidebarOpen: sidebarOpen = _bindable(false),
    sidebarCollapsible,
    _sidebarCollapsed: sidebarCollapsed = _bindable(false),
    fullscreenable,
    _fullscreen: fullscreen = _bindable(false),
    skipLink,
    pageScrollbar,
    propsHeader,
    propsBrand,
    propsSidebar,
    propsMain,
    propsAside,
    propsMenuButton,
    propsFullscreenButton,
    propsFullscreenExit,
    propsDrawer,
    propsHeaderContent,
    propsBody,
    propsSidebarScroll,
    propsAsideScroll,
    propsNav,
    propsFooter,
    propsCollapse,
    children,
    ...rest
  }: AppShellProps) => {
    const ui = useComponent(
      appShellRecipe,
      () => ({ sidebarCollapsible, fullscreenable, skipLink, pageScrollbar }),
      { sidebarCollapsible: false, fullscreenable: true, skipLink: true, pageScrollbar: true },
    );
    const messages = useMessages('patterns', patternsMessages);
    const mainId = `${useId()}-main`;

    const wide = useMediaQuery(WIDE_QUERY);
    // 侧栏能收起：品牌格里有收起、展开按钮（没写 brand 时也给出品牌格放它）
    const collapsible = () => hasContent(sidebar) && ui().options.sidebarCollapsible;
    const brandCell = () => hasContent(brand) || collapsible();
    // 收起成图标栏只在宽屏（窄屏时侧栏在抽屉里，抽屉总是完整的）
    const collapsed = () => collapsible() && sidebarCollapsed && wide.value;
    // 正文这一排有没有侧栏：全屏时没有
    const showSidebar = () => hasContent(sidebar) && !fullscreen;
    NavCompactContext.provide(collapsed);
    AppShellContext.provide({ collapsed });
    // 变宽后侧栏已经显示出来，抽屉没必要再开着
    watch(wide, (isWide) => {
      if (isWide) sidebarOpen = false;
    });
    // 抽屉里点了链接（通常是换页）：关闭抽屉
    function closeOnNavigate(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest('a[href]')) sidebarOpen = false;
    }

    // 全屏：状态是这里的 fullscreen，浏览器全屏只是顺带的。请求被拒绝时（iframe、不支持）照样隐藏顶栏和侧栏，
    // 所以要记下有没有真的进去：只有进去过，离开浏览器全屏（用户按 Esc）才算退出
    let inBrowserFullscreen = false;
    let root: HTMLElement | null = null;
    watch(
      () => fullscreen,
      (on) => {
        if (on) {
          sidebarOpen = false;
          void document.documentElement.requestFullscreen?.()?.catch(() => undefined);
        } else if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined);
        }
      },
    );
    // 进入、退出后焦点跟到对应的按钮上：原来聚焦的按钮随顶栏隐藏（或被移除），焦点会掉到页面开头。
    // 焦点还在看得见的地方（正文里的控件、用 Esc 退出时）不动
    watch(
      () => fullscreen,
      (on) => {
        const active = document.activeElement;
        const lost =
          !active ||
          active === document.body ||
          (active as HTMLElement).checkVisibility?.() === false;
        if (!lost) return;
        root
          ?.querySelector<HTMLElement>(
            on ? '[data-part="fullscreenExit"]' : '[data-part="fullscreenButton"]',
          )
          ?.focus();
      },
      { flush: 'post' },
    );
    useEventListener(
      () => (typeof document === 'undefined' ? null : document),
      'fullscreenchange',
      () => {
        if (document.fullscreenElement) inBrowserFullscreen = true;
        else if (inBrowserFullscreen) {
          inBrowserFullscreen = false;
          fullscreen = false;
        }
      },
    );
    // 没进浏览器全屏时 Esc 由这里退出；进去了的话浏览器自己处理。浮层先处理了的 Esc 不算
    useEventListener(
      () => (fullscreen ? document : null),
      'keydown',
      (event) => {
        const key = event as KeyboardEvent;
        if (key.key === 'Escape' && !key.defaultPrevented && !document.fullscreenElement)
          fullscreen = false;
      },
    );
    onBeforeUnmount(() => {
      if (inBrowserFullscreen && document.fullscreenElement)
        void document.exitFullscreen().catch(() => undefined);
    });

    /** 正文一排的栅格列：有没有侧栏、右栏，侧栏收起了没有 */
    function bodyColumns() {
      const withAside = hasContent(aside);
      if (!showSidebar()) return withAside && appShellStateStyles.withAside;
      if (withAside)
        return collapsed() ? appShellStateStyles.withBothCollapsed : appShellStateStyles.withBoth;
      return collapsed()
        ? appShellStateStyles.withSidebarCollapsed
        : appShellStateStyles.withSidebar;
    }

    function renderSidebar(s: AppShellParts) {
      return (
        <div
          {...mergeAttrs<'div'>(
            { ...s.sidebar, sx: [s.sidebar.sx, fullscreen && appShellStateStyles.hidden] },
            propsSidebar,
          )}
        >
          <ScrollArea
            {...mergePartProps<ScrollAreaProps>(
              {
                ...s.sidebarScroll,
                propsViewport: { sx: appShellStateStyles.railViewport },
                propsContent: {
                  ...s.sidebarContent,
                  sx: [
                    s.sidebarContent.sx,
                    collapsed() && appShellStateStyles.sidebarContentCompact,
                  ],
                },
              },
              propsSidebarScroll,
            )}
          >
            {sidebar}
          </ScrollArea>
        </div>
      );
    }

    /** 品牌格里收起、展开侧栏的按钮 */
    function renderCollapseButton(s: AppShellParts) {
      return (
        <IconButton
          {...mergePartProps<IconButtonProps>(
            {
              ...s.collapseButton,
              sx: [s.collapseButton.sx, collapsed() && appShellStateStyles.collapseButtonCentered],
              icon: sidebarCollapsed ? PanelLeftOpen : PanelLeftClose,
              size: 'sm',
              variant: 'ghost',
              propsIcon: { flipInRtl: true },
              'aria-label': sidebarCollapsed ? messages.sidebarExpand : messages.sidebarCollapse,
            },
            propsCollapse,
            { onClick: () => (sidebarCollapsed = !sidebarCollapsed) },
          )}
        />
      );
    }

    return () => {
      const { options, parts: s } = ui();
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              ...s.root,
              sx: [s.root.sx, fullscreen ? appShellFullscreenOffset : appShellOffset],
            },
            rest,
            { ref: (element: unknown) => (root = element instanceof HTMLElement ? element : null) },
          )}
        >
          {options.skipLink && <SkipLink href={`#${mainId}`} />}
          {options.pageScrollbar && <PageScrollbar />}
          <header
            {...mergeAttrs<'header'>(
              {
                ...s.header,
                sx: [
                  s.header.sx,
                  brandCell() && hasContent(sidebar) && appShellStateStyles.headerWithBrand,
                  fullscreen && appShellStateStyles.hidden,
                ],
              },
              propsHeader,
            )}
          >
            {hasContent(sidebar) && (
              <IconButton
                {...mergePartProps<IconButtonProps>(
                  { ...s.menuButton, icon: MenuIcon, 'aria-label': messages.navigationOpen },
                  propsMenuButton,
                  { 'aria-expanded': sidebarOpen, onClick: () => (sidebarOpen = true) },
                )}
              />
            )}
            {brandCell() && (
              <div
                {...mergeAttrs<'div'>(
                  {
                    ...s.brand,
                    sx: [
                      s.brand.sx,
                      hasContent(sidebar) && [
                        appShellStateStyles.brandRail,
                        collapsed() && appShellStateStyles.brandRailCollapsed,
                      ],
                      !hasContent(brand) && appShellStateStyles.brandOnlyWide,
                    ],
                  },
                  propsBrand,
                )}
              >
                {!collapsed() && brand}
                {collapsible() && renderCollapseButton(s)}
              </div>
            )}
            {hasContent(nav) && <div {...mergeAttrs<'div'>(s.nav, propsNav)}>{nav}</div>}
            <div
              {...mergeAttrs<'div'>(
                {
                  ...s.headerContent,
                  sx: [
                    s.headerContent.sx,
                    hasContent(nav) && appShellStateStyles.headerContentAfterNav,
                  ],
                },
                propsHeaderContent,
              )}
            >
              <div {...mergeAttrs<'div'>(s.headerMain)}>{header}</div>
              {/* 放在内容格里：和顶栏的工具同一个间距，顶栏自己的列间距是给品牌格对齐用的 */}
              {options.fullscreenable && (
                <IconButton
                  {...mergePartProps<IconButtonProps>(
                    {
                      ...s.fullscreenButton,
                      icon: Maximize,
                      'aria-label': messages.fullscreenEnter,
                      title: messages.fullscreenEnter,
                    },
                    propsFullscreenButton,
                    { onClick: () => (fullscreen = true) },
                  )}
                />
              )}
            </div>
          </header>
          {fullscreen && (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  ...s.fullscreenExit,
                  icon: Minimize,
                  'aria-label': messages.fullscreenExit,
                  title: messages.fullscreenExit,
                },
                propsFullscreenExit,
                { onClick: () => (fullscreen = false) },
              )}
            />
          )}
          <div {...mergeAttrs<'div'>({ ...s.body, sx: [s.body.sx, bodyColumns()] }, propsBody)}>
            {hasContent(sidebar) && renderSidebar(s)}
            <div {...mergeAttrs<'div'>(s.column)}>
              <main {...mergeAttrs<'main'>(s.main, propsMain, { id: mainId, tabindex: -1 })}>
                {children}
              </main>
              {hasContent(footer) && (
                <footer {...mergeAttrs<'footer'>(s.footer, propsFooter)}>{footer}</footer>
              )}
            </div>
            {hasContent(aside) && (
              <aside {...mergeAttrs<'aside'>(s.aside, propsAside)}>
                <ScrollArea
                  {...mergePartProps<ScrollAreaProps>(
                    {
                      ...s.asideScroll,
                      propsViewport: { sx: appShellStateStyles.railViewport },
                      propsContent: s.asideContent,
                    },
                    propsAsideScroll,
                  )}
                >
                  {aside}
                </ScrollArea>
              </aside>
            )}
          </div>
          {hasContent(sidebar) && (
            <Drawer
              {...mergePartProps<DrawerProps>(
                { ...s.drawer, title: messages.navigation, side: 'start' },
                propsDrawer,
                { onClick: closeOnNavigate },
              )}
              _open={sidebarOpen}
            >
              {freshCopy(sidebar)}
            </Drawer>
          )}
        </div>
      );
    };
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
const appShellBrandStyles = css.create({
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
    return () => (
      <a
        {...mergeAttrs<'a'>(
          {
            sx: [appShellBrandStyles.root, focusRingStyles.visible],
            ...partAttrs({ name: 'AppShellBrand' }, 'root'),
          },
          rest,
          {
            href: router.href(href),
            onClick: (event: MouseEvent) => router.onClick(event, href),
          },
        )}
      >
        {logo ??
          (icon && (
            <Icon
              {...mergePartProps<IconProps>({ icon, sx: appShellBrandStyles.mark }, propsIcon)}
            />
          ))}
        {children}
      </a>
    );
  },
);
