import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ResizeHandleProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Split from './demo/Split.tsx?demo';

export const meta = {
  title: 'ResizeHandle 宽度调整手柄',
  description:
    '贴着元素结束边的一条细线：拖动、聚焦后按方向键调整宽度，双击回到初始宽度。AppShell 的抽屉式侧栏与 DataTable 的列宽都用它。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ResizeHandle } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="split" title="可以拖宽的列表" demo={Split}>
      手柄放在要调整的元素里（它要有 <Code>position: relative</Code> 或
      fixed），宽度从这个元素量起；
      <Code>width</Code> 是当前宽度，<Code>onWidthChange</Code> 拿到已经夹在 <Code>minWidth</Code>、
      <Code>maxWidth</Code> 之间的新宽度。拖动用 Pointer Events
      并捕获指针，移出窗口也能继续；聚焦后按 ← / → 每次调整 <Code>step</Code>（默认 16
      px），这是拖动的键盘替代（WCAG 2.5.7）；写了 <Code>defaultWidth</Code>{' '}
      时双击回到它。从右到左排版下方向自动镜像。手柄是 <Code>role="separator"</Code>
      ，带当前值与范围，名称写在 <Code>aria-label</Code> 上。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
