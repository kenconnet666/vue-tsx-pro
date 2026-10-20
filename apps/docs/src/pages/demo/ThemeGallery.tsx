import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Button,
  Card,
  darkTheme,
  Flex,
  GridList,
  highContrastTheme,
  lightTheme,
  midnightTheme,
  paperTheme,
  Progress,
  Provider,
  Switch,
  Text,
} from '@vue-tsx-pro/ui';

const themes = [
  ['亮色', lightTheme],
  ['暗色', darkTheme],
  ['纸张', paperTheme],
  ['午夜', midnightTheme],
  ['高对比', highContrastTheme],
] as const;

// 每张卡片套一层 Provider：主题只作用在这一块，页面其余部分不变
export default _component(() => () => (
  <GridList minItemWidth="15rem" gap="md">
    {themes.map(([label, theme]) => (
      <li key={theme.name}>
        <Provider theme={theme}>
          <Card header={<Text weight="semibold">{label}</Text>}>
            <Flex direction="column" gap="sm">
              <Flex gap="xs" wrap>
                <Badge tone="accent">新版本</Badge>
                <Badge tone="success">运行中</Badge>
                <Badge tone="danger">失败</Badge>
              </Flex>
              <Progress value={64} aria-label={`${label}主题的进度条`} />
              <Switch checked>部署后通知</Switch>
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
