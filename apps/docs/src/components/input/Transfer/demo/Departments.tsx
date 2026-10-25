// 通知范围：左边是组织机构树，勾上部门就是它下面的全部团队；移过去的是团队（叶子），已经移过去的在树上勾上且不能再勾
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Small, TreeTransfer } from '@vue-tsx-pro/ui';

interface Org {
  id: string;
  name: string;
  children?: Org[];
}

const orgs: Org[] = [
  {
    id: 'rd',
    name: '研发中心',
    children: [
      { id: 'rd-fe', name: '前端组' },
      { id: 'rd-be', name: '后端组' },
      { id: 'rd-qa', name: '测试组' },
    ],
  },
  {
    id: 'mfg',
    name: '制造中心',
    children: [
      {
        id: 'mfg-plant',
        name: '总装厂',
        children: [
          { id: 'mfg-plant-1', name: '一车间' },
          { id: 'mfg-plant-2', name: '二车间' },
        ],
      },
      { id: 'mfg-quality', name: '质量部' },
    ],
  },
  { id: 'purchase', name: '采购部' },
];

export default _component(() => {
  let teams = _state(['rd-fe', 'mfg-quality']);
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="通知范围">
        <TreeTransfer
          items={orgs}
          getKey={(org) => org.id}
          getLabel={(org) => org.name}
          getChildren={(org) => org.children}
          _value={teams}
          titles={['组织机构', '通知的团队']}
          searchable
        />
      </Field>
      <Small tone="muted">value：{teams.join('、')}</Small>
    </Flex>
  );
});
