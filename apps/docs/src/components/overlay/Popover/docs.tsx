import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import hoverCardApi from 'virtual:api/HoverCardProps';
import api from 'virtual:api/PopoverProps';
import tooltipApi from 'virtual:api/TooltipProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Placements from './demo/Placements.tsx?demo';
import Profile from './demo/Profile.tsx?demo';
import Share from './demo/Share.tsx?demo';
import Timing from './demo/Timing.tsx?demo';
import Toolbar from './demo/Toolbar.tsx?demo';

export const meta = {
  title: 'Popover 弹出框',
  description:
    '贴着触发器弹出的非模态浮层：点击打开的 Popover、悬停打开的 HoverCard 与 Tooltip。原生 popover 负责顶层与 Esc，floating-ui 负责定位。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { HoverCard, Popover, Tooltip } from '@vue-tsx-pro/ui';"
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
          隐藏。提示经 aria-describedby 补充说明，触发器自己要有名称，提示里不放可交互的内容。
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
        <Example id="timing" title="显示的时机" demo={Timing}>
          Tooltip 的 <Code>delay</Code> 是指针停多久才显示（默认 500
          毫秒），工具栏这类连续的按钮可以设成 0；<Code>disabled</Code> 时只渲染触发器。HoverCard 的{' '}
          <Code>delay</Code> / <Code>closeDelay</Code> 分别控制打开与离开后关闭的等待，
          <Code>offset</Code> 是与触发器的距离（像素）。三者都可以 <Code>open={'{_bind(x)}'}</Code>{' '}
          受控。
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
