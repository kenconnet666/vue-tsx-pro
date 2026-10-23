// 多行的描述：超过两行时后面有“展开”；短的没有按钮
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Ellipsis, Flex, Text } from '@vue-tsx-pro/ui';

const items = [
  {
    title: '机匣支架改用整体锻件',
    description:
      '原方案由三块钣金件焊接，焊后需要校形与探伤，单件工时 4.2 小时。改为整体锻件后取消焊接与校形工序，机加余量从 3 mm 降到 1.5 mm，单件材料费增加 120 元，工时降到 1.6 小时，综合测算单件降本 486 元，年产 1,200 件约 58 万元。需要锻件供应商在 11 月前完成首件鉴定。',
  },
  {
    title: '紧固件标准化',
    description: '把 37 种非标螺栓并成 12 种标准件。',
  },
];

export default _component(() => () => (
  <Flex direction="column" gap="md">
    {items.map((item) => (
      <Card key={item.title}>
        <Flex direction="column" gap="xs">
          <Text weight="semibold">{item.title}</Text>
          <Ellipsis lines={2} expandable>
            {item.description}
          </Ellipsis>
        </Flex>
      </Card>
    ))}
  </Flex>
));
