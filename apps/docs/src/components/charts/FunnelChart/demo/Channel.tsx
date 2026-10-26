// 渠道转化：访问 → 注册 → 加购 → 下单 → 复购；环节之间写转化率，末尾写总转化；点一个环节下钻
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { FunnelChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const stages = [
  { label: '访问', value: 186 },
  { label: '注册', value: 121 },
  { label: '加购', value: 64 },
  { label: '下单', value: 52 },
  { label: '复购', value: 23 },
];

export default _component(() => {
  let picked = _state('');
  return () => (
    <Flex direction="column" gap="sm">
      <FunnelChart
        aria-label="渠道转化"
        stages={stages}
        unit="人"
        onItemClick={(stage) => (picked = stage.label)}
      />
      <Small tone="muted">{picked ? `点了：${picked}` : '点一个环节试试'}</Small>
    </Flex>
  );
});
