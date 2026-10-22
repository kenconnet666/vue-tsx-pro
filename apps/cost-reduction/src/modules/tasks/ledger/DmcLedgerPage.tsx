/**
 * 降 DMC 台账：DMC 的明细是实施节点，表格里一列是节点的完成情况与下一个节点（过期标红）；
 * 各节点的日期、是否需要 SB 与贯彻架次在详情行里；金额单位是美元 / FH
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Checklist, Flex, Small, type DataTableColumn } from '@vue-tsx-pro/ui';
import { nextDmcNode, nodeLateDays } from '../../../domain/task/status';
import type { CostTask } from '../../../domain/task/types';
import { DetailSection } from '../../../shared/DetailSection';
import { taskColumns } from './columns';
import { countActive, filterFields } from './filters';
import { LedgerPage } from './LedgerPage';

const nodeColumns: DataTableColumn<CostTask>[] = [
  {
    key: 'nodes',
    header: '实施节点',
    width: 224,
    // 后端按下一节点的计划日期排：越早越前，全部完成的在最后
    sortable: true,
    cell: (task) => {
      const node = nextDmcNode(task);
      return (
        <Flex inline align="center" gap="sm">
          <Checklist
            layout="icons"
            items={task.dmcNodes.map((item) => ({ label: item.form, done: item.done != null }))}
          />
          {node ? (
            <span>
              {node.form} <Small tone={nodeLateDays(node) ? 'danger' : 'muted'}>{node.due}</Small>
            </span>
          ) : (
            <Small tone="muted">已全部完成</Small>
          )}
        </Flex>
      );
    },
  },
];

/** 详情行里的实施节点（完成日期，或计划日期与超时）与贯彻情况 */
function nodeDetail(task: CostTask) {
  const done = task.dmcNodes.filter((node) => node.done).length;
  return (
    <>
      <DetailSection title={`实施节点 · ${done} / ${task.dmcNodes.length}`}>
        <Checklist
          layout="inline"
          items={task.dmcNodes.map((node) => {
            const late = nodeLateDays(node);
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
          })}
        />
      </DetailSection>
      <DetailSection title="贯彻">
        <Small>
          需要 SB 贯彻航线架次：{task.needSb ? '是' : '否'} · 贯彻架次 {task.flights ?? '—'}
        </Small>
      </DetailSection>
    </>
  );
}

export default _component(() => () => (
  <LedgerPage
    kind="dmc"
    middle={[taskColumns.org, taskColumns.contact]}
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
