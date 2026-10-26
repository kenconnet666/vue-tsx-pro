// 自己画值的输入：经办人字段的 input 换成带搜索的 Select（真实场景接人员选择器），类型仍是 select，
// 比较方式（是、不是、是其中之一）与摘要照旧；format 决定摘要里值的写法。字段的 group 把字段列表分成两组
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  ConditionBuilder,
  describeCondition,
  Flex,
  Select,
  Small,
  useLang,
  type Condition,
  type ConditionField,
} from '@zerodep-dev/vue-tsx-pro-ui';

const people = [
  { id: 'u01', name: '林晓', dept: '采购部' },
  { id: 'u02', name: '陈思雨', dept: '质量部' },
  { id: 'u03', name: '王建国', dept: '财务部' },
  { id: 'u04', name: '赵一凡', dept: '采购部' },
];
const nameOf = (id: unknown) => people.find((person) => person.id === id)?.name ?? String(id);
const toOption = (person: (typeof people)[number]) => ({
  value: person.id,
  label: person.name,
  description: person.dept,
});

const fields: ConditionField[] = [
  { name: 'amount', label: '金额', type: 'number', group: '申请单' },
  { name: 'reason', label: '事由', type: 'text', group: '申请单' },
  {
    name: 'owner',
    label: '经办人',
    type: 'select',
    group: '流程变量',
    format: nameOf,
    input: ({ op, value, onChange, label }) =>
      op === 'in' || op === 'notIn' ? (
        <Select
          items={people}
          toOption={toOption}
          selectionMode="multiple"
          searchable
          _value={(value as string[] | undefined) ?? []}
          onUpdate:_value={onChange}
          aria-label={label}
        />
      ) : (
        <Select
          items={people}
          toOption={toOption}
          searchable
          _value={(value as string | undefined) ?? null}
          onUpdate:_value={onChange}
          aria-label={label}
        />
      ),
  },
  { name: 'round', label: '协商轮次', type: 'number', group: '流程变量' },
];

export default _component(() => {
  const lang = useLang();
  let condition = _state<Condition | null>({
    any: [
      { field: 'owner', op: 'in', value: ['u01', 'u04'] },
      { field: 'round', op: 'gte', value: 3 },
    ],
  });
  return () => (
    <Flex direction="column" gap="md">
      <ConditionBuilder fields={fields} _value={condition} aria-label="提级条件" />
      <Small tone="muted">
        {condition ? describeCondition(condition, fields, lang) : '没有条件'}
      </Small>
    </Flex>
  );
});
