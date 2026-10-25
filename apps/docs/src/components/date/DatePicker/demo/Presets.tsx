// 交货日期：日历旁边是常用的快捷选项（按今天算），日历下方的“今天”；今天之前不能选，所以“昨天”不可用
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DatePicker, Field, Grid, shiftIsoDate, todayIso } from '@vue-tsx-pro/ui';

/** 下个月的 1 日 */
const nextMonthStart = () => `${shiftIsoDate(todayIso(), { months: 1 }).slice(0, 7)}-01`;
/** 这个月的最后一天：下个月 1 日的前一天 */
const monthEnd = () => shiftIsoDate(nextMonthStart(), { days: -1 });

export default _component(() => {
  const today = todayIso();
  let delivery = _state<string | null>(null);
  let period = _state<string | null>(null);
  return () => (
    <Grid minItemWidth="16rem" gap="lg">
      <Field label="交货日期" description={delivery ? <Code>{delivery}</Code> : '今天之前不能选'}>
        <DatePicker
          _value={delivery}
          min={today}
          presets={[
            { label: '昨天', value: () => shiftIsoDate(todayIso(), { days: -1 }) },
            { label: '明天', value: () => shiftIsoDate(todayIso(), { days: 1 }) },
            { label: '一周后', value: () => shiftIsoDate(todayIso(), { weeks: 1 }) },
            { label: '月底', value: monthEnd },
            { label: '下月初', value: nextMonthStart },
          ]}
        />
      </Field>
      <Field label="账期" description={period ? <Code>{period}</Code> : '日历下方是“本月”'}>
        <DatePicker _value={period} granularity="month" />
      </Field>
    </Grid>
  );
});
