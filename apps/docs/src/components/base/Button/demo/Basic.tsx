import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex gap="sm" wrap>
    <Button>保存</Button>
    <Button variant="soft" tone="neutral">
      取消
    </Button>
  </Flex>
));
