// 选年份、月份、日期，或日期加时间：granularity 决定值的形式与弹出的选择
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DatePicker, Field, Grid } from '@vue-tsx-pro/ui';

export default _component(() => {
  let year = _state<string | null>('2026');
  let month = _state<string | null>('2026-10');
  let start = _state<string | null>('2026-10-23T14:30');
  return () => (
    <Grid minItemWidth="15rem" gap="lg">
      <Field label="财年" description={<Code>{year ?? 'null'}</Code>}>
        <DatePicker granularity="year" value={_bind(year)} />
      </Field>
      <Field label="账期" description={<Code>{month ?? 'null'}</Code>}>
        <DatePicker granularity="month" value={_bind(month)} />
      </Field>
      <Field label="会议开始" description={<Code>{start ?? 'null'}</Code>}>
        <DatePicker granularity="minute" value={_bind(start)} />
      </Field>
    </Grid>
  );
});
