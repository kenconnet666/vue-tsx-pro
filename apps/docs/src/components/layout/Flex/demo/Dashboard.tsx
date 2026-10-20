import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, Grid, Small, Strong } from '@vue-tsx-pro/ui';

const styles = stylex.create({
  wide: { gridColumn: 'span 2' },
  tall: { gridRow: 'span 2' },
  cell: { minHeight: '4.5rem' },
});

// 四列三行正好 12 格：跨两列的 3 个、跨两行的 1 个、单格的 4 个
const cells = [
  { title: '销售趋势', note: '跨两列', sx: styles.wide },
  { title: '待办', note: '跨两行', sx: styles.tall },
  { title: '新客户', note: '1 格' },
  { title: '转化率', note: '1 格' },
  { title: '退款', note: '1 格' },
  { title: '客单价', note: '1 格' },
  { title: '库存预警', note: '跨两列', sx: styles.wide },
  { title: '物流异常', note: '跨两列', sx: styles.wide },
];

export default _component(() => () => (
  <Grid columns={4} gap="sm" flow="row dense">
    {cells.map((cell) => (
      <Card key={cell.title} padding="sm" sx={[styles.cell, cell.sx]}>
        <Flex direction="column" gap="xs">
          <Strong>{cell.title}</Strong>
          <Small tone="muted">{cell.note}</Small>
        </Flex>
      </Card>
    ))}
  </Grid>
));
