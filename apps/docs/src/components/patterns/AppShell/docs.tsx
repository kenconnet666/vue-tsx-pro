import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/AppShellProps';
import brandApi from 'virtual:api/AppShellBrandProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Admin from './frames/Admin.tsx?demo';
import Layout from './frames/Layout.tsx?demo';
import Mixed from './frames/Mixed.tsx?demo';
import Overlay from './frames/Overlay.tsx?demo';

export const meta = {
  title: 'AppShell 应用外壳',
  description:
    '整页骨架：粘性半透明顶栏、左侧导航、正文、右侧栏；侧栏可以常驻（窄屏收进抽屉），也可以是盖在页面上、能拖动宽度的抽屉。自带跳到正文与浮层滚动条，本站就是用它搭的。',
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
    <Example id="overlay" title="抽屉式侧栏" demo={Overlay} frame="40rem">
      <Code>sidebarMode="overlay"</Code>{' '}
      时侧栏是盖在页面上面的抽屉，开不开都不占正文的位置：正文总是整宽，布局不随侧栏变化，数据为主的工作台用它。“菜单”按钮固定在顶栏品牌格的结束边，打开、收起都是它；抽屉从顶栏下面弹出、盖在正文上。抽屉的结束边可以拖动调整宽度（也能聚焦后用
      ← / →，双击回到初始宽度），范围 16–480 px；顶栏的品牌格按初始宽度，拖动时不变。
      <Code>sidebarOpen</Code>、<Code>sidebarWidth</Code>{' '}
      都能双向绑定，存起来就能记住各人的设置（本站记在 localStorage）。焦点在抽屉里时按 Esc
      收起、焦点回到“菜单”；窄屏时点了链接也收起。
    </Example>
    <Example id="layout" title="用户自选布局" demo={Layout} frame="40rem">
      抽屉可以从左、右、上、下四边滑出：<Code>sidebarSide</Code>（<Code>start</Code> /{' '}
      <Code>end</Code> / <Code>top</Code> / <Code>bottom</Code>
      ，随排版方向）。上下抽屉盖满宽度，导航的小节排成多列，拖动贴着正文的那条边调高度（
      <Code>_sidebarHeight</Code>）。想让用户自己选，用 <Code>createLayoutPreference</Code>
      记住形式、方向、开关与尺寸（localStorage），交给 <Code>layout</Code>，配合顶栏里的{' '}
      <Code>LayoutSwitcher</Code>；写了 <Code>layout</Code> 后 <Code>sidebarMode</Code>、
      <Code>sidebarSide</Code> 与各个 <Code>_sidebar…</Code> 绑定不再起作用。
    </Example>
    <Example id="mixed" title="混合布局与页签" demo={Mixed} frame="40rem">
      顶栏放一级导航（<Code>nav</Code>，常用 <Code>NavBar</Code>
      ，放不下的收进“更多”），侧栏放当前模块的二级导航，正文上面是打开过的页面（
      <Code>tabs</Code>，常用 <Code>PageTabs</Code>），正文下面是页脚（<Code>footer</Code>
      ）。只要顶部导航时不传 <Code>sidebar</Code> 即可。<Code>sidebarCollapsible</Code>{' '}
      在侧栏底部加“收起侧栏”按钮，宽屏时把侧栏收成只有图标的窄栏（<Code>NavList</Code>{' '}
      自动换成紧凑样式，分组悬停弹出子项），品牌格只剩标志；<Code>sidebarCollapsed</Code>{' '}
      可以双向绑定，存起来记住各人的设置。页签可以关闭（关闭按钮、Delete、中键）、拖动排序，右键有“关闭其他”“关闭右侧”；接路由时用{' '}
      <Code>useRouteTabs(router, &#123; home: '/' &#125;)</Code>（
      <Code>@zerodep-dev/vue-tsx-pro-ui/vue-router</Code>）维护打开的页面，整个展开给{' '}
      <Code>&lt;PageTabs &#123;...tabs&#125; /&gt;</Code>
      ：换页自动加页签，切回来回到上次的完整地址，关掉当前页时跳到相邻的页。
    </Example>
    <ApiReference api={[api, brandApi]} />
  </DocPage>
));
