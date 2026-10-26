// 一排指标：按宽度换行，同一行里之间一条竖线；要引起注意的数用 tone 标红
import { AlarmClock, BadgeCheck, CalendarClock, PackageCheck } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Link, Small, Stat, StatGroup } from '@zerodep-dev/vue-tsx-pro-ui';

const items = [
  { label: '超时', icon: AlarmClock, value: 10, urgent: true },
  { label: '7 天内到期', icon: CalendarClock, value: 6, urgent: false },
  { label: '待验收', icon: BadgeCheck, value: 5, urgent: false },
  { label: '可关闭', icon: PackageCheck, value: 0, urgent: false },
];

export default _component(() => () => (
  <Card variant="outline" padding="md" header="需要处理">
    <StatGroup>
      {items.map((item) => (
        <Stat
          key={item.label}
          label={item.label}
          icon={item.icon}
          value={item.value}
          unit="项"
          tone={item.urgent && item.value > 0 ? 'danger' : undefined}
          footer={item.value > 0 ? <Link href="#">去处理</Link> : <Small tone="muted">没有</Small>}
        />
      ))}
    </StatGroup>
  </Card>
));
