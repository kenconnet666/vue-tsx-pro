import { Heart, Plus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, IconButton } from '@vue-tsx-pro/ui';

// 圆角档位与 Badge、Card、输入框共用一套（Radius），对应主题的 radii
const radii = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;

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
