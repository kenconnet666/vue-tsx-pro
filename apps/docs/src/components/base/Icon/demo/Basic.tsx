import {
  Bell,
  Calendar,
  Camera,
  Cloud,
  Download,
  Folder,
  Heart,
  House,
  Mail,
  MapPin,
  Search,
  Settings,
  ShoppingCart,
  Star,
  User,
  Zap,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Grid, Icon, Small } from '@vue-tsx-pro/ui';

const icons = {
  Search,
  Bell,
  Heart,
  Settings,
  House,
  User,
  Mail,
  Calendar,
  Camera,
  Cloud,
  Download,
  Folder,
  MapPin,
  ShoppingCart,
  Star,
  Zap,
};

export default _component(() => () => (
  <Grid minItemWidth="5.5rem" gap="md">
    {Object.entries(icons).map(([name, icon]) => (
      <Flex key={name} direction="column" align="center" gap="xs">
        <Icon icon={icon} size="xl" />
        <Small tone="muted">{name}</Small>
      </Flex>
    ))}
  </Grid>
));
