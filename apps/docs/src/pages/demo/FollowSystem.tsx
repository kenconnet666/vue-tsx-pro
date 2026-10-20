import { CloudSun, MoonStar, Sun } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Icon,
  midnightTheme,
  paperTheme,
  Provider,
  Text,
  type IconData,
} from '@vue-tsx-pro/ui';

/** 同一张卡片：在哪套主题下都一样写，颜色全来自主题 */
const Sample = _component(({ icon, title }: { icon: IconData; title: string }) => () => (
  <Card>
    <Flex direction="column" gap="sm" align="start">
      <Flex align="center" gap="sm">
        <Icon icon={icon} />
        <Text weight="semibold">{title}</Text>
        <Badge tone="success">已同步</Badge>
      </Flex>
      <Text size="sm" tone="muted">
        系统是亮色时用纸张主题，暗色时用午夜主题。
      </Text>
      <Flex gap="sm">
        <Button size="sm">保存</Button>
        <Button size="sm" variant="soft">
          预览
        </Button>
      </Flex>
    </Flex>
  </Card>
));

// theme 写成 { light, dark }：按系统的 prefers-color-scheme 选一套，系统切换明暗时跟着变。
// 右边两张固定成亮、暗两套，对照系统切换前后的样子
export default _component(() => () => (
  <Grid minItemWidth="16em" gap="md">
    <Provider theme={{ light: paperTheme, dark: midnightTheme }}>
      <Sample icon={CloudSun} title="跟随系统" />
    </Provider>
    <Provider theme={paperTheme}>
      <Sample icon={Sun} title="系统是亮色时" />
    </Provider>
    <Provider theme={midnightTheme}>
      <Sample icon={MoonStar} title="系统是暗色时" />
    </Provider>
  </Grid>
));
