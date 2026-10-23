// 约会议：工作时间内每半小时一档，午休 12:00–13:30 不可选；提醒每 15 分钟一档，12 小时制；不在列表里的时间也能直接键入
import { _component } from '@vue-tsx-pro/tsx';
import { Code, Field, Grid, TimePicker } from '@vue-tsx-pro/ui';

export default _component(() => {
  let start = _state<string | null>('10:30');
  let remind = _state<string | null>(null);
  let wake = _state<string | null>('06:45');
  return () => (
    <Grid minItemWidth="14rem" gap="lg">
      <Field label="会议开始" description={<Code>{start ?? 'null'}</Code>}>
        <TimePicker
          value={_bind(start)}
          min="09:00"
          max="18:00"
          // 午休：列表里不可用，键入时显示出错
          isTimeUnavailable={(time) => time >= '12:00' && time < '13:30'}
        />
      </Field>
      <Field label="提醒时间" description={<Code>{remind ?? 'null'}</Code>}>
        <TimePicker value={_bind(remind)} step={15} hourCycle="h12" clearable />
      </Field>
      <Field label="闹钟" description="列表每小时一档，06:45 这样的时间直接键入">
        <TimePicker value={_bind(wake)} step={60} />
      </Field>
    </Grid>
  );
});
