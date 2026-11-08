// 费用报销单：显示、必填、只读的条件写在 .meta() 里（visibleWhen、requiredWhen、readonlyWhen，同 ConditionBuilder 的条件），
// useForm 的 access 按字段路径给权限（同流程的环节权限：申请人填写、财务只改核定金额）；不显示的不校验，明细表跟着它的权限
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  emptyValues,
  Flex,
  RadioGroup,
  SchemaForm,
  useForm,
  type FieldAccessMap,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { z } from 'zod';

const schema = z.object({
  kind: z.enum(['travel', 'meal', 'other'], '请选择费用类型').meta({
    title: '费用类型',
    control: 'radio',
    options: { travel: '差旅', meal: '招待', other: '其他' },
  }),
  city: z
    .string()
    .optional()
    .meta({ title: '出差城市', visibleWhen: { field: 'kind', op: 'eq', value: 'travel' } }),
  guests: z
    .number()
    .optional()
    .meta({
      title: '招待人数',
      unit: '人',
      visibleWhen: { field: 'kind', op: 'eq', value: 'meal' },
      requiredWhen: { field: 'kind', op: 'eq', value: 'meal' },
    }),
  amount: z.number('请填写金额').meta({ title: '金额', unit: '元' }),
  // 超过 5000 要写说明
  note: z
    .string()
    .optional()
    .meta({
      title: '说明',
      control: 'textarea',
      span: 'full',
      requiredWhen: { field: 'amount', op: 'gt', value: 5000 },
    }),
  approved: z.number().optional().meta({ title: '核定金额', unit: '元' }),
  lines: z
    .array(
      z.object({
        item: z.string().min(1, '请填写项目').meta({ title: '项目' }),
        cost: z.number('请填写金额').meta({ title: '金额', unit: '元' }),
      }),
    )
    .meta({ title: '明细' }),
});

/** 两个环节的字段权限：申请人填写时看不到核定金额，财务审核时只改核定金额 */
const STEPS: Record<string, FieldAccessMap> = {
  apply: { approved: 'hidden' },
  review: {
    kind: 'readonly',
    city: 'readonly',
    guests: 'readonly',
    amount: 'readonly',
    note: 'readonly',
    lines: 'readonly',
    approved: 'required',
  },
};

export default _component(() => {
  let step = _state<'apply' | 'review'>('apply');
  let result = _state('');
  const form = useForm({
    schema,
    initial: { ...emptyValues(schema), kind: 'travel', lines: [{ item: '高铁', cost: 553 }] },
    access: () => STEPS[step]!,
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      result = step === 'apply' ? '已提交，等财务审核' : '已审核';
    },
  });
  return () => (
    <Flex direction="column" gap="lg">
      <RadioGroup
        _value={step}
        orientation="horizontal"
        aria-label="环节"
        items={[
          { value: 'apply', label: '申请人填写' },
          { value: 'review', label: '财务审核' },
        ]}
      />
      <SchemaForm controller={form} columns={2} submitText={step === 'apply' ? '提交' : '审核通过'}>
        {result}
      </SchemaForm>
    </Flex>
  );
});
