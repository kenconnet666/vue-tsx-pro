import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex } from '@vue-tsx-pro/ui';

const tones = [
  ['neutral', '取消'],
  ['accent', '确定'],
  ['info', '详情'],
  ['success', '完成'],
  ['warning', '注意'],
  ['danger', '删除'],
] as const;
const variants = ['solid', 'soft', 'surface', 'outline', 'ghost', 'link'] as const;

export default _component(() => () => (
  <Flex direction="column" gap="md">
    {tones.map(([tone, label]) => (
      <Flex key={tone} gap="sm" wrap align="center">
        {variants.map((variant) => (
          <Button key={variant} tone={tone} variant={variant}>
            {label}
          </Button>
        ))}
      </Flex>
    ))}
  </Flex>
));
