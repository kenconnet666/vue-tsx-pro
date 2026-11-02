import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/AppShellProps';
import brandApi from 'virtual:api/AppShellBrandProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Admin from './frames/Admin.tsx?demo';
import Fullscreen from './frames/Fullscreen.tsx?demo';
import Mixed from './frames/Mixed.tsx?demo';

export const meta = {
  title: 'AppShell 应用外壳',
  description:
    '整页骨架：粘性半透明顶栏、左侧导航、正文、右侧栏；宽屏时侧栏常驻，窄屏收进抽屉；右上角能进入全屏，只留正文。自带跳到正文与浮层滚动条，本站就是用它搭的。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { AppShell, AppShellBrand } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Example id="admin" title="后台" demo={Admin} frame="40rem">
      <Code>header</Code>、<Code>sidebar</Code>、<Code>aside</Code>{' '}
      三个插槽，正文是子元素。断点按视口：64rem
      以上侧栏常驻，更窄时收进从起始边滑出的抽屉，换页或变宽时自动关上；80rem
      以上显示右侧栏（目录这类辅助内容），更窄时不显示。两侧栏粘在顶栏下面，内容多时各自滚动；顶栏的高度经{' '}
      <Code>layoutVars.stickyOffset</Code>（从 <Code>@zerodep-dev/vue-tsx-pro-ui/vars</Code>{' '}
      导入）交给正文里的标题，锚点跳转不被顶栏挡住；铺满视口的页面也用它算高度。示例在单独的页面里打开，窗口缩窄可以看到抽屉。
      <Code>sidebarOpen</Code>{' '}
      可以双向绑定抽屉的开关：示例的导航只写锚点、不换路由，点了导航项自己关上。页面最前面的“跳到正文”（
      <Code>skipLink</Code>）与整页的浮层滚动条（<Code>pageScrollbar</Code>
      ）默认都开。
    </Example>
    <Example id="fullscreen" title="全屏" demo={Fullscreen} frame="28rem">
      顶栏结束边默认有全屏按钮（<Code>fullscreenable</Code>
      ）：进入后不显示顶栏和左侧栏，正文占满窗口，同时请求浏览器全屏；右上角留一个退出按钮，Esc
      也退出。
      <Code>_fullscreen</Code>{' '}
      可以双向绑定。隐藏的顶栏和侧栏留在页面里，退出后滚动位置、展开的分组都还在。浏览器不让全屏时（如
      iframe 没写 <Code>allow="fullscreen"</Code>）照样隐藏这两块。
    </Example>
    <Example id="mixed" title="混合布局" demo={Mixed} frame="40rem">
      顶栏放一级导航（<Code>nav</Code>，常用 <Code>NavBar</Code>
      ，放不下的收进“更多”），侧栏放当前模块的二级导航，正文下面是页脚（<Code>footer</Code>
      ）。只要顶部导航时不传 <Code>sidebar</Code> 即可。<Code>sidebarCollapsible</Code>{' '}
      在侧栏底部加“收起侧栏”按钮，宽屏时把侧栏收成只有图标的窄栏（<Code>NavList</Code>{' '}
      自动换成紧凑样式，分组悬停弹出子项），品牌格只剩标志；<Code>_sidebarCollapsed</Code>{' '}
      可以双向绑定，存起来记住各人的设置。
    </Example>
    <ApiReference api={[api, brandApi]} />
  </DocPage>
));
