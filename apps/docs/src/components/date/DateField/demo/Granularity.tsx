// 精确到哪一段：年、年月、年月日、日期加时分（同原生的 month、date、datetime-local），值的格式跟着变
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, DateField, Field, Grid } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let year = _state<string | null>('2026');
  let month = _state<string | null>('2026-10');
  let day = _state<string | null>('2026-10-20');
  let at = _state<string | null>('2026-10-20T14:30');
  let precise = _state<string | null>('2026-10-20T14:30:15');
  return () => (
    <Grid minItemWidth="15rem" gap="lg">
      <Field label="年度" description={<Code>{year ?? 'null'}</Code>}>
        <DateField granularity="year" _value={year} />
      </Field>
      <Field label="账期" description={<Code>{month ?? 'null'}</Code>}>
        <DateField granularity="month" _value={month} />
      </Field>
      <Field label="发货日期" description={<Code>{day ?? 'null'}</Code>}>
        <DateField _value={day} />
      </Field>
      <Field label="会议开始" description={<Code>{at ?? 'null'}</Code>}>
        <DateField granularity="minute" _value={at} />
      </Field>
      <Field label="日志时间" description={<Code>{precise ?? 'null'}</Code>}>
        <DateField granularity="second" _value={precise} />
      </Field>
    </Grid>
  );
});
