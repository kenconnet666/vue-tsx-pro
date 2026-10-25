// 目标线与下钻：各团队的实现销售对着年度指标；点一个团队（实际项目里跳到筛好条件的台账）
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Small } from '@vue-tsx-pro/ui';
import { BarChart } from '@vue-tsx-pro/ui/charts';

const teams = [
  { team: '总体技术', committed: 420, realized: 318 },
  { team: '研发中心', committed: 260, realized: 274 },
  { team: '运营部', committed: 310, realized: 196 },
  { team: '航电', committed: 180, realized: 142 },
];

export default _component(() => {
  let picked = _state('');
  return () => (
    <Flex direction="column" gap="sm">
      <BarChart
        aria-label="各团队的销售额对着指标"
        data={teams}
        index="team"
        series={[
          { key: 'committed', label: '承诺值' },
          { key: 'realized', label: '实现值' },
        ]}
        unit="万元"
        targets={[
          { value: 300, label: '团队指标' },
          { value: 200, label: '保底', color: 'warning' },
        ]}
        onItemClick={(row) => (picked = row.team)}
      />
      <Small tone="muted">{picked ? `点了：${picked}` : '点一组柱子试试'}</Small>
    </Flex>
  );
});
