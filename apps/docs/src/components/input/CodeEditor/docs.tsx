import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/CodeEditorProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Config from './demo/Config.tsx?demo';
import Toolbar from './demo/Toolbar.tsx?demo';

export const meta = {
  title: 'CodeEditor 代码编辑器',
  description:
    'CodeMirror 6 的编辑器：语法高亮、括号匹配、缩进、搜索与补全，外壳同输入框，颜色与字体跟着主题。在自己的子路径里，用到时才加载。',
  order: 21,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { CodeEditor } from '@zerodep-dev/vue-tsx-pro-ui/code-editor';"
  >
    <Example id="config" title="编辑 JSON 配置" demo={Config}>
      <Code>_value</Code> 双向绑定代码，<Code>aria-label</Code> 必填；高度由 <Code>sx</Code>{' '}
      给（默认 20rem）。<Code>language</Code> 传 CodeMirror 的语言扩展（
      <Code>json()</Code>、<Code>java()</Code>……），不给时按 TSX。
      <Code>onReady</Code> 拿到编辑器，<Code>goTo(行, 列)</Code> 把光标移过去并聚焦。CodeMirror 与{' '}
      <Code>@codemirror/*</Code> 是可选的 peer，用到这个子路径时安装。
    </Example>
    <Example id="toolbar" title="工具栏与只读" demo={Toolbar}>
      编辑器的 <Code>undo</Code>、<Code>redo</Code> 给外面的按钮用；<Code>edit</Code>{' '}
      改几段代码，当作用户的修改（进撤销历史、写回 <Code>_value</Code>
      ），可视化编辑器同步回代码时用它。
      <Code>readonly</Code> 的编辑器能选中、复制、搜索，不能改。
    </Example>
    <KeyboardReference
      keys={[
        ['Tab / Shift+Tab', '缩进 / 取消缩进'],
        ['Esc，然后 Tab', '把焦点移出编辑器'],
        ['Ctrl+Z / Ctrl+Shift+Z', '撤销 / 重做'],
        ['Ctrl+F', '打开搜索与替换'],
        ['Ctrl+Space', '打开补全'],
      ]}
    >
      Tab 用来缩进，键盘用户先按 Esc 再按 Tab 离开编辑器，不会被困住。Mac 上 Ctrl 换成 ⌘。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
