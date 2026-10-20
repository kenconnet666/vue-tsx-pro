import { _component } from '@vue-tsx-pro/tsx';
import { Button, Card, Flex, Stat } from '@vue-tsx-pro/ui';

export default _component(() => {
  let visitors = _state(3260);
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Card>
        <Stat label="在线人数" value={visitors} format={{ maximumFractionDigits: 0 }} unit="人" />
      </Card>
      <Button variant="soft" onClick={() => (visitors += Math.round(Math.random() * 400 - 150))}>
        刷新
      </Button>
    </Flex>
  );
});
