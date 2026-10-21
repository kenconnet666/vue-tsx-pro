import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/AppShellProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Admin from './frames/Admin.tsx?demo';
import Overlay from './frames/Overlay.tsx?demo';

export const meta = {
  title: 'AppShell 应用外壳',
  description:
    '整页骨架：粘性半透明顶栏、左侧导航、正文、右侧栏；侧栏可以常驻（窄屏收进抽屉），也可以是盖在页面上、能拖动宽度的抽屉。自带跳到正文与浮层滚动条，本站就是用它搭的。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { AppShell } from '@vue-tsx-pro/ui';">
    <Example id="admin" title="后台" demo={Admin} frame="40rem">
      <Code>header</Code>、<Code>sidebar</Code>、<Code>aside</Code>{' '}
      三个插槽，正文是子元素。断点按视口：64rem
      以上侧栏常驻，更窄时收进从起始边滑出的抽屉，换页或变宽时自动关上；80rem
      以上显示右侧栏（目录这类辅助内容），更窄时不显示。两侧栏粘在顶栏下面，内容多时各自滚动；顶栏的高度经{' '}
      <Code>layoutVars.stickyOffset</Code>（从 <Code>@vue-tsx-pro/ui/vars.stylex</Code>{' '}
      导入）交给正文里的标题，锚点跳转不被顶栏挡住；铺满视口的页面也用它算高度。示例在单独的页面里打开，窗口缩窄可以看到抽屉。
      <Code>sidebarOpen</Code>{' '}
      可以双向绑定抽屉的开关：示例的导航只写锚点、不换路由，点了导航项自己关上。页面最前面的“跳到正文”（
      <Code>skipLink</Code>）与整页的浮层滚动条（<Code>pageScrollbar</Code>
      ）默认都开。
    </Example>
    <Example id="overlay" title="抽屉式侧栏" demo={Overlay} frame="40rem">
      <Code>sidebarMode="overlay"</Code>{' '}
      时侧栏是盖在页面上面的抽屉，开不开都不占正文的位置：正文总是整宽，布局不随侧栏变化，数据为主的工作台（本站的降本管理案例）用它。“菜单”按钮固定在顶栏品牌格的结束边，打开、收起都是它；抽屉从顶栏下面弹出、盖在正文上。抽屉的结束边可以拖动调整宽度（也能聚焦后用
      ← / →，双击回到初始宽度），范围 16–480 px；顶栏的品牌格按初始宽度，拖动时不变。
      <Code>sidebarOpen</Code>、<Code>sidebarWidth</Code>{' '}
      都能双向绑定，存起来就能记住各人的设置（本站记在 localStorage）。焦点在抽屉里时按 Esc
      收起、焦点回到“菜单”；窄屏时点了链接也收起。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
