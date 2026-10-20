import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex } from '@vue-tsx-pro/ui';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export default _component(() => () => (
  <Flex gap="sm" wrap align="center">
    {sizes.map((size) => (
      <Button key={size} size={size}>
        {size}
      </Button>
    ))}
  </Flex>
));
