// 出差申请：字段按 meta 的 tab 分进标签页（没写的排在页签前面）；“查看”是同一份值的只读视图（SchemaView），
// 审批时看单据、打印都用它：选项显示文字、开关显示是否、明细表带合计，access 隐藏的不列
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  emptyValues,
  Flex,
  RadioGroup,
  SchemaForm,
  SchemaView,
  useForm,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, '请填写事由').meta({ title: '出差事由', span: 'full' }),
  city: z.string().min(1, '请填写城市').meta({ title: '目的地', tab: '行程' }),
  days: z.number('请填写天数').meta({ title: '天数', unit: '天', tab: '行程' }),
  transport: z.enum(['train', 'plane', 'car']).meta({
    title: '交通方式',
    control: 'radio',
    options: { train: '火车', plane: '飞机', car: '自驾' },
    tab: '行程',
  }),
  advance: z.boolean().meta({ title: '预支借款', control: 'switch', tab: '费用' }),
  lines: z
    .array(
      z.object({
        item: z.string().min(1, '请填写项目').meta({ title: '项目' }),
        cost: z.number('请填写金额').meta({ title: '金额', unit: '元', total: 'sum' }),
      }),
    )
    .meta({ title: '预算明细', control: 'table', tab: '费用' }),
  // 只给财务看：查看时按权限不列
  account: z.string().optional().meta({ title: '借款账户', tab: '费用' }),
});

export default _component(() => {
  let mode = _state<'edit' | 'view'>('edit');
  let result = _state('');
  const form = useForm({
    schema,
    initial: {
      ...emptyValues(schema),
      title: '华东区客户回访',
      transport: 'train',
      advance: true,
      lines: [
        { item: '高铁', cost: 553 },
        { item: '酒店', cost: 1260.5 },
      ],
    },
    onSubmit: () => {
      result = '已提交';
    },
  });
  return () => (
    <Flex direction="column" gap="lg">
      <RadioGroup
        _value={mode}
        orientation="horizontal"
        aria-label="视图"
        items={[
          { value: 'edit', label: '填写' },
          { value: 'view', label: '查看' },
        ]}
      />
      {mode === 'edit' ? (
        <SchemaForm controller={form} columns={2}>
          {result}
        </SchemaForm>
      ) : (
        <SchemaView
          schema={schema}
          values={form.values}
          access={{ account: 'hidden' }}
          propsDescriptions={{ bordered: true }}
        />
      )}
    </Flex>
  );
});
