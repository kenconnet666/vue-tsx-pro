import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DataTableProps';
import treeApi from 'virtual:api/TreeDataTableProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Org from './demo/Org.tsx?demo';
import Orders from './demo/Orders.tsx?demo';
import States from './demo/States.tsx?demo';
import { ExampleColumn, Examples } from '../../../site/Examples';

export const meta = {
  title: 'DataTable 数据表格',
  description:
    '按列定义渲染一组行：虚拟滚动、排序、勾选、固定列、列宽调整、加载与空状态；TreeDataTable 是有层级的行。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { DataTable, TreeDataTable } from '@vue-tsx-pro/ui';">
    <Example id="orders" title="一万条订单" demo={Orders}>
      列定义里 <Code>type</Code>{' '}
      决定默认的格式与对齐（number、currency、percent、fileSize、date、dateTime，跟随语言；不写时按第一个值推断，数字靠右），
      <Code>cell</Code> 自定义单元格，
      <Code>value</Code>{' '}
      给排序用的值；点可排序的列标题在升序、降序、不排之间切换（本地按数字、日期、按语言的文字排，
      <Code>manualSort</Code> 时交给服务端）。<Code>selectionMode="multiple"</Code> 多一列勾选框；
      <Code>sticky</Code> 的列横向滚动时固定在两侧；<Code>resizable</Code>{' '}
      时可以拖动或用键盘调整列宽，
      <Code>columnWidths</Code>{' '}
      双向绑定可以存到本地设置里。工具栏（搜索、批量操作、分页）用现有组件组合，不内置。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="tree" title="组织架构" demo={Org}>
          TreeDataTable 建在 DataTable
          上，列定义、排序、勾选都一样；第一列带缩进与展开按钮，同级之间按排序排。
          <Code>loadChildren</Code> 懒加载：展开时取回子项放进数据，期间按钮显示加载中。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="states" title="加载、空状态与外观" demo={States}>
          <Code>loading</Code> 且没有数据时显示骨架行，已有数据（刷新）时表头下方一条进度条，表格带
          aria-busy；没有数据显示 <Code>empty</Code>。<Code>density</Code>、<Code>variant</Code>、
          <Code>striped</Code> 与静态表格相同。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, treeApi]} />
  </DocPage>
));
