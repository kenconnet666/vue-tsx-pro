import { Plus, Settings } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Flex, IconButton } from '@zerodep-dev/vue-tsx-pro-ui';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Flex gap="sm" wrap align="center">
      {sizes.map((size) => (
        <Button key={size} size={size} icon={Plus}>
          {size}
        </Button>
      ))}
    </Flex>
    <Flex gap="sm" wrap align="center">
      {sizes.map((size) => (
        <Button key={size} size={size} variant="outline" tone="neutral">
          {size}
        </Button>
      ))}
    </Flex>
    <Flex gap="sm" wrap align="center">
      {sizes.map((size) => (
        <IconButton
          key={size}
          size={size}
          variant="soft"
          icon={Settings}
          aria-label={`设置（${size}）`}
        />
      ))}
    </Flex>
  </Flex>
));
