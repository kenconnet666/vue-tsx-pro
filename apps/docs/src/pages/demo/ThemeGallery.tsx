import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  builtinThemes,
  Button,
  Card,
  Flex,
  GridList,
  Progress,
  Provider,
  Switch,
  Text,
} from '@vue-tsx-pro/ui';

// 每张卡片套一层 Provider：主题只作用在这一块，页面其余部分不变
export default _component(() => () => (
  <GridList minItemWidth="15rem" gap="md">
    {Object.entries(builtinThemes).map(([name, theme]) => (
      <li key={name}>
        <Provider theme={theme}>
          <Card header={<Text weight="semibold">{name}</Text>}>
            <Flex direction="column" gap="sm">
              <Flex gap="xs" wrap>
                <Badge tone="accent">新版本</Badge>
                <Badge tone="success" variant="solid">
                  运行中
                </Badge>
                <Badge tone="warning">待审核</Badge>
                <Badge tone="danger">失败</Badge>
              </Flex>
              <Progress value={64} aria-label={`${name} 主题的进度条`} />
              <Switch _checked>部署后通知</Switch>
              <Flex gap="xs">
                <Button size="sm">保存</Button>
                <Button size="sm" variant="soft" tone="neutral">
                  取消
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Provider>
      </li>
    ))}
  </GridList>
));
