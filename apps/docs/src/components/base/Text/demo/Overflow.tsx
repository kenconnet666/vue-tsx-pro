import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Flex, Grid, Paragraph, Small, Strong, Text } from '@zerodep-dev/vue-tsx-pro-ui';

const long =
  '组件库按源码使用时，改了组件立刻热更新；发布的包是编译好的 ESM 与类型声明，使用方不需要任何额外配置就能按需引入、摇树优化，样式在用到时由运行时引擎生成，开发服务器把组件库整个预构建。';

export default _component(() => () => (
  <Grid minItemWidth="18em" gap="md">
    <Card>
      <Flex direction="column" gap="xs">
        <Small tone="muted">truncate：单行省略</Small>
        <Strong truncate>vue-tsx-pro / packages / ui / src / display / VirtualList.tsx</Strong>
        <Text truncate tone="muted">
          {long}
        </Text>
      </Flex>
    </Card>
    <Card>
      <Flex direction="column" gap="xs">
        <Small tone="muted">lineClamp={2}：最多两行</Small>
        <Paragraph lineClamp={2}>{long}</Paragraph>
      </Flex>
    </Card>
    <Card>
      <Flex direction="column" gap="xs">
        <Small tone="muted">wrap="balance"：各行长度均衡</Small>
        <Paragraph wrap="balance" size="lg" weight="semibold" align="center">
          用更自然的 TSX 写 Vue 组件，符文让状态读写像普通变量
        </Paragraph>
      </Flex>
    </Card>
  </Grid>
));
