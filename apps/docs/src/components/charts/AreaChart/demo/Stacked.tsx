// 各渠道的销售额依次叠起：上沿是总额，每一层是一个渠道的贡献；点图例隐藏一个渠道，总额跟着变。
// 切到“占比”是 stacked="percent"：叠满 100%，看线上的份额怎样逐月变大
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';
import { AreaChart } from '@vue-tsx-pro/ui/charts';

const months = [
  { month: '1月', online: 120, store: 80, partner: 40 },
  { month: '2月', online: 135, store: 76, partner: 46 },
  { month: '3月', online: 160, store: 90, partner: 52 },
  { month: '4月', online: 178, store: 88, partner: 61 },
  { month: '5月', online: 190, store: 95, partner: 70 },
  { month: '6月', online: 230, store: 102, partner: 78 },
  { month: '7月', online: 246, store: 98, partner: 85 },
  { month: '8月', online: 260, store: 110, partner: 92 },
];

export default _component(() => {
  let mode = _state<'amount' | 'percent'>('amount');
  return () => (
    <Flex direction="column" gap="sm">
      <ToggleGroup _value={_bind(mode)} required size="sm" aria-label="显示方式">
        <ToggleItem value="amount">金额</ToggleItem>
        <ToggleItem value="percent">占比</ToggleItem>
      </ToggleGroup>
      <AreaChart
        aria-label="各渠道销售额"
        stacked={mode === 'percent' ? 'percent' : true}
        data={months}
        index="month"
        series={[
          { key: 'online', label: '线上商城' },
          { key: 'store', label: '门店' },
          { key: 'partner', label: '合作渠道' },
        ]}
        unit="万元"
        curve="linear"
      />
    </Flex>
  );
});
