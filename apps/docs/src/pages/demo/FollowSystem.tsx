import { _component } from '@vue-tsx-pro/tsx';
import { Button, Card, Flex, midnightTheme, paperTheme, Provider, Text } from '@vue-tsx-pro/ui';

// theme 写成 { light, dark }：按系统的 prefers-color-scheme 选一套，系统切换明暗时跟着变
export default _component(() => () => (
  <Provider theme={{ light: paperTheme, dark: midnightTheme }}>
    <Card>
      <Flex direction="column" gap="sm" align="start">
        <Text>系统是亮色时用纸张主题，暗色时用午夜主题。</Text>
        <Button size="sm">试着切换系统的明暗</Button>
      </Flex>
    </Card>
  </Provider>
));
