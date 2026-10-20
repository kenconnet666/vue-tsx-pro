import { ClipboardList, JapaneseYen } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Grid, Stat, Switch } from '@vue-tsx-pro/ui';

export default _component(() => {
  let loading = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Switch checked={_bind(loading)}>加载中</Switch>
      <Grid minItemWidth="12em" gap="md">
        <Card>
          <Stat label="降本项目总数" value={6} unit="项" icon={ClipboardList} loading={loading} />
        </Card>
        <Card>
          <Stat
            label="实际降本金额"
            value={910.36}
            format={{ minimumFractionDigits: 2 }}
            unit="万元"
            icon={JapaneseYen}
            change={0.123}
            changeLabel="较上月"
            loading={loading}
          />
        </Card>
        <Card header="本月说明" loading={loading}>
          实际降本金额按财务口径统计，每月 5 日更新上月数据。
        </Card>
      </Grid>
    </Flex>
  );
});
