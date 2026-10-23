import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DrawerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Detail from './demo/Detail.tsx?demo';
import Edit from './demo/Edit.tsx?demo';
import Filters from './demo/Filters.tsx?demo';
import Imperative from './demo/Imperative.tsx?demo';
import Sides from './demo/Sides.tsx?demo';

export const meta = {
  title: 'Drawer 抽屉',
  description:
    '从一侧滑入的模态面板：看详情、编辑、筛选时列表留在原处；可以拖动调宽、记住宽度，关闭前确认未保存的改动。与 Dialog 共用同一个内核。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Drawer, useDrawer } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn wide>
        <Example id="detail" title="详情：列表留在原处" demo={Detail}>
          点一行（或编号按钮，键盘也能打开）从结束边滑出详情：状态与时限、关键信息、流转记录，列表不跳走；正在看的那一行用
          DataTable 的 <Code>activeKey</Code> 高亮。<Code>title</Code> 与 <Code>description</Code>{' '}
          是抽屉的名称与描述，<Code>footer</Code>{' '}
          放“打开完整详情”这类去处；关上后焦点回到打开它的按钮。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="edit" title="编辑：拖宽度与关闭前确认" demo={Edit}>
          左右两侧的抽屉靠正文的一边默认可以拖动（也能聚焦后用方向键，双击回到初始宽度），一直拖到只剩一窄条、让出后面的页面，再拖回来接着填；内容不会挤成一列，多出的部分被裁掉。
          <Code>width</Code> 双向绑定、交给 <Code>usePersistentState</Code> 记住；
          <Code>{'resizable={false}'}</Code> 或 <Code>defaults.Drawer</Code> 关掉。
          <Code>onConfirm</Code> 是保存：返回 Promise 时按钮加载中、关不掉。<Code>beforeClose</Code>{' '}
          在取消、关闭按钮、<Kbd>Esc</Kbd>、点遮罩时先问一次，返回 false
          不关——有未保存的改动时确认。
        </Example>
        <Example id="sides" title="方向与宽度" demo={Sides}>
          <Code>side</Code> 取 start、end（默认）、top、bottom，start / end 跟随从右到左排版；
          <Code>size</Code> 与 Container 同档，只管左右两侧的宽度，上下两侧的高度随内容。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="filters" title="筛选" demo={Filters}>
          条件多、页面放不下时收进抽屉：改的是一份草稿，<Code>onConfirm</Code>
          （查看结果）时才生效，关掉就放弃；
          <Code>footer</Code> 里的“重置”排在取消、确认前面，确认按钮上写着已设几项。
        </Example>
        <Example id="imperative" title="命令式：从表格的一行打开" demo={Imperative}>
          <Code>useDrawer()</Code> 的 <Code>open(options)</Code> 用法同
          useDialog：每一行的“编辑”直接打开，页面里不放 Drawer。草稿留在这次打开里，
          <Code>onConfirm</Code> 保存时写回表格；
          <Code>await handle.closed</Code> 得到关上的原因（保存是 confirm，放弃是
          escape、outside、close）。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        [
          'Tab / Shift+Tab',
          '在抽屉里的可聚焦元素之间移动；页面其余部分不可操作（原生模态 dialog）',
        ],
        ['Esc', '关闭抽屉（有 beforeClose 时先问），焦点回到打开它的元素'],
        ['← / →', '宽度调整手柄聚焦时：调宽、调窄（跟随从右到左排版）；双击回到初始宽度'],
      ]}
    >
      打开时焦点落在带 <Code>autofocus</Code> 的元素上，没有就是第一个可聚焦的元素。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
