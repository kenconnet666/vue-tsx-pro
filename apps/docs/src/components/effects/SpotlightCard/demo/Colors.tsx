import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Grid, Stat } from '@vue-tsx-pro/ui';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
import { SpotlightCard } from '@vue-tsx-pro/ui/effects';

const STATS = [
  { label: '新增用户', value: 12840, color: colors.chart2 },
  { label: '订单金额', value: 98213, color: colors.chart3, unit: '元' },
  { label: '转化率', value: 4.7, color: colors.chart4, unit: '%' },
  { label: '留存', value: 68.2, color: colors.chart5, unit: '%', border: false },
];

const styles = stylex.create({ card: { height: '100%' } });

export default _component(() => () => (
  <Grid minItemWidth="12rem" gap="md">
    {STATS.map((stat) => (
      <SpotlightCard key={stat.label} color={stat.color} size="14em" border={stat.border}>
        <Card sx={styles.card}>
          <Stat label={stat.label} value={stat.value} unit={stat.unit} />
        </Card>
      </SpotlightCard>
    ))}
  </Grid>
));
