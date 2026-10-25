// 数值轴的范围与单位、类目的显示文字、高度；图例、网格线、提示框、加载与空状态；hiddenSeries 双向绑定
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Small, Switch } from '@vue-tsx-pro/ui';
import { ScatterChart } from '@vue-tsx-pro/ui/charts';

// 每次会话只属于一个系列：另一个字段留空，那个系列上就不画点
interface Session {
  id: string;
  minutes: number;
  fresh?: number;
  returning?: number;
}

const sessions: Session[] = [
  { id: 'a1', minutes: 3, fresh: 4 },
  { id: 'a2', minutes: 8, fresh: 9 },
  { id: 'a3', minutes: 12, fresh: 11 },
  { id: 'a4', minutes: 5, returning: 7 },
  { id: 'a5', minutes: 15, returning: 18 },
  { id: 'a6', minutes: 21, returning: 22 },
  { id: 'a7', minutes: 2, fresh: 2 },
  { id: 'a8', minutes: 10, returning: 14 },
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
        <Switch _checked={_bind(legend)}>图例</Switch>
        <Switch _checked={_bind(grid)}>网格线</Switch>
        <Switch _checked={_bind(tooltip)}>提示框</Switch>
        <Switch _checked={_bind(loading)}>加载中</Switch>
        <Switch _checked={_bind(empty)}>没有数据</Switch>
      </Flex>
      <ScatterChart
        aria-label="访问时长与浏览页数"
        data={empty ? [] : sessions}
        index="id"
        indexFormat={(_, row) => `会话 ${row.id.toUpperCase()}`}
        x="minutes"
        xLabel="停留（分钟）"
        series={[
          { key: 'fresh', label: '新访客' },
          { key: 'returning', label: '回访' },
        ]}
        unit="页"
        valueDomain={[0, 25]}
        legend={legend}
        grid={grid}
        tooltip={tooltip}
        loading={loading}
        _hiddenSeries={_bind(hidden)}
        height={260}
      />
      <Small tone="muted">隐藏的系列：{hidden.join('、') || '无'}</Small>
    </Flex>
  );
});
