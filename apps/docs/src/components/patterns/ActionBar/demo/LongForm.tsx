// 长表单：操作栏贴在滚动区域的底边，起始边写着改了几处；盖着下面的字段时带阴影，滚到底与内容平齐
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  Card,
  Flex,
  Form,
  FormSection,
  GridItem,
  ScrollArea,
  Select,
  Textarea,
  TextField,
  useForm,
} from '@vue-tsx-pro/ui';
import { ActionBar } from '@vue-tsx-pro/ui/patterns';
import * as z from 'zod';

const styles = css.create({
  scroll: { height: '24rem' },
  body: { padding: '_lg' },
});

const schema = z.object({
  name: z.string().min(2, '至少 2 个字'),
  code: z.string().regex(/^[0-9A-Z]{18}$/, '18 位数字或大写字母'),
  contact: z.string().min(1, '请填写联系人'),
  phone: z.string().regex(/^1\d{10}$/, '11 位手机号'),
  address: z.string(),
  bank: z.string().min(1, '请填写开户行'),
  account: z.string().min(1, '请填写账号'),
  invoice: z.string().nullable(),
  terms: z.string().nullable(),
  note: z.string().min(6, '至少写 6 个字').max(200),
});

const FIELDS = Object.keys(schema.shape) as (keyof z.infer<typeof schema>)[];
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default _component(() => {
  const form = useForm({
    schema,
    initial: {
      name: '供应商甲精密制造有限公司',
      code: '91310115MA1K4XXX0Q',
      contact: '周岚',
      phone: '13800001234',
      address: '上海市浦东新区某路 88 号',
      bank: '某银行上海浦东支行',
      account: '6222 0210 0100 1234 567',
      invoice: 'special',
      terms: '60',
      note: '',
    },
    onSubmit: async (values) => {
      await wait(800);
      form.reset(values);
    },
  });
  const changed = () => FIELDS.filter((name) => form.isDirty(name)).length;

  return () => (
    <Card padding="none">
      <Form controller={form}>
        <ScrollArea sx={styles.scroll}>
          <Flex direction="column" gap="xl" sx={styles.body}>
            <FormSection title="基本信息" columns={2} minColumnWidth="15em">
              <form.Field name="name" label="供应商名称">
                <TextField value={_bind(form.values.name)} />
              </form.Field>
              <form.Field name="code" label="统一社会信用代码">
                <TextField value={_bind(form.values.code)} />
              </form.Field>
              <form.Field name="contact" label="联系人">
                <TextField value={_bind(form.values.contact)} />
              </form.Field>
              <form.Field name="phone" label="手机">
                <TextField value={_bind(form.values.phone)} inputmode="numeric" />
              </form.Field>
              <GridItem span="full">
                <form.Field name="address" label="地址">
                  <TextField value={_bind(form.values.address)} />
                </form.Field>
              </GridItem>
            </FormSection>
            <FormSection title="结算信息" columns={2} minColumnWidth="15em">
              <form.Field name="bank" label="开户行">
                <TextField value={_bind(form.values.bank)} />
              </form.Field>
              <form.Field name="account" label="账号">
                <TextField value={_bind(form.values.account)} />
              </form.Field>
              <form.Field name="invoice" label="发票类型">
                <Select
                  value={_bind(form.values.invoice)}
                  items={[
                    { value: 'special', label: '增值税专用发票' },
                    { value: 'normal', label: '增值税普通发票' },
                  ]}
                />
              </form.Field>
              <form.Field name="terms" label="账期">
                <Select
                  value={_bind(form.values.terms)}
                  items={[
                    { value: '30', label: '30 天' },
                    { value: '60', label: '60 天' },
                    { value: '90', label: '90 天' },
                  ]}
                />
              </form.Field>
            </FormSection>
            <FormSection title="变更说明">
              <form.Field
                name="note"
                label="为什么改"
                description="审批人会看到，写清楚改了什么、依据是什么"
              >
                <Textarea value={_bind(form.values.note)} rows={3} />
              </form.Field>
            </FormSection>
          </Flex>
          <ActionBar start={form.dirty ? `有 ${changed()} 处改动还没保存` : '没有改动'}>
            <Button
              variant="ghost"
              tone="neutral"
              disabled={!form.dirty}
              onClick={() => form.reset()}
            >
              撤销改动
            </Button>
            <Button type="submit" disabled={!form.dirty} loading={form.submitting}>
              保存
            </Button>
          </ActionBar>
        </ScrollArea>
      </Form>
    </Card>
  );
});
