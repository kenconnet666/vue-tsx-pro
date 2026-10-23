// 按月的预算期间、按年的对比区间、精确到分钟的维护窗口：granularity 决定两端的形式与日历选什么
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DateRangePicker, Field, Grid, type DateRange } from '@vue-tsx-pro/ui';

const show = (range: DateRange<string> | null) =>
  range ? <Code>{`${range.start} – ${range.end}`}</Code> : 'null';

export default _component(() => {
  let budget = _state<DateRange<string> | null>({ start: '2026-01', end: '2026-06' });
  let years = _state<DateRange<string> | null>({ start: '2023', end: '2026' });
  let maintenance = _state<DateRange<string> | null>({
    start: '2026-10-24T22:00',
    end: '2026-10-25T06:00',
  });
  return () => (
    <Grid minItemWidth="20rem" gap="lg">
      <Field label="预算期间（按月）" description={show(budget)}>
        <DateRangePicker
          value={_bind(budget)}
          granularity="month"
          presets={[
            { label: '上半年', value: { start: '2026-01-01', end: '2026-06-30' } },
            { label: '下半年', value: { start: '2026-07-01', end: '2026-12-31' } },
            'thisYear',
          ]}
        />
      </Field>
      <Field label="对比区间（按年）" description={show(years)}>
        <DateRangePicker value={_bind(years)} granularity="year" />
      </Field>
      <Field label="维护窗口" description={show(maintenance)}>
        <DateRangePicker value={_bind(maintenance)} granularity="minute" visibleMonths={1} />
      </Field>
    </Grid>
  );
});
