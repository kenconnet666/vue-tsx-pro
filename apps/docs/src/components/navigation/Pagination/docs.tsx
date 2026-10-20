import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import pageJumpApi from 'virtual:api/PageJumpProps';
import pageSizeApi from 'virtual:api/PageSizeSelectProps';
import pagerApi from 'virtual:api/PagerProps';
import api from 'virtual:api/PaginationProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Full from './demo/Full.tsx?demo';
import Links from './demo/Links.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'Pagination 分页',
  description:
    '上一页、页码、省略号、下一页；PageSizeSelect、PageJump 是可以随意并排的配套组件，Pager 是文章末尾的上一篇 / 下一篇。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { PageJump, PageSizeSelect, Pager, Pagination } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="full" title="表格下方的分页" demo={Full}>
        给了 <Code>total</Code> 与 <Code>pageSize</Code> 就自动算页数，也可以直接给{' '}
        <Code>pageCount</Code>。<Code>showTotal</Code> 显示总条数；每页条数变了时，在 PageSizeSelect
        的 <Code>onUpdate</Code> 里回到第 1 页。三个组件各自独立，按需组合。
      </Example>
      <Example id="variants" title="页码的数量" demo={Variants}>
        按钮数固定：翻页时省略号换位置，按钮不跳动、不会让指针下的按钮变成别的页码。当前页带
        aria-current="page"。
      </Example>
      <Example id="links" title="链接与上一篇 / 下一篇" demo={Links}>
        <Code>href</Code> 给出每页的地址时页码渲染为链接；站内地址经路由适配不刷新页面。Pager 带
        rel="prev" / rel="next"。
      </Example>
    </Examples>
    <ApiReference api={[api, pageSizeApi, pageJumpApi, pagerApi]} />
  </DocPage>
));
