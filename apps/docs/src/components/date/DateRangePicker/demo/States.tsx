// 只显示一个月、允许区间夹着不可选的日期（周末不算工作日，但请假可以跨周末）；
// valueType="dateValue" 一开始为空时也写回 CalendarDate，能直接算天数；以及外观与状态
import type { CalendarDate } from '@internationalized/date';
import { Plane } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Code,
  DateRangePicker,
  Field,
  Grid,
  todayIso,
  type DateRange,
} from '@zerodep-dev/vue-tsx-pro-ui';

/** ISO 日期是不是周末 */
const isWeekend = (iso: string) => [0, 6].includes(new Date(`${iso}T00:00`).getDay());

export default _component(() => {
  let leave = _state<DateRange<string> | null>(null);
  let trip = _state<DateRange<CalendarDate> | null>(null);
  return () => (
    <Grid minItemWidth="20rem" gap="lg">
      <Field
        label="请假"
        description={
          leave ? <Code>{`${leave.start} – ${leave.end}`}</Code> : '起止只能是工作日，可以跨周末'
        }
      >
        <DateRangePicker
          _value={leave}
          min={todayIso()}
          visibleMonths={1}
          isDateUnavailable={isWeekend}
          allowsUnavailableInRange
          clearable
        />
      </Field>
      <Field
        label="出差"
        required
        error={trip ? undefined : '请选择出差日期'}
        description={
          trip ? `共 ${trip.end.compare(trip.start) + 1} 天` : '值是 CalendarDate，选好后算出天数'
        }
      >
        <DateRangePicker _value={trip} valueType="dateValue" icon={Plane} radius="full" />
      </Field>
      <Field label='variant="soft" size="sm"'>
        <DateRangePicker
          _value={{ start: '2026-10-01', end: '2026-10-07' }}
          variant="soft"
          size="sm"
        />
      </Field>
      <Field label="只读" readonly>
        <DateRangePicker _value={{ start: '2026-10-01', end: '2026-10-07' }} />
      </Field>
      <Field label="不可用" disabled>
        <DateRangePicker _value={{ start: '2026-10-01', end: '2026-10-07' }} />
      </Field>
    </Grid>
  );
});
