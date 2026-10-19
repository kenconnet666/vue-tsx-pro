// 表单演示：一份 zod schema 同时负责校验、值的类型与字段约束（必填标记、maxlength、NumberField 的范围）
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Form, NumberField, Select, TextField, useForm } from '@vue-tsx-pro/ui';
import * as z from 'zod';
import { toaster } from '../toaster';

/** 后端返回的城市：字段名不是 value / label，交给 Select 时用 toOption 转换 */
const cities = [
  { code: 'bj', name: '北京' },
  { code: 'sh', name: '上海' },
  { code: 'gz', name: '广州' },
];

const schema = z.object({
  email: z.email('邮箱格式不对'),
  nickname: z.string().max(12, '最多 12 个字'),
  age: z.number({ error: '请填写年龄' }).int().min(18, '未满 18 岁').max(120),
  city: z.string().min(1, '请选择城市'),
});

/** 注册表单：必填标记、输入框的 type 与 maxlength、年龄的范围都从 schema 来 */
export const FormDemo = _component(() => {
  const form = useForm({
    schema,
    initial: { email: '', nickname: '', age: 18, city: '' },
    onSubmit: (values) => toaster.show({ tone: 'success', title: `已注册：${values.email}` }),
  });

  return () => (
    <Form controller={form} class="zod-form-demo">
      <Flex direction="column" gap="md">
        <form.Field name="email" label="邮箱">
          <TextField value={_bind(form.values.email)} />
        </form.Field>
        <form.Field name="nickname" label="昵称" description="选填，最多 12 个字">
          <TextField value={_bind(form.values.nickname)} />
        </form.Field>
        <form.Field name="age" label="年龄">
          <NumberField value={_bind(form.values.age)} />
        </form.Field>
        <form.Field name="city" label="城市">
          <Select
            items={cities}
            toOption={(city) => ({ value: city.code, label: city.name })}
            value={_bind(form.values.city)}
            placeholder="选择城市"
          />
        </form.Field>
        <Flex gap="sm">
          <Button type="submit" loading={form.submitting}>
            注册
          </Button>
          <Button type="reset" variant="outline" tone="neutral">
            重置
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
});
