/**
 * 应用外壳：粘性顶栏、左侧栏（导航）、正文、右侧栏（本页目录），文档站与后台的整页骨架。
 *
 *   <AppShell
 *     header={<><Logo /><CommandPalette … /><ThemeSwitcher preference={preference} /></>}
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
 * 两侧栏粘在顶栏下面，内容多时各自滚动。顶栏半透明，滚动的正文从下面透出（backdrop-filter）。
 *
 * 自带 SkipLink（跳到正文）；顶栏的高度经 layoutVars.stickyOffset 交给里面的标题，锚点跳转后不被顶栏挡住。
 */
import { Menu as MenuIcon } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import { SkipLink } from '../navigation/SkipLink';
import { Drawer, type DrawerProps } from '../overlay/Drawer';
import { useMediaQuery } from '../utils/dom/media-query';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { layoutVars } from '../utils/style/vars.stylex';

/** 顶栏高度：也是两侧栏粘住的位置、标题跳转时让开的距离 */
const HEADER_HEIGHT = '3.5rem';
// 与 sizes.lg / sizes.xl 相同（媒体查询里不能用 CSS 变量）
const WIDE_QUERY = '(min-width: 64rem)';
const WIDE = '@media (min-width: 64rem)';
const WIDER = '@media (min-width: 80rem)';

/** 未声明的属性落到外层 div 上 */
export interface AppShellProps extends PartProps<'div'> {
  /** 顶栏的内容：标志、搜索、主题切换… */
  header?: VNodeChild;
  /** 左侧栏：站点导航；窄屏时收进抽屉 */
  sidebar?: VNodeChild;
  /** 右侧栏：本页目录等辅助内容；较窄时不显示 */
  aside?: VNodeChild;
  /** 窄屏时侧栏抽屉是否打开：父级可以写 sidebarOpen={_bind(x)} */
  sidebarOpen?: boolean;
  /** 页面最前面的“跳到正文”链接，默认 true */
  skipLink?: boolean;
  /** 顶栏（header）的部件属性 */
  propsHeader?: PartProps<'header'>;
  /** 左侧栏（div）的部件属性 */
  propsSidebar?: PartProps<'div'>;
  /** 正文（main）的部件属性 */
  propsMain?: PartProps<'main'>;
  /** 右侧栏（aside）的部件属性 */
  propsAside?: PartProps<'aside'>;
  /** 窄屏时打开侧栏的按钮的部件属性 */
  propsMenuButton?: Partial<IconButtonProps>;
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
  root: { display: 'flex', flexDirection: 'column', minHeight: '100dvh' },
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
  menuButton: { display: { default: 'inline-flex', [WIDE]: 'none' }, flexShrink: 0 },
  headerContent: { display: 'flex', alignItems: 'center', gap: '_md', flexGrow: 1, minWidth: 0 },
  body: { display: 'grid', flexGrow: 1, gridTemplateColumns: 'minmax(0, 1fr)' },
  withSidebar: { gridTemplateColumns: { default: null, [WIDE]: '16rem minmax(0, 1fr)' } },
  withAside: { gridTemplateColumns: { default: null, [WIDER]: 'minmax(0, 1fr) 14rem' } },
  withBoth: {
    gridTemplateColumns: {
      default: null,
      [WIDE]: '16rem minmax(0, 1fr)',
      [WIDER]: '16rem minmax(0, 1fr) 14rem',
    },
  },
  // 两侧栏：粘在顶栏下面、占满剩下的视口高度，内容多时各自滚动，滚到头不带动页面
  rail: {
    position: 'sticky',
    top: layoutVars.stickyOffset,
    boxSizing: 'border-box',
    height: `calc(100dvh - ${layoutVars.stickyOffset})`,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    paddingBlock: '_xl',
  },
  sidebar: {
    display: { default: 'none', [WIDE]: 'block' },
    paddingInline: '_md',
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_border',
  },
  aside: { display: { default: 'none', [WIDER]: 'block' }, paddingInline: '_lg' },
  // 正文由 SkipLink 聚焦（tabindex=-1）：不显示焦点框
  main: { minWidth: 0, paddingBlock: '_xl', paddingInline: '_xl', outlineStyle: 'none' },
});

/** 应用外壳：粘性顶栏、左侧栏、正文、右侧栏；窄屏时左侧栏收进抽屉 */
export const AppShell = _component(
  ({
    header,
    sidebar,
    aside,
    sidebarOpen = _bindable(false),
    skipLink = true,
    propsHeader,
    propsSidebar,
    propsMain,
    propsAside,
    propsMenuButton,
    propsDrawer,
    children,
    ...rest
  }: AppShellProps) => {
    const lang = useLang();
    const mainId = `${useId()}-main`;
    const wide = useMediaQuery(WIDE_QUERY);
    // 变宽后侧栏已经显示出来：抽屉没必要再开着
    watch(wide, (isWide) => {
      if (isWide) sidebarOpen = false;
    });
    // 抽屉里点了链接（通常是换页）：关闭抽屉
    function closeOnNavigate(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest('a[href]')) sidebarOpen = false;
    }

    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [appShellStyles.root, appShellOffset as unknown as StyleXStyles] },
          rest,
        )}
      >
        {skipLink && <SkipLink href={`#${mainId}`} />}
        <header {...mergeAttrs<'header'>({ sx: appShellStyles.header }, propsHeader)}>
          {sidebar != null && (
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
          <div {...mergeAttrs<'div'>({ sx: appShellStyles.headerContent })}>{header}</div>
        </header>
        <div
          {...mergeAttrs<'div'>({
            sx: [
              appShellStyles.body,
              sidebar != null && aside != null
                ? appShellStyles.withBoth
                : sidebar != null
                  ? appShellStyles.withSidebar
                  : aside != null && appShellStyles.withAside,
            ],
          })}
        >
          {sidebar != null && (
            <div
              {...mergeAttrs<'div'>(
                { sx: [appShellStyles.rail, appShellStyles.sidebar] },
                propsSidebar,
              )}
            >
              {sidebar}
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
          {aside != null && (
            <aside
              {...mergeAttrs<'aside'>(
                { sx: [appShellStyles.rail, appShellStyles.aside] },
                propsAside,
              )}
            >
              {aside}
            </aside>
          )}
        </div>
        {sidebar != null && (
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
