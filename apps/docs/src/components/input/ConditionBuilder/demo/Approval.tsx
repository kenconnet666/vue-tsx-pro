// 审批条件：金额、品类、供应商、加急、交货日期五个字段，比较方式随字段类型（数字有大小与介于，日期是早于、晚于，
// 选项是“是其中之一”），值的输入也随之换（数字框、日期选择、多选）。组里还能加组，表头选全部、任一、都不、不全满足。
// 下面是 describeCondition 写成的一句话，与写回的 JSON
import { _component } from '@vue-tsx-pro/tsx';
import {
  CodeBlock,
  ConditionBuilder,
  describeCondition,
  Flex,
  Small,
  useLang,
  type Condition,
  type ConditionField,
} from '@vue-tsx-pro/ui';

const fields: ConditionField[] = [
  { name: 'amount', label: '金额', type: 'number' },
  {
    name: 'category',
    label: '品类',
    type: 'select',
    options: [
      { value: 'steel', label: '钢材' },
      { value: 'aluminum', label: '铝材' },
      { value: 'fastener', label: '紧固件' },
      { value: 'service', label: '服务' },
    ],
  },
  { name: 'supplier', label: '供应商', type: 'text' },
  { name: 'urgent', label: '加急', type: 'boolean' },
  { name: 'delivery', label: '交货日期', type: 'date' },
];

export default _component(() => {
  const lang = useLang();
  let condition = _state<Condition | null>({
    all: [
      { field: 'amount', op: 'gte', value: 100000 },
      {
        any: [
          { field: 'category', op: 'in', value: ['steel', 'aluminum'] },
          { field: 'urgent', op: 'eq', value: true },
        ],
      },
    ],
  });
  return () => (
    <Flex direction="column" gap="md">
      <ConditionBuilder fields={fields} _value={condition} aria-label="审批条件" />
      <Small tone="muted">
        {condition ? describeCondition(condition, fields, lang) : '没有条件：全部通过'}
      </Small>
      <CodeBlock code={JSON.stringify(condition, null, 2)} lang="json" maxLines={12} />
    </Flex>
  );
});
