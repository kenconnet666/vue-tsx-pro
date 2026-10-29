import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Grid, Text, t } from '@zerodep-dev/vue-tsx-pro-ui';
import { WaveGrid } from '@zerodep-dev/vue-tsx-pro-ui/three';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';

const styles = css.create({
  stage: { height: '14rem' },
  caption: { color: '_textMuted', padding: `${t.space.sm} ${t.space.md}` },
});

export default _component(() => () => (
  <Grid minItemWidth="18rem" gap="md">
    <Card padding="none">
      <WaveGrid sx={styles.stage} />
      <Text size="sm" sx={styles.caption}>
        grid · 默认色板
      </Text>
    </Card>
    <Card padding="none">
      <WaveGrid
        sx={styles.stage}
        variant="dots"
        palette={[colors.chart2, colors.chart7, colors.warning]}
      />
      <Text size="sm" sx={styles.caption}>
        dots · 青、绿、黄
      </Text>
    </Card>
    <Card padding="none">
      <WaveGrid
        sx={styles.stage}
        amplitude={1.8}
        speed={2}
        palette={[colors.chart5, colors.chart4, colors.chart3]}
      />
      <Text size="sm" sx={styles.caption}>
        amplitude 1.8 · speed 2
      </Text>
    </Card>
  </Grid>
));
