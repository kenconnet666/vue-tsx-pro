// 预算到实际的差异：成本超支是坏事，对调颜色（增加用 danger、减少用 success）；
// 中间插一根小计柱（total 不写 value：画到当时的累计）；目标线标出预算上限；点一步看明细
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Small } from '@vue-tsx-pro/ui';
import { WaterfallChart } from '@vue-tsx-pro/ui/charts';

const steps = [
  { label: '预算', value: 860, total: true },
  { label: '人力', value: 64 },
  { label: '外包', value: -38 },
  { label: '小计', total: true },
  { label: '云资源', value: 27 },
  { label: '差旅', value: -12 },
  { label: '实际', total: true },
];

export default _component(() => {
  let picked = _state('');
  return () => (
    <Flex direction="column" gap="sm">
      <WaterfallChart
        aria-label="预算到实际"
        steps={steps}
        unit="万元"
        increaseColor="danger"
        decreaseColor="success"
        totalColor="chart4"
        valueDomain={[700, undefined]}
        targets={[{ value: 900, label: '上限' }]}
        height={260}
        onItemClick={(step) => (picked = step.label)}
      />
      <Small tone="muted">{picked ? `点了：${picked}` : '点一根柱子试试'}</Small>
    </Flex>
  );
});
