import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import CostDashboard from './frames/CostDashboard.tsx?demo';

export const meta = {
  title: 'Cost Dashboard 首页 · 统计看板',
  description:
    '联合降本的首页：需要处理的事、任务池三桶、三种收益分开挂账、进度 × 收益状态矩阵、超时最久的项目、团队分布、差额归因与金额口径；数字都能点进对应的页面。',
  order: 0.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Stat, Table, Tabs } from '@vue-tsx-pro/ui'; import { BarChart, DonutChart } from '@vue-tsx-pro/ui/charts';"
  >
    <Example id="dashboard" title="降本统计看板" demo={CostDashboard} frame="48rem">
      首页就是统计看板，统计与表格分开：这一页只放统计，明细在台账与一本账。最上面一排是需要处理的事（
      <Code>Stat</Code>
      ），超时、认定超期有数时标红，点了去台账对应的页签或收益认定。口径按需求定义方案：顶栏按降本类型切换，万元与美元/FH
      不在一个视图里相加；任务池总数只出现一次，三桶互斥；预测、承诺、实现三种收益分开挂账，金额与一本账同一套算法；进度
      ×
      收益状态交叉成矩阵（行与台账的页签一致），金额口径分三栏。件数跳到带页签与筛选的台账，金额跳到带单位与口径的一本账，项目编码去详情。
    </Example>
  </DocPage>
));
