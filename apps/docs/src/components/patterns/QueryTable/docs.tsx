import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/QueryTableProps';
import settingsApi from 'virtual:api/ColumnSettingsProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Orders from './demo/Orders.tsx?demo';

export const meta = {
  title: 'QueryTable 查询表格',
  description:
    '列表页的整块：查询栏、工具栏（刷新、行高、列设置、全屏）、批量操作、数据表格与分页拼在一起，状态都在 useTableQuery 里（同 ProTable）。',
  order: 4,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { QueryTable } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Example id="orders" title="采购单列表" demo={Orders}>
      <Code>query</Code> 是 <Code>useTableQuery</Code> 的返回值：页码、每页条数、排序（
      <Code>manualSort</Code>，交给服务端；<Code>multiSort</Code> 时按住 Shift
      点列标题追加一列，写在 <Code>query.sorts</Code>）、已应用的条件、总数与加载都在里面。
      <Code>filters</Code> 拿到草稿，控件绑定它的字段，点“查询”（或在输入框里回车）才交给{' '}
      <Code>query.search</Code>；“重置”回到 <Code>blankFilters</Code>
      （不写时是一开始的条件）并查询；
      <Code>moreFilters</Code> 是收起的条件。工具栏起始边是 <Code>title</Code>（也是表格的名称），
      <Code>toolbar</Code>{' '}
      放自己的按钮，结尾是刷新、行高、列设置（勾选显示、拖动排序、重置）与全屏。列标题带列菜单（固定、前后移动、隐藏），列宽可以拖动；
      <Code>persistKey</Code> 把列设置与行高记在浏览器里。<Code>selectionMode="multiple"</Code>{' '}
      时勾选后出现批量操作栏，
      <Code>batchActions</Code> 拿到已选的 key 给出按钮。列设置也可以单独用：
      <Code>ColumnSettings</Code> 与 DataTable 绑定同一份 <Code>hidden</Code>、<Code>order</Code>。
    </Example>
    <ApiReference api={[api, settingsApi]} />
  </DocPage>
));
