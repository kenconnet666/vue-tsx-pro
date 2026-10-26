// 混合布局：顶栏是一级导航（NavBar），侧栏是当前模块的二级导航（可以收起成图标栏），正文上面是打开过的页面（PageTabs），
// 底部是页脚。示例不换路由：页签由本地状态维护，接路由时用 useRouteTabs
import {
  BarChart3,
  Box,
  FileSignature,
  FileText,
  House,
  ReceiptText,
  Scale,
  ShoppingCart,
  Truck,
  Users,
} from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Avatar,
  Card,
  Flex,
  Grid,
  H1,
  NavBar,
  NavItem,
  NavList,
  Paragraph,
  Small,
  Stat,
  type NavBarItem,
} from '@zerodep-dev/vue-tsx-pro-ui';
import {
  AppShell,
  AppShellBrand,
  PageTabs,
  type PageTab,
} from '@zerodep-dev/vue-tsx-pro-ui/patterns';

const sidePages = {
  po: { title: '采购单', icon: ReceiptText },
  quote: { title: '询价比价', icon: Scale },
  contract: { title: '合同', icon: FileSignature },
  suppliers: { title: '供应商', icon: Users },
  logistics: { title: '到货跟踪', icon: Truck },
} as const;

// 各页的几个指标：示例里页面只有标题与指标
const stats: Record<string, [label: string, value: number, unit?: string][]> = {
  home: [
    ['待我审批', 6],
    ['本月采购额', 1_284_000, '元'],
    ['在途订单', 23],
  ],
  po: [
    ['草稿', 4],
    ['审批中', 9],
    ['已下单', 57],
  ],
  quote: [
    ['进行中的询价', 2],
    ['已收报价', 11],
    ['平均降幅', 6.8, '%'],
  ],
  contract: [
    ['生效中', 38],
    ['30 天内到期', 3],
    ['待盖章', 1],
  ],
  suppliers: [
    ['合格供应商', 142],
    ['考察中', 7],
    ['本季新增', 5],
  ],
  logistics: [
    ['今日到货', 8],
    ['延误', 2],
    ['待验收', 5],
  ],
};
type SidePage = keyof typeof sidePages;

// 顶栏的一级导航：各模块（示例里只有“采购”是做好的）
const modules: NavBarItem[] = [
  { label: '工作台', href: '#home', icon: House },
  { label: '采购', href: '#purchase', icon: ShoppingCart },
  { label: '报表', href: '#reports', icon: BarChart3 },
  { label: '文档', href: '#docs', icon: FileText },
];

export default _component(() => {
  let current = _state('home');
  let collapsed = _state(false);
  let tabs = _state<PageTab[]>([
    { path: 'home', title: '工作台', pinned: true },
    { path: 'po', title: '采购单' },
  ]);

  function open(path: SidePage) {
    if (!tabs.some((tab) => tab.path === path))
      tabs = [...tabs, { path, title: sidePages[path].title }];
    current = path;
  }

  function close(paths: string[]) {
    const order = tabs;
    tabs = tabs.filter((tab) => tab.pinned || !paths.includes(tab.path));
    if (!paths.includes(current)) return;
    // 关掉了当前页：去后面还开着的一个，没有时前面的
    const at = order.findIndex((tab) => tab.path === current);
    const next =
      order.slice(at + 1).find((tab) => !paths.includes(tab.path)) ??
      order
        .slice(0, at)
        .reverse()
        .find((tab) => tab.pinned || !paths.includes(tab.path));
    current = next?.path ?? 'home';
  }

  const title = () => tabs.find((tab) => tab.path === current)?.title ?? '';

  return () => (
    <AppShell
      brand={
        <AppShellBrand href="#home" icon={Box}>
          采购协同
        </AppShellBrand>
      }
      nav={<NavBar items={modules} aria-label="模块" />}
      header={<Avatar size="sm" name="林小满" />}
      sidebar={
        <NavList aria-label="采购">
          {(Object.keys(sidePages) as SidePage[]).map((page) => (
            <NavItem
              key={page}
              href={`#${page}`}
              icon={sidePages[page].icon}
              active={current === page}
              badge={page === 'quote' ? 2 : 0}
              onClick={(event: MouseEvent) => {
                event.preventDefault();
                open(page);
              }}
            >
              {sidePages[page].title}
            </NavItem>
          ))}
        </NavList>
      }
      sidebarCollapsible
      _sidebarCollapsed={collapsed}
      tabs={
        <PageTabs
          pages={tabs}
          current={current}
          onNavigate={(path) => (current = path)}
          onClose={close}
          onReorder={(paths) =>
            (tabs = paths.map((path) => tabs.find((tab) => tab.path === path)!))
          }
        />
      }
      footer={
        <Flex justify="between" wrap gap="sm">
          <Small tone="muted">© 2026 采购协同平台</Small>
          <Small tone="muted">版本 3.2.0</Small>
        </Flex>
      }
    >
      <Flex direction="column" gap="md">
        <H1>{title()}</H1>
        <Grid minItemWidth="10rem" gap="md">
          {(stats[current] ?? []).map(([label, value, unit]) => (
            <Card key={label}>
              <Stat label={label} value={value} unit={unit} />
            </Card>
          ))}
        </Grid>
        <Card>
          <Paragraph>
            点左边的二级导航打开页面，上面多出一个页签；页签可以关闭、拖动排序，右键有“关闭其他”“关闭右侧”；侧栏底部的按钮把侧栏收成图标栏，二级导航只剩图标，悬停看名称。
          </Paragraph>
        </Card>
      </Flex>
    </AppShell>
  );
});
