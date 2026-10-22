// 编号用等宽字体（mono），金额、计数用等宽数字（numeric）：上下对齐，变化时不跳动
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Text } from '@vue-tsx-pro/ui';

const rows = [
  ['DJ-2026-ZT-76', '1,117.48'],
  ['DMC-2026-QY-3', '9.10'],
  ['DJ-2026-FC-114', '211.06'],
];

export default _component(() => () => (
  <Flex direction="column" gap="xs">
    {rows.map(([code, amount]) => (
      <Flex key={code} justify="between" gap="xl">
        <Text mono size="sm">
          {code}
        </Text>
        <Text numeric>{amount} 万元</Text>
      </Flex>
    ))}
    <Text numeric tone="danger" weight="semibold">
      超时 11 天
    </Text>
  </Flex>
));
