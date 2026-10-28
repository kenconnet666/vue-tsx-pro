// 表单对话框（组件）：字段多、有联动时自己排版，确认就是提交；这里模拟后端：名称重复时拒绝，说明显示在表单顶上
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Field,
  Flex,
  HttpError,
  Select,
  Small,
  TextField,
  useForm,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { FormDialog } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import * as z from 'zod';

const TAKEN = ['采购部', '财务部'];

const schema = z.object({
  name: z.string().trim().min(1, '请填部门名称').max(20, '最多 20 个字'),
  kind: z.string().min(1, '请选类型'),
});

export default _component(() => {
  let open = _state(false);
  let created = _state<string[]>([]);

  const form = useForm({
    schema,
    initial: { name: '', kind: 'business' },
    onSubmit: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      // 后端的业务拒绝：带错误码的 HttpError，说明显示在表单顶上，对话框留着
      if (TAKEN.includes(values.name))
        throw new HttpError(`部门名称已存在: ${values.name}`, {
          request: { method: 'POST', url: '/departments' },
          code: 'demo.name-taken',
        });
      created = [...created, values.name];
      open = false;
    },
  });

  return () => (
    <Flex direction="column" gap="sm" align="start">
      <Button
        onClick={() => {
          form.reset({ name: '', kind: 'business' });
          open = true;
        }}
      >
        新建部门
      </Button>
      <Small tone="muted">
        已建：{created.join('、') || '还没有'}（试试“采购部”，会被后端拒绝）
      </Small>
      <FormDialog controller={form} _open={open} title="新建部门" confirmText="保存" size="sm">
        <form.Field name="name" label="部门名称">
          <TextField placeholder="例如：质量部" />
        </form.Field>
        <Field label="类型">
          <Select
            items={[
              { value: 'business', label: '业务部门' },
              { value: 'support', label: '职能部门' },
            ]}
            _value={form.values.kind}
          />
        </Field>
      </FormDialog>
    </Flex>
  );
});
