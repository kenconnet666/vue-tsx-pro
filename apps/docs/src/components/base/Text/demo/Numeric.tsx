// 编号用等宽字体（mono），金额、计数用等宽数字（numeric）：上下对齐，变化时不跳动
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Text } from '@zerodep-dev/vue-tsx-pro-ui';

const rows = [
  ['PO-2026-0276', '1,117.48'],
  ['PO-2026-0233', '9.10'],
  ['PO-2026-02114', '211.06'],
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
