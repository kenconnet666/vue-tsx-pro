// 物料分类：选到哪一级都行（changeOnSelect），停用的分类不能选；路径用“›”分隔
import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Cascader, Field, Flex, Small } from '@vue-tsx-pro/ui';

interface Category {
  id: string;
  name: string;
  retired?: boolean;
  children?: Category[];
}

const categories: Category[] = [
  {
    id: 'mech',
    name: '机械件',
    children: [
      {
        id: 'bearing',
        name: '轴承',
        children: [
          { id: 'deep-groove', name: '深沟球轴承' },
          { id: 'tapered', name: '圆锥滚子轴承' },
        ],
      },
      { id: 'fastener', name: '紧固件', children: [{ id: 'bolt', name: '螺栓' }] },
      { id: 'casting', name: '铸件（停用）', retired: true },
    ],
  },
  {
    id: 'elec',
    name: '电子件',
    children: [
      { id: 'connector', name: '连接器' },
      { id: 'sensor', name: '传感器', children: [{ id: 'temp', name: '温度传感器' }] },
    ],
  },
];

export default _component(() => {
  let category = _state<readonly string[] | null>(['mech', 'bearing']);
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="物料分类" description="大类、小类都能选：报表按哪一级汇总就选到哪一级">
        <Cascader
          items={categories}
          getKey={(item) => item.id}
          getLabel={(item) => item.name}
          getChildren={(item) => item.children}
          isDisabled={(item) => !!item.retired}
          value={_bind(category)}
          changeOnSelect
          separator=" › "
          clearable
        />
      </Field>
      <Flex align="center" gap="xs">
        <Small tone="muted">汇总到第</Small>
        <Badge size="xs" variant="soft">
          {category?.length ?? 0}
        </Badge>
        <Small tone="muted">级</Small>
      </Flex>
    </Flex>
  );
});
