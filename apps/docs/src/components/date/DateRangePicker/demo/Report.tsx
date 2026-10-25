// 报表的统计区间带快捷区间（内置的与自己的结算周期），今天之后不能选；酒店入住与离店，订满的日子不能夹在中间
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

/** 本结算周期：上月 26 日到本月 25 日（今天过了 25 日就是本月 26 日到下月 25 日） */
function settlementPeriod(): DateRange<string> {
  const today = todayIso();
  const anchor = Number(today.slice(8)) > 25 ? today : shiftIsoDate(today, { months: -1 });
  const start = `${anchor.slice(0, 7)}-26`;
  return { start, end: shiftIsoDate(shiftIsoDate(start, { months: 1 }), { days: -1 }) };
}

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
          _value={_bind(report)}
          max={today}
          presets={[
            'today',
            'last7Days',
            'last30Days',
            'thisMonth',
            'lastMonth',
            // 自己的快捷区间：结算周期是上月 26 日到本月 25 日
            { label: '本结算周期', value: settlementPeriod },
            'thisYear',
          ]}
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
          _value={_bind(stay)}
          min={today}
          isDateUnavailable={(date) => booked.has(date)}
          clearable
        />
      </Field>
    </Grid>
  );
});
