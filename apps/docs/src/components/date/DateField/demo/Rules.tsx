// 约束与写法：isDateUnavailable 标出不可选的日期（周末），值照样写回、控件显示出错，错误文字由 Field 给；
// hourCycle 固定 12 / 24 小时制；suffix 放在框里最后；valueType="dateValue" 一开始为空时写回 CalendarDate
import { isWeekend, parseDate, type DateValue } from '@internationalized/date';
import { CalendarCheck } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Code, DateField, Field, Grid, Icon, useLang } from '@vue-tsx-pro/ui';

export default _component(() => {
  const lang = useLang();
  const weekend = (day: DateValue) => isWeekend(day, lang.code);
  let workday = _state<string | null>('2026-10-24');
  let meeting = _state<string | null>('2026-10-20T14:30');
  let shipped = _state<DateValue | null>(null);
  return () => (
    <Grid minItemWidth="15rem" gap="lg">
      <Field
        label="到岗日期"
        description="只能选工作日"
        error={workday && weekend(parseDate(workday)) ? '这天是周末，请换一个工作日' : undefined}
      >
        <DateField _value={workday} isDateUnavailable={(_, day) => weekend(day)} />
      </Field>
      <Field label="会议开始（12 小时制）" description={<Code>{meeting ?? 'null'}</Code>}>
        <DateField
          granularity="minute"
          hourCycle="h12"
          _value={meeting}
          suffix={<Icon icon={CalendarCheck} tone="muted" />}
        />
      </Field>
      <Field
        label="发货日期"
        description={<Code>{shipped ? `CalendarDate ${shipped.toString()}` : 'null'}</Code>}
      >
        <DateField _value={shipped} valueType="dateValue" />
      </Field>
    </Grid>
  );
});
