// 后台的顶栏导航：有子项的是下拉菜单，待办带角标；拖动滑块把顶栏变窄，放不下的项收进“更多”
import { BarChart3, Boxes, House, ShoppingCart, Truck, Users, Wrench } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Field, Flex, NavBar, Slider, Small, type NavBarItem } from '@vue-tsx-pro/ui';

const items: NavBarItem[] = [
  { label: '工作台', href: '#home', icon: House },
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
  { label: '物流', href: '#logistics', icon: Truck, badge: 3 },
  {
    label: '报表',
    icon: BarChart3,
    children: [
      { label: '降本月报', href: '#monthly' },
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
        <Slider value={_bind(width)} min={30} max={100} />
      </Field>
      <Card padding="xs" style={{ width: `${width}%` }}>
        <NavBar items={items} aria-label="主导航" />
      </Card>
      <Small tone="muted">当前页按路由适配判断；本页的链接是锚点，点了在地址栏里变化</Small>
    </Flex>
  );
});
