import { Star } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Icon, Text } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex gap="lg" align="center">
    <Icon icon={Star} size="sm" />
    <Icon icon={Star} size="lg" />
    <Icon icon={Star} size={32} />
    <Icon icon={Star} size={32} strokeWidth={1} />
    <Text size="xl">
      <Icon icon={Star} /> 跟随文字
    </Text>
  </Flex>
));
