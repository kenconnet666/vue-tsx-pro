import { Heart, Plus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, IconButton } from '@vue-tsx-pro/ui';

const radii = ['none', 'sm', 'md', 'full'] as const;

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Flex gap="sm" wrap align="center">
      {radii.map((radius) => (
        <Button key={radius} radius={radius}>
          {radius}
        </Button>
      ))}
    </Flex>
    <Flex gap="sm" wrap align="center">
      {radii.map((radius) => (
        <Button key={radius} radius={radius} variant="outline" icon={Plus}>
          {radius}
        </Button>
      ))}
    </Flex>
    <Flex gap="sm" wrap align="center">
      {radii.map((radius) => (
        <IconButton
          key={radius}
          radius={radius}
          variant="soft"
          tone="danger"
          icon={Heart}
          aria-label={`收藏（${radius}）`}
        />
      ))}
    </Flex>
  </Flex>
));
