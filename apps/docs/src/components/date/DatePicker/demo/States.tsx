// 外观（variant、size、radius、图标）与状态（只读、不可用、出错、必填）：与其他输入框同一套
import { CalendarClock } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { DatePicker, Field, Grid } from '@vue-tsx-pro/ui';

export default _component(() => {
  let due = _state<string | null>('2026-10-30');
  let delivery = _state<string | null>(null);
  return () => (
    <Grid minItemWidth="15rem" gap="lg">
      <Field label='variant="soft" size="sm"'>
        <DatePicker value={_bind(due)} variant="soft" size="sm" />
      </Field>
      <Field label='radius="full" size="lg" 加图标'>
        <DatePicker value={_bind(due)} radius="full" size="lg" icon={CalendarClock} />
      </Field>
      <Field label="只读" readonly description="能聚焦、能复制，不能改，也不弹日历">
        <DatePicker value="2026-10-01" />
      </Field>
      <Field label="不可用" disabled>
        <DatePicker value="2026-10-01" />
      </Field>
      <Field
        label="交付日期"
        required
        error={delivery ? undefined : '请选择交付日期'}
        description="必填；选好后错误消失"
      >
        <DatePicker value={_bind(delivery)} clearable />
      </Field>
      <Field label="日历弹在上方、并排两个月">
        <DatePicker placement="top-start" visibleMonths={2} />
      </Field>
    </Grid>
  );
});
