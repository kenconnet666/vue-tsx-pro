import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Button,
  Card,
  defineTheme,
  Flex,
  lightTheme,
  Provider,
  Switch,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { customizeTheme, paletteColors } from '@zerodep-dev/vue-tsx-pro-ui/theme-customize';

// 直接改 token：品牌色、中性色整组换成 Radix 的 plum、mauve，再把圆角调大
const plum = defineTheme(
  lightTheme,
  {
    colors: paletteColors({ accent: 'plum', neutral: 'mauve', appearance: 'light' }),
    radii: { md: '0.75em' },
  },
  { name: 'plum' },
);

// 用主题编辑器的旋钮：效果相同，旋钮之间的换算（圆角等比缩放等）交给 customizeTheme
const grass = customizeTheme(lightTheme, { accent: 'grass', neutral: 'sage', radius: 'none' });

export default _component(() => () => (
  <Flex gap="md" wrap>
    {(
      [
        ['defineTheme', plum],
        ['customizeTheme', grass],
      ] as const
    ).map(([label, theme]) => (
      <Provider key={label} theme={theme}>
        <Card>
          <Flex direction="column" gap="sm" align="start">
            <Flex gap="xs" align="center">
              <Text weight="semibold">{label}</Text>
              <Badge tone="accent">品牌色</Badge>
            </Flex>
            <Switch _checked>自动保存</Switch>
            <Flex gap="xs">
              <Button size="sm">确定</Button>
              <Button size="sm" variant="outline">
                取消
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Provider>
    ))}
  </Flex>
));
