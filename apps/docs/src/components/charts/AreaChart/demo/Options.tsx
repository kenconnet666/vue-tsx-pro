// 格式与坐标：类目的显示文字（indexFormat）、数值格式（百分比）、数值轴的范围；
// 图例、网格线、提示框、加载中、没有数据的开关；hiddenSeries 双向绑定，点图例时写回
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Small, Switch } from '@vue-tsx-pro/ui';
import { AreaChart } from '@vue-tsx-pro/ui/charts';

const weeks = [
  { date: '2026-08-03', paid: 0.021, trial: 0.048 },
  { date: '2026-08-10', paid: 0.024, trial: 0.051 },
  { date: '2026-08-17', paid: 0.022, trial: 0.055 },
  { date: '2026-08-24', paid: 0.028, trial: 0.058 },
  { date: '2026-08-31', paid: 0.031, trial: 0.054 },
  { date: '2026-09-07', paid: 0.029, trial: 0.061 },
  { date: '2026-09-14', paid: 0.034, trial: 0.066 },
];

export default _component(() => {
  let legend = _state(true);
  let grid = _state(true);
  let tooltip = _state(true);
  let loading = _state(false);
  let empty = _state(false);
  let hidden = _state<string[]>([]);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap>
        <Switch _checked={legend}>图例</Switch>
        <Switch _checked={grid}>网格线</Switch>
        <Switch _checked={tooltip}>提示框</Switch>
        <Switch _checked={loading}>加载中</Switch>
        <Switch _checked={empty}>没有数据</Switch>
      </Flex>
      <AreaChart
        aria-label="每周转化率"
        data={empty ? [] : weeks}
        index="date"
        indexFormat={(_, row) => row.date.slice(5).replace('-', '/')}
        series={[
          { key: 'trial', label: '试用转化' },
          { key: 'paid', label: '付费转化' },
        ]}
        valueFormat={{ style: 'percent', maximumFractionDigits: 1 }}
        valueDomain={[0, 0.08]}
        legend={legend}
        grid={grid}
        tooltip={tooltip}
        loading={loading}
        _hiddenSeries={hidden}
        empty="这段时间还没有数据"
        height={240}
      />
      <Small tone="muted">隐藏的系列：{hidden.join('、') || '无'}（点图例切换）</Small>
    </Flex>
  );
});
