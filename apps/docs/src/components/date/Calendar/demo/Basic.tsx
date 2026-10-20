// 机票的出发日期：今天之前不能选；旁边是选中日期的说明与几个快捷日期
import { PlaneTakeoff } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Button,
  Calendar,
  Card,
  daysBetween,
  Flex,
  Icon,
  isoDayOfWeek,
  shiftIsoDate,
  Strong,
  Text,
  todayIso,
  useFormat,
} from '@vue-tsx-pro/ui';

const styles = stylex.create({ side: { flexGrow: 1, flexBasis: '16rem' } });

export default _component(() => {
  const format = useFormat();
  const today = todayIso();
  const quick = [
    ['今天', today],
    ['明天', shiftIsoDate(today, { days: 1 })],
    ['下周一', shiftIsoDate(today, { days: 8 - (isoDayOfWeek(today) || 7) })],
    ['一个月后', shiftIsoDate(today, { months: 1 })],
  ] as const;
  let departure = _state<string | null>(shiftIsoDate(today, { days: 3 }));

  return () => {
    const days = departure ? daysBetween(today, departure) : null;
    return (
      <Flex gap="xl" wrap align="start">
        <Calendar value={_bind(departure)} min={today} aria-label="出发日期" />
        <Card sx={styles.side} header={<Strong>上海 → 成都</Strong>}>
          <Flex direction="column" gap="md">
            <Flex align="center" gap="sm">
              <Icon icon={PlaneTakeoff} />
              <Text>
                {departure ? format.date(departure, { dateStyle: 'full' }) : '还没选出发日期'}
              </Text>
            </Flex>
            {days != null && (
              <Text tone="muted" size="sm">
                {days === 0 ? '今天出发' : `${days} 天后出发`}
              </Text>
            )}
            <Flex gap="sm" wrap>
              {quick.map(([label, date]) => (
                <Button
                  key={label}
                  size="sm"
                  variant={departure === date ? 'solid' : 'soft'}
                  onClick={() => (departure = date)}
                >
                  {label}
                </Button>
              ))}
            </Flex>
          </Flex>
        </Card>
      </Flex>
    );
  };
});
