// 示例自己的主题偏好：不记进 localStorage，只作用于下面这块（整站的切换在右上角）。
// 应用里通常把 preference.theme 交给 createUi 或最外层的 Provider
import { Bell } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  createThemePreference,
  darkTheme,
  Flex,
  lightTheme,
  paperTheme,
  Provider,
  Small,
  Strong,
  Switch,
} from '@vue-tsx-pro/ui';
import { ThemeSwitcher } from '@vue-tsx-pro/ui/patterns';

const preference = createThemePreference({
  themes: { light: lightTheme, dark: darkTheme, paper: paperTheme },
  storageKey: false,
  fallback: 'light',
});

export default _component(() => {
  let notify = _state(true);
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex align="center" gap="sm">
        <ThemeSwitcher preference={preference} />
        <Small tone="muted">
          当前：{preference.name}
          {preference.preference === 'system' ? '（跟随系统）' : ''}
        </Small>
      </Flex>
      <Provider theme={preference.theme}>
        <Card>
          <Flex direction="column" gap="md">
            <Flex direction="column" gap="xs">
              <Strong>通知设置</Strong>
              <Small tone="muted">这块区域用的是上面选的主题</Small>
            </Flex>
            <Switch checked={_bind(notify)}>新评论时提醒我</Switch>
            <Flex gap="sm">
              <Button size="sm" icon={Bell}>
                保存
              </Button>
              <Button size="sm" variant="soft" tone="neutral">
                取消
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Provider>
    </Flex>
  );
});
