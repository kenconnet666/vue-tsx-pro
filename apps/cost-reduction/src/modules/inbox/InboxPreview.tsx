/**
 * 收件箱右栏：选中的这一条的预览与处理。上面是摘要（编号、名称、流程与环节、到达方式、来自、时限、处理人；
 * 任务卡再带状态、责任团队、主办、计划完成），下面是流程面板（流程图缩略、按我和这一条的关系给出的操作、流转记录）。
 * 任务池流程的节点要填的业务字段与任务详情里一样（TaskWorkflowPanel），计划调整带上申请的改动；表单类的节点到卡里处理
 */
import { ArrowUpRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  DeadlineTag,
  Descriptions,
  Flex,
  H2,
  LinkButton,
  Small,
  StatusBadge,
  useFormat,
  useRequest,
  type WorkItem,
} from '@vue-tsx-pro/ui';
import { getTask } from '../../api/tasks';
import { personName, shortTeam } from '../../app/master';
import { paths } from '../../app/paths';
import { workflowVersion } from '../../app/sync';
import { TODAY } from '../../domain/clock';
import { costKinds } from '../../shared/kinds';
import { CodeLink, isTaskCode } from '../../shared/CodeLink';
import { RequestView } from '../../shared/RequestView';
import { taskStatuses } from '../../shared/statuses';
import { WorkflowPanel } from '../../shared/WorkflowPanel';
import { PlanChangeSummary } from '../tasks/detail/PlanChangeCards';
import { TaskWorkflowPanel } from '../tasks/detail/TaskWorkflowPanel';
import {
  arrivals,
  fromText,
  handlerText,
  outcomeLabel,
  processName,
} from '../../shared/work-item-labels';

const styles = stylex.create({
  root: { padding: '_md' },
});

/** 收件箱右栏的预览 */
export const InboxPreview = _component(
  ({
    item,
    onChange,
  }: {
    /** 选中的待办 */
    item: WorkItem;
    /** 处理、认领之后：列表重新取 */
    onChange?: () => void;
  }) => {
    const format = useFormat();
    const task = useRequest(([code]: [string, number], signal) => getTask(code, signal), {
      params: () => [item.businessKey, workflowVersion()] as [string, number],
      enabled: () => isTaskCode(item.businessKey),
      keepPrevious: false,
    });

    return () => {
      const arrival = arrivals[item.arrival];
      const summary = (
        <Descriptions
          size="sm"
          columns={2}
          items={[
            { label: '流程', value: processName(item.processKey) },
            {
              label: '到达方式',
              value: <Badge tone={arrival.tone}>{arrival.label}</Badge>,
            },
            { label: '来自', value: fromText(item) },
            {
              label: '到达时间',
              value: format.date(item.createdAt, { dateStyle: 'medium', timeStyle: 'short' }),
            },
            {
              label: item.state === 'open' ? '时限' : '处理',
              value:
                item.state === 'open' ? (
                  item.dueOn ? (
                    <DeadlineTag due={item.dueOn} today={TODAY} />
                  ) : (
                    '不限'
                  )
                ) : (
                  `${outcomeLabel(item)} · ${personName(item.completion?.by ?? '')}`
                ),
            },
            { label: '处理人', value: handlerText(item) },
            ...(item.reassignRequest
              ? [
                  {
                    label: '申请改派',
                    value: `${personName(item.reassignRequest.by)}：${item.reassignRequest.reason}`,
                    span: 2,
                  },
                ]
              : []),
          ]}
        />
      );
      return (
        <Flex direction="column" gap="md" sx={styles.root}>
          <Flex direction="column" gap="xs">
            <Flex align="center" gap="sm" wrap>
              <CodeLink code={item.businessKey} />
              <Badge tone="accent">{item.name}</Badge>
            </Flex>
            <Flex align="center" justify="between" gap="sm" wrap>
              <H2 size="md">{item.title}</H2>
              {isTaskCode(item.businessKey) && (
                <LinkButton
                  href={paths.task(item.businessKey)}
                  size="sm"
                  variant="outline"
                  tone="neutral"
                  iconEnd={ArrowUpRight}
                >
                  去卡里处理
                </LinkButton>
              )}
            </Flex>
          </Flex>
          {summary}
          {isTaskCode(item.businessKey) ? (
            <RequestView request={task} notFound={`没有找到项目 ${item.businessKey}`}>
              {(card) => {
                const money = costKinds[card.kind];
                return (
                  <Flex direction="column" gap="md">
                    <Descriptions
                      size="sm"
                      columns={2}
                      items={[
                        {
                          label: '任务状态',
                          value: <StatusBadge statuses={taskStatuses} value={card.status} />,
                        },
                        { label: '责任团队', value: shortTeam(card.team) },
                        { label: '主办', value: card.owner ? personName(card.owner) : '—' },
                        { label: '计划完成', value: card.due },
                        {
                          label: `预期收益（${money.unit}）`,
                          value: format.number(card.expected, money.format),
                        },
                      ]}
                    />
                    {item.processKey === 'task' ? (
                      <TaskWorkflowPanel task={card} onChange={onChange} />
                    ) : (
                      <WorkflowPanel
                        businessKey={item.businessKey}
                        processKey={item.processKey}
                        onChange={onChange}
                      >
                        {item.processKey === 'task-change' && card.pendingChange && (
                          <PlanChangeSummary task={card} change={card.pendingChange} />
                        )}
                      </WorkflowPanel>
                    )}
                  </Flex>
                );
              }}
            </RequestView>
          ) : (
            <WorkflowPanel
              businessKey={item.businessKey}
              processKey={item.processKey}
              onChange={onChange}
            />
          )}
          {item.state !== 'open' && (
            <Small tone="muted">这一条已经处理过；流程现在走到哪里看上面的流程图</Small>
          )}
        </Flex>
      );
    };
  },
);
