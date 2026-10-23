import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Grid, Text } from '@vue-tsx-pro/ui';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
import { BorderBeam } from '@vue-tsx-pro/ui/effects';

const styles = stylex.create({
  card: { position: 'relative', minHeight: '8rem', display: 'grid', placeItems: 'center' },
  caption: { color: '_textMuted' },
});

export default _component(() => () => (
  <Grid minItemWidth="10rem" gap="md">
    <Card sx={styles.card}>
      <Text size="sm" sx={styles.caption}>
        两条错开、逆向
      </Text>
      <BorderBeam duration={8000} />
      <BorderBeam
        duration={8000}
        delay={4000}
        reverse
        colorFrom={colors.chart4}
        colorTo={colors.chart3}
      />
    </Card>
    <Card sx={styles.card}>
      <Text size="sm" sx={styles.caption}>
        更长、更粗、更快
      </Text>
      <BorderBeam length={160} borderWidth="3px" duration={3000} colorTo={colors.chart6} />
    </Card>
    <Card sx={styles.card} radius="full">
      <Text size="sm" sx={styles.caption}>
        胶囊形（radius 与容器一致）
      </Text>
      <BorderBeam radius="full" colorFrom={colors.chart7} colorTo={colors.chart2} />
    </Card>
  </Grid>
));
