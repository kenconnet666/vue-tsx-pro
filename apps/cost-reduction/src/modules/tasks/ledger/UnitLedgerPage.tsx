/**
 * 单机降本台账：金额单位是万元，写在“收益（万元）”的分组表头里；
 * 详情行里有降本明细的摘要（构型通知单、零件更改条数、工程评估），明细本身在编辑页维护
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Small } from '@vue-tsx-pro/ui';
import type { CostTask } from '../../../domain/task/types';
import { DetailSection } from '../../../shared/Progress';
import { taskColumns } from './columns';
import { countActive, filterFields } from './filters';
import { LedgerPage } from './LedgerPage';

/** 详情行里的降本明细摘要 */
function partsSummary(task: CostTask) {
  const detail = task.unitDetail;
  if (!detail) return null;
  const { opinion, type } = detail.evaluation;
  return (
    <DetailSection title={`降本明细 · ${detail.parts.length} 条零件更改`}>
      <Small>
        构型通知单 {detail.notices.join('、')} · 工程评估：{opinion}
        {type && `（${type}）`}
      </Small>
    </DetailSection>
  );
}

export default _component(() => () => (
  <LedgerPage
    kind="unit"
    middle={[taskColumns.category, taskColumns.team, taskColumns.contact]}
    after={[taskColumns.form]}
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
