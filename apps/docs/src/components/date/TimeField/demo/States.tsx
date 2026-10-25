// 外观、图标、清空按钮、值的类型与状态：与其他输入框同一套
import type { Time } from '@internationalized/date';
import { AlarmClock, Clock } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Grid, TimeField } from '@vue-tsx-pro/ui';

export default _component(() => {
  let start = _state<string | null>('09:30');
  let alarm = _state<Time | null>(null);
  return () => (
    <Grid minItemWidth="13rem" gap="lg">
      <Field label="图标与清空按钮">
        <TimeField _value={_bind(start)} icon={Clock} clearable />
      </Field>
      <Field
        label='valueType="dateValue"'
        description={alarm ? `Time：${alarm.toString()}` : '值是 Time 对象'}
      >
        <TimeField _value={_bind(alarm)} valueType="dateValue" icon={AlarmClock} />
      </Field>
      <Field label='variant="soft" size="lg"'>
        <TimeField _value="18:00" variant="soft" size="lg" />
      </Field>
      <Field label="必填" required error={start ? undefined : '请填写开始时间'}>
        <TimeField _value={_bind(start)} />
      </Field>
      <Field label="只读" readonly>
        <TimeField _value="12:00" />
      </Field>
      <Field label="不可用" disabled>
        <TimeField _value="12:00" />
      </Field>
    </Grid>
  );
});
