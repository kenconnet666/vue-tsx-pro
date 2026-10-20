import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import groupApi from 'virtual:api/NavGroupProps';
import itemApi from 'virtual:api/NavItemProps';
import api from 'virtual:api/NavListProps';
import skipLinkApi from 'virtual:api/SkipLinkProps';
import tocApi from 'virtual:api/TableOfContentsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Admin from './demo/Admin.tsx?demo';
import Contents from './demo/Contents.tsx?demo';
import Sections from './demo/Sections.tsx?demo';

export const meta = {
  title: 'NavList 侧边导航',
  description:
    '侧栏里的导航链接：NavItem、可展开的 NavGroup、带小标题的 NavSection；TableOfContents 是本页目录，SkipLink 是跳到正文的链接。',
  order: 4,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { NavGroup, NavItem, NavList, NavSection, SkipLink, TableOfContents } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="groups" title="后台导航" demo={Admin}>
        当前页按路由适配判断（也可以用 <Code>active</Code> 指定），带 aria-current="page"
        与高亮；含当前页的 NavGroup 自动展开。<Code>end</Code> 放计数之类的尾部内容。用 vue-router
        时 <Code>vueRouterAdapter(router, {'{ match: "prefix" }'})</Code> 让 /orders 在 /orders/42
        也高亮。
      </Example>
      <Example id="sections" title="文档站导航" demo={Sections}>
        NavSection 是带小标题、不能收起的一组：链接多、按主题分组的侧栏（本站就是）。
      </Example>
      <Example id="toc" title="本页目录" demo={Contents}>
        TableOfContents 列出各节标题，滚动时高亮正在读的一节，指示条滑过去；当前节带
        aria-current="location"。目录项可以手写，也可以用 <Code>collectHeadings(article)</Code> 从带
        id 的标题收集。正文在自己的滚动区域里时给 <Code>scrollRoot</Code>。
      </Example>
    </Examples>
    <ApiReference api={[api, itemApi, groupApi, tocApi, skipLinkApi]} />
  </DocPage>
));
