/**
 * 页签区（后台的多页签）：打开过的页面各一个标签，点了切过去，可以关闭、拖动排序，右键有“关闭其他”“关闭右侧”。
 * 放在 AppShell 的 tabs 里；和路由同步交给 useRouteTabs（@zerodep-dev/vue-tsx-pro-ui/vue-router），也可以自己维护 pages。
 *
 *   const tabs = useRouteTabs(router, { home: '/' });
 *   <AppShell tabs={<PageTabs {...tabs} />} …>
 *
 * 标签就是 Tabs（只当导航，没有 TabPanel；activation="manual"：方向键只移动焦点，Enter 才切过去，免得逐个跳页面）：
 * 关闭按钮、Delete、鼠标中键关闭，拖动或 Alt + ←→ 排序，放不下时滚动按钮与“全部标签页”。固定的页（pinned）不能关。
 *
 * 部件：Root（Tabs）、List（TabList）、Tab、Menu（右键菜单）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { useMessages } from '../config/lang/messages';
import { Tab, TabList, Tabs, type TabListProps } from '../navigation/Tabs';
import { ContextMenu } from '../overlay/ContextMenu';
import { MenuItem } from '../overlay/Menu';
import { mergePartProps, type PartProps } from '../utils/props';
import { patternsMessages } from './messages';

/** 一个页签 */
export interface PageTab {
  /** 页面的地址：也是页签的 value */
  path: string;
  /** 页签上的文字 */
  title: string;
  /** 固定：不能关闭（首页、工作台） */
  pinned?: boolean;
}

/** 未声明的属性落到外层（Tabs 的 div）上 */
export interface PageTabsProps extends PartProps<'div'> {
  /** 打开的页面，按显示的顺序 */
  pages: readonly PageTab[];
  /** 当前页面的地址 */
  current: string;
  /** 点了一个页签（或 Enter）：跳过去 */
  onNavigate: (path: string) => void;
  /** 关闭页签（关闭按钮、Delete、中键，或右键菜单里的“关闭其他”“关闭右侧”）：参数是要关的地址 */
  onClose?: (paths: string[]) => void;
  /** 拖动排序：新的顺序 */
  onReorder?: (paths: string[]) => void;
  /** 标签栏右边“全部标签页”的菜单，默认 true */
  showAllMenu?: boolean;
  /** 标签栏（TabList）的部件属性 */
  propsList?: Partial<TabListProps>;
}

/** 页签区：打开过的页面，切换、关闭、排序 */
export const PageTabs = _component(
  ({
    pages,
    current,
    onNavigate,
    onClose,
    onReorder,
    showAllMenu = true,
    propsList,
    ...rest
  }: PageTabsProps) => {
    const messages = useMessages('patterns', patternsMessages);
    // 右键菜单是给哪个页签打开的（页签的 contextmenu 先于外层的 ContextMenu 收到）
    let menuFor = _state<string | null>(null);

    /** 右键菜单里关闭 path 之外的、它右边的 */
    const others = (path: string) =>
      pages.filter((page) => page.path !== path && !page.pinned).map((page) => page.path);
    const toRight = (path: string) =>
      pages
        .slice(pages.findIndex((page) => page.path === path) + 1)
        .filter((page) => !page.pinned)
        .map((page) => page.path);

    function renderMenu() {
      const path = menuFor;
      const page = pages.find((item) => item.path === path);
      if (!path || !page) return null;
      return (
        <>
          <MenuItem disabled={page.pinned} onAction={() => onClose?.([path])}>
            {messages.pageTabsClose}
          </MenuItem>
          <MenuItem disabled={others(path).length === 0} onAction={() => onClose?.(others(path))}>
            {messages.pageTabsCloseOthers}
          </MenuItem>
          <MenuItem disabled={toRight(path).length === 0} onAction={() => onClose?.(toRight(path))}>
            {messages.pageTabsCloseRight}
          </MenuItem>
        </>
      );
    }

    return () => {
      const list = (
        <TabList
          {...mergePartProps<TabListProps>(
            { 'aria-label': messages.pageTabsLabel, showAllMenu, onReorder },
            propsList,
          )}
        >
          {pages.map((page) => (
            <Tab
              key={page.path}
              value={page.path}
              onClose={page.pinned || !onClose ? undefined : () => onClose([page.path])}
              onContextmenu={() => (menuFor = page.path)}
            >
              {page.title}
            </Tab>
          ))}
        </TabList>
      );
      return (
        <Tabs
          {...rest}
          _value={current}
          onUpdate:_value={(next: string | undefined) =>
            next !== undefined && next !== current && onNavigate(next)
          }
          activation="manual"
        >
          {onClose ? (
            <ContextMenu menu={renderMenu()} label={messages.pageTabsMenu}>
              {list}
            </ContextMenu>
          ) : (
            list
          )}
        </Tabs>
      );
    };
  },
);
