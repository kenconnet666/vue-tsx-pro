import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/SparklineProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Cards from './demo/Cards.tsx?demo';
import InTable from './demo/InTable.tsx?demo';

export const meta = {
  title: 'Sparkline 迷你图',
  description:
    '没有坐标轴的小折线、面积或柱：嵌在指标卡、表格的格子、列表的一行里看走势。纯 SVG，不依赖图表库。',
  order: 11.5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Sparkline } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="cards" title="指标卡里" demo={Cards}>
      放进 Stat 的 children：占满数值下面的一行。<Code>variant</Code> 是 <Code>line</Code>
      （默认）、<Code>area</Code>（下面填一层浅色）或 <Code>bar</Code>（每个值一根柱，从 0 起），
      <Code>tone</Code> 是色调。默认标出最后一个点（<Code>showLast</Code>
      ）。读屏念成一句话：几个值、从哪到哪、最低最高，按 <Code>valueFormat</Code> 格式化，
      <Code>label</Code> 写在前面。
    </Example>
    <Example id="in-table" title="表格里" demo={InTable}>
      宽度占满容器，<Code>height</Code> 默认 2em（随字号缩放），表格里配合行高调小。空值（
      <Code>null</Code>）处断开。
      <Code>domain</Code> 固定纵向的范围（几行一起比较时用同一个范围）。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
