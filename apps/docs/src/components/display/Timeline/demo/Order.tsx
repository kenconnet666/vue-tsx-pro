import { CircleCheck, CreditCard, Package, Truck } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Timeline } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Card>
    <Timeline
      items={[
        { title: '已下单', time: '10-18 09:12', dateTime: '2026-10-18T09:12', icon: CircleCheck },
        {
          title: '已付款',
          time: '10-18 09:13',
          dateTime: '2026-10-18T09:13',
          icon: CreditCard,
          description: '微信支付 ¥1,280.00',
        },
        { title: '已出库', time: '10-18 15:40', dateTime: '2026-10-18T15:40', icon: Package },
        {
          title: '运输中',
          time: '10-19 06:20',
          dateTime: '2026-10-19T06:20',
          icon: Truck,
          tone: 'accent',
          description: '快件已到达【上海徐汇营业部】',
        },
      ]}
      pending="正在派送，预计今天 18:00 前送达"
    />
  </Card>
));
