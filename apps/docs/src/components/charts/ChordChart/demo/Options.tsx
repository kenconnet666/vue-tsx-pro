// 图例、提示框、加载与空状态
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Switch } from '@zerodep-dev/vue-tsx-pro-ui';
import { ChordChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const teams = [
  { id: 'design', label: '设计' },
  { id: 'web', label: '前端' },
  { id: 'server', label: '后端' },
  { id: 'qa', label: '测试' },
];

const handoffs = [
  { source: 'design', target: 'web', value: 42 },
  { source: 'web', target: 'server', value: 31 },
  { source: 'server', target: 'qa', value: 27 },
  { source: 'web', target: 'qa', value: 24 },
  { source: 'qa', target: 'web', value: 18 },
  { source: 'design', target: 'qa', value: 9 },
];

export default _component(() => {
  let legend = _state(true);
  let tooltip = _state(true);
  let loading = _state(false);
  let empty = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap>
        <Switch _checked={legend}>图例</Switch>
        <Switch _checked={tooltip}>提示框</Switch>
        <Switch _checked={loading}>加载中</Switch>
        <Switch _checked={empty}>没有数据</Switch>
      </Flex>
      <ChordChart
        aria-label="团队之间的交接"
        nodes={teams}
        links={empty ? [] : handoffs}
        unit="次"
        legend={legend}
        tooltip={tooltip}
        loading={loading}
        empty="这个月还没有交接记录"
        height={320}
      />
    </Flex>
  );
});
