// 报表的统计区间带快捷区间，今天之后不能选；酒店入住与离店，订满的日子不能夹在中间
import { _component } from '@vue-tsx-pro/tsx';
import {
  Code,
  DateRangePicker,
  Field,
  Grid,
  shiftIsoDate,
  todayIso,
  useFormat,
  type DateRange,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  const format = useFormat();
  const today = todayIso();
  // 演示数据：从今天往后数的第 5、6 天已订满
  const booked = new Set([5, 6].map((days) => shiftIsoDate(today, { days })));
  let report = _state<DateRange<string> | null>({
    start: shiftIsoDate(today, { days: -6 }),
    end: today,
  });
  let stay = _state<DateRange<string> | null>(null);
  const nights = (range: DateRange<string>) =>
    Math.round((Date.parse(range.end) - Date.parse(range.start)) / 86_400_000);
  return () => (
    <Grid minItemWidth="20rem" gap="lg">
      <Field
        label="统计区间"
        description={report ? <Code>{`${report.start} – ${report.end}`}</Code> : '选一个区间'}
      >
        <DateRangePicker
          value={_bind(report)}
          max={today}
          presets={['today', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth', 'thisYear']}
          startName="from"
          endName="to"
        />
      </Field>
      <Field
        label="入住与离店"
        description={
          stay
            ? `${format.date(stay.start, { dateStyle: 'medium' })} 入住，共 ${nights(stay)} 晚`
            : '订满的日子不能夹在中间'
        }
      >
        <DateRangePicker
          value={_bind(stay)}
          min={today}
          isDateUnavailable={(date) => booked.has(date)}
          clearable
        />
      </Field>
    </Grid>
  );
});
