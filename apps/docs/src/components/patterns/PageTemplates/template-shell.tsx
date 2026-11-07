/**
 * 整页模板共用的外壳：采购后台的顶栏、侧边导航与内容区（AppShell）。各个模板只管自己的内容区；
 * 侧栏的链接只写锚点（示例里不真的换页），当前页由 current 指定。
 */
import { Bell, Box, ClipboardList, FilePlus2, LayoutDashboard, Search } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Avatar,
  Badge,
  IconButton,
  NavItem,
  NavList,
  NavSection,
  TextField,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { AppShell, AppShellBrand } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import type { VNodeChild } from 'vue';

const pages = {
  dashboard: { label: '概览', icon: LayoutDashboard },
  orders: { label: '采购单', icon: ClipboardList },
  create: { label: '新建采购申请', icon: FilePlus2 },
} as const;

/** 模板里的页面 */
export type TemplatePage = keyof typeof pages;

const styles = css.create({
  search: { width: '16rem' },
  end: { marginInlineStart: 'auto' },
});

/** 外壳：current 是侧栏里高亮的那一页 */
export const TemplateShell = _component(
  ({ current, children }: { current: TemplatePage; children?: VNodeChild }) => {
    let navOpen = _state(false);
    const item = (page: TemplatePage) => (
      <NavItem
        href={`#${page}`}
        icon={pages[page].icon}
        active={current === page}
        onClick={() => (navOpen = false)}
        end={page === 'orders' && <Badge radius="full">8</Badge>}
      >
        {pages[page].label}
      </NavItem>
    );
    return () => (
      <AppShell
        _sidebarOpen={navOpen}
        brand={
          <AppShellBrand href="#dashboard" icon={Box}>
            华辰采购
          </AppShellBrand>
        }
        header={
          <>
            <TextField
              type="search"
              icon={Search}
              placeholder="搜索采购单、供应商"
              aria-label="搜索"
              propsRoot={{ sx: styles.search }}
            />
            <IconButton icon={Bell} aria-label="通知" sx={styles.end} />
            <Avatar size="sm" name="林小满" />
          </>
        }
        sidebar={
          <NavList aria-label="采购后台">
            <NavSection label="工作台">
              {item('dashboard')}
              {item('orders')}
              {item('create')}
            </NavSection>
          </NavList>
        }
      >
        {children}
      </AppShell>
    );
  },
);
