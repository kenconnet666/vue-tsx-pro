import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Card,
  Flex,
  Small,
  Text,
  VirtualList,
  type Tone,
  type VisibleRange,
} from '@vue-tsx-pro/ui';

const levels = ['INFO', 'WARN', 'INFO', 'ERROR', 'INFO', 'DEBUG'] as const;
const levelTones: Record<(typeof levels)[number], Tone> = {
  DEBUG: 'muted',
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'danger',
};
const messages = [
  '订单服务健康检查通过',
  '支付回调重试第 2 次',
  '缓存命中率 97.4%',
  '库存同步超时，已放入重试队列',
  '用户 1024 登录成功',
  '定时任务 report:daily 开始执行，预计耗时 3 分钟，完成后会把结果推送到运营群',
];

const pageOf = (start: number) =>
  Array.from({ length: 30 }, (_, offset) => {
    const index = start + offset;
    return {
      id: index,
      level: levels[index % levels.length]!,
      message: messages[index % messages.length]!,
    };
  });

const styles = css.create({
  list: { height: '22rem' },
  padded: { paddingBlock: '_xs', paddingInline: '_md' },
  // 级别定宽，消息才对得齐
  level: { flexShrink: 0, width: '3.5em', fontFamily: '_mono' },
});

export default _component(() => {
  let entries = _state<ReturnType<typeof pageOf>>([]);
  let loading = _state(false);

  const loadMore = () => {
    if (loading) return;
    loading = true;
    setTimeout(() => {
      entries = [...entries, ...pageOf(entries.length)];
      loading = false;
    }, 900);
  };
  // 滚到最后几行时自动取下一页
  const onRangeChange = ({ endIndex }: VisibleRange) => {
    if (endIndex >= entries.length - 5) loadMore();
  };
  loadMore();

  return () => (
    <Card padding="none">
      <VirtualList
        items={entries}
        getKey={(entry) => entry.id}
        estimateSize={32}
        loading={loading}
        onRangeChange={onRangeChange}
        aria-label="运行日志"
        sx={styles.list}
      >
        {(entry) => (
          <Flex gap="sm" sx={styles.padded}>
            <Small tone={levelTones[entry.level]} sx={styles.level}>
              {entry.level}
            </Small>
            <Text size="sm">{entry.message}</Text>
          </Flex>
        )}
      </VirtualList>
      <Small tone="muted" sx={styles.padded}>
        已加载 {entries.length} 条
      </Small>
    </Card>
  );
});
