import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import CostDashboard from './frames/CostDashboard.tsx?demo';

export const meta = {
  title: 'Cost Dashboard 降本统计看板',
  description:
    '联合降本的统计页：任务池三桶构成、三种收益分开挂账、进度 × 收益状态矩阵、差额归因、团队分布与金额口径；数字点进去是筛好条件的任务池。',
  order: 3,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Table, Tabs } from '@vue-tsx-pro/ui'; import { BarChart, DonutChart } from '@vue-tsx-pro/ui/charts';"
  >
    <Example id="dashboard" title="降本统计看板" demo={CostDashboard} frame="48rem">
      统计与表格分开：这一页只放统计，明细在任务池。口径按需求定义方案：顶栏按降本类型切换，万元与美元/FH
      不在一个视图里相加；任务池总数只出现一次，已确认收益、挂账待定、方案待定三桶互斥；预测、承诺、实现三种收益分开挂账，挂账待定写“待定价”；进度
      ×
      收益状态交叉成矩阵（行与任务池的页签一致），金额口径分三栏。矩阵的格子、收益卡片的“明细”、金额口径的数字都是{' '}
      <Code>Link</Code>，跳到带着页签与筛选的任务池。
    </Example>
  </DocPage>
));
