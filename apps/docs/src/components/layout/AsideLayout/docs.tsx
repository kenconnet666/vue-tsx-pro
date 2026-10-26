import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/AsideLayoutProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Detail from './demo/Detail.tsx?demo';

export const meta = {
  title: 'AsideLayout 主栏与侧栏',
  description:
    '详情页常用的两栏：主栏放长内容，侧栏定宽、粘在顶栏下面放要一直看得见的；容器窄了叠成一列。',
  order: 8,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { AsideLayout } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="detail" title="详情页" demo={Detail}>
      子元素是主栏，<Code>aside</Code> 是侧栏（<Code>asideWidth</Code> 定宽，默认
      26rem），两栏里的块按 <Code>gap</Code> 竖排。按容器宽度决定叠不叠（不到 56rem
      叠成一列、侧栏在后），放在抽屉、分栏里也对。<Code>sticky</Code>（默认开）让侧栏粘在 AppShell
      的顶栏下面，滚动主栏时不动；示例在文档的卡片里，关掉了。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
