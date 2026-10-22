/**
 * 待办的写法（收件箱、工作台、任务看板共用）：页签名称、到达方式的名称与色调、来自哪个节点与谁、处理人或岗位
 */
import { workItemOutcomes, type StatusTone, type WorkItem } from '@vue-tsx-pro/ui';
import { master, personName } from '../app/master';
import { processOf } from '../domain/workflow';
import { groupName } from '../domain/workflow/groups';
import type { InboxView } from '../domain/workflow/inbox';

/** 页签的名称 */
export const inboxViewLabels: Record<InboxView, string> = {
  mine: '我的待办',
  pool: '岗位待认领',
  designate: '待指定',
  done: '我已处理',
  started: '我发起的',
};

/** 到达方式：名称与色调（转派普通、退回与提级醒目） */
export const arrivals: Record<WorkItem['arrival'], { label: string; tone: StatusTone }> = {
  start: { label: '发起', tone: 'neutral' },
  forward: { label: '转派', tone: 'accent' },
  return: { label: '退回', tone: 'warning' },
  escalate: { label: '提级', tone: 'danger' },
};

/** 流程的名称 */
export const processName = (key: string) => processOf(key)?.name ?? key;

/** 节点的名称 */
export const nodeName = (processKey: string, node: string | null) =>
  node == null ? '' : (processOf(processKey)?.nodes.find((item) => item.id === node)?.name ?? node);

/** 从哪儿来：节点与人；流程开始的第一个节点写发起人 */
export function fromText(item: WorkItem): string {
  const who = item.from.user ? personName(item.from.user) : '';
  if (item.from.node == null) return who ? `${who} 发起` : '发起';
  return [nodeName(item.processKey, item.from.node), who].filter(Boolean).join(' · ');
}

/** 正在处理的人，或在哪个岗位收件箱里等认领 */
export const handlerText = (item: WorkItem) =>
  item.assignee
    ? personName(item.assignee)
    : `${groupName(item.pool ?? '', master().teams)}（待认领）`;

/** 处理结果的名称 */
export function outcomeLabel(item: WorkItem): string {
  const outcome = item.completion?.outcome;
  if (!outcome) return '';
  const definition = processOf(item.processKey);
  const outcomes = definition ? workItemOutcomes(definition, item) : [];
  return outcomes.find((entry) => entry.key === outcome)?.label ?? outcome;
}
