import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/LineChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Annotations from './demo/Annotations.tsx?demo';
import Basic from './demo/Basic.tsx?demo';
import Curves from './demo/Curves.tsx?demo';
import Gaps from './demo/Gaps.tsx?demo';
import Palette from './demo/Palette.tsx?demo';
import Zoom from './demo/Zoom.tsx?demo';
import Options from './demo/Options.tsx?demo';

export const meta = {
  title: 'LineChart 折线图',
  description:
    '看数值随时间的变化趋势：直线、平滑或阶梯，可带数据点。自己用 SVG 画，跟随主题，没有第三方依赖。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { LineChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          每行是一个时间点，每个系列一条线。悬停时十字线在各条线上标出当前点，提示框列出各系列的值；
          <Code>dots="hollow"</Code> 画出空心的数据点。
        </Example>
        <Example id="curves" title="线的形状" demo={Curves}>
          <Code>curve</Code>：<Code>linear</Code> 折线、<Code>monotone</Code>{' '}
          平滑（不会越过数据点）、
          <Code>step</Code> 阶梯（值保持到下一个点才跳变）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="gaps" title="缺失的数据" demo={Gaps}>
          值为 <Code>null</Code> 或 <Code>undefined</Code> 的点不画，线在这里断开，不会被当成 0。
          <Code>valueFormat</Code> 设成百分比，<Code>valueDomain</Code> 收窄数值轴，变化更明显。
        </Example>
        <Example id="palette" title="多个系列" demo={Palette}>
          系列按顺序取图表色板的 8 种颜色，各色在亮色、暗色、纸张主题的背景上都满足 3:1
          的图形对比度。
        </Example>
        <Example id="options" title="线宽、图例与状态" demo={Options}>
          <Code>lineWidth</Code> 是线宽（像素）；<Code>legend</Code>{' '}
          默认多于一个系列时显示，点图例隐藏、恢复系列；
          <Code>grid</Code>、<Code>tooltip</Code> 可以关掉。加载中（<Code>loading</Code>
          ）显示骨架，没有数据时显示 <Code>empty</Code>（默认“暂无数据”）。
        </Example>
      </ExampleColumn>
    </Examples>
    <Example id="annotations" title="标注与区间" demo={Annotations}>
      <Code>annotations</Code> 的每一项标在一个类目（<Code>at</Code>，index
      字段的值）上：只写文字时是一条竖线（换供应商、调价生效这类事件）；写了 <Code>series</Code>{' '}
      时圈出这个系列在那里的值，文字在圈的上方。<Code>bands</Code> 是浅色的带：默认在类目轴上（
      <Code>from</Code>、<Code>to</Code> 是类目，含两端），<Code>axis="value"</Code>{' '}
      时在数值轴上（目标区间，数值轴的范围会包含它）。颜色可以写语义色或色板。柱状图、面积图、组合图同样支持，横向的柱状图只画竖线与区间。
    </Example>
    <Example id="zoom" title="缩放与导出" demo={Zoom}>
      <Code>zoom</Code>{' '}
      在绘图区下面放一条区间滑块，选一段类目放大看（拖两端，或聚焦后用方向键），“显示全部”恢复；
      <Code>zoomRange</Code> 可以双向绑定（类目的位置，含两端，<Code>null</Code>{' '}
      是全部）。读屏的数据表仍是全部数据。
      <Code>exportable</Code> 在右上角放导出菜单：绘图区存成
      PNG（两倍分辨率，主题的颜色与字体照原样），数据表存成 CSV（带 BOM，Excel
      打开中文不乱码）；文件名默认是图表的名称，<Code>exportName</Code>{' '}
      可以改。柱状图、面积图、组合图同样支持；导出各种图表都有，直接用 HTML 画的漏斗图只能导出数据。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
