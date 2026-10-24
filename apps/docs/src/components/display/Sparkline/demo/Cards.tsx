// 指标卡里的迷你图：Stat 的 children 占满数值下面的一行；折线看走势、面积看总量的起伏、柱看每月的多少。
// 读屏念成一句话（几个值、从哪到哪、最低最高），label 写在前面
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Grid, Sparkline, Stat } from '@vue-tsx-pro/ui';

const savings = [40, 70, 150, 205, 180, 150, 185, 150, 190, 205, 270, 360];
const visits = [820, 932, 901, 934, 1290, 1330, 1320, 1180, 1420, 1510, 1490, 1680];
const overdue = [6, 4, 7, 3, 2, 5, 1, 0, 2, 1, 3, 1];

export default _component(() => () => (
  <Grid minItemWidth="14em" gap="md">
    <Card>
      <Stat label="实际降本" value={360} unit="万元" change={0.333} changeLabel="较上月">
        <Sparkline data={savings} label="近 12 个月实际降本" valueFormat={{ suffix: '万元' }} />
      </Stat>
    </Card>
    <Card>
      <Stat label="门户访问" value={1680} unit="次" change={0.127} changeLabel="较上月">
        <Sparkline data={visits} variant="area" tone="info" label="近 12 个月门户访问" />
      </Stat>
    </Card>
    <Card>
      <Stat label="超时任务" value={1} unit="项" tone="danger" change={-0.667} invertChange>
        <Sparkline data={overdue} variant="bar" tone="danger" label="近 12 个月超时任务" />
      </Stat>
    </Card>
  </Grid>
));
