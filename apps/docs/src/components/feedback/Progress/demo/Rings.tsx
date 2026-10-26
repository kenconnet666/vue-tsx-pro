// 环形进度与目标：仪表盘里的完成率，目标线标出要达到的位置
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Flex, Grid, Progress, Small, Text } from '@zerodep-dev/vue-tsx-pro-ui';

const plants = [
  { name: '一车间', done: 86, target: 80, tone: 'success' as const },
  { name: '二车间', done: 64, target: 80, tone: 'warning' as const },
  { name: '三车间', done: 38, target: 75, tone: 'danger' as const },
];

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Grid minItemWidth="9rem" gap="md">
      {plants.map((plant) => (
        <Card key={plant.name}>
          <Flex direction="column" align="center" gap="xs">
            <Progress
              shape="circle"
              size="lg"
              value={plant.done}
              target={plant.target}
              tone={plant.tone}
              label={`${plant.name} 产量完成率`}
            />
            <Small tone="muted">目标 {plant.target}%</Small>
          </Flex>
        </Card>
      ))}
    </Grid>
    <Flex direction="column" gap="md">
      <Progress value={6.4} max={10} target={8} label="年度产量（万件）" valueLabel="6.4 / 10" />
      <Progress value={92} target={85} tone="success" label="交付准时率" />
    </Flex>
    <Flex align="center" gap="md">
      <Progress shape="circle" size="sm" aria-label="正在同步" />
      <Text size="sm" tone="muted">
        不确定进度：弧线一直转
      </Text>
      <Progress shape="circle" value={100} size="sm" tone="success" aria-label="已完成" />
    </Flex>
  </Flex>
));
