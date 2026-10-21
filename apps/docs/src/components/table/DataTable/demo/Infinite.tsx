// 滚动加载：onRangeChange 报告可见行的范围，离末尾不到 10 行时取下一页；取的时候 loading，表头下方一条进度条。
// estimateRowHeight 是行高的估计（这里内容会换行，估高一些滚动条更准）
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { DataTable, Flex, Small, type DataTableColumn } from '@vue-tsx-pro/ui';

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
const fetchPage = (page: number) =>
  new Promise<Event[]>((resolve) =>
    setTimeout(
      () =>
        resolve(
          Array.from({ length: PAGE }, (_, index) => {
            const id = page * PAGE + index + 1;
            const minutes = String(id % 60).padStart(2, '0');
            return { id, at: `10:${minutes}`, message: messages[id % messages.length]! };
          }),
        ),
      400,
    ),
  );

const columns: DataTableColumn<Event>[] = [
  { key: 'id', header: '#', width: 64 },
  { key: 'at', header: '时间', width: 80 },
  { key: 'message', header: '事件', width: 280, wrap: true },
];

const styles = stylex.create({ table: { height: '18rem' } });

export default _component(() => {
  let rows = _state.raw<Event[]>([]);
  let loading = _state(false);

  async function loadMore() {
    if (loading || rows.length >= TOTAL) return;
    loading = true;
    rows = [...rows, ...(await fetchPage(rows.length / PAGE))];
    loading = false;
  }
  void loadMore();

  return () => (
    <Flex direction="column" gap="sm">
      <DataTable
        rows={rows}
        columns={columns}
        getKey={(event) => String(event.id)}
        loading={loading}
        estimateRowHeight={44}
        onRangeChange={({ endIndex }) => {
          if (endIndex >= rows.length - 10) void loadMore();
        }}
        aria-label="事件流"
        propsRoot={{ sx: styles.table }}
      />
      <Small tone="muted">
        已加载 {rows.length} / {TOTAL} 条
      </Small>
    </Flex>
  );
});
