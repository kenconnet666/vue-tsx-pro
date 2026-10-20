import { CircleCheck, TriangleAlert } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Icon, Text } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    {/* 旁边已有文字：图标只是装饰，读屏跳过 */}
    <Text>
      <Icon icon={CircleCheck} tone="success" /> 已保存
    </Text>
    {/* 单独出现、表达含义：给名称 */}
    <Icon icon={TriangleAlert} aria-label="有未保存的修改" />
  </Flex>
));
