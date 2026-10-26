import { CircleCheck, CircleX, Lock, TriangleAlert, Wifi } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Icon, Text } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Flex gap="xl" wrap>
    {/* 旁边已有文字：图标只是装饰，读屏跳过 */}
    <Flex direction="column" gap="xs">
      <Text>
        <Icon icon={CircleCheck} tone="success" /> 已保存
      </Text>
      <Text>
        <Icon icon={TriangleAlert} tone="warning" /> 3 项待确认
      </Text>
      <Text>
        <Icon icon={CircleX} tone="danger" /> 同步失败
      </Text>
    </Flex>
    {/* 单独出现、表达含义：给名称 */}
    <Flex gap="md" align="center">
      <Icon icon={TriangleAlert} tone="warning" size="xl" aria-label="有未保存的修改" />
      <Icon icon={Lock} tone="muted" size="xl" aria-label="仅自己可见" />
      <Icon icon={Wifi} tone="success" size="xl" aria-label="已连接" />
    </Flex>
  </Flex>
));
