// 后台的顶栏导航：有子项的是下拉菜单，审批是下拉面板（带说明的列表，选一条收起），带角标；拖动滑块把顶栏变窄，放不下的项收进“更多”
import { BarChart3, Boxes, House, ShoppingCart, Stamp, Truck, Users, Wrench } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Field,
  Flex,
  ItemList,
  ItemListItem,
  NavBar,
  Slider,
  Small,
  type NavBarItem,
} from '@zerodep-dev/vue-tsx-pro-ui';

const approvals = [
  { title: '采购：展厅大屏与音响', description: '总经理审批 · 今天到期' },
  { title: '请假：年假 3 天', description: '部门经理审批 · 2 小时前到达' },
];

const items: NavBarItem[] = [
  { label: '工作台', href: '#home', icon: House },
  {
    label: '审批',
    href: '#approvals',
    icon: Stamp,
    badge: approvals.length,
    panel: (close) => (
      <ItemList aria-label="待审批" style={{ width: '20rem' }}>
        {approvals.map((a) => (
          <ItemListItem
            key={a.title}
            title={a.title}
            description={a.description}
            onSelect={close}
          />
        ))}
      </ItemList>
    ),
  },
  {
    label: '采购',
    icon: ShoppingCart,
    children: [
      { label: '采购单', href: '#po' },
      { label: '询价比价', href: '#quote' },
      { label: '合同', href: '#contract' },
    ],
  },
  { label: '供应商', href: '#suppliers', icon: Users },
  { label: '库存', href: '#stock', icon: Boxes },
  { label: '物流', href: '#logistics', icon: Truck },
  {
    label: '报表',
    icon: BarChart3,
    children: [
      { label: '销售月报', href: '#monthly' },
      { label: '季度复盘', href: '#quarterly' },
    ],
  },
  { label: '设置', href: '#settings', icon: Wrench },
];

export default _component(() => {
  let width = _state(100);
  return () => (
    <Flex direction="column" gap="md">
      <Field label={`顶栏宽度：${width}%`}>
        <Slider _value={width} min={30} max={100} />
      </Field>
      <Card padding="xs" style={{ width: `${width}%` }}>
        <NavBar items={items} aria-label="主导航" />
      </Card>
      <Small tone="muted">当前页按路由适配判断；本页的链接是锚点，点了在地址栏里变化</Small>
    </Flex>
  );
});
