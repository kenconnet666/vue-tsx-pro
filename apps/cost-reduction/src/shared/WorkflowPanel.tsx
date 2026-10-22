/**
 * 一张卡的流程面板（建议卡、方案卡、任务卡共用）：泳道流程图与进度、正在处理的节点（处理岗位或人、时限）、
 * 当前用户能做的事（岗位收件箱里的先认领，自己的待办用审批按钮处理，结果要求的业务字段由使用方给出）、流转记录。
 * 处理完重新取流程轨迹，并通知卡片刷新（状态由流程决定）
 */
import { Hand } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  ApprovalActions,
  Button,
  Card,
  Flex,
  FlowDiagram,
  H2,
  processProgress,
  Small,
  Text,
  useRequest,
  workItemOutcomes,
  WorkflowTimeline,
  type ApprovalInput,
  type ProcessOutcome,
  type WorkItem,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';
import { watch, type VNodeChild } from 'vue';
import { claimWorkItem, completeWorkItem, getWorkflowTrace } from '../api/workflow';
import { notifyError, toaster } from '../app/feedback';
import { master, personName } from '../app/master';
import { currentUser } from '../app/session';
import { processOf } from '../domain/workflow';
import { groupName, groupsOf } from '../domain/workflow/groups';
import { RequestView } from './RequestView';

/** 业务字段的值：对话框里填，随处理一起提交成流程变量 */
export type WorkflowValues = Record<string, unknown>;

/** WorkflowPanel 的属性 */
export interface WorkflowPanelProps {
  /** 卡的编号 */
  businessKey: string;
  /** 流程标识 */
  processKey: string;
  /** 结果要求的业务字段在对话框里的内容；values 可写 */
  fields?: (outcome: ProcessOutcome, node: string, values: WorkflowValues) => VNodeChild;
  /** 打开一个节点的待办时业务字段的初始值 */
  defaults?: (node: string) => WorkflowValues;
  /** 提交前的业务检查（与后端同一条规则）：返回说明时不提交 */
  check?: (outcome: ProcessOutcome, node: string, values: WorkflowValues) => string | null;
  /** 处理、认领之后：卡片重新取数 */
  onChange?: () => void;
}

const styles = stylex.create({
  section: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  todo: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_sm',
    padding: '_sm',
    borderRadius: '_md',
    backgroundColor: '_accentSoft',
  },
});

/** 流程变量要能放进 JSON：Decimal 写成十进制字符串 */
const plain = (value: unknown) => (Decimal.isDecimal(value) ? value.toString() : value);

const isEmpty = (value: unknown) =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0);

/** 一张卡的流程面板 */
export const WorkflowPanel = _component(
  ({ businessKey, processKey, fields, defaults, check, onChange }: WorkflowPanelProps) => {
    const trace = useRequest((key: string, signal) => getWorkflowTrace(key, processKey, signal), {
      params: () => businessKey,
    });
    let values = _state<WorkflowValues>({});
    const me = currentUser();
    // 轮到我处理的待办换了：业务字段回到那个节点的初始值
    watch(
      () => trace.data?.items.find((item) => item.state === 'open' && item.assignee === me.id),
      (item, previous) => {
        if (item && item.id !== previous?.id) values = defaults?.(item.node) ?? {};
      },
      { immediate: true },
    );

    const myGroups = groupsOf(me, master().teams);
    /** 正在处理的人或岗位 */
    const handler = (item: WorkItem) =>
      item.assignee ? personName(item.assignee) : groupName(item.pool ?? '', master().teams);

    async function claim(item: WorkItem) {
      try {
        await claimWorkItem(item.id);
        toaster.show({ title: `已认领：${item.name}`, tone: 'success' });
        await trace.refresh();
      } catch (error) {
        notifyError('没能认领', error);
      }
    }

    async function complete(
      item: WorkItem,
      outcome: ProcessOutcome | undefined,
      input: ApprovalInput,
    ) {
      const variables = Object.fromEntries(
        (outcome?.fields ?? []).map((field) => [field, plain(values[field])]),
      );
      try {
        await completeWorkItem(item.id, { ...input, variables });
        toaster.show({
          title: `已处理：${item.name} · ${outcome?.label ?? input.outcome}`,
          tone: 'success',
        });
        await trace.refresh();
        onChange?.();
      } catch (error) {
        notifyError(`${item.name} 没能处理`, error);
        throw error;
      }
    }

    return () => (
      <Card variant="outline" header={<H2 size="sm">流程</H2>}>
        <RequestView request={trace} notFound="这张卡还没有流程">
          {({ instance, events, items }) => {
            const definition = processOf(instance.key);
            if (!definition) return <Small tone="muted">没有流程定义 {instance.key}</Small>;
            const open = items.filter((item) => item.state === 'open');
            const mine = open.filter((item) => item.assignee === me.id);
            const claimable = open.filter(
              (item) =>
                item.assignment === 'pool' &&
                item.pool != null &&
                myGroups.includes(item.pool) &&
                !item.releasedBy.includes(me.id),
            );
            return (
              <Flex direction="column" gap="md">
                <FlowDiagram
                  definition={definition}
                  progress={processProgress(instance, events)}
                  size="sm"
                  fit
                  nodeDetail={(node) => {
                    const item = open.find((entry) => entry.node === node.id);
                    return (
                      item && `${handler(item)}${item.dueOn ? ` · ${item.dueOn.slice(5)}` : ''}`
                    );
                  }}
                  aria-label={`${definition.name}的流程图`}
                />
                {instance.status === 'suspended' && (
                  <Small tone="warning">流程已暂停：恢复后才能处理</Small>
                )}
                {claimable.map((item) => (
                  <div key={item.id} {...stylex.attrs(styles.todo)}>
                    <Text size="sm">
                      {item.name} 在{groupName(item.pool ?? '', master().teams)}
                      的收件箱里，还没人认领
                    </Text>
                    <Button size="sm" icon={Hand} onClick={() => void claim(item)}>
                      认领
                    </Button>
                  </div>
                ))}
                {mine.map((item) => {
                  const outcomes = workItemOutcomes(definition, item);
                  return (
                    <div key={item.id} {...stylex.attrs(styles.section)}>
                      <Small tone="muted">
                        轮到你处理：{item.name}
                        {item.dueOn ? `（${item.dueOn} 前）` : ''}
                        {item.arrival === 'return' ? ' · 被退回' : ''}
                      </Small>
                      <ApprovalActions
                        node={item.name}
                        outcomes={outcomes}
                        disabled={instance.status !== 'active'}
                        fields={(outcome) => fields?.(outcome, item.node, values)}
                        validate={(outcome) => {
                          const missing = (outcome.fields ?? []).filter((field) =>
                            isEmpty(values[field]),
                          );
                          return missing.length
                            ? '还有业务字段没填'
                            : (check?.(outcome, item.node, values) ?? null);
                        }}
                        onComplete={(input) =>
                          complete(
                            item,
                            outcomes.find((entry) => entry.key === input.outcome),
                            input,
                          )
                        }
                      />
                    </div>
                  );
                })}
                <WorkflowTimeline
                  size="sm"
                  definition={definition}
                  events={events}
                  actorName={personName}
                />
              </Flex>
            );
          }}
        </RequestView>
      </Card>
    );
  },
);
