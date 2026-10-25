// 订酒店：并排两个月选入住与离店，订满的晚上不能被夹在中间；右侧算出几晚、总价
import { BedDouble } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  Card,
  daysBetween,
  Flex,
  Icon,
  RangeCalendar,
  shiftIsoDate,
  Strong,
  Text,
  todayIso,
  useFormat,
  type DateRange,
} from '@vue-tsx-pro/ui';

const styles = css.create({ side: { flexGrow: 1, flexBasis: '15rem' } });
const NIGHTLY = 528;

export default _component(() => {
  const format = useFormat();
  const today = todayIso();
  const booked = new Set([9, 10, 23].map((days) => shiftIsoDate(today, { days })));
  let stay = _state<DateRange<string> | null>({
    start: shiftIsoDate(today, { days: 2 }),
    end: shiftIsoDate(today, { days: 5 }),
  });

  return () => {
    const nights = stay ? daysBetween(stay.start, stay.end) : 0;
    const day = (date: string) =>
      format.date(date, { month: 'long', day: 'numeric', weekday: 'short' });
    return (
      <Flex gap="xl" wrap align="start">
        <RangeCalendar
          _value={_bind(stay)}
          visibleMonths={2}
          min={today}
          isDateUnavailable={(date) => booked.has(date)}
          aria-label="入住与离店"
        />
        <Card sx={styles.side} header={<Strong>湖景大床房</Strong>}>
          <Flex direction="column" gap="sm">
            <Flex align="center" gap="sm">
              <Icon icon={BedDouble} />
              <Text>
                {stay ? `${day(stay.start)} 入住 → ${day(stay.end)} 离店` : '先点入住，再点离店'}
              </Text>
            </Flex>
            {nights > 0 && (
              <Text tone="muted" size="sm">
                {nights} 晚 × {format.currency(NIGHTLY)}
              </Text>
            )}
            <Strong size="lg">{format.currency(nights * NIGHTLY)}</Strong>
            <Button disabled={nights === 0}>预订</Button>
          </Flex>
        </Card>
      </Flex>
    );
  };
});
