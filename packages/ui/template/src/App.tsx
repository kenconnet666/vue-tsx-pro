// 后台的外壳：顶栏、侧边导航（窄屏收进抽屉）、内容区放当前路由的页面
import { Box, ClipboardList, FilePlus2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Avatar, NavItem, NavList, NavSection } from '@zerodep-dev/vue-tsx-pro-ui';
import { AppShell, AppShellBrand } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { RouterView } from 'vue-router';

export const App = _component(() => {
  let navOpen = _state(false);
  return () => (
    <AppShell
      _sidebarOpen={navOpen}
      brand={
        <AppShellBrand href="/orders" icon={Box}>
          采购后台
        </AppShellBrand>
      }
      header={<Avatar size="sm" name="林小满" />}
      sidebar={
        <NavList aria-label="采购后台">
          <NavSection label="采购">
            <NavItem href="/orders" icon={ClipboardList} onClick={() => (navOpen = false)}>
              采购单
            </NavItem>
            <NavItem href="/orders/new" icon={FilePlus2} onClick={() => (navOpen = false)}>
              新建采购单
            </NavItem>
          </NavSection>
        </NavList>
      }
    >
      <RouterView />
    </AppShell>
  );
});
