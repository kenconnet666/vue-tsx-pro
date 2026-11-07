// 同一份供应商准入申请，按 schema 生成：标签、占位、分组、栏宽写在 .meta() 里，SchemaForm 按类型选控件
// （文字、下拉、日期、复选框），emptyValues 给出空白的初始值；必填标记、错误汇总、跨字段校验照旧来自 useForm
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { emptyValues, phoneSchema, SchemaForm, useForm } from '@zerodep-dev/vue-tsx-pro-ui';
import { z } from 'zod';

const schema = z
  .object({
    company: z.string().min(2, '请填写公司全称').meta({ title: '公司全称', group: '企业' }),
    creditCode: z
      .string()
      .regex(/^[0-9A-Z]{18}$/, '统一社会信用代码是 18 位数字或大写字母')
      .meta({ title: '信用代码', placeholder: '18 位', group: '企业' }),
    category: z
      .enum(['机械件', '塑料件', '钣金件', '标准件', '线缆'], '请选择供货品类')
      .meta({ title: '供货品类', placeholder: '请选择', group: '企业' }),
    contact: z.string().min(1, '请填写联系人').meta({ title: '联系人', group: '联系与有效期' }),
    phone: phoneSchema({ message: '手机号是 11 位数字' }).meta({
      title: '手机号',
      group: '联系与有效期',
    }),
    validFrom: z.iso.date('请选择开始日期').meta({ title: '有效期起', group: '联系与有效期' }),
    validTo: z.iso.date('请选择结束日期').meta({ title: '有效期止', group: '联系与有效期' }),
    note: z
      .string()
      .max(200)
      .meta({ title: '补充说明', control: 'textarea', span: 'full', group: '确认' }),
    agreed: z
      .boolean()
      .refine((value) => value, '请确认已阅读准入须知')
      .meta({ title: '已阅读并同意准入须知', control: 'checkbox', group: '确认' }),
  })
  .refine((values) => !values.validFrom || !values.validTo || values.validTo > values.validFrom, {
    message: '结束日期要晚于开始日期',
    path: ['validTo'],
  });

export default _component(() => {
  let result = _state('');
  const form = useForm({
    schema,
    initial: emptyValues(schema),
    dependencies: { validTo: ['validFrom'] },
    onSubmit: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      result = `${values.company} 的准入申请已提交`;
      form.reset();
    },
  });
  return () => (
    <SchemaForm controller={form} columns={2} submitText="提交申请">
      {result}
    </SchemaForm>
  );
});
