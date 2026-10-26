// 部件属性：每个节点都能单独加样式与属性。看板卡片里的柱状图：图例挪到左边、做成胶囊按钮，
// 单位做成右边的小标签，绘图区上沿一条虚线；propsTable 落在给读屏的数据表上（看不见：给它一个名称）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Paragraph, Strong } from '@zerodep-dev/vue-tsx-pro-ui';
import { BarChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';

const quarters = [
  { quarter: 'Q1', plan: 420, actual: 380 },
  { quarter: 'Q2', plan: 460, actual: 472 },
  { quarter: 'Q3', plan: 500, actual: 455 },
  { quarter: 'Q4', plan: 540, actual: 568 },
];

const styles = css.create({
  // 单位在右、图例在左
  header: { flexDirection: 'row-reverse' },
  legend: { justifyContent: 'flex-start', marginInlineStart: 0, marginInlineEnd: 'auto' },
  legendItem: {
    paddingBlock: '2px',
    paddingInline: '_sm',
    borderRadius: '_full',
    backgroundColor: { default: '_fill', ':hover': '_fillHover' },
  },
  unit: {
    paddingBlock: '1px',
    paddingInline: '_xs',
    borderRadius: '_sm',
    backgroundColor: '_fill',
  },
  // 绘图区上沿一条虚线，和标题行分开
  plot: {
    borderTopWidth: '1px',
    borderTopStyle: 'dashed',
    borderTopColor: '_borderMuted',
    paddingBlockStart: '_sm',
  },
});

export default _component(() => () => (
  <Card
    header={
      <div>
        <Strong>季度采购额</Strong>
        <Paragraph size="sm" tone="muted">
          计划与实际
        </Paragraph>
      </div>
    }
  >
    <BarChart
      aria-label="季度采购额"
      data={quarters}
      index="quarter"
      series={[
        { key: 'plan', label: '计划', color: 'neutral' },
        { key: 'actual', label: '实际' },
      ]}
      unit="万元"
      height={220}
      propsHeader={{ sx: styles.header }}
      propsLegend={{ sx: styles.legend }}
      propsLegendItem={{ sx: styles.legendItem }}
      propsUnit={{ sx: styles.unit }}
      propsPlot={{ sx: styles.plot }}
      propsTable={{ 'aria-label': '季度采购额明细' }}
    />
  </Card>
));
