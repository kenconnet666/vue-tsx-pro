import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Empty,
  Flex,
  ItemList,
  ItemListItem,
  Small,
  Strong,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@zerodep-dev/vue-tsx-pro-ui';

const orders = [
  { id: '#10234', customer: '林小满', amount: '¥1,280.00', status: 'shipped' },
  { id: '#10233', customer: '周一航', amount: '¥329.00', status: 'unpaid' },
  { id: '#10232', customer: '陈默', amount: '¥4,299.00', status: 'shipped' },
  { id: '#10231', customer: '许悠', amount: '¥659.00', status: 'unpaid' },
  { id: '#10230', customer: '王晴', amount: '¥88.00', status: 'done' },
];

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'unpaid', label: '待付款' },
  { value: 'shipped', label: '已发货' },
  { value: 'done', label: '已完成' },
  { value: 'refund', label: '退款' },
];

export default _component(() => {
  let tab = _state('all');
  const list = (status: string) =>
    status === 'all' ? orders : orders.filter((order) => order.status === status);
  return () => (
    <Tabs _value={tab}>
      <TabList aria-label="订单状态">
        {tabs.map(({ value, label }) => (
          <Tab key={value} value={value}>
            <Flex align="center" gap="xs">
              {label}
              <Badge radius="full" tone={tab === value ? 'accent' : 'neutral'}>
                {list(value).length}
              </Badge>
            </Flex>
          </Tab>
        ))}
      </TabList>
      {tabs.map(({ value, label }) => (
        <TabPanel key={value} value={value}>
          {list(value).length ? (
            <ItemList divided>
              {list(value).map((order) => (
                <ItemListItem
                  key={order.id}
                  title={order.customer}
                  description={order.id}
                  end={<Strong>{order.amount}</Strong>}
                  href={`#order-${order.id.slice(1)}`}
                />
              ))}
            </ItemList>
          ) : (
            <Empty title={`没有${label}的订单`} />
          )}
        </TabPanel>
      ))}
      <Small tone="muted">方向键在标签之间移动，焦点到哪个就切到哪个</Small>
    </Tabs>
  );
});
