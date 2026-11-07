// 工作台的一块出错：只有这块换成出错提示，旁边的指标照常；重试时这块重新创建
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Card,
  ErrorBoundary,
  Flex,
  Grid,
  Small,
  Stat,
  Strong,
} from '@zerodep-dev/vue-tsx-pro-ui';

let failNext = false;

/** 模拟一块读接口数据的卡片：failNext 打开时下一次创建会在渲染里出错 */
const Revenue = _component(() => {
  const broken = failNext;
  failNext = false;
  return () => {
    if (broken) throw new Error('接口返回的金额字段是空的（revenue.total）');
    return <Stat label="本月销售额" value={1_284_000} unit="元" change={0.124} />;
  };
});

export default _component(() => {
  let reports = _state(0);
  let version = _state(0);
  return () => (
    <Grid minItemWidth="16rem" balanced gap="md">
      <Card>
        <ErrorBoundary key={version} onError={() => reports++}>
          <Revenue />
        </ErrorBoundary>
      </Card>
      <Card>
        <Stat label="待我审批" value={6} unit="件" />
      </Card>
      <Card>
        <Flex direction="column" align="start" gap="sm">
          <Strong>模拟接口出错</Strong>
          <Small tone="muted">onError 已上报 {reports} 次</Small>
          <Button
            size="sm"
            variant="soft"
            tone="danger"
            onClick={() => {
              failNext = true;
              version++;
            }}
          >
            让第一块出错
          </Button>
        </Flex>
      </Card>
    </Grid>
  );
});
