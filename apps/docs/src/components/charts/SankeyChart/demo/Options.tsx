// 提示框、加载与空状态
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Switch } from '@vue-tsx-pro/ui';
import { SankeyChart } from '@vue-tsx-pro/ui/charts';

const nodes = [
  { id: 'cart', label: '加入购物车' },
  { id: 'checkout', label: '去结算' },
  { id: 'paid', label: '已付款' },
  { id: 'left', label: '放弃' },
];

const links = [
  { source: 'cart', target: 'checkout', value: 3200 },
  { source: 'cart', target: 'left', value: 1800 },
  { source: 'checkout', target: 'paid', value: 2600 },
  { source: 'checkout', target: 'left', value: 600 },
];

export default _component(() => {
  let tooltip = _state(true);
  let loading = _state(false);
  let empty = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap>
        <Switch _checked={_bind(tooltip)}>提示框</Switch>
        <Switch _checked={_bind(loading)}>加载中</Switch>
        <Switch _checked={_bind(empty)}>没有数据</Switch>
      </Flex>
      <SankeyChart
        aria-label="下单流程"
        nodes={nodes}
        links={empty ? [] : links}
        unit="人"
        tooltip={tooltip}
        loading={loading}
        empty="今天还没有订单"
        height={260}
      />
    </Flex>
  );
});
