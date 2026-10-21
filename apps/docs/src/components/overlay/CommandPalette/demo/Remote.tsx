import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, CommandPalette, Flex, Small } from '@vue-tsx-pro/ui';
import { watch } from 'vue';

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: '待付款' | '已发货' | '已完成';
}

const customers = ['林小满', '周一航', '陈思远', '王可欣', '赵子墨', '孙若溪'];
const statuses: Order['status'][] = ['待付款', '已发货', '已完成'];
const orders: Order[] = Array.from({ length: 60 }, (_, index) => ({
  id: `A-${10200 + index * 7}`,
  customer: customers[index % customers.length]!,
  amount: 120 + ((index * 389) % 2400),
  status: statuses[index % statuses.length]!,
}));

/** 模拟服务端搜索：按订单号、客户名匹配，延迟 450 毫秒返回 */
function searchOrders(keyword: string): Promise<Order[]> {
  const text = keyword.trim().toLowerCase();
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          orders
            .filter(
              (order) =>
                !text || order.id.toLowerCase().includes(text) || order.customer.includes(text),
            )
            .slice(0, 20),
        ),
      450,
    ),
  );
}

export default _component(() => {
  let open = _state(false);
  let keyword = _state('');
  let results = _state<Order[]>([]);
  let loading = _state(false);
  let picked = _state('');
  let latest = 0;

  // 输入变了就重新搜索；晚到的旧结果丢掉
  watch(
    () => keyword,
    async (text) => {
      const request = ++latest;
      loading = true;
      const found = await searchOrders(text);
      if (request !== latest) return;
      results = found;
      loading = false;
    },
    { immediate: true },
  );

  return () => (
    <Flex direction="column" gap="md" align="start">
      <CommandPalette
        open={_bind(open)}
        inputValue={_bind(keyword)}
        items={results}
        filter={false}
        loading={loading}
        hotkey={false}
        label="搜索订单"
        placeholder="订单号或客户名"
        toOption={(order) => ({
          value: order.id,
          label: `${order.id} · ${order.customer}`,
          description: `¥${order.amount.toLocaleString('zh-CN')}`,
          group: order.status,
        })}
        onAction={(order) => (picked = `${order.id}（${order.customer}，${order.status}）`)}
        trigger={(props) => (
          <Button {...props} variant="outline" tone="neutral" icon={Search}>
            搜索订单
          </Button>
        )}
      />
      <Small tone="muted">
        {picked ? `打开了订单 ${picked}` : '每次输入都向“服务端”查询，结果约半秒后到'}
      </Small>
    </Flex>
  );
});
