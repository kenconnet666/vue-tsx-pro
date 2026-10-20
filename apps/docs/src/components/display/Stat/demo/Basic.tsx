import { ChartColumn, ClipboardList, JapaneseYen, TrendingUp } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Grid, Stat } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Grid minItemWidth="14em" gap="md">
    <Card>
      <Stat label="降本项目总数" value={6} unit="项" icon={ClipboardList} />
    </Card>
    <Card>
      <Stat
        label="预期降本金额"
        value={1087.5}
        format={{ minimumFractionDigits: 2 }}
        unit="万元"
        icon={JapaneseYen}
      />
    </Card>
    <Card>
      <Stat
        label="实际降本金额"
        value={910.36}
        format={{ minimumFractionDigits: 2 }}
        unit="万元"
        icon={ChartColumn}
      />
    </Card>
    <Card>
      <Stat label="降本达成率" value={83.7} unit="%" icon={TrendingUp} />
    </Card>
  </Grid>
));
