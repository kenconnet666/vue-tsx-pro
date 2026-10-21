// 案例：降 DMC 台账（表格页）。DMC 的明细是实施节点：表格里一列是节点的完成情况与下一个节点（过期标红），
// 各节点的日期、是否需要 SB 与贯彻架次在详情里；金额单位是美元 / FH
import { _component } from '@vue-tsx-pro/tsx';
import { daysBetween, Flex, Small, type DataTableColumn } from '@vue-tsx-pro/ui';
import { TODAY, type CostTask, type DmcNode } from '../../data';
import {
  checklist,
  countActive,
  detailSection,
  filterFields,
  LedgerPage,
  ledgerColumns,
  progressDots,
} from '../../ledger';

const nextNode = (task: CostTask) => task.dmcNodes.find((node) => node.done == null);

/** 没完成的节点超过计划日期几天；没超为 0 */
const lateDays = (node: DmcNode) => (node.done ? 0 : Math.max(0, daysBetween(node.due, TODAY)));

const nodeColumns: DataTableColumn<CostTask>[] = [
  {
    key: 'nodes',
    header: '实施节点',
    width: 224,
    sortable: true,
    // 按下一节点的计划日期排：越早越前，全部完成的在最后
    value: (task) => nextNode(task)?.due ?? '9999',
    cell: (task) => {
      const node = nextNode(task);
      return (
        <Flex inline align="center" gap="sm">
          {progressDots(
            task.dmcNodes.map((item) => ({ label: item.form, done: item.done != null })),
          )}
          {node ? (
            <span>
              {node.form} <Small tone={lateDays(node) ? 'danger' : 'muted'}>{node.due}</Small>
            </span>
          ) : (
            <Small tone="muted">已全部完成</Small>
          )}
        </Flex>
      );
    },
  },
];

/** 详情里的实施节点（完成日期，或计划日期与超时）与贯彻情况 */
function nodeDetail(task: CostTask) {
  const done = task.dmcNodes.filter((node) => node.done).length;
  return (
    <>
      {detailSection(
        `实施节点 · ${done} / ${task.dmcNodes.length}`,
        checklist(
          task.dmcNodes.map((node) => {
            const late = lateDays(node);
            return {
              label: node.form,
              done: node.done != null,
              extra: node.done ? (
                <Small tone="muted">{node.done}</Small>
              ) : (
                <Small tone={late ? 'danger' : 'muted'}>
                  计划 {node.due}
                  {late ? `，超 ${late} 天` : ''}
                </Small>
              ),
            };
          }),
        ),
      )}
      {detailSection(
        '贯彻',
        <Small>
          需要 SB 贯彻航线架次：{task.needSb ? '是' : '否'} · 贯彻架次 {task.flights ?? '—'}
        </Small>,
      )}
    </>
  );
}

export default _component(() => () => (
  <LedgerPage
    kind="dmc"
    editor="DmcEditor"
    middle={[ledgerColumns.org, ledgerColumns.contact]}
    after={nodeColumns}
    detailExtra={nodeDetail}
    filters={(query) => ({
      main: (
        <>
          {filterFields.team(query)}
          {filterFields.year(query)}
          {filterFields.form(query)}
          {filterFields.needSb(query)}
        </>
      ),
      more: (
        <>
          {filterFields.org(query)}
          {filterFields.contact(query)}
          {filterFields.valueState(query)}
        </>
      ),
      moreActive: countActive(query, ['org', 'contact', 'valueState']),
    })}
  />
));
