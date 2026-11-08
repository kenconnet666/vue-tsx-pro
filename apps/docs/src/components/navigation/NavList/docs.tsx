import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import navBarApi from 'virtual:api/NavBarProps';
import groupApi from 'virtual:api/NavGroupProps';
import itemApi from 'virtual:api/NavItemProps';
import api from 'virtual:api/NavListProps';
import navMenuApi from 'virtual:api/NavMenuProps';
import sectionApi from 'virtual:api/NavSectionProps';
import skipLinkApi from 'virtual:api/SkipLinkProps';
import tocApi from 'virtual:api/TableOfContentsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Admin from './demo/Admin.tsx?demo';
import Compact from './demo/Compact.tsx?demo';
import Contents from './demo/Contents.tsx?demo';
import MenuTree from './demo/MenuTree.tsx?demo';
import Sections from './demo/Sections.tsx?demo';
import TopBar from './demo/TopBar.tsx?demo';

export const meta = {
  title: 'NavList 导航菜单',
  description:
    '侧栏里的导航链接（NavList：NavItem、可展开的 NavGroup、带小标题的 NavSection）、按菜单数据渲染的 NavMenu、顶栏一行的 NavBar；TableOfContents 是本页目录，SkipLink 是跳到正文的链接。',
  order: 4,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { NavBar, NavGroup, NavItem, NavList, NavMenu, NavSection, SkipLink, TableOfContents } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="groups" title="后台导航" demo={Admin}>
          当前页按路由适配判断（也可以用 <Code>active</Code> 指定），带 aria-current="page"
          与高亮；含当前页的 NavGroup 自动展开。<Code>end</Code> 放计数之类的尾部内容。用 vue-router
          时 <Code>vueRouterAdapter(router, {'{ match: "prefix" }'})</Code> 让 /orders 在 /orders/42
          也高亮。
        </Example>
        <Example id="compact" title="窄侧栏：只显示图标" demo={Compact}>
          <Code>compact</Code> 时各项只剩图标，名称留给读屏、悬停或聚焦时用提示显示；NavSection 的{' '}
          <Code>icon</Code> 是小节标题前的标记（不能点），紧凑时代替标题。AppShell
          的侧栏收成图标栏时自动进入紧凑，不用写 <Code>compact</Code>。紧凑时 NavGroup
          只剩图标，悬停、聚焦时子项从右边弹出来（完整的文字，Tab
          进入），组里有当前页时图标高亮；NavItem 的 <Code>badge</Code>{' '}
          是计数角标，展开时在文字后面，紧凑时叠在图标上。
        </Example>
        <Example id="menu" title="按菜单数据渲染：NavMenu" demo={MenuTree}>
          菜单是一棵树（后端按角色返回、或配置里写的）时交给 <Code>NavMenu</Code>：
          <Code>items</Code> 的字段同 NavBar
          的项（label、href、icon、badge、disabled、children），同一份数据可以同时给顶栏的 NavBar
          和侧栏的 NavMenu。有 <Code>children</Code> 的项是一组：顶层默认是一直展开的小节，
          <Code>{'topLevel="group"'}</Code> 改成可收起的分组；没有 <Code>href</Code>{' '}
          又没有可显示子项的目录不画，用户没有能看的页面时目录自然消失。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="sections" title="文档站导航" demo={Sections}>
          NavSection 是带小标题、不能收起的一组：链接多、按主题分组的侧栏（本站就是）。
          <Code>disabled</Code> 的项不能点、不能聚焦，<Code>end</Code> 放在项的末尾（计数、标记）。
        </Example>
        <Example id="toc" title="本页目录" demo={Contents}>
          TableOfContents 列出各节标题，滚动时高亮正在读的一节，指示条滑过去；当前节带
          aria-current="location"。目录项可以手写，也可以用 <Code>collectHeadings(article)</Code>{' '}
          从带 id 的标题收集。正文在自己的滚动区域里时给 <Code>scrollRoot</Code>。
        </Example>
        <Example id="nav-bar" title="顶栏一行：NavBar" demo={TopBar}>
          <Code>NavBar</Code> 是顶栏的一行链接与下拉菜单：<Code>items</Code> 里有 <Code>href</Code>{' '}
          的是链接，有 <Code>children</Code>{' '}
          的是下拉菜单（菜单项是链接）。当前页同样按路由适配判断，子项是当前页时它的下拉按钮也高亮；放不下时后面的项收进“更多”菜单，藏起来的项不占位、读屏与
          Tab 都跳过。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference
      api={[api, sectionApi, itemApi, groupApi, navMenuApi, navBarApi, tocApi, skipLinkApi]}
    />
  </DocPage>
));
