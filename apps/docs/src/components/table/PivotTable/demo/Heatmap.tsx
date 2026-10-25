// 采购明细按“区域 → 供应商”与季度透视：相同区域合并成一格，每格是采购额之和（万元），带合计行与合计列；
// heatmap 按金额给格子着色，一眼看出哪个供应商、哪个季度贡献大。金额是 Decimal，合计精确相加
import { _component } from '@vue-tsx-pro/tsx';
import { PivotTable } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

interface Saving {
  region: string;
  supplier: string;
  quarter: string;
  amount: Decimal;
}

const raw: [string, string, string, string][] = [
  ['华东', '华辰精密', 'Q1', '128.4'],
  ['华东', '华辰精密', 'Q2', '96.2'],
  ['华东', '华辰精密', 'Q3', '210.5'],
  ['华东', '华辰精密', 'Q4', '188.1'],
  ['华东', '恒远五金', 'Q2', '42.8'],
  ['华东', '恒远五金', 'Q3', '76.3'],
  ['华东', '恒远五金', 'Q4', '120.6'],
  ['华南', '粤海机电', 'Q1', '64.9'],
  ['华南', '粤海机电', 'Q2', '71.2'],
  ['华南', '粤海机电', 'Q3', '58.4'],
  ['华南', '粤海机电', 'Q4', '90.7'],
  ['华南', '南方物流', 'Q1', '15.3'],
  ['华南', '南方物流', 'Q4', '33.0'],
  ['华北', '京津新材', 'Q1', '22.1'],
  ['华北', '京津新材', 'Q2', '35.6'],
  ['华北', '京津新材', 'Q3', '41.9'],
  ['华北', '京津新材', 'Q3', '18.2'],
  ['华北', '京津新材', 'Q4', '52.4'],
];

const savings: Saving[] = raw.map(([region, supplier, quarter, amount]) => ({
  region,
  supplier,
  quarter,
  amount: new Decimal(amount),
}));

export default _component(() => () => (
  <PivotTable
    aria-label="各区域、供应商的季度采购额（万元）"
    data={savings}
    rows={[
      { key: 'region', header: '区域', order: ['华东', '华南', '华北'] },
      { key: 'supplier', header: '供应商' },
    ]}
    columns={{ key: 'quarter', header: '季度' }}
    value={{ key: 'amount', header: '采购额', format: { minimumFractionDigits: 1 } }}
    heatmap
  />
));
