// 测算两版之间的差异：从 V1 出发，各参数的影响一步步加减到 V2；销售额变多是好事，所以往上是 success
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { WaterfallChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';
import Decimal from 'decimal.js';

const steps = [
  { label: 'V1 测算', value: new Decimal('126.4'), total: true },
  { label: '材料单价', value: new Decimal('-18.2') },
  { label: '成材率', value: new Decimal('9.6') },
  { label: '工时', value: new Decimal('6.5') },
  { label: '税率', value: new Decimal('-2.1') },
  { label: '批量', value: new Decimal('11.3') },
  { label: 'V2 测算', total: true },
];

export default _component(() => () => (
  <WaterfallChart
    aria-label="V1 到 V2 的测算差异"
    steps={steps}
    unit="万元"
    valueFormat={{ maximumFractionDigits: 1 }}
    height={280}
  />
));
