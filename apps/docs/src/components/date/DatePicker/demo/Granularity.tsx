// 选年份、季度、月份、周、日期，或日期加时间：granularity 决定值的形式与弹出的选择；会议只能约在 9:00–18:00
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DatePicker, Field, Grid } from '@vue-tsx-pro/ui';

export default _component(() => {
  let year = _state<string | null>('2026');
  let quarter = _state<string | null>('2026-Q4');
  let month = _state<string | null>('2026-10');
  let week = _state<string | null>('2026-W43');
  let start = _state<string | null>('2026-10-23T14:30');
  return () => (
    <Grid minItemWidth="15rem" gap="lg">
      <Field label="财年" description={<Code>{year ?? 'null'}</Code>}>
        <DatePicker granularity="year" value={_bind(year)} />
      </Field>
      <Field label="考核季度" description={<Code>{quarter ?? 'null'}</Code>}>
        <DatePicker granularity="quarter" value={_bind(quarter)} />
      </Field>
      <Field label="账期" description={<Code>{month ?? 'null'}</Code>}>
        <DatePicker granularity="month" value={_bind(month)} />
      </Field>
      <Field label="周报" description={<Code>{week ?? 'null'}</Code>}>
        <DatePicker granularity="week" value={_bind(week)} />
      </Field>
      <Field label="会议开始" description={start ? <Code>{start}</Code> : '只能约在 9:00–18:00'}>
        <DatePicker
          granularity="minute"
          value={_bind(start)}
          // 工作时间之外键入时显示出错
          isTimeUnavailable={(time) => time < '09:00' || time >= '18:00'}
        />
      </Field>
    </Grid>
  );
});
