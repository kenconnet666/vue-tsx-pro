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
  designing: { label: '方案设计中', tone: 'info' },
  verifying: { label: '验证中', tone: 'info' },
  awaiting: { label: '待认定', tone: 'warning', description: '等成本团队出具验证窗结论' },
  recognized: { label: '已认定', tone: 'accent' },
  negotiating: { label: '商务洽谈中', tone: 'warning', description: '线下洽谈，60 天内回填 B 值' },
  realized: { label: '已兑现', tone: 'success' },
  closed: { label: '关闭', tone: 'success' },
});

const exceptions = createStatusMap({
  paused: { label: '暂停', tone: 'warning', icon: CirclePause },
  terminated: { label: '终止', tone: 'danger', icon: CircleSlash },
  pricing: { label: '挂账待定', tone: 'neutral', icon: Hourglass },
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
        <Select
          items={taskStatuses.options()}
          selectionMode="multiple"
          _value={_bind(filter)}
          clearable
        />
      </Field>
      <Text size="sm" tone="muted">
        “验证中”排在第 {taskStatuses.order('verifying') + 1} 个阶段；不认识的状态显示成：
        <StatusBadge statuses={taskStatuses} value="archived" />
      </Text>
    </Flex>
  );
});
