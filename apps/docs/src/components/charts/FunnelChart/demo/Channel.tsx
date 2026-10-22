// 渠道转化：建议 → 立项 → 任务 → 兑现；环节之间写转化率，末尾写总转化；点一个环节下钻
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Small } from '@vue-tsx-pro/ui';
import { FunnelChart } from '@vue-tsx-pro/ui/charts';

const stages = [
  { label: '提交建议', value: 186 },
  { label: '通过初审', value: 121 },
  { label: '立项', value: 64 },
  { label: '转入任务', value: 52 },
  { label: '收益兑现', value: 23 },
];

export default _component(() => {
  let picked = _state('');
  return () => (
    <Flex direction="column" gap="sm">
      <FunnelChart
        aria-label="供应商建议的转化"
        stages={stages}
        unit="项"
        onItemClick={(stage) => (picked = stage.label)}
      />
      <Small tone="muted">{picked ? `点了：${picked}` : '点一个环节试试'}</Small>
    </Flex>
  );
});
