// 堆叠：同一季度的成本叠成一根柱子看总量；切到“占比”是 stacked="percent"，每根叠满 100%，只看构成的变化，
// 提示框里同时有金额与占比
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, ToggleGroup, ToggleItem } from '@zerodep-dev/vue-tsx-pro-ui';
import { BarChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const quarters = [
  { quarter: '一季度', material: 120, labor: 80, overhead: 40 },
  { quarter: '二季度', material: 150, labor: 85, overhead: 45 },
  { quarter: '三季度', material: 110, labor: 90, overhead: 38 },
  { quarter: '四季度', material: 170, labor: 95, overhead: 52 },
];

export default _component(() => {
  let mode = _state<'amount' | 'percent'>('amount');
  return () => (
    <Flex direction="column" gap="sm">
      <ToggleGroup _value={mode} required size="sm" aria-label="显示方式">
        <ToggleItem value="amount">金额</ToggleItem>
        <ToggleItem value="percent">占比</ToggleItem>
      </ToggleGroup>
      <BarChart
        aria-label="各季度成本构成"
        data={quarters}
        index="quarter"
        series={[
          { key: 'material', label: '材料' },
          { key: 'labor', label: '人工' },
          { key: 'overhead', label: '制造费用' },
        ]}
        unit="万元"
        stacked={mode === 'percent' ? 'percent' : true}
      />
    </Flex>
  );
});
