// 输入时自动分组：手机号、身份证号、银行卡号；值是去掉空格的原文，校验写在 schema 里
import { CreditCard, IdCard, Smartphone } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  bankCardFormat,
  Code,
  Form,
  Grid,
  idCardFormat,
  idCardSchema,
  phoneFormat,
  phoneSchema,
  TextField,
  useForm,
} from '@vue-tsx-pro/ui';
import * as z from 'zod';

const schema = z.object({
  phone: phoneSchema({ message: '请填写 11 位手机号' }),
  idCard: idCardSchema({ message: '身份证号不对（出生日期或最后一位校验码）' }),
  bankCard: z.string().min(16, '银行卡号至少 16 位'),
});

export default _component(() => {
  const form = useForm({
    schema,
    initial: { phone: '138000011', idCard: '11010519491231002X', bankCard: '' },
    validateOn: 'change',
  });
  return () => (
    <Form controller={form}>
      <Grid minItemWidth="15rem" gap="lg">
        <form.Field
          name="phone"
          label="手机号"
          description={
            <>
              值：<Code>{form.values.phone || '（空）'}</Code>
            </>
          }
        >
          <TextField value={_bind(form.values.phone)} format={phoneFormat} icon={Smartphone} />
        </form.Field>
        <form.Field
          name="idCard"
          label="身份证号"
          description="18 位，最后一位可以是 X（自动转大写）"
        >
          <TextField value={_bind(form.values.idCard)} format={idCardFormat} icon={IdCard} />
        </form.Field>
        <form.Field name="bankCard" label="银行卡号" description="每 4 位一组，最长 19 位">
          <TextField
            value={_bind(form.values.bankCard)}
            format={bankCardFormat}
            icon={CreditCard}
            clearable
          />
        </form.Field>
      </Grid>
    </Form>
  );
});
