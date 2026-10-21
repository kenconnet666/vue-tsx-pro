// 线宽、图例、网格线、提示框、加载与空状态；indexFormat 把类目换成显示文字；hiddenSeries 双向绑定，按钮也能切换
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Switch, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';
import { LineChart } from '@vue-tsx-pro/ui/charts';

const hours = [8, 10, 12, 14, 16, 18, 20, 22].map((hour, index) => ({
  hour,
  api: [120, 340, 410, 380, 450, 520, 300, 160][index]!,
  web: [80, 210, 260, 240, 310, 290, 220, 140][index]!,
}));

export default _component(() => {
  let width = _state('2');
  let legend = _state(true);
  let grid = _state(true);
  let tooltip = _state(true);
  let loading = _state(false);
  let empty = _state(false);
  let hidden = _state<string[]>([]);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" align="center" wrap>
        <ToggleGroup value={_bind(width)} required size="sm" aria-label="线宽">
          <ToggleItem value="1">细</ToggleItem>
          <ToggleItem value="2">中</ToggleItem>
          <ToggleItem value="4">粗</ToggleItem>
        </ToggleGroup>
        <Switch checked={_bind(legend)}>图例</Switch>
        <Switch checked={_bind(grid)}>网格线</Switch>
        <Switch checked={_bind(tooltip)}>提示框</Switch>
        <Switch checked={_bind(loading)}>加载中</Switch>
        <Switch checked={_bind(empty)}>没有数据</Switch>
      </Flex>
      <LineChart
        aria-label="每小时请求量"
        data={empty ? [] : hours}
        index="hour"
        indexFormat={(hour) => `${hour}:00`}
        series={[
          { key: 'api', label: '接口' },
          { key: 'web', label: '网页' },
        ]}
        unit="次/分"
        lineWidth={Number(width)}
        legend={legend}
        grid={grid}
        tooltip={tooltip}
        loading={loading}
        hiddenSeries={_bind(hidden)}
        height={240}
      />
      <Flex gap="sm" align="center">
        <Button
          size="sm"
          variant="soft"
          onClick={() => (hidden = hidden.includes('web') ? [] : ['web'])}
        >
          {hidden.includes('web') ? '显示网页' : '只看接口'}
        </Button>
      </Flex>
    </Flex>
  );
});
