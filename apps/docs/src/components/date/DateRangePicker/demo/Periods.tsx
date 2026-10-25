// 按月的预算期间、按年的对比区间、滚动四个季度、排班周、精确到分钟的维护窗口：granularity 决定两端的形式与日历选什么
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DateRangePicker, Field, Grid, type DateRange } from '@vue-tsx-pro/ui';

const show = (range: DateRange<string> | null) =>
  range ? <Code>{`${range.start} – ${range.end}`}</Code> : 'null';

export default _component(() => {
  let budget = _state<DateRange<string> | null>({ start: '2026-01', end: '2026-06' });
  let years = _state<DateRange<string> | null>({ start: '2023', end: '2026' });
  let quarters = _state<DateRange<string> | null>({ start: '2025-Q4', end: '2026-Q3' });
  let weeks = _state<DateRange<string> | null>(null);
  let maintenance = _state<DateRange<string> | null>({
    start: '2026-10-24T22:00',
    end: '2026-10-25T06:00',
  });
  return () => (
    <Grid minItemWidth="20rem" gap="lg">
      <Field label="预算期间（按月）" description={show(budget)}>
        <DateRangePicker
          _value={budget}
          granularity="month"
          presets={[
            { label: '上半年', value: { start: '2026-01-01', end: '2026-06-30' } },
            { label: '下半年', value: { start: '2026-07-01', end: '2026-12-31' } },
            'thisYear',
          ]}
        />
      </Field>
      <Field label="对比区间（按年）" description={show(years)}>
        <DateRangePicker _value={years} granularity="year" />
      </Field>
      <Field label="滚动四个季度" description={show(quarters)}>
        <DateRangePicker _value={quarters} granularity="quarter" />
      </Field>
      <Field label="排班周（按 ISO 周）" description={show(weeks)}>
        <DateRangePicker _value={weeks} granularity="week" visibleMonths={1} />
      </Field>
      <Field label="维护窗口" description={show(maintenance)}>
        <DateRangePicker _value={maintenance} granularity="minute" visibleMonths={1} />
      </Field>
    </Grid>
  );
});
