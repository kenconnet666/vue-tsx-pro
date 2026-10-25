// 供应商准入申请：form.Field 里只放控件（不写 value，自动绑定 form.values）；提交没通过时顶上的 FormErrorSummary
// 列出各项错误，焦点先到它上面，点哪一项跳到那个字段；报价有效期的起止互相依赖（dependencies），改了开始日期结束日期跟着重新校验
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  DateField,
  Flex,
  Form,
  FormErrorSummary,
  Grid,
  Select,
  Small,
  Switch,
  Textarea,
  TextField,
  useForm,
} from '@vue-tsx-pro/ui';
import * as z from 'zod';

const categories = ['机械件', '塑料件', '钣金件', '标准件', '线缆'];

const schema = z
  .object({
    company: z.string().min(2, '请填写公司全称'),
    creditCode: z.string().regex(/^[0-9A-Z]{18}$/, '统一社会信用代码是 18 位数字或大写字母'),
    category: z.string('请选择供货品类').min(1, '请选择供货品类'),
    contact: z.string().min(1, '请填写联系人'),
    phone: z.string().regex(/^1\d{10}$/, '手机号是 11 位数字'),
    validFrom: z.string('请选择开始日期').min(1, '请选择开始日期'),
    validTo: z.string('请选择结束日期').min(1, '请选择结束日期'),
    note: z.string().max(200),
    agreed: z.boolean().refine((value) => value, '请确认已阅读准入须知'),
  })
  // 跨字段：结束日期要晚于开始日期，错误标在结束日期上
  .refine((values) => !values.validFrom || !values.validTo || values.validTo > values.validFrom, {
    message: '结束日期要晚于开始日期',
    path: ['validTo'],
  });

export default _component(() => {
  let result = _state('');
  const form = useForm({
    schema,
    initial: {
      company: '',
      creditCode: '',
      category: null as unknown as string,
      contact: '',
      phone: '',
      validFrom: null as unknown as string,
      validTo: null as unknown as string,
      note: '',
      agreed: false,
    },
    // 开始日期改了，结束日期（填过的话）跟着重新校验
    dependencies: { validTo: ['validFrom'] },
    onSubmit: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      result = `${values.company} 的准入申请已提交`;
      form.reset();
    },
  });

  return () => (
    <Form controller={form} labelPlacement="start" labelWidth="7em">
      <Flex direction="column" gap="md">
        <FormErrorSummary />
        <Grid minItemWidth="20rem" gap="md">
          <form.Field name="company" label="公司全称">
            <TextField />
          </form.Field>
          <form.Field name="creditCode" label="信用代码">
            <TextField placeholder="18 位" />
          </form.Field>
          <form.Field name="category" label="供货品类">
            <Select items={categories} placeholder="请选择" />
          </form.Field>
          <form.Field name="contact" label="联系人">
            <TextField />
          </form.Field>
          <form.Field name="phone" label="手机号">
            <TextField type="tel" />
          </form.Field>
          <form.Field name="validFrom" label="有效期起">
            <DateField />
          </form.Field>
          <form.Field name="validTo" label="有效期止">
            <DateField />
          </form.Field>
        </Grid>
        <form.Field name="note" label="补充说明">
          <Textarea rows={2} showCount />
        </form.Field>
        <form.Field name="agreed" label="准入须知">
          <Switch>已阅读并同意准入须知</Switch>
        </form.Field>
        <Flex gap="sm" justify="end" align="center">
          <Small tone="muted" aria-live="polite">
            {result}
          </Small>
          <Button type="reset" variant="soft" tone="neutral">
            重置
          </Button>
          <Button type="submit" loading={form.submitting}>
            提交申请
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
});
