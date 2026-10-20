import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Dashboard from './demo/Dashboard.tsx?demo';

export const meta = {
  title: '统计看板示例',
  description:
    '筛选、关键指标、柱状图与折线图、明细表组合成一页统计分析；切换主题、改品牌色，图表与指标卡一起变化。',
  order: 0,
};

export default _component(() => () => (
  <DocPage wide meta={meta}>
    {/* 只有一个示例：不放进两列的 Examples，占满整页宽度 */}
    <Example id="dashboard" title="统计分析" demo={Dashboard}>
      选好条件点“查询”，指标卡（Stat）、柱状图（BarChart）与明细表（Table）按结果刷新，数值滚动到新值；折线图（LineChart）看全年趋势，“导出统计”下载
      CSV。<Code>Grid minItemWidth</Code> 让卡片按容器宽度自动换列，窄屏时单列。
    </Example>
  </DocPage>
));
