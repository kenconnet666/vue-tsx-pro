import { Bell, Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Alert,
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  paperTheme,
  Provider,
  Small,
  Switch,
  type ComponentDefaults,
} from '@vue-tsx-pro/ui';

// 一处统一改组件的默认外观：显式写的 prop 仍然优先
const rounded: ComponentDefaults = {
  Button: { variant: 'outline', radius: 'full' },
  Badge: { variant: 'solid' },
  Alert: { variant: 'outline' },
};

const Sample = _component(() => () => (
  <Flex direction="column" gap="sm">
    <Flex gap="sm" wrap>
      <Button icon={Check}>保存</Button>
      <Button variant="ghost" tone="neutral">
        取消（显式写的 variant）
      </Button>
    </Flex>
    <Flex gap="sm" align="center">
      <Badge tone="success">已发货</Badge>
      <Switch _checked>接收通知</Switch>
    </Flex>
    <Alert tone="info" icon={Bell} title="新版本可用" />
  </Flex>
));

export default _component(() => () => (
  <Grid minItemWidth="16rem" gap="md">
    <Card padding="sm">
      <Flex direction="column" gap="sm">
        <Small tone="muted">外层：站点的主题与默认值</Small>
        <Sample />
      </Flex>
    </Card>
    <Provider defaults={rounded}>
      <Card padding="sm">
        <Flex direction="column" gap="sm">
          <Small tone="muted">Provider defaults：按钮、徽标、提示条换了默认样式</Small>
          <Sample />
        </Flex>
      </Card>
    </Provider>
    <Provider theme={paperTheme}>
      <Card padding="sm">
        <Flex direction="column" gap="sm">
          <Small tone="muted">Provider theme：这一块固定用纸张主题</Small>
          <Sample />
        </Flex>
      </Card>
    </Provider>
  </Grid>
));
