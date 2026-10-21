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

export const meta = {
  title: 'Table 表格',
  description:
    '静态表格：原生 table 的各个元素各一个组件，内容直接写在 JSX 里（说明文字里的表格、对比表、明细）。要排序、勾选、虚拟滚动的用 DataTable。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Table, TableBody, TableCaption, TableCell, TableFoot, TableHead, TableHeaderCell, TableRow } from '@vue-tsx-pro/ui';"
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
          <Code>density</Code> 三档行高、<Code>striped</Code> 斑马纹，外观与 DataTable 相同；数字列{' '}
          <Code>align="end"</Code> 右对齐、<Code>nowrap</Code> 不换行；合计放在{' '}
          <Code>TableFoot</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, headerCellApi, cellApi]} />
  </DocPage>
));
