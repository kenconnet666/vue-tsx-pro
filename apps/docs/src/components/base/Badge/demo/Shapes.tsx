import { CircleCheck, Clock, Flame, Sparkles, TriangleAlert } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Badge, Flex, Text, type TextSize } from '@zerodep-dev/vue-tsx-pro-ui';

const sizes: TextSize[] = ['xs', 'sm', 'md', 'lg'];

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Flex align="center" gap="sm" wrap>
      <Text size="xs" tone="muted">
        字号
      </Text>
      {sizes.map((size) => (
        <Badge key={size} size={size} tone="accent">
          size={size}
        </Badge>
      ))}
    </Flex>
    <Flex align="center" gap="sm" wrap>
      <Text size="xs" tone="muted">
        胶囊与计数
      </Text>
      <Badge radius="full" variant="solid" tone="danger">
        12
      </Badge>
      <Badge radius="full" variant="solid">
        99+
      </Badge>
      <Badge radius="full" tone="success">
        在线
      </Badge>
      <Badge radius="full" variant="outline">
        v2.4.0
      </Badge>
    </Flex>
    <Flex align="center" gap="sm" wrap>
      <Text size="xs" tone="muted">
        图标
      </Text>
      <Badge icon={CircleCheck} tone="success">
        已通过
      </Badge>
      <Badge icon={Clock} tone="warning">
        待审核
      </Badge>
      <Badge icon={TriangleAlert} tone="danger" variant="surface">
        3 个错误
      </Badge>
      <Badge icon={Sparkles} tone="accent" variant="solid">
        Beta
      </Badge>
      <Badge icon={Flame} tone="warning" variant="outline" radius="full">
        热门
      </Badge>
    </Flex>
  </Flex>
));
