// 高度、图例、提示框、加载与空状态；hiddenItems 双向绑定（点图例隐藏一块，占比按剩下的重算）
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Small, Switch } from '@vue-tsx-pro/ui';
import { DonutChart } from '@vue-tsx-pro/ui/charts';

const devices = [
  { device: '手机', users: 6420 },
  { device: '电脑', users: 2810 },
  { device: '平板', users: 760 },
  { device: '其他', users: 190 },
];

export default _component(() => {
  let legend = _state(true);
  let tooltip = _state(true);
  let loading = _state(false);
  let empty = _state(false);
  let hidden = _state<string[]>(['其他']);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap>
        <Switch _checked={legend}>图例</Switch>
        <Switch _checked={tooltip}>提示框</Switch>
        <Switch _checked={loading}>加载中</Switch>
        <Switch _checked={empty}>没有数据</Switch>
      </Flex>
      <DonutChart
        aria-label="访问设备"
        data={empty ? [] : devices}
        index="device"
        value="users"
        unit="人"
        legend={legend}
        tooltip={tooltip}
        loading={loading}
        _hiddenItems={hidden}
        empty="还没有访问记录"
        height={220}
      />
      <Small tone="muted">隐藏了：{hidden.join('、') || '无'}</Small>
    </Flex>
  );
});
