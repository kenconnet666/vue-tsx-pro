import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Flex, Grid, GridItem, Small, Strong } from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  // 卡片撑满格子：跨两行的格子里卡片也一样高
  cell: { minHeight: '4.5rem', height: '_full' },
});

// 四列三行正好 12 格：跨两列的 3 个、跨两行的 1 个、单格的 4 个
const cells = [
  { title: '销售趋势', note: '跨两列', span: 2 },
  { title: '待办', note: '跨两行', rowSpan: 2 },
  { title: '新客户', note: '1 格' },
  { title: '转化率', note: '1 格' },
  { title: '退款', note: '1 格' },
  { title: '客单价', note: '1 格' },
  { title: '库存预警', note: '跨两列', span: 2 },
  { title: '物流异常', note: '跨两列', span: 2 },
];

export default _component(() => () => (
  <Grid columns={4} gap="sm" flow="row dense">
    {cells.map((cell) => (
      <GridItem key={cell.title} span={cell.span} rowSpan={cell.rowSpan}>
        <Card padding="sm" sx={styles.cell}>
          <Flex direction="column" gap="xs">
            <Strong>{cell.title}</Strong>
            <Small tone="muted">{cell.note}</Small>
          </Flex>
        </Card>
      </GridItem>
    ))}
  </Grid>
));
