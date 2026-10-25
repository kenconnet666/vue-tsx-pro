// 供应商开户：三步——企业信息、联系人与账号、确认提交。“下一步”只校验这一步的字段；第三步是只读的汇总，
// 提交没通过（第一步的信用代码被改坏）时跳回出错的那一步；字段里只放控件，form.Field 自动绑定值
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  Descriptions,
  Grid,
  NumberField,
  Select,
  Small,
  TextField,
  useForm,
} from '@vue-tsx-pro/ui';
import { StepsForm } from '@vue-tsx-pro/ui/patterns';
import * as z from 'zod';

const categories = ['机加件', '复材件', '钣金件', '标准件', '线缆'];

const schema = z
  .object({
    company: z.string().min(2, '请填写公司全称'),
    creditCode: z.string().regex(/^[0-9A-Z]{18}$/, '统一社会信用代码是 18 位数字或大写字母'),
    category: z.string('请选择供货品类').min(1, '请选择供货品类'),
    capacity: z.number('请填写月产能').int().min(1, '至少 1 件'),
    contact: z.string().min(1, '请填写联系人'),
    phone: z.string().regex(/^1\d{10}$/, '手机号是 11 位数字'),
    password: z.string().min(8, '至少 8 位'),
    confirm: z.string().min(1, '请再输入一次密码'),
  })
  .refine((values) => values.confirm === values.password, {
    path: ['confirm'],
    message: '两次输入的密码不一致',
  });

export default _component(() => {
  let step = _state(0);
  let result = _state('');
  const form = useForm({
    schema,
    initial: {
      company: '',
      creditCode: '',
      category: null as unknown as string,
      capacity: null as unknown as number,
      contact: '',
      phone: '',
      password: '',
      confirm: '',
    },
    dependencies: { confirm: ['password'] },
    onSubmit: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      result = `${values.company} 已开户，账号已发到 ${values.phone}`;
      form.reset();
      step = 0;
    },
  });

  return () => (
    <Card>
      <StepsForm
        form={form}
        _current={step}
        submitText="确认开户"
        steps={[
          {
            title: '企业信息',
            description: '名称、资质与产能',
            fields: ['company', 'creditCode', 'category', 'capacity'],
            content: () => (
              <Grid minItemWidth="16rem" gap="md">
                <form.Field name="company" label="公司全称">
                  <TextField />
                </form.Field>
                <form.Field name="creditCode" label="统一社会信用代码">
                  <TextField placeholder="18 位" />
                </form.Field>
                <form.Field name="category" label="供货品类">
                  <Select items={categories} placeholder="请选择" />
                </form.Field>
                <form.Field name="capacity" label="月产能（件）">
                  <NumberField />
                </form.Field>
              </Grid>
            ),
          },
          {
            title: '联系人与账号',
            description: '登录账号发到手机',
            fields: ['contact', 'phone', 'password', 'confirm'],
            content: () => (
              <Grid minItemWidth="16rem" gap="md">
                <form.Field name="contact" label="联系人">
                  <TextField />
                </form.Field>
                <form.Field name="phone" label="手机号">
                  <TextField type="tel" />
                </form.Field>
                <form.Field name="password" label="登录密码">
                  <TextField type="password" />
                </form.Field>
                <form.Field name="confirm" label="确认密码">
                  <TextField type="password" />
                </form.Field>
              </Grid>
            ),
          },
          {
            title: '确认提交',
            description: '核对后开户',
            fields: [],
            content: () => (
              <>
                <Descriptions
                  items={[
                    { label: '公司全称', value: form.values.company },
                    { label: '信用代码', value: form.values.creditCode },
                    { label: '供货品类', value: form.values.category },
                    { label: '月产能', value: `${form.values.capacity ?? '—'} 件` },
                    { label: '联系人', value: form.values.contact },
                    { label: '手机号', value: form.values.phone },
                  ]}
                />
                <Small tone="muted">提交前可以点上方已完成的步骤回去修改。</Small>
              </>
            ),
          },
        ]}
      />
      {result && (
        <Small tone="success" aria-live="polite">
          {result}
        </Small>
      )}
    </Card>
  );
});
