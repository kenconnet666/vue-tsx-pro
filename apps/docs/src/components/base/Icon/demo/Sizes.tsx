import { Star } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Icon, Small, Text } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const pixels = [16, 24, 32, 48] as const;
const strokes = [1, 1.5, 2, 2.5, 3] as const;

/** 一格：图标在上，说明在下 */
const Cell = _component(({ label, children }: { label: string; children?: VNodeChild }) => () => (
  <Flex direction="column" align="center" gap="xs">
    {children}
    <Small tone="muted">{label}</Small>
  </Flex>
));

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Flex gap="lg" align="end" wrap>
      {sizes.map((size) => (
        <Cell key={size} label={size}>
          <Icon icon={Star} size={size} />
        </Cell>
      ))}
      <Cell label="跟随文字">
        <Text size="xl">
          <Icon icon={Star} /> 星标
        </Text>
      </Cell>
    </Flex>
    <Flex gap="lg" align="end" wrap>
      {pixels.map((size) => (
        <Cell key={size} label={`${size}px`}>
          <Icon icon={Star} size={size} />
        </Cell>
      ))}
    </Flex>
    <Flex gap="lg" align="end" wrap>
      {strokes.map((width) => (
        <Cell key={width} label={`线宽 ${width}`}>
          <Icon icon={Star} size={32} strokeWidth={width} />
        </Cell>
      ))}
    </Flex>
  </Flex>
));
