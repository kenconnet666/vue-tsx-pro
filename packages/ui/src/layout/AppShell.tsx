/**
 * 应用外壳：粘性顶栏、左侧栏（导航）、正文、右侧栏（本页目录），文档站与后台的整页骨架。
 *
 *   <AppShell
 *     brand={<Logo />}
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
 * 自带 SkipLink（跳到正文）；顶栏的高度经 layoutVars.stickyOffset 交给里面的标题，锚点跳转后不被顶栏挡住。
 */
import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { NavCompactContext } from '../navigation/NavList';
import { SkipLink } from '../navigation/SkipLink';
import { PageScrollbar } from './PageScrollbar';
import { ResizeHandle, type ResizeHandleProps } from './ResizeHandle';
import { ScrollArea, type ScrollAreaProps } from './ScrollArea';
import { Drawer, type DrawerProps } from '../overlay/Drawer';
import { useMediaQuery } from '../utils/dom/media-query';
import { toElement } from '../utils/dom/element';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { breakpoints } from '../config/theme/tokens.stylex';
import { layoutVars } from '../utils/style/vars.stylex';

/** 顶栏高度：也是两侧栏粘住的位置、标题跳转时让开的距离 */
const HEADER_HEIGHT = '3rem';
/** 左侧栏的宽度：顶栏的品牌格与它同宽 */
const SIDEBAR_WIDTH = '16rem';
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
    transition: 'translate _durations.md _easings.exit, visibility 0s linear _durations.md',
  },
  // 打开：立刻可见，再滑进来
  overlayOpen: {
    visibility: 'visible',
    translate: 'none',
    transition: 'translate _durations.lg _easings.enter, visibility 0s',
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
    sidebarMode = 'docked',
    sidebarOpen = _bindable(false),
    sidebarWidth = _bindable(OVERLAY_WIDTH),
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
    children,
    ...rest
  }: AppShellProps) => {
    const lang = useLang();
    const id = useId();
    const mainId = `${id}-main`;
    const sidebarId = `${id}-sidebar`;
    const overlay = () => sidebarMode === 'overlay';
    const docked = () => hasContent(sidebar) && !overlay();
    const compact = () => overlay() && sidebarWidth < OVERLAY_COMPACT_WIDTH;
    NavCompactContext.provide(compact);
    const wide = useMediaQuery(WIDE_QUERY);
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
        {lang.navigationMenu}
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
                  'aria-label': lang.navigationOpen,
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
                        : appShellStyles.brandRail),
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
          <div {...mergeAttrs<'div'>({ sx: appShellStyles.headerContent }, propsHeaderContent)}>
            {header}
          </div>
        </header>
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                appShellStyles.body,
                docked() && hasContent(aside)
                  ? appShellStyles.withBoth
                  : docked()
                    ? appShellStyles.withSidebar
                    : hasContent(aside) && appShellStyles.withAside,
              ],
            },
            propsBody,
          )}
        >
          {docked() && (
            <div
              {...mergeAttrs<'div'>(
                { sx: [appShellStyles.rail, appShellStyles.sidebar] },
                propsSidebar,
              )}
            >
              <ScrollArea
                {...mergePartProps<ScrollAreaProps>(
                  {
                    sx: appShellStyles.railScroll,
                    propsViewport: { sx: appShellStyles.railViewport },
                    propsContent: { sx: appShellStyles.sidebarContent },
                  },
                  propsSidebarScroll,
                )}
              >
                {sidebar}
              </ScrollArea>
            </div>
          )}
          <main
            {...mergeAttrs<'main'>({ sx: appShellStyles.main }, propsMain, {
              id: mainId,
              tabindex: -1,
            })}
          >
            {children}
          </main>
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
              aria-label={lang.navigationResize}
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
              { title: lang.navigation, side: 'start' },
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
