// 请假：周末不可选，但请假区间可以跨过周末（allowsUnavailableInRange），只算工作日
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Flex,
  isoDayOfWeek,
  RangeCalendar,
  shiftIsoDate,
  Text,
  type DateRange,
} from '@vue-tsx-pro/ui';

const weekend = (date: string) => isoDayOfWeek(date) % 6 === 0;

/** 区间里的工作日天数 */
function workdays({ start, end }: DateRange<string>) {
  let count = 0;
  for (let date = start; date <= end; date = shiftIsoDate(date, { days: 1 })) {
    if (!weekend(date)) count += 1;
  }
  return count;
}

export default _component(() => {
  let leave = _state<DateRange<string> | null>(null);
  return () => (
    <Flex direction="column" gap="md">
      <RangeCalendar
        _value={_bind(leave)}
        visibleMonths={2}
        isDateUnavailable={weekend}
        allowsUnavailableInRange
        aria-label="请假日期"
      />
      <Flex gap="sm" align="center">
        <Text>{leave ? `${leave.start} 至 ${leave.end}` : '选开始与结束的工作日'}</Text>
        {leave && <Badge variant="soft">共 {workdays(leave)} 个工作日</Badge>}
      </Flex>
    </Flex>
  );
});
