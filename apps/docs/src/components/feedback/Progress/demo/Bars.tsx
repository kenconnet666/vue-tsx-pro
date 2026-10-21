import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Progress, Strong, type StatusTone } from '@vue-tsx-pro/ui';

const quotas: [name: string, used: number, total: number, unit: string][] = [
  ['存储空间', 38.6, 50, 'GB'],
  ['本月流量', 912, 1000, 'GB'],
  ['团队成员', 7, 20, '人'],
  ['API 调用', 120_000, 100_000, '次'],
];

// 用量越接近上限越醒目：80% 以上警告，超出为危险
const toneOf = (ratio: number): StatusTone =>
  ratio > 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'accent';

export default _component(() => () => (
  <Card>
    <Flex direction="column" gap="md">
      <Strong>套餐用量</Strong>
      {quotas.map(([name, used, total, unit]) => (
        <Progress
          key={name}
          value={used}
          max={total}
          tone={toneOf(used / total)}
          label={name}
          valueLabel={`${used.toLocaleString()} / ${total.toLocaleString()} ${unit}`}
          valueText={(value, max) => `${value.toString()} / ${max.toString()} ${unit}`}
          propsValueLabel={{ tone: used > total ? 'danger' : 'muted' }}
        />
      ))}
      <Progress value={64} label="资料完善度" />
      {/* 只要标签、不要右侧的数值：showValueLabel={false} */}
      <Progress value={3} max={5} label="新手任务" showValueLabel={false} tone="success" />
    </Flex>
  </Card>
));
