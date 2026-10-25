import { Download, Plus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Button,
  Card,
  Flex,
  Provider,
  Text,
  type ComponentDefaults,
  type ComponentStyles,
} from '@vue-tsx-pro/ui';

/**
 * 一块区域里的组件统一换个样子：不必包一层组件，也不必每处写 sx。
 * 写法同 createUi({ defaults, styles })；这里用 Provider，只作用在右边那张卡片里。
 * 组件自己有的选项（按钮的 radius、标记的 variant）改默认值；选项以外的样式写进 styles
 */
const defaults: ComponentDefaults = { Button: { radius: 'full' }, Badge: { variant: 'surface' } };

const styles: ComponentStyles = {
  Button: {
    // 追加在按钮自己的样式之后
    base: { root: { letterSpacing: '0.06em' } },
    // 已有的档位也能改：描边按钮改成虚线
    variants: { variant: { outline: { root: { borderStyle: 'dashed' } } } },
  },
  Badge: {
    base: { root: { textTransform: 'uppercase', fontWeight: '_semibold' } },
  },
};

function Toolbar() {
  return (
    <Flex direction="column" gap="sm">
      <Flex gap="sm" wrap>
        <Button icon={Plus}>新建</Button>
        <Button variant="outline" icon={Download}>
          导出
        </Button>
        <Button variant="ghost">更多</Button>
      </Flex>
      <Flex gap="xs" wrap>
        <Badge tone="success">beta</Badge>
        <Badge tone="info" variant="outline">
          new
        </Badge>
      </Flex>
    </Flex>
  );
}

export default _component(() => () => (
  <Flex gap="md" wrap>
    <Card sx={{ flex: '1 1 16rem' }}>
      <Text size="sm" tone="muted">
        默认
      </Text>
      <Toolbar />
    </Card>
    <Provider defaults={defaults} styles={styles}>
      <Card sx={{ flex: '1 1 16rem' }}>
        <Text size="sm" tone="muted">
          Provider 的 defaults 与 styles
        </Text>
        <Toolbar />
      </Card>
    </Provider>
  </Flex>
));
