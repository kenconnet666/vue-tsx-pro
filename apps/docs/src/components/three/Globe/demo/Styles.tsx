// 外观：点的疏密、颜色、光晕与自转速度；不拖动、不自转时就是一张静止的地球
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Flex, Grid, Small } from '@vue-tsx-pro/ui';
import { colors } from '@vue-tsx-pro/ui/tokens';
import { Globe } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  globe: { maxWidth: '16rem', marginInline: 'auto' },
});

const variants = [
  { label: '默认', props: {} },
  { label: '更密的点，反转自转', props: { density: 1.8, rotationSpeed: -10 } },
  {
    label: '暖色，不要光晕',
    props: { landColor: colors.warning, markerColor: colors.danger, glow: false },
  },
  {
    label: '静止，不能拖动',
    props: { rotationSpeed: 0, draggable: false, center: { lat: 0, lng: -30 } },
  },
];

export default _component(() => () => (
  <Grid minItemWidth="14rem" gap="md">
    {variants.map((variant) => (
      <Card key={variant.label} padding="sm">
        <Flex direction="column" gap="xs" align="center">
          <Globe {...variant.props} markers={[{ lat: 39.9, lng: 116.4 }]} sx={styles.globe} />
          <Small tone="muted">{variant.label}</Small>
        </Flex>
      </Card>
    ))}
  </Grid>
));
