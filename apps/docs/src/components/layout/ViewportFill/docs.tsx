import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ViewportFillProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import ListPage from './frames/ListPage.tsx?demo';

export const meta = {
  title: 'ViewportFill 占满到窗口底边',
  description:
    '从自己的顶边一直到视口底边，里面竖排：列表页让表格正好占满一屏、在表格里滚动，分页贴着窗口底边。',
  order: 9,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ViewportFill } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="list-page" title="列表页" demo={ListPage} frame="32rem">
      顶边的位置是量出来的：上面的页头、页签、查询栏换行变高都跟着变，不用手算“视口高度减顶栏减内边距”。
      <Code>bottom</Code> 是离窗口底边留的间距（与外壳正文的内边距一致），窗口太矮时不小于{' '}
      <Code>minHeight</Code>、整页滚动。里面的表格写 <Code>flexible</Code>
      ：按行数自己的高度，最多占到剩下的高度。外壳是页面组合里的 AppShell。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
