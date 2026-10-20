// /date 页：日期组件的演示（浏览器测试的对象）：日历、区间日历、日期与时间的分段输入、日期选择器
import { _component } from '@vue-tsx-pro/tsx';
import {
  Calendar,
  DateField,
  DatePicker,
  Field,
  Flex,
  RangeCalendar,
  Text,
  TimeField,
  type DateRange,
} from '@vue-tsx-pro/ui';

/** 订满的日子：区间里不能夹着它们 */
const booked = new Set(['2026-10-18', '2026-10-19']);

export const DateDemo = _component(() => {
  let day = _state<string | null>('2026-10-20');
  let stay = _state<DateRange<string> | null>(null);
  let birthday = _state<string | null>(null);
  let time = _state<string | null>('09:30');
  let departure = _state<string | null>('2026-10-20');
  let meeting = _state<string | null>('2026-10-20T14:30');

  return () => (
    <Flex direction="column" gap="lg">
      <Flex gap="lg" wrap align="start">
        <Calendar class="calendar-demo" value={_bind(day)} aria-label="出发日期" min="2026-10-05" />
        <RangeCalendar
          class="range-calendar-demo"
          value={_bind(stay)}
          visibleMonths={2}
          defaultFocused="2026-10-01"
          isDateUnavailable={(date) => booked.has(date)}
          aria-label="入住与离店"
        />
      </Flex>
      <Text class="calendar-summary">
        出发：{day ?? '未选'}；入住：{stay ? `${stay.start} 至 ${stay.end}` : '未选'}
      </Text>
      <Flex gap="lg" wrap>
        <Field label="生日" class="date-field-demo">
          <DateField value={_bind(birthday)} clearable max="2026-10-20" name="birthday" />
        </Field>
        <Field label="提醒时间" class="time-field-demo">
          <TimeField value={_bind(time)} />
        </Field>
      </Flex>
      <Text class="field-summary">
        生日：{birthday ?? '未填'}；提醒：{time ?? '未填'}
      </Text>
      <Flex gap="lg" wrap>
        <Field label="出发日期" class="date-picker-demo">
          <DatePicker value={_bind(departure)} min="2026-10-05" />
        </Field>
        <Field label="会议开始" class="date-time-picker-demo">
          <DatePicker granularity="minute" value={_bind(meeting)} />
        </Field>
      </Flex>
      <Text class="picker-summary">
        出发：{departure ?? '未选'}；会议：{meeting ?? '未选'}
      </Text>
    </Flex>
  );
});
