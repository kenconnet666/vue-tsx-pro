// 状态色点：六种色调、两种大小；点本身就是信息时写 label（读屏念），否则只是装饰
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small, StatusDot } from '@zerodep-dev/vue-tsx-pro-ui';

const tones = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'] as const;

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Flex gap="lg" wrap align="center">
      {tones.map((tone) => (
        <Flex key={tone} inline align="center" gap="xs">
          <StatusDot tone={tone} />
          <Small>{tone}</Small>
        </Flex>
      ))}
    </Flex>
    <Flex gap="lg" align="center">
      <Flex inline align="center" gap="xs">
        <StatusDot size="md" color="#8e4ec6" />
        <Small>size="md"，任意颜色（图例）</Small>
      </Flex>
      <Flex inline align="center" gap="xs">
        <StatusDot tone="danger" label="未读" />
        <Small>写了 label：读屏念“未读”</Small>
      </Flex>
    </Flex>
  </Flex>
));
