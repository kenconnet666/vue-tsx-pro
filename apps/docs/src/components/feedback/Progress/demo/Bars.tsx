import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, Progress, Small, Strong, Text, type StatusTone } from '@vue-tsx-pro/ui';

const quotas: [name: string, used: number, total: number, unit: string][] = [
  ['存储空间', 38.6, 50, 'GB'],
  ['本月流量', 912, 1000, 'GB'],
  ['团队成员', 7, 20, '人'],
  ['API 调用', 120_000, 100_000, '次'],
];

// 用量越接近上限越醒目：80% 以上警告，超出为危险
const toneOf = (ratio: number): StatusTone =>
  ratio > 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'accent';

const styles = stylex.create({ row: { display: 'flex', flexDirection: 'column', gap: '_xs' } });

export default _component(() => () => (
  <Card>
    <Flex direction="column" gap="md">
      <Strong>套餐用量</Strong>
      {quotas.map(([name, used, total, unit]) => (
        <div key={name} {...stylex.attrs(styles.row)}>
          <Flex justify="between" gap="sm">
            <Text size="sm">{name}</Text>
            <Small tone={used > total ? 'danger' : 'muted'}>
              {used.toLocaleString()} / {total.toLocaleString()} {unit}
            </Small>
          </Flex>
          <Progress
            value={used}
            max={total}
            tone={toneOf(used / total)}
            aria-label={name}
            valueText={(value, max) => `${value.toString()} / ${max.toString()} ${unit}`}
          />
        </div>
      ))}
    </Flex>
  </Card>
));
