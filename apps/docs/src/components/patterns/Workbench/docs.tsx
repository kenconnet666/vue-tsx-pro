import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/WorkbenchProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Ide from './demo/Ide.tsx?demo';

export const meta = {
  title: 'Workbench 工作台',
  description:
    'IDE 式的整页骨架：中间是主内容，四周停着工具窗口，两侧竖条上的图标显示、收起它们，拖到别的边挪窗口，也能浮动。主内容在开关工具窗口时不重建。',
  order: 20,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Workbench, defaultWorkbenchLayout } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Example id="ide" title="小 IDE" demo={Ide}>
      {'左边上下各一个（'}
      <Code>left</Code>
      {'、'}
      <Code>leftBottom</Code>
      {'），右边一个，下边一个占满整宽；同一处一次显示一个。"运行"窗口的 '}
      <Code>available</Code>
      {' 跟着运行状态，'}
      <Code>showWhenAvailable</Code>
      {' 让它运行时自动出来、停止时收起。布局是 '}
      <Code>_layout</Code>
      {'，要记住时配 '}
      <Code>usePersistentState</Code>
      {
        '。把竖条上的图标拖到另一组就把窗口挪过去（同 JetBrains），标题栏的 ⋯ 菜单里还能移到五处中的任一处、浮动（拖标题栏挪、拖右下角改大小）和停靠回去；挪过的、浮动的记在布局的 '
      }
      <Code>anchors</Code>
      {'、'}
      <Code>floating</Code>
      {' 里。'}
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
