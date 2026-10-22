// 详情页：主栏放概览与明细，侧栏放金额与清单；容器窄了（不到 56rem）叠成一列
import { _component } from '@vue-tsx-pro/tsx';
import { AsideLayout, Card, Checklist, Descriptions, Grid, Stat } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <AsideLayout
    asideLabel="收益与清单"
    asideWidth="18rem"
    sticky={false}
    aside={
      <>
        <Card variant="outline" header="收益（万元）">
          <Grid columns={2} gap="sm">
            <Stat label="预期" value={17.48} />
            <Stat label="测算 A" value="—" />
          </Grid>
        </Card>
        <Card variant="outline" header="里程碑">
          <Checklist
            items={[
              { label: '方案确定', done: true },
              { label: '验证完成', done: false },
            ]}
          />
        </Card>
      </>
    }
  >
    <Card variant="outline" header="概览">
      <Descriptions
        columns={2}
        size="sm"
        items={[
          { label: '任务类别', value: '设计优化' },
          { label: '责任团队', value: '总体技术' },
          { label: '主办', value: '宋知行' },
          { label: '计划完成', value: '2026-10-06' },
        ]}
      />
    </Card>
    <Card variant="outline" header="降本明细">
      卡箍改用铝合金，合并两件支架，减少紧固件。
    </Card>
  </AsideLayout>
));
