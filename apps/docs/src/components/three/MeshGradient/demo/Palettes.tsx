import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Badge, Grid } from '@vue-tsx-pro/ui';
import { MeshGradient } from '@vue-tsx-pro/ui/three';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';

const PALETTES = [
  { label: '默认', palette: undefined },
  { label: '日落', palette: [colors.chart3, colors.chart4, colors.chart8, colors.warning] },
  { label: '海洋', palette: [colors.chart6, colors.chart2, colors.accent] },
  { label: '森林', palette: [colors.chart7, colors.chart2, colors.chart8] },
  { label: '霓虹', palette: [colors.chart4, colors.chart5, colors.chart6, colors.chart1] },
  { label: '单色', palette: [colors.accent, colors.accentSoft, colors.background] },
];

const styles = stylex.create({
  tile: {
    height: '11rem',
    borderRadius: '_md',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '_md',
  },
});

export default _component(() => () => (
  <Grid minItemWidth="14rem" gap="md">
    {PALETTES.map((item) => (
      <MeshGradient key={item.label} palette={item.palette} sx={styles.tile}>
        <Badge variant="surface">{item.label}</Badge>
      </MeshGradient>
    ))}
  </Grid>
));
