// 滚动加载：useInfiniteList 管页码、是否还有更多与失败重试，onRangeChange 交给表格，离末尾不到 10 行时取下一页；
// 取的时候 loading，骨架接在末尾。estimateRowHeight 是行高的估计（这里内容会换行，估高一些滚动条更准）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  DataTable,
  Flex,
  InfiniteListStatus,
  Small,
  useInfiniteList,
  type DataTableColumn,
  type InfinitePage,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface Event {
  id: number;
  at: string;
  message: string;
}

const PAGE = 40;
const TOTAL = 400;
const messages = [
  '用户登录成功',
  '导出报表：2026 年 9 月销售明细（含退款与优惠券核销）',
  '支付回调重试第 2 次',
  '库存同步完成',
];

/** 模拟接口：第 page 页的事件，400ms 后返回 */
const fetchPage = (page = 0) =>
  new Promise<InfinitePage<Event, number>>((resolve) =>
    setTimeout(() => {
      const items = Array.from({ length: PAGE }, (_, index) => {
        const id = page * PAGE + index + 1;
        const minutes = String(id % 60).padStart(2, '0');
        return { id, at: `10:${minutes}`, message: messages[id % messages.length]! };
      });
      resolve({ items, next: (page + 1) * PAGE < TOTAL ? page + 1 : undefined });
    }, 400),
  );

const columns: DataTableColumn<Event>[] = [
  { key: 'id', header: '#', width: 64 },
  { key: 'at', header: '时间', width: 80 },
  { key: 'message', header: '事件', width: 280, wrap: true },
];

const styles = css.create({ table: { height: '18rem' } });

export default _component(() => {
  const events = useInfiniteList(fetchPage, { key: (event) => event.id, threshold: 10 });

  return () => (
    <Flex direction="column" gap="sm">
      <DataTable
        rows={events.items}
        columns={columns}
        getKey={(event) => String(event.id)}
        loading={events.loading}
        estimateRowHeight={44}
        onRangeChange={events.onRangeChange}
        aria-label="事件流"
        propsRoot={{ sx: styles.table }}
      />
      <InfiniteListStatus list={events} />
      <Small tone="muted">
        已加载 {events.items.length} / {TOTAL} 条
      </Small>
    </Flex>
  );
});
