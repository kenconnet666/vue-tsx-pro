import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import UnitLedger from './frames/UnitLedger.tsx?demo';

export const meta = {
  title: 'Unit Ledger 单机降本台账',
  description:
    '一期的核心表格页：单机降本项目（任务卡）的列表，按状态分组与关注两组页签，金额以万元显示、不跨收益状态合计。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DataTable, FilterBar, Pagination, Tabs } from '@vue-tsx-pro/ui';"
  >
    <Example id="ledger" title="单机降本台账" demo={UnitLedger} frame="48rem">
      依据设计规格（降本管理设计）。表格页只放数据：顶栏页签分状态分组与关注两组，条数只在页签上；查询栏不放状态；金额在“收益（万元）”分组下，一页只有一种单位，不在页内合计。编码去项目详情，“新建项目”“编辑”去单机降本编辑，删除只限待启动（确认后可撤销）。
      <Code>manualSort</Code> 把排序与分页交给“接口”（内存里模拟）。
    </Example>
  </DocPage>
));
