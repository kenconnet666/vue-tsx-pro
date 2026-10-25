import {
  Bell,
  Box,
  ChartLine,
  House,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Users,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Avatar,
  Badge,
  Card,
  Flex,
  Grid,
  H1,
  IconButton,
  NavGroup,
  NavItem,
  NavList,
  NavSection,
  Paragraph,
  Small,
  Stat,
  Strong,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextField,
} from '@vue-tsx-pro/ui';
import { AppShell, AppShellBrand } from '@vue-tsx-pro/ui/patterns';

const pages = {
  overview: { label: '概览', icon: House },
  orders: { label: '订单', icon: ShoppingCart },
  products: { label: '商品', icon: Package },
  customers: { label: '客户', icon: Users },
  reports: { label: '报表', icon: ChartLine },
  team: { label: '团队成员', icon: undefined },
  billing: { label: '账单', icon: undefined },
} as const;
type Page = keyof typeof pages;

const orders = [
  ['#10234', '林小满', '¥1,280.00', ['success', '已发货']],
  ['#10233', '周一航', '¥329.00', ['warning', '待付款']],
  ['#10232', '陈默', '¥4,299.00', ['info', '备货中']],
  ['#10231', '许悠', '¥659.00', ['success', '已完成']],
] as const;

const styles = css.create({
  search: { width: '16rem' },
  // 通知与头像靠顶栏的结束边
  end: { marginInlineStart: 'auto' },
});

export default _component(() => {
  let current = _state<Page>('overview');
  let navOpen = _state(false);
  // 示例里不真的换页：链接只写锚点，当前项由 active 指定；没有换路由，抽屉要自己关上
  const item = (page: Page) => (
    <NavItem
      href={`#${page}`}
      icon={pages[page].icon}
      active={current === page}
      onClick={() => {
        current = page;
        navOpen = false;
      }}
      end={page === 'orders' && <Badge radius="full">12</Badge>}
    >
      {pages[page].label}
    </NavItem>
  );

  return () => (
    <AppShell
      _sidebarOpen={navOpen}
      brand={
        <AppShellBrand href="#overview" icon={Box}>
          小满商城后台
        </AppShellBrand>
      }
      header={
        <>
          <TextField
            type="search"
            icon={Search}
            placeholder="搜索订单、客户"
            aria-label="搜索"
            propsRoot={{ sx: styles.search }}
          />
          <IconButton icon={Bell} aria-label="通知" sx={styles.end} />
          <Avatar size="sm" name="林小满" />
        </>
      }
      sidebar={
        <NavList aria-label="后台">
          <NavSection label="工作台">
            {item('overview')}
            {item('orders')}
            {item('products')}
            {item('customers')}
          </NavSection>
          <NavSection label="分析">
            {item('reports')}
            <NavGroup label="设置" icon={Settings}>
              {item('team')}
              {item('billing')}
            </NavGroup>
          </NavSection>
        </NavList>
      }
      aside={
        <Flex direction="column" gap="sm">
          <Strong>今日提醒</Strong>
          <Small tone="muted">3 笔订单超过 24 小时未发货</Small>
          <Small tone="muted">“云朵沙发”库存只剩 5 件</Small>
        </Flex>
      }
    >
      <Flex direction="column" gap="xl">
        <Flex direction="column" gap="xs">
          <H1 size="xxl">{pages[current].label}</H1>
          <Paragraph tone="muted">
            宽于 64rem 时侧栏常驻，更窄时收进抽屉（顶栏最前面出现菜单按钮）；宽于 80rem
            时显示右侧栏。
          </Paragraph>
        </Flex>
        <Grid minItemWidth="11rem" gap="md">
          <Card>
            <Stat label="今日销售额" value={48_210} unit="元" change={0.124} />
          </Card>
          <Card>
            <Stat label="订单数" value={326} change={0.058} />
          </Card>
          <Card>
            <Stat label="新客户" value={41} change={-0.032} />
          </Card>
          <Card>
            <Stat
              label="退款率"
              value={0.018}
              format={{ style: 'percent', maximumFractionDigits: 1 }}
              change={-0.2}
              invertChange
            />
          </Card>
        </Grid>
        <Card header={<Strong>最近订单</Strong>}>
          <Table aria-label="最近订单">
            <TableHead>
              <TableRow>
                <TableHeaderCell>订单号</TableHeaderCell>
                <TableHeaderCell>客户</TableHeaderCell>
                <TableHeaderCell>金额</TableHeaderCell>
                <TableHeaderCell>状态</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map(([id, customer, amount, [tone, status]]) => (
                <TableRow key={id}>
                  <TableCell>{id}</TableCell>
                  <TableCell>{customer}</TableCell>
                  <TableCell>{amount}</TableCell>
                  <TableCell>
                    <Badge tone={tone}>{status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Flex>
    </AppShell>
  );
});
