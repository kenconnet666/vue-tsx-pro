// 运行日志：useInfiniteList 一页页取，滚到最后几行时取下一页；第 3 页第一次会失败，列表下方出现“重试”
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Flex,
  InfiniteListStatus,
  Small,
  Text,
  useInfiniteList,
  VirtualList,
  type InfinitePage,
  type TextTone,
} from '@zerodep-dev/vue-tsx-pro-ui';

const levels = ['INFO', 'WARN', 'INFO', 'ERROR', 'INFO', 'DEBUG'] as const;
const levelTones: Record<(typeof levels)[number], TextTone> = {
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

interface LogEntry {
  id: number;
  level: (typeof levels)[number];
  message: string;
}

const PAGE = 30;
const PAGES = 5;

const styles = css.create({
  list: { height: '22rem' },
  padded: { paddingBlock: '_xs', paddingInline: '_md' },
  // 级别定宽，消息才对得齐
  level: { flexShrink: 0, width: '3.5em', fontFamily: '_mono' },
});

export default _component(() => {
  let failed = false;
  /** 假的日志接口：第 page 页，900 ms 后返回；第 3 页第一次失败 */
  const fetchLogs = (page = 1) =>
    new Promise<InfinitePage<LogEntry, number>>((resolve, reject) =>
      setTimeout(() => {
        if (page === 3 && !failed) {
          failed = true;
          reject(new Error('网关超时'));
          return;
        }
        const items = Array.from({ length: PAGE }, (_, offset) => {
          const index = (page - 1) * PAGE + offset;
          return {
            id: index,
            level: levels[index % levels.length]!,
            message: messages[index % messages.length]!,
          };
        });
        resolve({ items, next: page < PAGES ? page + 1 : undefined });
      }, 900),
    );
  const logs = useInfiniteList(fetchLogs, { key: (entry) => entry.id });

  return () => (
    <Card padding="none">
      <VirtualList
        items={logs.items}
        getKey={(entry) => entry.id}
        estimateSize={32}
        loading={logs.loading}
        onRangeChange={logs.onRangeChange}
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
      <InfiniteListStatus list={logs} />
      <Small tone="muted" sx={styles.padded}>
        已加载 {logs.items.length} / {PAGE * PAGES} 条
      </Small>
    </Card>
  );
});
