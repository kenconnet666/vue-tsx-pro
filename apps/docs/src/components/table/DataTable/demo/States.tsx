import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  DataTable,
  Flex,
  ToggleGroup,
  ToggleItem,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';

interface Log {
  id: number;
  level: string;
  message: string;
}

const sample: Log[] = Array.from({ length: 6 }, (_, index) => ({
  id: index,
  level: ['INFO', 'WARN', 'ERROR'][index % 3]!,
  message: ['服务健康检查通过', '支付回调重试第 2 次', '库存同步超时'][index % 3]!,
}));

const columns: DataTableColumn<Log>[] = [
  { key: 'id', header: '#', width: 56 },
  { key: 'level', header: '级别', width: 90 },
  { key: 'message', header: '内容', width: 260, wrap: true },
];

type Mode = 'data' | 'loading' | 'refreshing' | 'empty';

const styles = css.create({ table: { height: '16rem' } });

export default _component(() => {
  let mode = _state<Mode>('loading');
  let density = _state<'compact' | 'standard' | 'comfortable'>('compact');
  return () => (
    <Flex direction="column" gap="sm">
      <Flex gap="sm" wrap>
        <ToggleGroup _value={mode} required size="sm" aria-label="状态">
          <ToggleItem value="data">有数据</ToggleItem>
          <ToggleItem value="loading">首次加载</ToggleItem>
          <ToggleItem value="refreshing">刷新中</ToggleItem>
          <ToggleItem value="empty">没有数据</ToggleItem>
        </ToggleGroup>
        <ToggleGroup _value={density} required size="sm" aria-label="密度">
          <ToggleItem value="compact">紧凑</ToggleItem>
          <ToggleItem value="standard">标准</ToggleItem>
          <ToggleItem value="comfortable">宽松</ToggleItem>
        </ToggleGroup>
      </Flex>
      <DataTable
        rows={mode === 'empty' || mode === 'loading' ? [] : sample}
        columns={columns}
        getKey={(log) => String(log.id)}
        loading={mode === 'loading' || mode === 'refreshing'}
        density={density}
        variant="ghost"
        striped
        empty={
          <Flex direction="column" align="center" gap="sm">
            今天还没有日志
            <Button size="sm" variant="soft" onClick={() => (mode = 'data')}>
              载入示例数据
            </Button>
          </Flex>
        }
        aria-label="运行日志"
        propsRoot={{ sx: styles.table }}
      />
    </Flex>
  );
});
