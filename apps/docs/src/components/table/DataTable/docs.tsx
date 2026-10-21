import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DataTableProps';
import selectionBarApi from 'virtual:api/SelectionBarProps';
import treeApi from 'virtual:api/TreeDataTableProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Import from './demo/Import.tsx?demo';
import Infinite from './demo/Infinite.tsx?demo';
import Ledger from './demo/Ledger.tsx?demo';
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
    <Example id="ledger" title="降本台账：合计、状态与批量操作" demo={Ledger}>
      列的 <Code>summary</Code> 写 <Code>'sum'</Code> 时底部多一行吸底的合计（Decimal
      精确相加，按列的格式显示）；
      <Code>statuses</Code> 是状态映射，单元格显示成 StatusBadge；没有值时显示列的{' '}
      <Code>empty</Code>
      （默认 —，这里是“待定价”）。<Code>isRowSelectable</Code>{' '}
      决定哪些行能勾选，全选跳过不能勾选的；勾选后上方的 <Code>SelectionBar</Code>{' '}
      显示已选几项与批量操作。<Code>hiddenColumns</Code> 隐藏列，用 Menu 的 MenuCheckboxItem
      做列显示设置；固定列与滚动的列之间有一条竖线。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="import" title="导入校验" demo={Import}>
          <Code>rowTone</Code> 给整行着色：错误行浅红、提醒行浅黄，底色不透明，固定列也盖得住；配合{' '}
          <Code>isRowSelectable</Code> 只让校验通过的行能勾选导入。
        </Example>
        <Example id="tree" title="组织架构" demo={Org}>
          TreeDataTable 建在 DataTable
          上，列定义、排序、勾选都一样；第一列带缩进与展开按钮，同级之间按排序排。
          <Code>
            loadChildren
          </Code> 懒加载：展开时取回子项放进数据，期间按钮显示加载中。数字列的 <Code>format</Code>{' '}
          与类型的默认格式合并，金额按万元显示写 <Code>{'{ scale: 10_000 }'}</Code>
          ，单位放在表头里。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="states" title="加载、空状态与外观" demo={States}>
          <Code>loading</Code> 且没有数据时显示骨架行，已有数据（刷新）时表头下方一条进度条，表格带
          aria-busy；没有数据显示 <Code>empty</Code>。<Code>density</Code>、<Code>variant</Code>、
          <Code>striped</Code> 与静态表格相同。
        </Example>
        <Example id="infinite" title="滚动加载" demo={Infinite}>
          <Code>onRangeChange</Code>{' '}
          报告可见行的范围（不含预渲染的行），离末尾不远时取下一页；取的时候 <Code>loading</Code>
          ，已有数据所以只在表头下方显示进度条。内容会换行时给 <Code>estimateRowHeight</Code>{' '}
          一个接近的估计，滚动条更准。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Enter / Space', '在可排序的列标题上：切换升序、降序、不排'],
        ['Space', '在勾选框上：勾选这一行；表头的勾选框全选或全不选'],
        ['← / →', '在列宽的拖动把手上：调窄 / 调宽这一列（从右到左排版时反过来）'],
        ['↓ / ↑ / PageDown / PageUp', '表格区域聚焦时：纵向滚动（横向用 ← / →）'],
        ['Enter / Space', '在树形表格的展开按钮上：展开或收起这一行'],
      ]}
    >
      列标题、勾选框、展开按钮都是原生控件，按 Tab
      顺序经过；行本身不可聚焦，单元格里的链接、按钮照常可用。
    </KeyboardReference>
    <ApiReference api={[api, treeApi, selectionBarApi]} />
  </DocPage>
));
