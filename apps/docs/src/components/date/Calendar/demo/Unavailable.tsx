// 会议室预约：只能约今天起 30 天内的工作日，节假日与已约满的日子不可选（仍能用方向键经过，读屏念“不可用”）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Badge,
  Calendar,
  Card,
  Flex,
  isoDayOfWeek,
  shiftIsoDate,
  Strong,
  Text,
  todayIso,
  useFormat,
} from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({ side: { flexGrow: 1, flexBasis: '16rem' } });

export default _component(() => {
  const format = useFormat();
  const today = todayIso();
  const last = shiftIsoDate(today, { days: 30 });
  // 演示数据：从今天往后数的第 3、4、11 个日子已约满，第 8 天是节假日
  const fullyBooked = new Set([3, 4, 11].map((days) => shiftIsoDate(today, { days })));
  const holiday = shiftIsoDate(today, { days: 8 });
  const weekend = (date: string) => isoDayOfWeek(date) % 6 === 0;
  const reason = (date: string) =>
    weekend(date) ? '周末' : date === holiday ? '节假日' : fullyBooked.has(date) ? '已约满' : null;
  let picked = _state<string | null>(null);

  return () => (
    <Flex gap="xl" wrap align="start">
      <Calendar
        _value={picked}
        min={today}
        max={last}
        isDateUnavailable={(date) => reason(date) != null}
        aria-label="预约日期"
      />
      <Card sx={styles.side} header={<Strong>3 号会议室 · 12 人</Strong>}>
        <Flex direction="column" gap="sm">
          <Text>
            {picked
              ? `已选：${format.date(picked, { dateStyle: 'full' })}`
              : '选一个可预约的工作日'}
          </Text>
          <Text tone="muted" size="sm">
            可预约：{format.date(today, { month: 'long', day: 'numeric' })} 至{' '}
            {format.date(last, { month: 'long', day: 'numeric' })}
          </Text>
          <Flex gap="sm" wrap>
            <Badge variant="soft" tone="neutral">
              周末不开放
            </Badge>
            <Badge variant="soft" tone="warning">
              {format.date(holiday, { month: 'numeric', day: 'numeric' })} 节假日
            </Badge>
            <Badge variant="soft" tone="danger">
              {fullyBooked.size} 天已约满
            </Badge>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
});
