import { Bell, Heart, Search, Settings } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Icon } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex gap="md" align="center">
    <Icon icon={Search} />
    <Icon icon={Bell} />
    <Icon icon={Heart} />
    <Icon icon={Settings} />
  </Flex>
));
