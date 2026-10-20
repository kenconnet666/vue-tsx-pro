// 精确到哪一段：年、年月、年月日、日期加时分（同原生的 month、date、datetime-local），值的格式跟着变
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DateField, Field, Grid } from '@vue-tsx-pro/ui';

export default _component(() => {
  let year = _state<string | null>('2026');
  let month = _state<string | null>('2026-10');
  let day = _state<string | null>('2026-10-20');
  let at = _state<string | null>('2026-10-20T14:30');
  let precise = _state<string | null>('2026-10-20T14:30:15');
  return () => (
    <Grid minItemWidth="15rem" gap="lg">
      <Field label="年度" description={<Code>{year ?? 'null'}</Code>}>
        <DateField granularity="year" value={_bind(year)} />
      </Field>
      <Field label="账期" description={<Code>{month ?? 'null'}</Code>}>
        <DateField granularity="month" value={_bind(month)} />
      </Field>
      <Field label="发货日期" description={<Code>{day ?? 'null'}</Code>}>
        <DateField value={_bind(day)} />
      </Field>
      <Field label="会议开始" description={<Code>{at ?? 'null'}</Code>}>
        <DateField granularity="minute" value={_bind(at)} />
      </Field>
      <Field label="日志时间" description={<Code>{precise ?? 'null'}</Code>}>
        <DateField granularity="second" value={_bind(precise)} />
      </Field>
    </Grid>
  );
});
