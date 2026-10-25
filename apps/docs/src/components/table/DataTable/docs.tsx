import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DataTableProps';
import selectionBarApi from 'virtual:api/SelectionBarProps';
import treeApi from 'virtual:api/TreeDataTableProps';
import viewApi from 'virtual:api/DataTableViewProps';
import resizerApi from 'virtual:api/ColumnResizerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Changes from './demo/Changes.tsx?demo';
import Columns from './demo/Columns.tsx?demo';
import Editable from './demo/Editable.tsx?demo';
import Import from './demo/Import.tsx?demo';
import Infinite from './demo/Infinite.tsx?demo';
import Ledger from './demo/Ledger.tsx?demo';
import Locate from './demo/Locate.tsx?demo';
import MasterDetail from './demo/MasterDetail.tsx?demo';
import Org from './demo/Org.tsx?demo';
import Orders from './demo/Orders.tsx?demo';
import Pick from './demo/Pick.tsx?demo';
import Priority from './demo/Priority.tsx?demo';
import Proposals from './demo/Proposals.tsx?demo';
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
    <Example id="columns" title="采购单：表头筛选、多列排序与列菜单" demo={Columns}>
      列定义写 <Code>filter</Code> 时列标题上有筛选按钮：<Code>true</Code>{' '}
      列出这一列出现过的值（状态列按阶段顺序、显示状态名），也可以给 <Code>options</Code>，写{' '}
      <Code>'text'</Code> 是输入关键字；<Code>filters</Code> 双向绑定各列选中的值，默认在本地筛，
      <Code>manualFilter</Code> 时交给服务端。<Code>multiSort</Code> 时点列标题只按这一列排，按住
      Shift 点是追加一列（列标题上标着次序），排序写在 <Code>sorts</Code>。<Code>columnMenu</Code>{' '}
      在列标题结尾放 ⋮：排序、固定在开头 / 结尾、前后移动、隐藏，写回 <Code>columnPins</Code>、
      <Code>columnOrder</Code>、<Code>hiddenColumns</Code>
      ，都能双向绑定、存起来（这里记在浏览器里，刷新后还在）。
    </Example>
    <Example id="editable" title="采购申请明细：就地编辑与校验" demo={Editable}>
      列写 <Code>editable</Code>
      （或按行判断的函数）时可以就地编辑，表格随之变成网格（role="grid"）：方向键在格之间走，只有一格能
      Tab 进入；在可编辑的格上按 Enter、F2、双击或直接打字开始编辑，Enter 提交、Tab
      提交并到下一个可编辑的格、Esc 放弃。默认编辑器按列选（状态列是 Select，数字类是
      NumberField，其余是 TextField），<Code>editor</Code> 自己写（这里的交期是 DateField）。列的{' '}
      <Code>validate</Code> 拦下不合理的值，<Code>onCellChange</Code>{' '}
      写回，返回文字时是不接受的原因（接口拒绝），编辑器留着并显示它；<Code>validateRow</Code>{' '}
      返回整行的问题，标在对应的格上（红框，悬停与读屏都能知道原因）。
    </Example>
    <Example id="reorder" title="需求排期：拖动行" demo={Priority}>
      给了 <Code>onReorder</Code> 时第一列前面有把手：按下拖动，或聚焦后空格拿起、↑↓
      移动、空格放下（每一步读屏都会播报），拖完得到新的顺序。排序、筛选时显示的顺序不是数据的顺序，把手收起，取消后又能拖。
    </Example>
    <Example id="ledger" title="项目台账：合计、状态与批量操作" demo={Ledger}>
      列的 <Code>summary</Code> 写 <Code>'sum'</Code> 时底部多一行吸底的合计（Decimal
      精确相加，按列的格式显示）；
      <Code>statuses</Code> 是状态映射，单元格显示成 StatusBadge；没有值时显示列的{' '}
      <Code>empty</Code>
      （默认 —，这里是“待签约”）。<Code>isRowSelectable</Code>{' '}
      决定哪些行能勾选，全选跳过不能勾选的；勾选后上方的 <Code>SelectionBar</Code>{' '}
      显示已选几项与批量操作。<Code>hiddenColumns</Code> 隐藏列，这里用 Menu 的 MenuCheckboxItem
      做列显示设置（也可以开 <Code>columnMenu</Code>）；固定列与滚动的列之间有一条竖线。
    </Example>
    <Example id="changes" title="采购方案调整：分组表头" demo={Changes}>
      <Code>columnGroups</Code> 写组标题与组里各列的
      key：相邻的几列上方共用一个标题，表头变成两行，没分组的列跨两行；组与相邻的列之间有竖线，固定列照常固定。列定义仍是平铺的，排序、列宽、隐藏列都按列算，组里的列全隐藏时这一组也不显示。
    </Example>
    <Example id="details" title="供应商改进建议：展开行" demo={Proposals}>
      <Code>renderDetail</Code> 给出一行的详情：多一列展开按钮（aria-expanded，aria-controls
      指向详情），展开的行下面多一行跨全部列的详情，虚拟滚动按真实高度测量；<Code>hasDetail</Code>{' '}
      决定哪些行能展开，<Code>expandedRows</Code>{' '}
      可以双向绑定。详情横向滚动时贴着可见区域的起始边，宽度不超过可见区域。
    </Example>
    <Example id="locate" title="定位到行" demo={Locate}>
      <Code>handle</Code> 在挂载后交出 <Code>scrollToRow(key, options)</Code>
      ：虚拟滚动里还没渲染的行也能滚到，停在吸顶表头之下、吸底合计行之上（<Code>align</Code> 同
      VirtualList，默认已完整可见就不动）；找不到这一行时返回 false。滚到之后用 <Code>rowTone</Code>{' '}
      闪一下，方便从通知、搜索结果跳过来时找到它。
    </Example>
    <Example id="master-detail" title="主从视图：点一行看详情" demo={MasterDetail}>
      <Code>onRowClick</Code> 点一行（点在按钮、链接、输入框上的除外）在旁边打开详情，
      <Code>activeKey</Code> 高亮正在看的那一行（起始边一条竖线，带
      aria-current）。整行点击只是鼠标的捷径：行里还要有键盘能到的入口，这里编号是按钮。配 Splitter
      做成可拖动的左右两栏（收件箱就是这样）。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="import" title="导入校验" demo={Import}>
          <Code>rowTone</Code> 给整行着色：错误行浅红、提醒行浅黄，底色不透明，固定列也盖得住；配合{' '}
          <Code>isRowSelectable</Code> 只让校验通过的行能勾选导入。
        </Example>
        <Example id="tree" title="组织架构" demo={Org}>
          TreeDataTable 建在 DataTable
          上，列定义、排序、勾选都一样；第一列带缩进与展开按钮，同级之间按排序排（
          <Code>manualSort</Code>{' '}
          时按数据的顺序）。多选默认父子联动：勾父行连带子孙，只勾一部分时父行半选；
          <Code>checkStrictly</Code> 时各自勾选。
          <Code>loadChildren</Code>{' '}
          懒加载：展开时取回子项放进数据，期间按钮显示加载中；服务端在每行带上{' '}
          <Code>hasChildren</Code>（query 库里是 <Code>{'bool(() => d.children.any())'}</Code>
          ），交给同名的属性。懒加载的树要在服务端搜索：服务端回“匹配的节点和它们的祖先”的平铺行（query
          库的 <Code>db.withAncestors</Code>，PostgreSQL、MySQL 上是一条递归查询），
          <Code>buildTree</Code> 组装成树，再用 <Code>filterTree</Code>{' '}
          得到要展开、高亮的节点。数字列的 <Code>format</Code>{' '}
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
        <Example id="single" title="单选：选一家报价" demo={Pick}>
          <Code>selectionMode="single"</Code> 时每行是同一组的单选框（同一个
          name）：点击或方向键选中，选中的行带 aria-selected 并整行高亮；没有全选，取消选择用
          SelectionBar 的清空或把 <Code>_selected</Code> 设为空数组。
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
    <ApiReference api={[api, treeApi, selectionBarApi, viewApi, resizerApi]} />
  </DocPage>
));
