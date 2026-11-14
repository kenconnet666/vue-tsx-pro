import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import hoverCardApi from 'virtual:api/HoverCardProps';
import api from 'virtual:api/PopoverProps';
import tooltipApi from 'virtual:api/TooltipProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Compute from './demo/Compute.tsx?demo';
import Placements from './demo/Placements.tsx?demo';
import Profile from './demo/Profile.tsx?demo';
import Share from './demo/Share.tsx?demo';
import Timing from './demo/Timing.tsx?demo';
import Toolbar from './demo/Toolbar.tsx?demo';

export const meta = {
  title: 'Popover 弹出框',
  description:
    '贴着触发器弹出的非模态浮层：点击打开的 Popover、悬停打开的 HoverCard 与 Tooltip。原生 popover 负责顶层与 Esc，位置由组件库自己计算（翻转、贴边、箭头、限高）。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { HoverCard, Popover, Tooltip } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="popover" title="Popover" demo={Share}>
          <Code>trigger</Code> 是渲染函数：把收到的 props
          展开到你的按钮上，组件接管点击、aria-expanded 与定位。打开时焦点移进去，点外面、Esc
          关闭，焦点回到触发器。弹出层是 role="dialog"，名称默认取触发器的文字。
        </Example>
        <Example id="tooltip" title="Tooltip" demo={Toolbar}>
          给图标按钮补一句用途和快捷键。指针停一会儿显示，在一排按钮上移动时不用每次都等；键盘聚焦立即显示，Esc
          隐藏。提示经 aria-describedby
          补充说明，触发器自己要有名称，提示里不放可交互的内容。同一个按钮既有提示又打开菜单时，用{' '}
          <Code>mergeProps&lt;TooltipTriggerProps &amp; MenuTriggerProps&gt;(tip, menu)</Code>{' '}
          合并两个触发器的属性（ref 与事件都保留）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="hover-card" title="HoverCard" demo={Profile}>
          悬停或聚焦链接时弹出一张富内容卡片：可以移到卡片上，卡片里能放按钮（键盘 Tab
          进入）。卡片只是预览，里面的信息在别处也要能拿到——触屏没有悬停。
        </Example>
        <Example id="placement" title="位置与箭头" demo={Placements}>
          <Code>placement</Code> 是边加对齐，共 12 种；空间不够时自动翻到另一边、贴着视口平移。
          <Code>arrow</Code> 显示指向触发器的小箭头。
        </Example>
        <Example id="compute" title="自己算位置" demo={Compute}>
          组件用的定位规则是一个纯函数 <Code>computePlacement</Code>
          ：给锚点的矩形、浮层的大小和边界，返回左上角、最后落在哪一侧、箭头的位置与可用高度，不碰
          DOM。想要的一侧放不下换对侧，都放不下选空间大的一侧，再沿边缘挪回边界里。自己写贴着元素的浮层用{' '}
          <Code>anchorFloating(anchor, floating, options)</Code>
          ：它量尺寸、写位置，滚动、尺寸变化时重新定位，关闭时调返回的 <Code>stop</Code>
          ；锚点可以是元素，也可以是只有位置的虚拟锚点（指针的位置用 <Code>pointAnchor(x, y)</Code>
          ）。只要“位置可能变了”的通知时用 <Code>autoUpdate</Code>。
        </Example>
        <Example id="timing" title="显示的时机" demo={Timing}>
          Tooltip 的 <Code>delay</Code> 是指针停多久才显示（默认 500
          毫秒），工具栏这类连续的按钮可以设成 0；<Code>disabled</Code> 时只渲染触发器。HoverCard 的{' '}
          <Code>delay</Code> / <Code>closeDelay</Code> 分别控制打开与离开后关闭的等待，
          <Code>offset</Code> 是与触发器的距离（像素）。三者都可以 <Code>_open={'{x}'}</Code> 受控。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        [
          'Enter / Space',
          'Popover 的触发器：打开或关闭；打开后焦点移到第一个可聚焦元素（有 autofocus 的优先）',
        ],
        [
          'Tab',
          '聚焦 Tooltip 的触发器时立即显示提示；聚焦 HoverCard 的触发器时打开卡片，再按 Tab 进入卡片',
        ],
        ['Esc', '关闭弹出层或隐藏提示；Popover 关闭后焦点回到触发器'],
      ]}
    >
      焦点离开 HoverCard 的触发器与卡片时卡片关闭；Tooltip 不可交互，焦点不会进入提示。
    </KeyboardReference>
    <ApiReference api={[api, tooltipApi, hoverCardApi]} />
  </DocPage>
));
