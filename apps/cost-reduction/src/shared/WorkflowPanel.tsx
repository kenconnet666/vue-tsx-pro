/**
 * 一张卡的流程面板（建议卡、方案卡、任务卡、收件箱的预览共用）：泳道流程图与进度、正在处理的节点（处理岗位或人、时限）、
 * 当前用户和这张卡的关系决定能做的事（DESIGN.md §6.2）：
 * - 岗位待认领：认领；
 * - 我认领的：处理（审批按钮，结果要求的业务字段由使用方给出；被退回的带上次交的附件）、退回收件箱（原因必填）；
 * - 指定给我的：处理、申请改派（原因必填）；
 * - 我负责的收件箱待指定（没人认领超时、有人申请改派）：从岗位成员里指定承办人；
 * - 我发起的：催办正在处理的人或岗位。
 * 做完重新取流程轨迹、发“流程变了”的信号（顶栏、收件箱跟着刷新），并通知卡片刷新（状态由流程决定）
 */
import { BellRing, Hand, Undo2, UserCheck, UserRoundCog } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Alert, Button, Card, Flex, H2, Small, Timeline, useRequest } from '@vue-tsx-pro/ui';
import { useFormDialog } from '@vue-tsx-pro/ui/patterns';
import {
  ApprovalActions,
  FlowDiagram,
  processProgress,
  workItemOutcomes,
  useWorkflowTimeline,
  type ApprovalInput,
  type ProcessOutcome,
  type WorkItem,
} from '@vue-tsx-pro/ui/workflow';
import Decimal from 'decimal.js';
import { watch, type VNodeChild } from 'vue';
import {
  claimWorkItem,
  completeWorkItem,
  designateWorkItem,
  getWorkflowTrace,
  releaseWorkItem,
  remindWorkItem,
  requestReassign,
} from '../api/workflow';
import { notifyError, toaster } from '../app/feedback';
import { master, personName, poolMembers } from '../app/master';
import { currentUser } from '../app/session';
import { announceWorkflowChange, workflowVersion } from '../app/sync';
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
  /** 不画流程图（收件箱的预览里另有缩略图时） */
  hideDiagram?: boolean;
  /**
   * 卡片的标题
   * @default '流程'
   */
  title?: string;
  /** 流程图上面的内容：审批的是什么（计划调整的改动） */
  children?: VNodeChild;
}

/** 流程变量要能放进 JSON：Decimal 写成十进制字符串 */
const plain = (value: unknown) => (Decimal.isDecimal(value) ? value.toString() : value);

const isEmpty = (value: unknown) =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0);

