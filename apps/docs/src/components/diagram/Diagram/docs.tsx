import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DiagramProps';
import controlsApi from 'virtual:api/DiagramControlsProps';
import lanesApi from 'virtual:api/DiagramLanesProps';
import minimapApi from 'virtual:api/DiagramMinimapProps';
import nodeApi from 'virtual:api/DiagramNodeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Editor from './demo/Editor.tsx?demo';
import Lanes from './demo/Lanes.tsx?demo';
import OrgChart from './demo/OrgChart.tsx?demo';
import Selection from './demo/Selection.tsx?demo';

export const meta = {
  title: 'Diagram 画布',
  description:
    '能平移、缩放的视口里摆放 HTML 节点与 SVG 连线：画布负责定位、选择与框选、拖动与连线、键盘与读屏，节点默认是 DiagramNode。流程图、组织架构图、关系图都建在它上面。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Diagram, DiagramControls, DiagramLanes, DiagramMinimap, DiagramNode, useDiagram } from '@vue-tsx-pro/ui/diagram';"
  >
    <Examples>
      <ExampleColumn wide>
        <Example id="org-chart" title="组织架构" demo={OrgChart}>
          <Code>nodes</Code> 给出每个节点的位置与大小（画布坐标），子节点是渲染函数，常用{' '}
          <Code>DiagramNode</Code>：<Code>start</Code> 放头像，<Code>title</Code>、
          <Code>description</Code> 写姓名与岗位，<Code>tone</Code> 标出总经理。
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
          时画两个节点之间的直线，<Code>edgeText</Code> 写在线的中点。节点按类型换图标与色调。
        </Example>
        <Example id="editor" title="编辑：拖动、连线、撤销重做" demo={Editor}>
          <Code>draggable</Code> 拖动节点（选中的一起拖），<Code>snapToGrid</Code>{' '}
          吸附网格，与别的节点对齐时画对齐线，拖到视口边上自动平移，Esc 取消；松开后{' '}
          <Code>onNodesMove</Code> 给出新位置，位置由自己的状态保存。
          <Code>connectable</Code>：悬停节点从四边的端口拖出连线（<Code>onConnect</Code>
          ），选中的连线拖两端改接（<Code>onReconnect</Code>）。
          <Code>routing="orthogonal"</Code>{' '}
          的线绕开节点、同一条边上的几条线排开，拖动时实时重画。每次改动交给{' '}
          <Code>createHistory</Code> 记一步；<Code>DiagramMinimap</Code> 是小地图，
          <Code>diagramToSvg</Code> / <Code>diagramToPng</Code>{' '}
          导出整张图。没给子节点时，节点画成标题为 <Code>getNodeLabel</Code> 的{' '}
          <Code>DiagramNode</Code>。
        </Example>
        <Example id="lanes" title="泳道与画布外的工具栏" demo={Lanes}>
          <Code>backdrop</Code> 画在连线下面、随视口平移缩放，<Code>DiagramLanes</Code>{' '}
          是现成的泳道，<Code>lanesExtent</Code> 算出泳道的范围交给 <Code>extent</Code>
          ，适应画布时整个放进来。<Code>DiagramNode</Code> 的 <Code>shape="pill"</Code>{' '}
          画开始与结束，选中的描边也是胶囊形；连线的 <Code>tone</Code> 改线与文字的颜色，
          <Code>dashed</Code> 画虚线。<Code>useDiagram()</Code>{' '}
          建的控制器交给画布，画布外的按钮也能缩放、适应画布，<Code>reveal</Code>{' '}
          把一个节点平移到看得见。
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
        [
          '← / → / ↑ / ↓（节点上）',
          '挪动聚焦的节点，选中的一起挪；按住 Shift 一次五步（可拖动时）',
        ],
        ['Escape（拖动中）', '取消这次拖动或连线'],
      ]}
    >
      焦点在视口上时方向键平移、+ / − 缩放；Tab 依次进到各个节点（按 nodes
      的顺序），可选择时再到各条连线。
    </KeyboardReference>
    <ApiReference api={[api, nodeApi, lanesApi, controlsApi, minimapApi]} />
  </DocPage>
));
