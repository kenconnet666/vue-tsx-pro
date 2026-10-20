// 填写个人信息：生日（不能晚于今天）、证件有效期（不能早于今天），段的顺序按语言，填全了才有值
import { _component } from '@vue-tsx-pro/tsx';
import { DateField, Field, Grid, Text, todayIso, useFormat } from '@vue-tsx-pro/ui';

export default _component(() => {
  const format = useFormat();
  const today = todayIso();
  let birthday = _state<string | null>('1992-08-16');
  let expires = _state<string | null>(null);
  return () => (
    <Grid minItemWidth="16rem" gap="lg">
      <Field
        label="生日"
        description={birthday ? format.date(birthday, { dateStyle: 'full' }) : '年 / 月 / 日'}
      >
        <DateField value={_bind(birthday)} max={today} name="birthday" clearable />
      </Field>
      <Field
        label="证件有效期至"
        required
        invalid={expires != null && expires < today}
        error={expires != null && expires < today ? '证件已过期' : undefined}
      >
        <DateField value={_bind(expires)} min={today} name="expires" />
      </Field>
      <Text tone="muted" size="sm">
        提交的值：birthday={birthday ?? 'null'}，expires={expires ?? 'null'}
      </Text>
    </Grid>
  );
});
