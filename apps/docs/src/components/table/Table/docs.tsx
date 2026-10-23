import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import cellApi from 'virtual:api/TableCellProps';
import headerCellApi from 'virtual:api/TableHeaderCellProps';
import api from 'virtual:api/TableProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Invoice from './demo/Invoice.tsx?demo';
import Plans from './demo/Plans.tsx?demo';
import Quotes from './demo/Quotes.tsx?demo';
import columnTableApi from 'virtual:api/ColumnTableProps';

export const meta = {
  title: 'Table 表格',
  description:
    '静态表格：原生 table 的各个元素各一个组件，内容直接写在 JSX 里（说明文字里的表格、对比表、明细）；ColumnTable 按列定义渲染、可以合并单元格。要排序、勾选、虚拟滚动的用 DataTable。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ColumnTable, Table, TableBody, TableCaption, TableCell, TableFoot, TableHead, TableHeaderCell, TableRow } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="plans" title="套餐对比" demo={Plans}>
          行标题用 <Code>TableHeaderCell scope="row"</Code>
          ，读屏念单元格时会带上行名与列名。只用图标表达的值（勾与叉）旁边放一份隐藏文字。
          <Code>TableCaption</Code> 是表格的标题。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="invoice" title="报价明细" demo={Invoice}>
          <Code>density</Code> 三档行高、<Code>striped</Code> 斑马纹，<Code>variant="ghost"</Code>{' '}
          去掉外框（放在卡片、对话框里），外观与 DataTable 相同；数字列 <Code>align="end"</Code>{' '}
          右对齐、<Code>nowrap</Code> 不换行；合计放在 <Code>TableFoot</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <Example id="column-table" title="列定义与合并单元格：询价比价单" demo={Quotes}>
      <Code>ColumnTable</Code> 按列定义渲染静态表格：列定义与 DataTable 相同（
      <Code>type</Code>、<Code>format</Code>、<Code>statuses</Code>、<Code>empty</Code>、
      <Code>summary</Code>），不虚拟滚动、列宽按内容，适合详情页的明细、打印与导出预览。
      <Code>mergeRepeated</Code> 写列的
      key：这几列里上下相邻、值相同的格合成一格，后一列只在前一列的同一格里合并（不同供应商下的同名品类不合）；
      <Code>cellSpan</Code> 更灵活，返回 <Code>{'{ rowSpan, colSpan }'}</Code>，被合并掉的格返回
      0（同 Ant Design 的 onCell）——这里没报价的行把“单价”“小计”合成一格写原因。
    </Example>
    <ApiReference api={[api, columnTableApi, headerCellApi, cellApi]} />
  </DocPage>
));
