import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/AsideLayoutProps';
import fillApi from 'virtual:api/ViewportFillProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Detail from './demo/Detail.tsx?demo';
import ListPage from './frames/ListPage.tsx?demo';

export const meta = {
  title: 'AsideLayout 页面版式',
  description:
    '整页的版式：详情页的主栏与侧栏（AsideLayout，侧栏定宽、粘在顶栏下面，容器窄了叠成一列），列表页占满到窗口底边（ViewportFill，表格正好占满一屏、在表格里滚动）。',
  order: 8,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { AsideLayout, ViewportFill } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="detail" title="详情页：主栏与侧栏" demo={Detail}>
      子元素是主栏，<Code>aside</Code> 是侧栏（<Code>asideWidth</Code> 定宽，默认
      26rem），两栏里的块按 <Code>gap</Code> 竖排。按容器宽度决定叠不叠（不到 56rem
      叠成一列、侧栏在后），放在抽屉、分栏里也对。<Code>sticky</Code>（默认开）让侧栏粘在 AppShell
      的顶栏下面，滚动主栏时不动；示例在文档的卡片里，关掉了。
    </Example>
    <Example id="viewport-fill" title="列表页：占满到窗口底边" demo={ListPage} frame="32rem">
      <Code>ViewportFill</Code>{' '}
      从自己的顶边一直到视口底边，里面竖排。顶边的位置是量出来的：上面的页头、页签、查询栏换行变高都跟着变，不用手算“视口高度减顶栏减内边距”。
      <Code>bottom</Code> 是离窗口底边留的间距，窗口太矮时不小于 <Code>minHeight</Code>
      、整页滚动。里面的表格写 <Code>flexible</Code>：按行数自己的高度，最多占到剩下的高度。
    </Example>
    <ApiReference api={[api, fillApi]} />
  </DocPage>
));
