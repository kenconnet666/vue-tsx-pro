import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex } from '@vue-tsx-pro/ui';

const tones = ['accent', 'neutral', 'danger'] as const;

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    {tones.map((tone) => (
      <Flex key={tone} gap="sm" wrap>
        <Button tone={tone}>{tone}</Button>
        <Button tone={tone} variant="soft">
          {tone}
        </Button>
        <Button tone={tone} variant="outline">
          {tone}
        </Button>
      </Flex>
    ))}
  </Flex>
));
