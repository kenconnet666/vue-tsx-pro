import { _component } from '@vue-tsx-pro/tsx';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import DmcLedger from './frames/DmcLedger.tsx?demo';

export const meta = {
  title: 'DMC Ledger 降 DMC 台账',
  description:
    '降 DMC 项目的列表：金额是美元 / FH；DMC 的明细是实施节点，表格里是节点的完成情况与下一个节点，详情里是各节点的日期。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DataTable, FilterBar, Pagination, Tabs } from '@vue-tsx-pro/ui';"
  >
    <Example id="ledger" title="降 DMC 台账" demo={DmcLedger} frame="48rem">
      与单机降本台账共用页面骨架，字段按 DMC 降本主表与实施节点信息表：提出单位、联络人、降 DMC
      目标与测算、商务金额 （美元 / FH），实施节点（ECP 批准、MI 批准、QSL
      入册、实施）的完成情况与下一节点（过期标红）；展开一行看各节点的完成或计划日期、是否需要 SB
      贯彻航线架次与贯彻架次。
    </Example>
  </DocPage>
));
