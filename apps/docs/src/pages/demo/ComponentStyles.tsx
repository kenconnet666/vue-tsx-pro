import { Download, Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Button,
  Card,
  Flex,
  Provider,
  Text,
  type ComponentsOptions,
} from '@zerodep-dev/vue-tsx-pro-ui';

/**
 * 一块区域里的组件统一换个样子：不必包一层组件，也不必每处写 sx。
 * 写法同 createUi({ components })；这里用 Provider，只作用在右边那张卡片里。
 * 一个组件的定制写在一处：组件自己有的选项（按钮的 radius、标记的 variant）改默认值，选项以外的样式写进 styles，
 * 某个档位取值的样式写进 variants
 */
const components: ComponentsOptions = {
  Button: {
    defaults: { radius: 'full' },
    // 追加在按钮自己的样式之后
    styles: { root: { letterSpacing: '0.06em' } },
    // 已有的档位也能改：描边按钮改成虚线
    variants: { variant: { outline: { root: { borderStyle: 'dashed' } } } },
  },
  Badge: {
    defaults: { variant: 'surface' },
    styles: { root: { textTransform: 'uppercase', fontWeight: '_semibold' } },
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
    <Provider components={components}>
      <Card sx={{ flex: '1 1 16rem' }}>
        <Text size="sm" tone="muted">
          Provider 的 components
        </Text>
        <Toolbar />
      </Card>
    </Provider>
  </Flex>
));
