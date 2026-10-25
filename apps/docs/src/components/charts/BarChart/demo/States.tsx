import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Switch } from '@vue-tsx-pro/ui';
import { BarChart } from '@vue-tsx-pro/ui/charts';

const data = [
  { name: 'A', value: 40 },
  { name: 'B', value: 65 },
  { name: 'C', value: 52 },
];

export default _component(() => {
  let loading = _state(false);
  let empty = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap>
        <Switch _checked={_bind(loading)}>加载中</Switch>
        <Switch _checked={_bind(empty)}>没有数据</Switch>
      </Flex>
      <BarChart
        aria-label="示例数据"
        data={empty ? [] : data}
        index="name"
        series={[{ key: 'value', label: '数值' }]}
        loading={loading}
        height={200}
      />
    </Flex>
  );
});
