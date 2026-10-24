import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/PivotTableProps';
import dimensionApi from 'virtual:api/PivotDimension';
import valueApi from 'virtual:api/PivotValue';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Count from './demo/Count.tsx?demo';
import Heatmap from './demo/Heatmap.tsx?demo';

export const meta = {
  title: 'PivotTable 透视表',
  description:
    '明细按行维度（可以多级）与列维度交叉汇总：求和、计数、平均、最小、最大，带合计行与合计列；可以着色成热力图。',
  order: 3,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { PivotTable, pivot } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn wide>
        <Example id="heatmap" title="热力图：区域、供应商 × 季度" demo={Heatmap}>
          <Code>rows</Code> 是行维度，可以多级（相同的上级合并成一格）；<Code>columns</Code>{' '}
          是列维度；<Code>value</Code> 是聚合的数值，格式同表格的列（<Code>type</Code>、
          <Code>format</Code>）。求和按 Decimal 精确相加。维度的 <Code>order</Code>{' '}
          决定顺序（没列出的排在后面），不写时按值排序；<Code>format</Code> 换成显示的文字。
          <Code>heatmap</Code>{' '}
          按数值给格子着色（强调色按比例混进底色，最深时文字仍够对比），合计不着色。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="count" title="计数与平均" demo={Count}>
          <Code>aggregate</Code> 是 <Code>sum</Code>（默认）、<Code>count</Code>（不需要数值字段）、
          <Code>avg</Code>、<Code>min</Code>、<Code>max</Code>。不写 <Code>columns</Code>{' '}
          时只按行汇总成一列。<Code>totals</Code> 关掉合计；没有明细的格子显示 <Code>empty</Code>
          （默认 —）。要自己画（导出、图表）时用 <Code>pivot</Code> 拿到行列与每格的值。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, dimensionApi, valueApi]} />
  </DocPage>
));
