// 状态映射：任务的八个阶段与三个异常状态写在一处，定义顺序就是阶段顺序；
// StatusBadge 按它显示名字与色调，筛选的下拉选项也从它来
import { ChevronRight, CirclePause, CircleSlash, Hourglass } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  createStatusMap,
  Field,
  Flex,
  Icon,
  Select,
  Small,
  StatusBadge,
  Text,
} from '@vue-tsx-pro/ui';

const taskStatuses = createStatusMap({
  pending: { label: '待启动', tone: 'neutral' },
  designing: { label: '设计中', tone: 'info' },
  verifying: { label: '测试中', tone: 'info' },
  awaiting: { label: '待验收', tone: 'warning', description: '等需求方出具验收报告' },
  accepted: { label: '已验收', tone: 'accent' },
  settling: { label: '结算中', tone: 'warning', description: '财务对账，30 天内回填结算金额' },
  settled: { label: '已结算', tone: 'success' },
  closed: { label: '关闭', tone: 'success' },
});

const exceptions = createStatusMap({
  paused: { label: '暂停', tone: 'warning', icon: CirclePause },
  terminated: { label: '终止', tone: 'danger', icon: CircleSlash },
  queued: { label: '待排期', tone: 'neutral', icon: Hourglass },
});

export default _component(() => {
  let filter = _state<string[]>(['verifying', 'awaiting']);
  return () => (
    <Flex direction="column" gap="lg">
      <Flex align="center" gap="xs" wrap>
        {taskStatuses.keys.map((key, index) => (
          <Flex key={key} inline align="center" gap="xs">
            {index > 0 && <Icon icon={ChevronRight} tone="muted" aria-hidden />}
            <StatusBadge statuses={taskStatuses} value={key} radius="full" />
          </Flex>
        ))}
      </Flex>
      <Flex align="center" gap="sm" wrap>
        <Small tone="muted">异常状态</Small>
        {exceptions.keys.map((key) => (
          <StatusBadge key={key} statuses={exceptions} value={key} variant="outline" />
        ))}
      </Flex>
      <Field label="按状态筛选" description="选项来自同一份状态映射，带说明">
        <Select items={taskStatuses.options()} selectionMode="multiple" _value={filter} clearable />
      </Field>
      <Text size="sm" tone="muted">
        “测试中”排在第 {taskStatuses.order('verifying') + 1} 个阶段；不认识的状态显示成：
        <StatusBadge statuses={taskStatuses} value="archived" />
      </Text>
    </Flex>
  );
});
