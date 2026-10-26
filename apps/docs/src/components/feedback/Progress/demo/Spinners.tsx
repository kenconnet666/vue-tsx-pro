import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Card,
  Flex,
  Small,
  Spinner,
  Text,
  type TextSize,
} from '@zerodep-dev/vue-tsx-pro-ui';

const sizes: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Flex align="center" gap="lg" wrap>
      {sizes.map((size) => (
        <Spinner key={size} size={size} />
      ))}
      <Text tone="accent">
        <Spinner /> 跟随文字颜色
      </Text>
      <Text tone="success" size="sm">
        <Spinner /> 同步中
      </Text>
    </Flex>
    <Card>
      <Flex align="center" justify="between" gap="md">
        <Flex align="center" gap="sm">
          {/* 单独出现、旁边没有文字时写 label：role="status"，读屏会念出来 */}
          <Spinner label="正在生成报表" />
          <Small tone="muted">正在生成报表，大约需要 30 秒</Small>
        </Flex>
        <Button size="sm" variant="ghost">
          取消
        </Button>
      </Flex>
    </Card>
  </Flex>
));
