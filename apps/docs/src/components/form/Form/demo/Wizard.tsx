import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  Flex,
  Form,
  Grid,
  NumberField,
  Small,
  Steps,
  TextField,
  useForm,
} from '@vue-tsx-pro/ui';
import * as z from 'zod';

// 开户申请分两步：第一步的字段校验通过才能进第二步，最后整份提交
const schema = z
  .object({
    company: z.string().min(2, '至少 2 个字'),
    contact: z.string().min(1, '请填写联系人'),
    phone: z.string().regex(/^1\d{10}$/, '请填写 11 位手机号'),
    password: z.string().min(8, '至少 8 位'),
    confirm: z.string().min(1, '请再输入一次密码'),
    budgetMin: z.number({ error: '请填写下限' }).min(0),
    budgetMax: z.number({ error: '请填写上限' }).min(0),
  })
  .refine((values) => values.confirm === values.password, {
    path: ['confirm'],
    message: '两次输入的密码不一致',
  })
  .refine((values) => values.budgetMax >= values.budgetMin, {
    path: ['budgetMax'],
    message: '上限不能低于下限',
  });

const steps = [
  { title: '企业信息', fields: ['company', 'contact', 'phone'] as const },
  { title: '账号与预算', fields: ['password', 'confirm', 'budgetMin', 'budgetMax'] as const },
];

export default _component(() => {
  let step = _state(0);
  let result = _state('');
  const form = useForm({
    schema,
    initial: {
      company: '',
      contact: '',
      phone: '',
      password: '',
      confirm: '',
      budgetMin: 10,
      budgetMax: 50,
    },
    // 改了密码重新校验“确认密码”，改了下限重新校验上限（填过的才提示）
    dependencies: { confirm: ['password'], budgetMax: ['budgetMin'] },
    onSubmit: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      result = `已提交：${values.company}，预算 ${values.budgetMin}–${values.budgetMax} 万元`;
    },
  });

  /** 只校验这一步的字段：通过才进下一步，没通过的错误立即显示 */
  async function next() {
    if (await form.validate(steps[step]!.fields)) step++;
  }

  return () => (
    <Card>
      <Form controller={form}>
        <Flex direction="column" gap="md">
          <Steps current={step} items={steps} />
          {step === 0 ? (
            <>
              <form.Field name="company" label="企业名称">
                <TextField value={_bind(form.values.company)} />
              </form.Field>
              <Grid minItemWidth="12rem" gap="md">
                <form.Field name="contact" label="联系人">
                  <TextField value={_bind(form.values.contact)} />
                </form.Field>
                <form.Field name="phone" label="手机号">
                  <TextField value={_bind(form.values.phone)} type="tel" />
                </form.Field>
              </Grid>
            </>
          ) : (
            <>
              <Grid minItemWidth="12rem" gap="md">
                <form.Field name="password" label="登录密码">
                  <TextField value={_bind(form.values.password)} type="password" />
                </form.Field>
                <form.Field name="confirm" label="确认密码">
                  <TextField value={_bind(form.values.confirm)} type="password" />
                </form.Field>
              </Grid>
              <Grid minItemWidth="12rem" gap="md">
                <form.Field name="budgetMin" label="年度预算下限（万元）">
                  <NumberField value={_bind(form.values.budgetMin)} />
                </form.Field>
                <form.Field name="budgetMax" label="年度预算上限（万元）">
                  <NumberField value={_bind(form.values.budgetMax)} />
                </form.Field>
              </Grid>
            </>
          )}
          <Flex align="center" justify="between" gap="md">
            <Small tone="muted" aria-live="polite">
              {result}
            </Small>
            <Flex gap="sm">
              {step > 0 && (
                <Button variant="ghost" tone="neutral" onClick={() => step--}>
                  上一步
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button onClick={() => void next()}>下一步</Button>
              ) : (
                <Button type="submit" loading={form.submitting}>
                  提交申请
                </Button>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Form>
    </Card>
  );
});
