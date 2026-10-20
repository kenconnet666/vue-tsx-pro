import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  builtinThemes,
  Card,
  createThemePreference,
  Flex,
  Provider,
  Text,
  ThemeSwitcher,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  // 应用里一般在创建应用前调用一次，交给 createUi；这里只管这一块，也不记到本地存储
  const preference = createThemePreference({ themes: builtinThemes, storageKey: false });
  return () => (
    <Provider theme={preference.theme}>
      <Card>
        <Flex align="center" gap="sm" justify="between">
          <Flex align="center" gap="sm">
            <Text>当前主题</Text>
            <Badge>{preference.name}</Badge>
          </Flex>
          <ThemeSwitcher preference={preference} />
        </Flex>
      </Card>
    </Provider>
  );
});
