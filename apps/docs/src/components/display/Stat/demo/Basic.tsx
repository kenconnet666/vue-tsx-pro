import { ChartColumn, ClipboardList, JapaneseYen, TrendingUp } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Grid, Stat, type NumericFormat } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

// 接口给的金额以元为单位（Decimal 不丢精度），卡片上按万元显示
const WAN_YUAN: NumericFormat = {
  scale: 10_000,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};
const expected = new Decimal('10875000');
const actual = new Decimal('9103600.35');

export default _component(() => () => (
  <Grid minItemWidth="14em" gap="md">
    <Card>
      <Stat label="降本项目总数" value={6} unit="项" icon={ClipboardList} />
    </Card>
    <Card>
      <Stat
        label="预期降本金额"
        value={expected}
        format={WAN_YUAN}
        unit="万元"
        icon={JapaneseYen}
      />
    </Card>
    <Card>
      <Stat label="实际降本金额" value={actual} format={WAN_YUAN} unit="万元" icon={ChartColumn} />
    </Card>
    <Card>
      <Stat
        label="降本达成率"
        value={actual.div(expected)}
        format={{ style: 'percent', maximumFractionDigits: 1 }}
        icon={TrendingUp}
      />
    </Card>
  </Grid>
));
