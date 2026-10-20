import { _component } from '@vue-tsx-pro/tsx';
import { Card, Grid, Stat } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Grid minItemWidth="12em" gap="md">
    <Card>
      <Stat label="订单数" value={1284} change={0.123} changeLabel="较上月" />
    </Card>
    <Card>
      <Stat label="客单价" value={86.4} unit="元" change={-0.042} changeLabel="较上月" />
    </Card>
    <Card>
      <Stat
        label="平均响应时间"
        value={212}
        unit="ms"
        change={-0.18}
        changeLabel="较上周"
        invertChange
        description="越低越好：下降显示为改善"
      />
    </Card>
  </Grid>
));
