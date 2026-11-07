import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Dashboard from './frames/Dashboard.tsx?demo';
import Detail from './frames/Detail.tsx?demo';
import Form from './frames/Form.tsx?demo';
import List from './frames/List.tsx?demo';

export const meta = {
  title: 'PageTemplates 整页模板',
  description:
    '后台最常见的几种页面整页拼好：列表页、详情页、表单页、仪表盘。复制源码改数据就能用，每一块都是组件库里的组件。',
  order: 0,
};

export default _component(() => () => (
  <DocPage meta={meta}>
    <Example id="list" title="列表页" demo={List} frame="40rem">
      外壳是 <Link href="/components/app-shell">AppShell</Link>
      （顶栏、侧边导航、内容区，窄屏时侧栏收进抽屉），内容区是一个{' '}
      <Link href="/components/query-table">QueryTable</Link>
      {'：查询栏、工具栏、批量操作、表格与分页一起管，条件、排序、页码在 '}
      <Code>useTableQuery</Code>
      {' 里，真的接口用 tableParams 把它们写成参数。单号是链接，点进详情页。'}
    </Example>
    <Example id="detail" title="详情页" demo={Detail} frame="40rem">
      {
        '面包屑、标题行（单号、状态、操作按钮）、标签页（基本信息用 Descriptions，明细用带合计的 ColumnTable，审批记录用 Timeline），右侧放金额与供应商。窄屏时右侧落到下面。'
      }
    </Example>
    <Example id="form" title="表单页" demo={Form} frame="40rem">
      <Link href="/components/form">FormSection</Link>
      {
        ' 按主题分组（每组最多两列，窄时自动一列），附件用 Upload；底部的 ActionBar 吸在滚动区域的底边，长表单不用滚到底才能提交。真的表单接上 useForm（校验、提交、后端错误标到字段上）。'
      }
    </Example>
    <Example id="dashboard" title="仪表盘" demo={Dashboard} frame="40rem">
      {
        '一排指标（Stat 带同比，Grid 的 balanced 让最后一行不落单）、按月的柱状图（charts 子路径）、待办与最近的采购单（ItemList 整条可点，结尾放金额与状态）。'
      }
    </Example>
  </DocPage>
));
