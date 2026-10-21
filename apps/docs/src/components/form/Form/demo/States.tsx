// Field 上的状态交给里面的控件：required 加星号与 aria-required，readonly、disabled 同步给控件；
// 给了 error 就算出错（标红、关联错误信息），只写 invalid 时只标红，错误在别处汇总
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Grid, NumberField, Select, TextField } from '@vue-tsx-pro/ui';

export default _component(() => {
  let name = _state('');
  let email = _state('lin@');
  let seats = _state(120);
  return () => (
    <Grid minItemWidth="14rem" gap="md">
      <Field label="姓名" required description="和证件上的一致">
        <TextField value={_bind(name)} />
      </Field>
      <Field label="工号" readonly description="入职时分配，不能修改">
        <TextField value="E-10024" />
      </Field>
      <Field label="部门" disabled description="由管理员调整">
        <Select items={['设计部', '研发部', '市场部']} value="设计部" />
      </Field>
      <Field
        label="邮箱"
        error={email.includes('.') ? undefined : '邮箱格式不对，例如 lin@example.com'}
      >
        <TextField value={_bind(email)} type="email" />
      </Field>
      <Field label="座位数" invalid description="超出了场地容量（见上方汇总）">
        <NumberField value={_bind(seats)} />
      </Field>
    </Grid>
  );
});
