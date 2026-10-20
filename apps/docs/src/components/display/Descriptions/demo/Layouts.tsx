import { _component } from '@vue-tsx-pro/tsx';
import { Descriptions, Flex } from '@vue-tsx-pro/ui';

const items = [
  { label: '姓名', value: '周一航' },
  { label: '部门', value: '设计中心' },
  { label: '职位', value: '高级交互设计师' },
  { label: '入职日期', value: '2021-03-15' },
];

export default _component(() => () => (
  <Flex direction="column" gap="xl">
    <Descriptions title="bordered：带边框的表格样式" columns={2} bordered items={items} />
    <Descriptions title='layout="vertical"：标签在上' columns={4} layout="vertical" items={items} />
    <Descriptions title='size="sm"' columns={2} size="sm" bordered items={items} />
  </Flex>
));
