// 表单演示：一份 zod schema 同时负责校验、值的类型与字段约束（必填标记、maxlength、NumberField 的范围）；
// 用户名的异步校验（模拟接口）、联系人的数组字段、未保存离开提醒
import { Plus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Flex,
  Form,
  IconButton,
  NumberField,
  Select,
  Spinner,
  Text,
  TextField,
  useForm,
  useLeaveConfirmation,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { z } from 'zod';
import { toaster } from '../toaster';

/** 后端返回的城市：字段名不是 value / label，交给 Select 时用 toOption 转换 */
const cities = [
  { code: 'bj', name: '北京' },
  { code: 'sh', name: '上海' },
  { code: 'gz', name: '广州' },
];

/** 模拟“用户名已占用”的接口：400ms 后返回 */
const takenNames = new Set(['admin', 'root']);
const checkUsername = (name: string, signal: AbortSignal) =>
  new Promise<string | undefined>((resolve) => {
    const timer = setTimeout(() => resolve(takenNames.has(name) ? '用户名已占用' : undefined), 400);
    signal.addEventListener('abort', () => clearTimeout(timer));
  });

const schema = z.object({
  username: z.string().min(2, '至少 2 个字'),
  email: z.email('邮箱格式不对'),
  nickname: z.string().max(12, '最多 12 个字'),
  age: z.number({ error: '请填写年龄' }).int().min(18, '未满 18 岁').max(120),
  city: z.string().min(1, '请选择城市'),
  contacts: z.array(z.object({ name: z.string().min(1, '请填写联系人') })),
});

/** 注册表单：必填标记、输入框的 type 与 maxlength、年龄的范围都从 schema 来 */
export const FormDemo = _component(() => {
  const form = useForm({
    schema,
    initial: { username: '', email: '', nickname: '', age: 18, city: '', contacts: [{ name: '' }] },
    fields: {
      username: {
        validate: (name, _, signal) => (name.length < 2 ? undefined : checkUsername(name, signal)),
      },
    },
    onSubmit: (values) => {
      toaster.show({ tone: 'success', title: `已注册：${values.username}` });
      // 保存成功：以现在的值为准，不再算未保存
      form.reset(form.values);
    },
  });
  const contacts = form.array('contacts');
  useLeaveConfirmation(() => form.dirty);

  return () => (
    <Form controller={form} class="zod-form-demo">
      <Flex direction="column" gap="md">
        <form.Field name="username" label="用户名" description="admin、root 已被占用">
          <TextField
            _value={form.values.username}
            suffix={form.validating('username') ? <Spinner aria-label="校验中" /> : undefined}
          />
        </form.Field>
        <form.Field name="email" label="邮箱">
          <TextField _value={form.values.email} />
        </form.Field>
        <form.Field name="nickname" label="昵称" description="选填，最多 12 个字">
          <TextField _value={form.values.nickname} />
        </form.Field>
        <form.Field name="age" label="年龄">
          <NumberField _value={form.values.age} />
        </form.Field>
        <form.Field name="city" label="城市">
          <Select
            items={cities}
            toOption={(city) => ({ value: city.code, label: city.name })}
            _value={form.values.city}
            placeholder="选择城市"
          />
        </form.Field>
        {contacts.items.map((contact, index) => (
          <Flex key={contacts.keys[index]} gap="sm" align="end" class="contact-row">
            <form.Field name={`contacts.${index}.name`} label={`联系人 ${index + 1}`}>
              <TextField _value={contact.name} />
            </form.Field>
            <IconButton
              icon={Trash2}
              variant="ghost"
              aria-label={`删除联系人 ${index + 1}`}
              disabled={contacts.items.length === 1}
              onClick={() => contacts.remove(index)}
            />
          </Flex>
        ))}
        <Button
          variant="outline"
          icon={Plus}
          class="contact-add"
          onClick={() => contacts.append({ name: '' })}
        >
          添加联系人
        </Button>
        <Text tone="muted" size="sm" class="form-dirty">
          {form.dirty ? '有未保存的修改' : '没有修改'}
        </Text>
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
