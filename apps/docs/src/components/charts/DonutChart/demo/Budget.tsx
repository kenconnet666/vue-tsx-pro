// 部门预算：arcWidth 为 0 画成饼图；金额是 Decimal，提示框与数据表按原值显示；颜色按语义单独给
import { _component } from '@vue-tsx-pro/tsx';
import { DonutChart } from '@vue-tsx-pro/ui/charts';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
import Decimal from 'decimal.js';

const budget = [
  { dept: '研发', amount: new Decimal('1280.50') },
  { dept: '市场', amount: new Decimal('760.25') },
  { dept: '运营', amount: new Decimal('430.00') },
  { dept: '行政', amount: new Decimal('215.75') },
];

export default _component(() => () => (
  <DonutChart
    aria-label="部门预算"
    data={budget}
    index="dept"
    value="amount"
    unit="万元"
    arcWidth={0}
    centerLabel={false}
    valueFormat={{ minimumFractionDigits: 2 }}
    // 行政用中性色，其余按色板
    itemColor={(row) => (row.dept === '行政' ? colors.textMuted : undefined)}
  />
));
