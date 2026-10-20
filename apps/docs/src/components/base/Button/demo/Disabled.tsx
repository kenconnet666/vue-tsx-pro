import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex gap="sm" wrap>
    <Button disabled>不可用</Button>
    <Button disabled focusableWhenDisabled title="填完必填项后才能提交">
      仍可聚焦
    </Button>
  </Flex>
));
