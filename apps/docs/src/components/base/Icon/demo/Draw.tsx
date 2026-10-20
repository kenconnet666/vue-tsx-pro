import { CircleCheck } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Icon } from '@vue-tsx-pro/ui';

export default _component(() => {
  let done = _state(true);
  return () => (
    <Flex gap="md" align="center">
      <Icon icon={CircleCheck} size={40} draw={done} />
      <Button variant="soft" onClick={() => (done = !done)}>
        {done ? '重置' : '画出来'}
      </Button>
    </Flex>
  );
});
