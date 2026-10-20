import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Text } from '@vue-tsx-pro/ui';

export default _component(() => {
  let count = _state(0);
  const label = _derived(count === 0 ? '还没点过' : `点了 ${count} 次`);

  return () => (
    <Flex gap="md" align="center">
      <Button onClick={() => count++}>点我</Button>
      <Text tone="muted">{label}</Text>
    </Flex>
  );
});
