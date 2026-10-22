import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import alertDialogApi from 'virtual:api/AlertDialogProps';
import api from 'virtual:api/DialogProps';
import drawerApi from 'virtual:api/DrawerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Confirm from './demo/Confirm.tsx?demo';
import Drawers from './demo/Drawers.tsx?demo';
import FormPrompt from './demo/FormPrompt.tsx?demo';
import EditDrawer from './demo/EditDrawer.tsx?demo';
import Import from './demo/Import.tsx?demo';
import Profile from './demo/Profile.tsx?demo';
import Terms from './demo/Terms.tsx?demo';

export const meta = {
  title: 'Dialog 对话框',
  description:
    '模态面板：居中的 Dialog、需要确认的 AlertDialog、从一侧滑入的 Drawer。建在原生 dialog 上，焦点、Esc、背景不可操作都由浏览器负责。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { AlertDialog, Dialog, Drawer, useConfirm, useFormDialog } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="dialog" title="编辑表单" demo={Profile}>
          <Code>open</Code> 双向绑定；<Code>title</Code> 与 <Code>description</Code>{' '}
          是对话框的无障碍名称与描述，
          <Code>footer</Code> 里的按钮靠结束边排。打开时焦点落在 autofocus
          的元素上（没有就是第一个可聚焦的），关闭后回到打开它的按钮。Esc、点遮罩、右上角的关闭按钮都能关。
        </Example>
        <Example id="alert-dialog" title="确认操作" demo={Confirm}>
          AlertDialog 用于不可撤销的操作：role="alertdialog"，焦点先落在取消上，点遮罩不关闭。
          <Code>onConfirm</Code> 返回 Promise 时确认按钮显示加载中，完成才关。不想维护 open 状态时用{' '}
          <Code>useConfirm()</Code>，await 得到 true / false。<Code>confirmText</Code> /{' '}
          <Code>cancelText</Code> 改按钮文字，默认取语言包。
        </Example>
        <Example id="form-prompt" title="要填一两个字段的操作" demo={FormPrompt}>
          退回要写原因、改派要选人这类操作，不值得单独写一个对话框：<Code>useFormDialog()</Code>{' '}
          返回 <Code>prompt(options)</Code>，await 得到填好的值（取消时是 null）。字段是
          text、textarea、 select，<Code>required</Code> 与 <Code>validate</Code>{' '}
          的错误落在字段下面；<Code>onSubmit</Code> 返回 Promise
          时确认按钮显示加载中，失败时对话框留着。对话框渲染在组件树之外，沿用调用处的主题与语言。
        </Example>
        <Example id="blocking" title="进行中的任务" demo={Import}>
          <Code>closable={'{false}'}</Code> 去掉右上角的关闭按钮，
          <Code>dismissible={'{false}'}</Code> 让点遮罩不关闭——任务进行中别被误关；<Kbd>Esc</Kbd>{' '}
          仍然可以关（浏览器的约定），关闭时原生 dialog 发出 <Code>close</Code> 事件，在{' '}
          <Code>onClose</Code> 里收尾。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="long-content" title="宽度与长内容" demo={Terms}>
          <Code>size</Code> 与 Container 同档（xs–xl），另有 full
          占满视口。内容长时只滚正文（ScrollArea），标题与页脚一直看得见。
        </Example>
        <Example id="drawer" title="抽屉" demo={Drawers}>
          Drawer 与 Dialog 共用同一个内核，只是从一侧滑入：<Code>side</Code> 取
          start、end、top、bottom，
          <Code>size</Code> 控制宽度。筛选、详情、移动端导航都适合放在抽屉里。
        </Example>
        <Example id="edit-drawer" title="抽屉里编辑：拖宽度与关闭前确认" demo={EditDrawer}>
          左右两侧的抽屉靠正文的一边默认可以拖动（也能聚焦后用方向键，双击回到初始宽度），一直拖到只剩一窄条、让出后面的页面，再拖回来接着填；内容不会挤成一列，多出的部分被裁掉。
          <Code>width</Code> 双向绑定、交给 <Code>usePersistentState</Code> 记住；
          <Code>{'resizable={false}'}</Code> 或 <Code>defaults.Drawer</Code> 关掉。
          <Code>beforeClose</Code> 在关闭按钮、<Kbd>Esc</Kbd>、点遮罩时先问一次，返回 false
          不关——表单有未保存的改动时用它确认。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        [
          'Tab / Shift+Tab',
          '在对话框里的可聚焦元素之间移动；页面其余部分不可操作（原生模态 dialog 的 inert）',
        ],
        ['Esc', '关闭对话框（AlertDialog 相当于取消），焦点回到打开它的元素'],
        ['Enter / Space', '按下聚焦的按钮；AlertDialog 打开时焦点在取消上，误按 Enter 不会执行'],
      ]}
    >
      打开时焦点落在带 <Code>autofocus</Code> 的元素上，没有就是第一个可聚焦的元素。
    </KeyboardReference>
    <ApiReference api={[api, alertDialogApi, drawerApi]} />
  </DocPage>
));
