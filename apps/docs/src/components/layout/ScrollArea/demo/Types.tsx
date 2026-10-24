import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Code, Flex, Grid, Paragraph, ScrollArea, Small } from '@vue-tsx-pro/ui';

const types = [
  ['hover', '指针在上面或正在滚动时显示（默认）'],
  ['scroll', '只在滚动时显示，停下后淡出'],
  ['always', '内容超出时一直显示'],
] as const;

const styles = css.create({
  area: { height: '9rem' },
  content: { paddingInlineEnd: '_md' },
});

const text =
  '滚动仍是浏览器原生的：触控板惯性、键盘、页内搜索、读屏都不变。只是把原生滚动条藏起来，换成半透明、浮在内容上方的滚动条，出现和消失都不占位，内容不会因此左右跳动。滚动条可以拖动，点击轨道翻一页。';

export default _component(() => () => (
  <Grid minItemWidth="10rem" gap="md">
    {types.map(([type, description]) => (
      <Card key={type} padding="sm">
        <Flex direction="column" gap="sm">
          <Code>type="{type}"</Code>
          <Small tone="muted">{description}</Small>
          <ScrollArea type={type} sx={styles.area} propsViewport={{ 'aria-label': type }}>
            <Paragraph size="sm" sx={styles.content}>
              {text}
              {text}
            </Paragraph>
          </ScrollArea>
        </Flex>
      </Card>
    ))}
  </Grid>
));
