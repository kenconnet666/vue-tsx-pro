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
    'IDE 式的整页骨架：中间是主内容，四周停着工具窗口，两侧竖条上的图标显示、收起它们。主内容在开关工具窗口时不重建。',
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
      {'。'}
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
