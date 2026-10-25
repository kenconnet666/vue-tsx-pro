// 精确到哪一段（granularity）、值的类型（valueType），以及与其他输入框同一套的外观与状态
import type { Time } from '@internationalized/date';
import { Timer } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Code, Field, Grid, TimePicker } from '@vue-tsx-pro/ui';

export default _component(() => {
  let lap = _state<string | null>('00:42:15');
  let shift = _state<string | null>('08:00');
  let alarm = _state<Time | null>(null);
  return () => (
    <Grid minItemWidth="14rem" gap="lg">
      <Field label='granularity="second"' description={<Code>{lap ?? 'null'}</Code>}>
        <TimePicker _value={lap} granularity="second" step={5} icon={Timer} />
      </Field>
      <Field label='granularity="hour"' description={<Code>{shift ?? 'null'}</Code>}>
        <TimePicker _value={shift} granularity="hour" step={60} min="06:00" max="22:00" />
      </Field>
      <Field
        label='valueType="dateValue"'
        description={alarm ? `Time 对象：${alarm.hour} 时 ${alarm.minute} 分` : '值是 Time 对象'}
      >
        <TimePicker _value={alarm} valueType="dateValue" clearable />
      </Field>
      <Field label='variant="soft" radius="full"'>
        <TimePicker _value="13:30" variant="soft" radius="full" size="sm" />
      </Field>
      <Field label="只读" readonly>
        <TimePicker _value="09:00" />
      </Field>
      <Field label="不可用" disabled>
        <TimePicker _value="09:00" />
      </Field>
    </Grid>
  );
});
