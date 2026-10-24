import { ChartLine, House, Package, Settings, ShoppingCart, Users } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Card, NavGroup, NavItem, NavList, type IconData } from '@vue-tsx-pro/ui';

const styles = css.create({ nav: { width: '15rem' } });

export default _component(() => {
  // 示例里不真的换页：链接只写锚点，当前项由 active 指定
  let current = _state('orders-all');
  const item = (key: string, label: string, icon?: IconData, end?: number) => (
    <NavItem
      href={`#${key}`}
      icon={icon}
      active={current === key}
      onClick={() => (current = key)}
      end={end != null && <Badge radius="full">{end}</Badge>}
    >
      {label}
    </NavItem>
  );
  return () => (
    <Card padding="sm" sx={styles.nav}>
      <NavList aria-label="后台">
        {item('home', '概览', House)}
        <NavGroup label="订单" icon={ShoppingCart}>
          {item('orders-all', '全部订单', undefined, 12)}
          {item('orders-refund', '退款售后', undefined, 3)}
          {item('orders-invoice', '发票')}
        </NavGroup>
        <NavGroup label="商品" icon={Package}>
          {item('products', '商品列表')}
          {item('inventory', '库存')}
        </NavGroup>
        {item('customers', '客户', Users)}
        {item('reports', '报表', ChartLine)}
        {item('settings', '设置', Settings)}
      </NavList>
    </Card>
  );
});
