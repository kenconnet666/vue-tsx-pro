/** 代码演练场的起始示例：符文、样式与主题 token、组件、图标各用到一点 */
export const STARTER = `import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Button, Flex, Text } from '@vue-tsx-pro/ui';
import { Heart } from '@lucide/icons';

const styles = stylex.create({
  count: { fontSize: '_xxl', fontWeight: '_bold', color: '_accent' },
});

export default _component(() => {
  let count = _state(0);
  const label = _derived(count === 0 ? '还没点过' : \`点了 \${count} 次\`);
  return () => (
    <Flex direction="column" gap="md" align="start">
      <span {...stylex.attrs(styles.count)}>{count}</span>
      <Flex gap="sm" align="center">
        <Button icon={Heart} onClick={() => count++}>点我</Button>
        <Text tone="muted">{label}</Text>
      </Flex>
    </Flex>
  );
});
`;
