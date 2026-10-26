import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Flex,
  Progress,
  Small,
  Spinner,
  Text,
  type TextSize,
} from '@zerodep-dev/vue-tsx-pro-ui';

const sizes: TextSize[] = ['xs', 'sm', 'md', 'lg'];

export default _component(() => {
  let uploaded = _state(3);
  return () => (
    <Flex direction="column" gap="lg">
      {sizes.map((size) => (
        <Flex key={size} align="center" gap="md">
          <Small tone="muted">{size}</Small>
          <Progress
            value={62}
            size={size}
            radius={size === 'lg' ? 'sm' : 'full'}
            aria-label={`粗细 ${size}`}
          />
        </Flex>
      ))}
      <Flex direction="column" gap="xs">
        <Flex align="center" gap="sm">
          <Spinner size="sm" />
          <Text size="sm">正在连接服务器…（不确定进度：不写 value）</Text>
        </Flex>
        <Progress aria-label="正在连接服务器" />
      </Flex>
      <Flex direction="column" gap="xs">
        <Flex align="center" justify="between">
          <Text size="sm">已上传 {uploaded} / 8 个文件</Text>
          <Button size="sm" variant="soft" disabled={uploaded >= 8} onClick={() => uploaded++}>
            再传一个
          </Button>
        </Flex>
        <Progress
          value={uploaded}
          max={8}
          tone={uploaded >= 8 ? 'success' : 'accent'}
          aria-label="上传进度"
          valueText={(value) => `已上传 ${value.toString()} 个文件，共 8 个`}
        />
      </Flex>
    </Flex>
  );
});
