// 外观与状态：和 TextField 同一个输入框外壳（样式、尺寸、圆角、图标、清空），只读、不可用、出错
import { CalendarDays } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { DateField, Field, Grid } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Grid minItemWidth="15rem" gap="lg">
    <Field label="surface（默认）">
      <DateField _value="2026-10-20" icon={CalendarDays} clearable />
    </Field>
    <Field label="soft">
      <DateField _value="2026-10-20" variant="soft" icon={CalendarDays} />
    </Field>
    <Field label={'size="sm" · radius="full"'}>
      <DateField _value="2026-10-20" size="sm" radius="full" />
    </Field>
    <Field label={'size="lg"'}>
      <DateField _value="2026-10-20" size="lg" />
    </Field>
    <Field label="只读">
      <DateField _value="2026-10-20" readonly />
    </Field>
    <Field label="不可用">
      <DateField _value="2026-10-20" disabled />
    </Field>
    <Field label="出错" error="早于开学日期">
      <DateField _value="2026-08-01" min="2026-09-01" />
    </Field>
    <Field label="空着">
      <DateField />
    </Field>
  </Grid>
));
