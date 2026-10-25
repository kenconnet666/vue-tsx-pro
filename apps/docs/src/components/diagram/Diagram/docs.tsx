import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DiagramProps';
import controlsApi from 'virtual:api/DiagramControlsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Lanes from './demo/Lanes.tsx?demo';
import OrgChart from './demo/OrgChart.tsx?demo';
import Selection from './demo/Selection.tsx?demo';

export const meta = {
  title: 'Diagram 画布',
  description:
    '能平移、缩放的视口里摆放 HTML 节点与 SVG 连线：节点内容自己画，画布负责定位、选择与框选、键盘与读屏、连线与箭头。流程图、组织架构图、关系图都建在它上面。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Diagram, DiagramControls, useDiagram } from '@vue-tsx-pro/ui/diagram';"
  >
    <Examples>
      <ExampleColumn wide>
        <Example id="org-chart" title="组织架构" demo={OrgChart}>
          <Code>nodes</Code>{' '}
          给出每个节点的位置与大小（画布坐标），子节点是渲染函数，节点框里画什么自己定；
          <Code>edges</Code> 的 <Code>points</Code> 是排好的折线，拐角自动画成圆角、终点画箭头。
          <Code>fitView</Code> 第一次有尺寸时把整张图放进视口（不超过原大）；<Code>overlay</Code>{' '}
          里的 <Code>DiagramControls</Code>{' '}
          是缩小、比例、放大、适应画布四个按钮。拖动空白处平移，滚轮平移，按住 Ctrl / ⌘
          滚轮或触控板捏合缩放。
        </Example>
        <Example id="selection" title="选择与框选" demo={Selection}>
          <Code>selectable</Code> 让节点与连线可以点选，<Code>_selected</Code>{' '}
          双向绑定选中的节点与连线；<Code>dragMode="select"</Code>{' '}
          时拖动空白处框选（按住空格拖动才平移），
          <Code>selectionMode="partial"</Code> 碰到框就算。连线没给 <Code>points</Code>{' '}
          时画两个节点之间的直线，<Code>edgeText</Code> 写在线的中点。
        </Example>
        <Example id="lanes" title="泳道与画布外的工具栏" demo={Lanes}>
          <Code>backdrop</Code> 画在连线下面、随视口平移缩放（泳道、分区）；<Code>propsEdge</Code>{' '}
          按连线给 <Code>sx</Code>：线与箭头都是 <Code>currentColor</Code>，改 <Code>color</Code>{' '}
          就变色，<Code>strokeDasharray</Code> 画虚线。<Code>useDiagram()</Code>{' '}
          建的控制器交给画布，画布外的按钮也能缩放、适应画布，<Code>reveal</Code>{' '}
          把一个节点平移到看得见。流程图的重做见{' '}
          <Link href="/components/flow-diagram">FlowDiagram</Link>。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        [
          'Tab / Shift+Tab',
          '在视口、节点、连线（可选择时）之间移动；聚焦到视口外的节点时自动平移过去',
        ],
        ['Enter / Space', '选中聚焦的节点或连线；按住 Shift / Ctrl 时加选或取消'],
        ['Ctrl+A', '全选（可选择时）'],
        ['Escape', '清空选择'],
        ['← / → / ↑ / ↓', '视口有焦点时平移'],
        ['+ / -', '视口有焦点时放大、缩小'],
        ['0', '回到适应内容'],
      ]}
    >
      焦点在视口上时方向键平移、+ / − 缩放；Tab 依次进到各个节点（按 nodes
      的顺序），可选择时再到各条连线。
    </KeyboardReference>
    <ApiReference api={[api, controlsApi]} />
  </DocPage>
));
