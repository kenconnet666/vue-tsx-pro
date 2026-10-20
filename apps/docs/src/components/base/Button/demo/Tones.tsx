import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex } from '@vue-tsx-pro/ui';

const tones = ['accent', 'neutral', 'danger'] as const;
const variants = ['solid', 'soft', 'surface', 'outline', 'ghost', 'link'] as const;

export default _component(() => () => (
  <Flex direction="column" gap="md">
    {tones.map((tone) => (
      <Flex key={tone} gap="sm" wrap align="center">
        {variants.map((variant) => (
          <Button key={variant} tone={tone} variant={variant}>
            {tone === 'accent' ? '确定' : tone === 'neutral' ? '取消' : '删除'}
          </Button>
        ))}
      </Flex>
    ))}
  </Flex>
));
