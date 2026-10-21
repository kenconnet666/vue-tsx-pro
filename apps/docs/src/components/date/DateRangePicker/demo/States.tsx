// 只显示一个月、允许区间夹着不可选的日期（周末不算工作日，但请假可以跨周末），以及外观与状态
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DateRangePicker, Field, Grid, todayIso, type DateRange } from '@vue-tsx-pro/ui';

/** ISO 日期是不是周末 */
const isWeekend = (iso: string) => [0, 6].includes(new Date(`${iso}T00:00`).getDay());

export default _component(() => {
  let leave = _state<DateRange<string> | null>(null);
  return () => (
    <Grid minItemWidth="20rem" gap="lg">
      <Field
        label="请假"
        description={
          leave ? <Code>{`${leave.start} – ${leave.end}`}</Code> : '起止只能是工作日，可以跨周末'
        }
      >
        <DateRangePicker
          value={_bind(leave)}
          min={todayIso()}
          visibleMonths={1}
          isDateUnavailable={isWeekend}
          allowsUnavailableInRange
          clearable
        />
      </Field>
      <Field label='variant="soft" size="sm"'>
        <DateRangePicker
          value={{ start: '2026-10-01', end: '2026-10-07' }}
          variant="soft"
          size="sm"
        />
      </Field>
      <Field label="只读" readonly>
        <DateRangePicker value={{ start: '2026-10-01', end: '2026-10-07' }} />
      </Field>
      <Field label="不可用" disabled>
        <DateRangePicker value={{ start: '2026-10-01', end: '2026-10-07' }} />
      </Field>
    </Grid>
  );
});
