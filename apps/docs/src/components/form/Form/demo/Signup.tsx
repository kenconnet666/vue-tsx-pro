import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Card,
  Flex,
  Form,
  NumberField,
  Small,
  Spinner,
  TextField,
  useForm,
  useLeaveConfirmation,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { z } from 'zod';

// 假的“用户名已占用”接口：400ms 后返回；新的输入到来时经 signal 中止
const taken = new Set(['admin', 'root', 'xiaoman']);
const checkUsername = (name: string, signal: AbortSignal) =>
  new Promise<string | undefined>((resolve) => {
    const timer = setTimeout(
      () => resolve(taken.has(name) ? '这个用户名已被占用' : undefined),
      400,
    );
    signal.addEventListener('abort', () => clearTimeout(timer));
  });

// 一份 schema：校验、值的类型，还有字段约束（必填标记、maxlength、年龄的范围）
const schema = z.object({
  username: z.string().min(2, '至少 2 个字').max(16),
  email: z.email('邮箱格式不对'),
  password: z.string().min(8, '至少 8 位'),
  age: z.number({ error: '请填写年龄' }).int().min(18, '未满 18 岁').max(120),
  bio: z.string().max(60).optional(),
});

export default _component(() => {
  let result = _state('');
  const form = useForm({
    schema,
    initial: { username: '', email: '', password: '', age: 18, bio: '' },
    fields: {
      username: {
        validate: (name, _, signal) => (name.length < 2 ? undefined : checkUsername(name, signal)),
      },
    },
    onSubmit: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      result = `已注册 ${values.username}（${values.email}）`;
      form.reset(form.values);
    },
  });

  // 填了没注册就离开（站内跳转、关掉标签页）时先问一下
  useLeaveConfirmation(() => form.dirty && !form.submitting);

  return () => (
    <Card>
      <Form controller={form}>
        <Flex direction="column" gap="md">
          <form.Field name="username" label="用户名" description="admin、root、xiaoman 已被占用">
            <TextField
              _value={form.values.username}
              suffix={form.validating('username') ? <Spinner aria-label="校验中" /> : undefined}
            />
          </form.Field>
          <form.Field name="email" label="邮箱">
            <TextField _value={form.values.email} type="email" />
          </form.Field>
          <form.Field name="password" label="密码">
            <TextField _value={form.values.password} type="password" />
          </form.Field>
          <form.Field name="age" label="年龄">
            <NumberField _value={form.values.age} />
          </form.Field>
          <form.Field name="bio" label="一句话介绍">
            <TextField _value={form.values.bio} showCount />
          </form.Field>
          <Flex align="center" justify="between" gap="md">
            <Small tone="muted">{result || (form.dirty ? '有未保存的改动' : '')}</Small>
            <Flex gap="sm">
              <Button type="reset" variant="ghost" tone="neutral">
                重置
              </Button>
              <Button type="submit" loading={form.submitting}>
                注册
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Form>
    </Card>
  );
});
