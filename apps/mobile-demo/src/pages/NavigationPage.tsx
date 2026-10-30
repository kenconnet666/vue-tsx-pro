// 导航：固定的导航栏、吸顶可滑动的标签页、底部标签栏、回到顶部；三端同一份页面
import { House, LayoutGrid, Search as SearchIcon, ShoppingCart, User } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  BackTop,
  Cell,
  CellGroup,
  ConfigProvider,
  Empty,
  Icon,
  NavBar,
  Tab,
  TabBar,
  TabBarItem,
  Tabs,
  Tag,
  showToast,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { back } from '../nav.ts';
import { demoSettings } from '../settings.ts';

const styles = css.create({
  page: { minHeight: '100vh', backgroundColor: '_background' },
  list: { paddingBlockStart: '_sm' },
});

/** 订单的状态 */
const STATUS = {
  unpaid: ['待付款', 'warning'],
  unshipped: ['待发货', 'accent'],
  shipped: ['待收货', 'accent'],
  review: ['待评价', 'success'],
} as const;

type Status = keyof typeof STATUS;

const ORDERS = Array.from({ length: 24 }, (_, index) => ({
  id: 1024 + index,
  status: (['unpaid', 'unshipped', 'shipped', 'review'] as const)[index % 4] as Status,
  amount: ((index * 37) % 500) + 19.9,
}));

export const NavigationPage = _component(() => {
  let tab = _state('all');
  let bar = _state('home');

  const list = (status?: Status) => {
    const rows = ORDERS.filter((order) => !status || order.status === status);
    if (!rows.length) return <Empty description="没有订单" />;
    return (
      <CellGroup inset {...css.attrs(styles.list)}>
        {rows.map((order) => (
          <Cell
            title={`订单 ${order.id}`}
            description={`¥${order.amount.toFixed(2)}`}
            value={<Tag tone={STATUS[order.status][1]}>{STATUS[order.status][0]}</Tag>}
            center
            arrow
            onClick={() => showToast(`订单 ${order.id}`)}
          />
        ))}
      </CellGroup>
    );
  };

  return () => (
    <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
      <NavBar
        title="我的订单"
        leftArrow
        left="返回"
        right={<Icon icon={SearchIcon} />}
        fixed
        placeholder
        onClickLeft={back}
        onClickRight={() => showToast('搜索订单')}
      />
      <Tabs _value={tab} swipeable sticky offsetTop="calc(3.15em + env(safe-area-inset-top))">
        <Tab name="all" title="全部">
          {list()}
        </Tab>
        <Tab name="unpaid" title="待付款" badge={6}>
          {list('unpaid')}
        </Tab>
        <Tab name="unshipped" title="待发货">
          {list('unshipped')}
        </Tab>
        <Tab name="shipped" title="待收货" badge>
          {list('shipped')}
        </Tab>
        <Tab name="review" title="待评价">
          {list('review')}
        </Tab>
        <Tab name="refund" title="退款/售后" disabled>
          {list()}
        </Tab>
      </Tabs>
      <BackTop bottom="5em" />
      <TabBar _value={bar}>
        <TabBarItem name="home" icon={House}>
          首页
        </TabBarItem>
        <TabBarItem name="category" icon={LayoutGrid}>
          分类
        </TabBarItem>
        <TabBarItem name="cart" icon={ShoppingCart} badge={3}>
          购物车
        </TabBarItem>
        <TabBarItem name="mine" icon={User} badge>
          我的
        </TabBarItem>
      </TabBar>
    </ConfigProvider>
  );
});
