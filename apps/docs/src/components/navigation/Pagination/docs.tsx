import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import pageJumpApi from 'virtual:api/PageJumpProps';
import pageSizeApi from 'virtual:api/PageSizeSelectProps';
import pagerApi from 'virtual:api/PagerProps';
import barApi from 'virtual:api/PaginationBarProps';
import api from 'virtual:api/PaginationProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Bar from './demo/Bar.tsx?demo';
import BarVariants from './demo/BarVariants.tsx?demo';
import Full from './demo/Full.tsx?demo';
import Links from './demo/Links.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'Pagination 分页',
  description:
    '上一页、页码、省略号、下一页；PaginationBar 是表格下方的整行分页栏（总数、页码、每页条数、跳页），PageSizeSelect、PageJump 也可以自己并排，Pager 是文章末尾的上一篇 / 下一篇。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { PageJump, PageSizeSelect, Pager, Pagination, PaginationBar } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="bar" title="分页栏" demo={Bar}>
          表格、列表下方的一整行：起始边是“第 1–5 条，共 1,286 条”，结束边是页码、每页条数与跳页。
          <Code>_page</Code>、<Code>_pageSize</Code> 都双向绑定（接 useTableQuery 时直接{' '}
          <Code>_bind</Code> 它的同名字段），换每页条数回到第 1
          页；只有一页时不显示跳页。分页导航的名称用 <Code>propsPagination</Code> 的{' '}
          <Code>aria-label</Code> 区分。
        </Example>
        <Example id="full" title="自己组合" demo={Full}>
          给了 <Code>total</Code> 与 <Code>_pageSize</Code> 就自动算页数，也可以直接给{' '}
          <Code>pageCount</Code>。<Code>showTotal</Code> 显示总条数；每页条数变了时，在
          PageSizeSelect 的 <Code>onSizeChange</Code> 里回到第 1
          页。三个组件各自独立，排法与分页栏不同时自己并排。
        </Example>
        <Example id="variants" title="页码的数量" demo={Variants}>
          按钮数固定：翻页时省略号换位置，按钮不跳动、不会让指针下的按钮变成别的页码。当前页带
          aria-current="page"。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="bar-variants" title="分页栏的宽度与取舍" demo={BarVariants}>
          分页栏按自己的宽度（容器查询）取舍：窄于 36em 时不显示跳页，窄于 24em
          时总数换到单独一行，放在卡片、侧栏里也不挤。
          <Code>showTotal</Code> 给函数时自己写总数（拿到 <Code>from</Code>、<Code>to</Code>、
          <Code>total</Code>）；<Code>showSizeSelect</Code>、<Code>showJump</Code> 关掉不要的部分。
        </Example>
        <Example id="links" title="链接与上一篇 / 下一篇" demo={Links}>
          <Code>href</Code> 给出每页的地址时页码渲染为链接；站内地址经路由适配不刷新页面。Pager 带
          rel="prev" / rel="next"。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, barApi, pageSizeApi, pageJumpApi, pagerApi]} />
  </DocPage>
));
