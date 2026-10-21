import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import TaskPool from './frames/TaskPool.tsx?demo';

export const meta = {
  title: 'Task Pool 降本任务池',
  description:
    '联合降本的任务池（表格页）：顶栏按状态分组与关注两组页签，查询栏只放页签以外的条件，表格按任务卡的字段，金额不跨收益状态合计。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DataTable, FilterBar, Pagination, SelectionBar, Steps, Tabs } from '@vue-tsx-pro/ui';"
  >
    <Example id="pool" title="降本任务池" demo={TaskPool} frame="48rem">
      字段、状态与口径按需求定义方案的任务卡，数据是虚构的。表格页只放数据：顶栏的页签分两组，按状态分组与“关注”（超时、7
      天内到期、可关闭、关闭材料不全），条数只在页签上出现；查询栏只放页签以外的条件，不再有状态。表格按任务卡的字段：来源编号、里程碑、计划完成与超时天数、收益的挂账口径与
      A / B / D；不同收益状态的金额不相加（看统计去统计看板），单机降本与降 DMC
      单位不同，每格带单位。
      <Code>manualSort</Code>{' '}
      把排序与分页交给“接口”（内存里模拟，只采用最后一次请求的结果）；点行首的箭头看简要描述、里程碑的日期与交付证据、关闭三材料。统计看板里点数字跳过来时，地址上带着页签与筛选。
    </Example>
  </DocPage>
));
