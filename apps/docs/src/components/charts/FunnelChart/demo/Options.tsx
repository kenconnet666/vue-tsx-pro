// 颜色、金额、不写转化率；加载中与没有数据
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Switch } from '@vue-tsx-pro/ui';
import { FunnelChart } from '@vue-tsx-pro/ui/charts';
import Decimal from 'decimal.js';

const stages = [
  { label: '机会值', value: new Decimal('1520000') },
  { label: '预测值', value: new Decimal('1180000') },
  { label: '承诺值', value: new Decimal('760000') },
  { label: '实现值', value: new Decimal('415000'), color: 'success' },
];

export default _component(() => {
  let loading = _state(false);
  let rates = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap>
        <Switch checked={_bind(rates)}>转化率</Switch>
        <Switch checked={_bind(loading)}>加载中</Switch>
      </Flex>
      <FunnelChart
        aria-label="收益的四个口径"
        stages={stages}
        color="chart3"
        rates={rates}
        loading={loading}
        unit="万元"
        valueFormat={{ scale: 10_000, maximumFractionDigits: 1 }}
      />
      <FunnelChart aria-label="没有数据" stages={[]} />
    </Flex>
  );
});
