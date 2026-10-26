import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/NavBarProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Header from './demo/Header.tsx?demo';

export const meta = {
  title: 'NavBar 横向导航',
  description: '顶栏的一行链接与下拉菜单，放不下的项收进“更多”。侧边的多级导航用 NavList。',
  order: 4.5,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { NavBar } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="header" title="后台顶栏" demo={Header}>
      <Code>items</Code> 里有 <Code>href</Code> 的是链接，有 <Code>children</Code>{' '}
      的是下拉菜单（Menu，菜单项是链接）。当前页按路由适配判断（同{' '}
      <Link href="/components/nav-list">NavList</Link>），链接带 aria-current
      与下划线，子项是当前页时它的下拉按钮也高亮；<Code>badge</Code>{' '}
      是计数角标。放不下时后面的项收进“更多”菜单（有子项的按分组列出），藏起来的项不占位、读屏与 Tab
      都跳过。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
