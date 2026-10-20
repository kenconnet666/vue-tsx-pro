import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex gap="sm" wrap align="center">
    <Button variant="solid">solid</Button>
    <Button variant="soft">soft</Button>
    <Button variant="surface">surface</Button>
    <Button variant="outline">outline</Button>
    <Button variant="ghost">ghost</Button>
    <Button variant="link">link</Button>
  </Flex>
));
