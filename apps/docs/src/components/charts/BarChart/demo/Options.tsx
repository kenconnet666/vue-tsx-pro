// 柱子的圆角、类目的显示文字（indexFormat）、数值格式与范围；网格线与提示框的开关
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Grid, Slider, Switch } from '@vue-tsx-pro/ui';
import { BarChart } from '@vue-tsx-pro/ui/charts';

const months = [
  { month: '2026-04', target: 0.85, actual: 0.78 },
  { month: '2026-05', target: 0.85, actual: 0.83 },
  { month: '2026-06', target: 0.88, actual: 0.91 },
  { month: '2026-07', target: 0.88, actual: 0.86 },
  { month: '2026-08', target: 0.9, actual: 0.94 },
  { month: '2026-09', target: 0.9, actual: 0.89 },
];

export default _component(() => {
  let radius = _state(4);
  let grid = _state(true);
  let tooltip = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="12rem" gap="lg" align="end">
        <Field label={`圆角：${radius}px`}>
          <Slider _value={_bind(radius)} min={0} max={12} />
        </Field>
        <Flex gap="lg" wrap>
          <Switch _checked={_bind(grid)}>网格线</Switch>
          <Switch _checked={_bind(tooltip)}>提示框</Switch>
        </Flex>
      </Grid>
      <BarChart
        aria-label="各月目标与完成率"
        data={months}
        index="month"
        indexFormat={(_, row) => `${Number(row.month.slice(5))} 月`}
        series={[
          { key: 'target', label: '目标' },
          { key: 'actual', label: '完成' },
        ]}
        valueFormat={{ style: 'percent' }}
        valueDomain={[0.6, 1]}
        radius={radius}
        grid={grid}
        tooltip={tooltip}
        height={240}
      />
    </Flex>
  );
});
