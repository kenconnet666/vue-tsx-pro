/**
 * 计划调整（DESIGN.md §3.5）：审批中的申请（改了什么、谁什么时候提交、原因）与它的审批流程，PEMO 在这里同意或不同意；
 * 变更记录列出同意过的调整。项目详情与收件箱的预览共用申请的摘要
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Descriptions, H2, ItemList, ItemListItem, Small, Text } from '@vue-tsx-pro/ui';
import { personName } from '../../../app/master';
import { changedValues, changeText } from '../../../domain/task/plan-change';
import type { CostTask, PendingPlanChange } from '../../../domain/task/types';
import { WorkflowPanel } from '../../../shared/WorkflowPanel';

/** 申请的摘要：改了哪几项（没改的写“不变”）、申请人、提交日期、原因 */
export const PlanChangeSummary = _component(
  ({ task, change }: { task: CostTask; change: PendingPlanChange }) =>
    () => {
      const { due, owner } = changedValues(task, change);
      return (
        <Descriptions
          size="sm"
          columns={2}
          items={[
            { label: '计划完成', value: due ? changeText(due) : `${task.due}（不变）` },
            {
              label: '主办',
              value: owner ? changeText(owner, personName) : `${personName(task.owner)}（不变）`,
            },
            { label: '申请人', value: `${personName(change.by)} · ${change.at}` },
            { label: '原因', value: change.reason, span: 2 },
          ]}
        />
      );
    },
);

/** 审批中的计划调整：摘要与审批流程（没有在审批的时候不显示） */
export const PendingPlanChangeCard = _component(
  ({ task, onChange }: { task: CostTask; onChange?: () => void }) =>
    () =>
      task.pendingChange && (
        <WorkflowPanel
          title="计划调整审批中"
          businessKey={task.code}
          processKey="task-change"
          hideDiagram
          onChange={onChange}
        >
          <PlanChangeSummary task={task} change={task.pendingChange} />
        </WorkflowPanel>
      ),
);

/** 变更记录：同意过的计划调整，新的在前 */
export const ChangesCard = _component(({ task }: { task: CostTask }) => () => (
  <Card variant="outline" header={<H2 size="sm">变更记录</H2>}>
    {task.changes.length === 0 ? (
      <Small tone="muted">没有调整过计划；调整要经 PEMO 同意</Small>
    ) : (
      <ItemList divided density="compact">
        {task.changes.map((record, index) => (
          <ItemListItem
            key={index}
            title={[
              record.due && `计划完成 ${changeText(record.due)}`,
              record.owner && `主办 ${changeText(record.owner, personName)}`,
            ]
              .filter(Boolean)
              .join('；')}
            description={record.reason}
            end={
              <Text size="sm" tone="muted" numeric>
                {record.at} · {personName(record.by)}申请 · {personName(record.approvedBy)}同意
              </Text>
            }
          />
        ))}
      </ItemList>
    )}
  </Card>
));
