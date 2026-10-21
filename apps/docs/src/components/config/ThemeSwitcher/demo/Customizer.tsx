// 主题编辑器：调品牌色、中性色、圆角、缩放、字体，实时检查对比度、导出代码；
// 设置交给 customizeTheme 生成新主题，这里只作用于右边的预览（完整的页面见“主题定制”指南）
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Button,
  Card,
  Flex,
  Grid,
  lightTheme,
  Progress,
  Provider,
  ScrollArea,
  Small,
  Strong,
  Switch,
  ThemeCustomizer,
} from '@vue-tsx-pro/ui';
import { customizeTheme, type ThemeSettings } from '@vue-tsx-pro/ui/theme-customize';

const styles = stylex.create({ panel: { height: '26rem' } });

export default _component(() => {
  let settings = _state<ThemeSettings>({ accent: 'teal', radius: 'large' });
  let on = _state(true);
  return () => (
    <Grid minItemWidth="18rem" gap="lg">
      <ScrollArea sx={styles.panel} aria-label="主题设置">
        <ThemeCustomizer settings={_bind(settings)} base={lightTheme} />
      </ScrollArea>
      <Provider theme={customizeTheme(lightTheme, settings)}>
        <Card>
          <Flex direction="column" gap="md">
            <Strong>预览</Strong>
            <Small tone="muted">左边改的设置只作用于这块</Small>
            <Progress value={64} label="本月目标" />
            <Switch checked={_bind(on)}>自动续费</Switch>
            <Flex gap="sm">
              <Button size="sm">确定</Button>
              <Button size="sm" variant="outline" tone="neutral">
                取消
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Provider>
    </Grid>
  );
});
