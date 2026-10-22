// 案例：单机降本台账（表格页）。列与查询条件按设计规格；金额单位是万元，写在“收益（万元）”的分组表头里；
// 详情里有降本明细的摘要（构型通知单、零件更改条数、工程评估），明细本身在编辑页维护
import { _component } from '@vue-tsx-pro/tsx';
import { Small } from '@vue-tsx-pro/ui';
import type { CostTask } from '../data';
import { countActive, detailSection, filterFields, LedgerPage, ledgerColumns } from '../ledger';

function partsSummary(task: CostTask) {
  const detail = task.unitDetail;
  if (!detail) return null;
  const { opinion, type } = detail.evaluation;
  return detailSection(
    `降本明细 · ${detail.parts.length} 条零件更改`,
    <Small>
      构型通知单 {detail.notices.join('、')} · 工程评估：{opinion}
      {type && `（${type}）`}
    </Small>,
  );
}

export default _component(() => () => (
  <LedgerPage
    kind="unit"
    editor="UnitEditor"
    middle={[ledgerColumns.category, ledgerColumns.team, ledgerColumns.contact]}
    after={[ledgerColumns.form]}
    detailExtra={partsSummary}
    filters={(query) => ({
      main: (
        <>
          {filterFields.category(query)}
          {filterFields.team(query)}
          {filterFields.year(query)}
          {filterFields.contact(query)}
        </>
      ),
      more: (
        <>
          {filterFields.org(query)}
          {filterFields.form(query)}
          {filterFields.install(query)}
          {filterFields.supplier(query)}
          {filterFields.funding(query)}
          {filterFields.valueState(query)}
        </>
      ),
      moreActive: countActive(query, [
        'org',
        'form',
        'install',
        'supplier',
        'funding',
        'valueState',
      ]),
    })}
  />
));
