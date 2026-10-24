// 工作台的一排仪表盘：完成率（分三段，目标 90%）、产能利用率（越过 85% 就是提醒）、供应商风险分（越低越好，区间倒过来）。
// 数值弧的颜色取它所在区间的色调；读屏按 meter 念数值与目标
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Gauge, Grid } from '@vue-tsx-pro/ui';

const styles = stylex.create({
  // 仪表盘在卡片里居中
  center: { display: 'grid', justifyItems: 'center' },
});

export default _component(() => () => (
  <Grid minItemWidth="12em" gap="md">
    <Card sx={styles.center}>
      <Gauge
        value={0.82}
        max={1}
        valueFormat={{ style: 'percent' }}
        label="年度降本完成率"
        target={0.9}
        bands={[
          { to: 0.6, tone: 'danger' },
          { to: 0.9, tone: 'warning' },
          { to: 1, tone: 'success' },
        ]}
      />
    </Card>
    <Card sx={styles.center}>
      <Gauge
        value={0.91}
        max={1}
        valueFormat={{ style: 'percent' }}
        label="产线利用率"
        bands={[
          { to: 0.7, tone: 'info' },
          { to: 0.85, tone: 'success' },
          { to: 1, tone: 'warning' },
        ]}
      />
    </Card>
    <Card sx={styles.center}>
      <Gauge
        value={38}
        label="供应商风险分"
        bands={[
          { to: 40, tone: 'success' },
          { to: 70, tone: 'warning' },
          { to: 100, tone: 'danger' },
        ]}
      />
    </Card>
    <Card sx={styles.center}>
      <Gauge
        value={2.4}
        max={5}
        valueFormat={{ maximumFractionDigits: 1 }}
        unit="天"
        label="平均处理时长"
        tone="accent"
      />
    </Card>
  </Grid>
));
