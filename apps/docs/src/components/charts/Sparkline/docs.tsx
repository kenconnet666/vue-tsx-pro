import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import gaugeApi from 'virtual:api/GaugeProps';
import proportionApi from 'virtual:api/ProportionBarProps';
import api from 'virtual:api/SparklineProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Cards from './demo/Cards.tsx?demo';
import GaugeSizes from './demo/GaugeSizes.tsx?demo';
import Gauges from './demo/Gauges.tsx?demo';
import InTable from './demo/InTable.tsx?demo';
import Proportions from './demo/Proportions.tsx?demo';

export const meta = {
  title: 'Sparkline 小图',
  description:
    '嵌在指标卡、表格、工作台里的小图：没有坐标轴的迷你折线（Sparkline）、半圆仪表盘（Gauge）、按构成分段的比例条（ProportionBar）。从主入口导入，纯 SVG。',
  order: 12,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Gauge, ProportionBar, Sparkline } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="cards" title="迷你图：指标卡里" demo={Cards}>
      放进 Stat 的 children：占满数值下面的一行。<Code>type</Code> 是 <Code>line</Code>
      （默认）、<Code>area</Code>（下面填一层浅色）或 <Code>bar</Code>（每个值一根柱，从 0 起），
      <Code>tone</Code> 是色调。默认标出最后一个点（<Code>showLast</Code>
      ）。读屏念成一句话：几个值、从哪到哪、最低最高，按 <Code>valueFormat</Code> 格式化，
      <Code>label</Code> 写在前面。
    </Example>
    <Example id="in-table" title="迷你图：表格里" demo={InTable}>
      宽度占满容器，<Code>height</Code> 默认 2em（随字号缩放），表格里配合行高调小。空值（
      <Code>null</Code>）处断开。
      <Code>domain</Code> 固定纵向的范围（几行一起比较时用同一个范围）。
    </Example>
    <Example id="gauge" title="仪表盘：一个量落在哪个区间" demo={Gauges}>
      <Code>value</Code> 在 <Code>min</Code>–<Code>max</Code>（默认 0–100）之间；<Code>bands</Code>{' '}
      是外圈的区间（每段到 <Code>to</Code> 为止，带色调），数值弧取它所在区间的色调（
      <Code>tone</Code> 可以指定）；<Code>target</Code> 在外圈上画一道刻度。<Code>valueFormat</Code>
      、<Code>unit</Code> 决定中间与读屏的数值写法，读屏按 meter 念。和{' '}
      <Link href="/components/progress">Progress</Link> 的分工：Progress 是做到哪了，Gauge
      是一个量处在好坏的哪一段。
    </Example>
    <Example id="gauge-sizes" title="仪表盘：大小与中间的文字" demo={GaugeSizes}>
      宽 10em，随字号缩放：<Code>size</Code> 档位或外层的字号。<Code>valueLabel</Code>{' '}
      换掉中间的文字；读屏仍念 <Code>aria-valuetext</Code>（格式化的数值与目标）。
    </Example>
    <Example id="proportion-bar" title="比例条：一个总数的构成" demo={Proportions}>
      <Code>segments</Code> 互斥、加起来是总数；颜色用 <Code>tone</Code>（状态色）或{' '}
      <Code>color</Code>
      （任意颜色）。横条对读屏是一张图，名称后面自动带上各段的数量；图例是普通文字，
      <Code>valueText</Code> 改数量的写法，<Code>legendExtra</Code> 在图例项后面补一句。数量为 0
      的段不画但留在图例里。要比较趋势、多个总数时用图表。
    </Example>
    <ApiReference api={[api, gaugeApi, proportionApi]} />
  </DocPage>
));
