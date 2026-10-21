import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/AppShellProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Admin from './frames/Admin.tsx?demo';

export const meta = {
  title: 'AppShell 应用外壳',
  description:
    '整页骨架：粘性半透明顶栏、左侧导航、正文、右侧栏；窄屏时侧栏收进抽屉，自带跳到正文与浮层滚动条。本站就是用它搭的。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { AppShell } from '@vue-tsx-pro/ui';">
    <Example id="admin" title="后台" demo={Admin} frame="40rem">
      <Code>header</Code>、<Code>sidebar</Code>、<Code>aside</Code>{' '}
      三个插槽，正文是子元素。断点按视口：64rem
      以上侧栏常驻，更窄时收进从起始边滑出的抽屉，换页或变宽时自动关上；80rem
      以上显示右侧栏（目录这类辅助内容），更窄时不显示。两侧栏粘在顶栏下面，内容多时各自滚动；顶栏的高度经{' '}
      <Code>layoutVars.stickyOffset</Code>{' '}
      交给正文里的标题，锚点跳转不被顶栏挡住。示例在单独的页面里打开，窗口缩窄可以看到抽屉。
      <Code>sidebarOpen</Code>{' '}
      可以双向绑定抽屉的开关：示例的导航只写锚点、不换路由，点了导航项自己关上。页面最前面的“跳到正文”（
      <Code>skipLink</Code>）与整页的浮层滚动条（<Code>pageScrollbar</Code>
      ）默认都开。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
