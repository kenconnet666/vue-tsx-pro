import { CircleCheck, Heart, Rocket, Signature } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Icon } from '@vue-tsx-pro/ui';

export default _component(() => {
  let done = _state(true);
  return () => (
    <Flex gap="lg" align="center" wrap>
      <Icon icon={CircleCheck} size={40} tone="success" draw={done} />
      <Icon icon={Heart} size={40} tone="danger" draw={done} />
      <Icon icon={Rocket} size={40} tone="accent" draw={done} />
      <Icon icon={Signature} size={40} draw={done} />
      <Button variant="soft" onClick={() => (done = !done)}>
        {done ? '重置' : '画出来'}
      </Button>
    </Flex>
  );
});
