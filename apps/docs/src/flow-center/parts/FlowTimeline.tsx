/**
 * 审批单的流转记录：谁在什么时候做了什么（发起、处理、转办、加签……），处理的结果与意见；改过单据的列出前后值。
 * 推进的内部事件（进节点、出节点）不列。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { InstanceDetail } from '@zerodep-dev/flow-ts-engine';
import { Timeline, type TimelineItem } from '@zerodep-dev/vue-tsx-pro-ui';
import { eventText, RESULT_TEXT, timeText, who } from './labels';

/** FlowTimeline 的属性 */
export interface FlowTimelineProps {
  detail: InstanceDetail;
  /** 演示的“现在”（时间的写法按它判断今年） */
  now: Date;
}

/** 处理结果的文字：人工节点是按钮的名字，等消息、自动节点带回的结果按结果的说法（已付款、退票……） */
function outcomeLabel(detail: InstanceDetail, node: string | null, outcome: string | null) {
  if (!outcome) return '';
  const task = detail.definition.nodes.find((n) => n.id === node);
  return task?.type === 'task'
    ? (task.outcomes.find((o) => o.key === outcome)?.label ?? outcome)
    : (RESULT_TEXT[outcome] ?? outcome);
}

/** 一个值的写法：空的写“空”，明细表这类对象写成 JSON */
const valueText = (value: unknown) =>
  value === null || value === undefined || value === ''
    ? '空'
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value as string | number | boolean);

/** 改过的数据：字段 → [原来, 现在] */
function changes(data: Readonly<Record<string, unknown>> | null): string {
  const before = (data?.['before'] ?? {}) as Record<string, unknown>;
  const after = (data?.['after'] ?? {}) as Record<string, unknown>;
  return Object.keys(after)
    .map((key) => `${key}：${valueText(before[key])} → ${valueText(after[key])}`)
    .join('；');
}

/** 流转记录 */
export const FlowTimeline = _component(({ detail, now }: FlowTimelineProps) => {
  return () => {
    const nodeName = (id: string | null) =>
      detail.definition.nodes.find((n) => n.id === id)?.name ?? '';
    const items: TimelineItem[] = detail.events.flatMap((event, index) => {
      const text = eventText(event);
      if (!text) return [];
      const outcome = outcomeLabel(detail, event.node, event.outcome);
      const title = [nodeName(event.node), outcome || text].filter(Boolean).join(' · ');
      const description =
        event.type === 'instance.dataChanged' ? changes(event.data) : (event.comment ?? undefined);
      return [
        {
          key: String(index),
          title,
          actor: event.actor ? who(event.actor) : '系统',
          time: timeText(event.at, now),
          dateTime: new Date(event.at).toISOString(),
          ...(description ? { description } : {}),
          ...(event.type === 'job.failed' || event.type === 'workItem.overdue'
            ? { tone: 'danger' as const }
            : event.type === 'workItem.completed' && event.outcome === 'reject'
              ? { tone: 'danger' as const }
              : {}),
        },
      ];
    });
    return <Timeline items={items} reverse aria-label="流转记录" />;
  };
});
