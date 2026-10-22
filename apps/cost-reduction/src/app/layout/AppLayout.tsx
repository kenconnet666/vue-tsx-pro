/**
 * 页面外壳（路由的布局）：顶栏是品牌、本页的导航（页面用 PageNav 放进来）、收件箱与我负责的任务、主题与当前用户；
 * 侧栏是盖在页面上的抽屉（开不开正文都是整宽），按模块分组，只列当前角色看得到的项；拖窄时只剩图标；
 * 正文是当前路由的页面。外壳只渲染一次，换页时只换正文与顶栏里本页导航那一格
 */
import { Plane } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  AppShell,
  Icon,
  NavItem,
  NavList,
  NavSection,
  Provider,
  ThemeSwitcher,
  Toaster,
  usePersistentState,
  type ComponentDefaults,
} from '@vue-tsx-pro/ui';
import { RouterView, useRoute } from 'vue-router';
import { toaster } from '../feedback';
import { paths } from '../paths';
import { hasAnyRole } from '../session';
import { preference } from '../theme';
import { homeEntry, navGroups, sectionOf } from './nav';
import { PAGE_NAV_ID } from './PageNav';
import { InboxTray, MyTasksTray, NotificationTray } from './Trays';
import { UserMenu } from './UserMenu';

/** 降本管理的外观默认值：状态标签用直角，与表格的直线对齐 */
const appDefaults: ComponentDefaults = { Badge: { radius: 'none' } };

const styles = stylex.create({
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    flexShrink: 0,
    color: '_text',
    textDecoration: 'none',
    fontWeight: '_semibold',
    fontSize: '_lg',
  },
  brandMark: { color: '_accentText' },
  // 正文上下的内边距与区块之间的间距一致：列表页的分页贴近窗口底边
  main: { paddingBlock: '_md' },
  // 本页的导航在品牌格（与“打开”导航）之后，贴着顶栏底边；占满中间
  nav: { display: 'flex', alignSelf: 'stretch', alignItems: 'flex-end', flexGrow: 1, minWidth: 0 },
  tools: { display: 'flex', alignItems: 'center', gap: '_xs', flexShrink: 0 },
});

// 侧栏默认收起（表格不被挡住）；开关与拖动后的宽度各人记住
const sidebar = usePersistentState('cost-reduction:sidebar', { open: false, width: 256 });

/** 页面外壳 */
export const AppLayout = _component(() => {
  const route = useRoute();
  return () => {
    const current = sectionOf(route);
    return (
      <Provider defaults={appDefaults}>
        <AppShell
          sidebarMode="overlay"
          sidebarOpen={_bind(sidebar.value.open)}
          sidebarWidth={_bind(sidebar.value.width)}
          propsMain={{ sx: styles.main }}
          brand={
            <a href={paths.workbench()} {...stylex.attrs(styles.brand)}>
              <Icon icon={Plane} sx={styles.brandMark} />
              联合降本管理
            </a>
          }
          header={
            <>
              <div id={PAGE_NAV_ID} {...stylex.attrs(styles.nav)} />
              <div {...stylex.attrs(styles.tools)}>
                <InboxTray />
                <MyTasksTray />
                <NotificationTray />
              </div>
              <ThemeSwitcher preference={preference} />
              <UserMenu />
            </>
          }
          sidebar={
            <NavList aria-label="联合降本管理">
              <NavItem
                href={homeEntry.href}
                icon={homeEntry.icon}
                active={current === homeEntry.key}
              >
                {homeEntry.label}
              </NavItem>
              {navGroups.map((group) => {
                const items = group.items.filter((item) => hasAnyRole(item.roles));
                return (
                  items.length > 0 && (
                    <NavSection key={group.label} label={group.label} icon={group.icon}>
                      {items.map((item) => (
                        <NavItem
                          key={item.key}
                          href={item.href}
                          icon={item.icon}
                          active={current === item.key}
                        >
                          {item.label}
                        </NavItem>
                      ))}
                    </NavSection>
                  )
                );
              })}
            </NavList>
          }
        >
          <RouterView />
        </AppShell>
        <Toaster controller={toaster} />
      </Provider>
    );
  };
});