/** 一张卡的流程面板 */
export const WorkflowPanel = _component(
  ({
    businessKey,
    processKey,
    fields,
    defaults,
    check,
    onChange,
    hideDiagram = false,
    title = '流程',
    children,
  }: WorkflowPanelProps) => {
    // 别处（收件箱、另一个标签里的同一张卡）做了操作也重新取
    const trace = useRequest(
      ([key]: [string, number], signal) => getWorkflowTrace(key, processKey, signal),
      { params: () => [businessKey, workflowVersion()] as [string, number] },
    );
    const prompt = useFormDialog();
    const records = useWorkflowTimeline(() => ({
      events: trace.data?.events ?? [],
      definition: trace.data && processOf(trace.data.instance.key),
      actorName: personName,
    }));
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

    /** 做完一个操作：提示、重新取、通知别处 */
    async function done(title: string) {
      toaster.show({ title, tone: 'success' });
      announceWorkflowChange();
      await trace.refresh();
      onChange?.();
    }

    async function claim(item: WorkItem) {
      try {
        await claimWorkItem(item.id);
        await done(`已认领：${item.name}`);
      } catch (error) {
        // 被别人抢先：提示并刷新，这一条从岗位待认领里消失
        notifyError('没能认领', error);
        announceWorkflowChange();
      }
    }

    /** 要填原因的操作：退回收件箱、申请改派、催办 */
    async function withReason(
      title: string,
      confirmText: string,
      required: boolean,
      action: (reason: string) => Promise<unknown>,
      success: string,
    ) {
      const values = await prompt({
        title,
        confirmText,
        fields: [
          {
            name: 'reason',
            label: required ? '原因' : '留言',
            type: 'textarea',
            required,
            maxlength: 200,
          },
        ],
        onSubmit: async ({ reason }) => {
          try {
            await action(reason ?? '');
          } catch (error) {
            notifyError(`没能${confirmText}`, error);
            throw error;
          }
        },
      });
      if (values) await done(success);
    }

    async function designate(item: WorkItem) {
      const members = poolMembers(item.pool ?? '').filter(
        (person) => person.id !== item.reassignRequest?.by,
      );
      const values = await prompt({
        title: `指定承办人：${item.name}`,
        description: item.reassignRequest
          ? `${personName(item.reassignRequest.by)}申请改派：${item.reassignRequest.reason}`
          : '超过约定的工作日没人认领；指定即生效，被指定人只能申请改派',
        confirmText: '指定',
        fields: [
          {
            name: 'assignee',
            label: '承办人',
            type: 'select',
            required: true,
            options: members.map((person) => ({ value: person.id, label: person.name })),
          },
        ],
        onSubmit: async ({ assignee }) => {
          try {
            await designateWorkItem(item.id, assignee ?? '');
          } catch (error) {
            notifyError('没能指定', error);
            throw error;
          }
        },
      });
      if (values) await done(`已指定 ${personName(values.assignee ?? '')} 处理：${item.name}`);
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
        await done(`已处理：${item.name} · ${outcome?.label ?? input.outcome}`);
      } catch (error) {
        notifyError(`${item.name} 没能处理`, error);
        throw error;
      }
    }

    return () => (
      <Card variant="outline" header={<H2 size="sm">{title}</H2>}>
        <Flex direction="column" gap="md">
          {children}
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
              const toDesignate = open.filter(
                (item) =>
                  item.pool != null &&
                  (me.leads ?? []).includes(item.pool) &&
                  (item.needsDesignation || item.reassignRequest != null),
              );
              // 我发起的、还在流转：可以催正在处理的（不是我自己的）
              const remindable =
                instance.startedBy === me.id && instance.status === 'active'
                  ? open.filter((item) => item.assignee !== me.id)
                  : [];
              return (
                <Flex direction="column" gap="md">
                  {!hideDiagram && (
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
                  )}
                  {instance.status === 'suspended' && (
                    <Alert tone="warning" size="sm" description="流程已暂停：恢复后才能处理" />
                  )}
                  {claimable.map((item) => (
                    <Alert
                      key={item.id}
                      tone="accent"
                      size="sm"
                      icon={false}
                      description={`${item.name} 在${groupName(item.pool ?? '', master().teams)}的收件箱里，还没人认领`}
                      action={
                        <Button size="sm" icon={Hand} onClick={() => void claim(item)}>
                          认领
                        </Button>
                      }
                    />
                  ))}
                  {toDesignate.map((item) => (
                    <Alert
                      key={item.id}
                      tone="warning"
                      size="sm"
                      icon={false}
                      description={
                        item.reassignRequest
                          ? `${personName(item.reassignRequest.by)}申请改派「${item.name}」：${item.reassignRequest.reason}`
                          : `「${item.name}」没人认领，等你指定承办人`
                      }
                      action={
                        <Button size="sm" icon={UserCheck} onClick={() => void designate(item)}>
                          指定承办人
                        </Button>
                      }
                    />
                  ))}
                  {remindable.map((item) => (
                    <Alert
                      key={item.id}
                      tone="neutral"
                      size="sm"
                      icon={false}
                      description={`你发起的这张卡在「${item.name}」，${handler(item)}处理中${item.dueOn ? `，${item.dueOn} 前` : ''}`}
                      action={
                        <Button
                          size="sm"
                          variant="soft"
                          icon={BellRing}
                          onClick={() =>
                            void withReason(
                              `催办：${item.name}`,
                              '催办',
                              false,
                              (comment) => remindWorkItem(item.id, comment),
                              `已催办：${item.name}`,
                            )
                          }
                        >
                          催办
                        </Button>
                      }
                    />
                  ))}
                  {mine.map((item) => {
                    const outcomes = workItemOutcomes(definition, item);
                    // 被退回重新处理：上次在这个节点交的附件作为已有文件带上，不用重新上传
                    const previous =
                      item.arrival === 'return'
                        ? events.findLast(
                            (event) =>
                              event.node === item.node &&
                              (event.type === 'completed' || event.type === 'auto-completed') &&
                              event.attachments.length > 0,
                          )
                        : undefined;
                    return (
                      <Flex key={item.id} direction="column" gap="sm">
                        <Small tone="muted">
                          轮到你处理：{item.name}
                          {item.dueOn ? `（${item.dueOn} 前）` : ''}
                          {item.arrival === 'return' ? ' · 被退回' : ''}
                        </Small>
                        <ApprovalActions
                          node={item.name}
                          outcomes={outcomes}
                          attachments={previous?.attachments.map((name) => ({ name }))}
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
                        <Flex wrap gap="xs">
                          {item.assignment === 'claimed' && (
                            <Button
                              size="xs"
                              variant="ghost"
                              tone="neutral"
                              icon={Undo2}
                              onClick={() =>
                                void withReason(
                                  `退回收件箱：${item.name}`,
                                  '退回',
                                  true,
                                  (reason) => releaseWorkItem(item.id, reason),
                                  `已退回收件箱：${item.name}`,
                                )
                              }
                            >
                              退回收件箱
                            </Button>
                          )}
                          {item.assignment === 'designated' && (
                            <Button
                              size="xs"
                              variant="ghost"
                              tone="neutral"
                              icon={UserRoundCog}
                              onClick={() =>
                                void withReason(
                                  `申请改派：${item.name}`,
                                  '申请改派',
                                  true,
                                  (reason) => requestReassign(item.id, reason),
                                  `已申请改派：${item.name}`,
                                )
                              }
                            >
                              申请改派
                            </Button>
                          )}
                        </Flex>
                      </Flex>
                    );
                  })}
                  <Timeline size="sm" items={records.value} reverse />
                </Flex>
              );
            }}
          </RequestView>
        </Flex>
      </Card>
    );
  },
);
