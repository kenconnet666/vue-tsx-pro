// 四种样式放在同一块有底色的舞台上对比：outline 没有底色、ghost 连边框也没有，在白底上看不出区别
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Grid, Paragraph, Strong } from '@zerodep-dev/vue-tsx-pro-ui';

const variants = [
  ['surface', '表面色加描边（默认）：页面上最常见的卡片'],
  ['outline', '只有描边、没有底色：放在有底色的区域里'],
  ['elevated', '浮起的表面加阴影：可点击、可拖动的卡片'],
  ['ghost', '没有边框与底色：只用来分组与留白'],
] as const;

const styles = css.create({
  stage: { padding: '_lg', borderRadius: '_lg', backgroundColor: '_surfaceMuted' },
});

export default _component(() => () => (
  <div {...css.attrs(styles.stage)}>
    <Grid minItemWidth="11em" balanced gap="md">
      {variants.map(([variant, description]) => (
        <Card key={variant} variant={variant}>
          <Strong>{variant}</Strong>
          <Paragraph size="sm" tone="muted">
            {description}
          </Paragraph>
        </Card>
      ))}
    </Grid>
  </div>
));
