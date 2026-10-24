/**
 * 流转记录：把流程的流转事件（WorkflowEvent）写成 Timeline 的各项——谁、什么时候、在哪个节点、做了什么，意见与附件。
 * 处理结果按种类着色（通过绿、否决与终止红、退回与提级黄），认领、指定、催办、留言、暂停、调整各有图标。
 * 默认不显示“到达节点”（太碎）；人名与附件交给使用方（工号换姓名、附件做成链接）。
 *
 *   const records = useWorkflowTimeline(() => ({ events: trace.events, definition: flow, actorName }));
 *   <Timeline items={records.value} reverse />          新的在前；交替、尺寸、部件属性都是 Timeline 的
 *
 * 文案随语言（workflowMessages，可在 Lang.messages.workflow 里改写），所以要在 setup 里调用。
 */
import {
  Ban,
  BellRing,
  Check,
  CirclePlay,
  Clock,
  CornerUpLeft,
  Flag,
  Hand,
  Hourglass,
  Inbox,
  MessageSquare,
  Pause,
  Shuffle,
  UserCheck,
  UserRoundCog,
  X,
  CircleArrowUp,
} from '@lucide/icons';
import * as css from '@vue-tsx-pro/tsx/styles';
import { computed, type ComputedRef, type VNodeChild } from 'vue';
import type { IconData } from '../base/Icon';
import { useMessages } from '../config/lang/messages';
import type { TimelineItem } from '../display/Timeline';
import type { StatusTone } from '../utils/style/tone-styles';
import {
  processGraph,
  processOutcome,
  type ProcessDefinition,
  type ProcessOutcomeKind,
} from './definition';
import { workflowMessages, type WorkflowEventText, type WorkflowMessages } from './messages';
import type { WorkflowEvent, WorkflowEventTypes } from './runtime';

/** useWorkflowTimeline 的选项 */
export interface WorkflowTimelineOptions {
  /** 流转记录（旧的在前，同后端返回的顺序）；新的在前显示用 Timeline 的 reverse */
  events: readonly WorkflowEvent[];
  /** 流程定义：节点名称、处理结果的名称与种类；不给时显示节点与结果的标识 */
  definition?: ProcessDefinition;
  /** 不显示的种类，默认只隐藏“到达节点” */
  hide?: readonly (keyof WorkflowEventTypes)[];
  /** 操作人的工号 → 显示的名字；默认原样显示 */
  actorName?: (id: string) => string;
  /** 时间的显示，默认 `MM-DD HH:mm` */
  formatTime?: (iso: string) => string;
  /** 一个附件怎么显示（链接、预览）；默认是文件名 */
  renderAttachment?: (attachment: string) => VNodeChild;
}

/** 流转记录的样式：comment（意见）、attachments、attachment */
export const workflowTimelineStyles = css.create({
  comment: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  attachments: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '_xs',
    marginBlockStart: '_xs',
    fontSize: '_sm',
  },
  attachment: { color: '_textMuted' },
});

/** 处理结果的种类 → 色调与图标 */
const outcomeLook: Record<ProcessOutcomeKind, { tone: StatusTone; icon: IconData }> = {
  approve: { tone: 'success', icon: Check },
  reject: { tone: 'danger', icon: X },
  return: { tone: 'warning', icon: CornerUpLeft },
  escalate: { tone: 'warning', icon: CircleArrowUp },
  terminate: { tone: 'danger', icon: Ban },
};

/** 其余种类的文案、色调与图标 */
const eventLook: Record<
  Exclude<keyof WorkflowEventTypes, 'completed'>,
  {
    text: (messages: WorkflowMessages) => (text: WorkflowEventText) => string;
    tone: StatusTone;
    icon: IconData;
  }
> = {
  started: { text: (m) => m.eventStarted, tone: 'accent', icon: CirclePlay },
  arrived: { text: (m) => m.eventArrived, tone: 'neutral', icon: Inbox },
  'auto-completed': { text: (m) => m.eventAutoCompleted, tone: 'info', icon: Clock },
  claimed: { text: (m) => m.eventClaimed, tone: 'neutral', icon: Hand },
  released: { text: (m) => m.eventReleased, tone: 'warning', icon: Inbox },
  designated: { text: (m) => m.eventDesignated, tone: 'accent', icon: UserCheck },
  'reassign-requested': {
    text: (m) => m.eventReassignRequested,
    tone: 'warning',
    icon: UserRoundCog,
  },
  unclaimed: { text: (m) => m.eventUnclaimed, tone: 'warning', icon: Hourglass },
  reminded: { text: (m) => m.eventReminded, tone: 'info', icon: BellRing },
  commented: { text: (m) => m.eventCommented, tone: 'neutral', icon: MessageSquare },
  suspended: { text: (m) => m.eventSuspended, tone: 'warning', icon: Pause },
  resumed: { text: (m) => m.eventResumed, tone: 'accent', icon: CirclePlay },
  terminated: { text: (m) => m.eventTerminated, tone: 'danger', icon: Ban },
  moved: { text: (m) => m.eventMoved, tone: 'warning', icon: Shuffle },
  ended: { text: (m) => m.eventEnded, tone: 'success', icon: Flag },
};

/** 默认的时间显示：10-21 09:30 */
const shortTime = (iso: string) => `${iso.slice(5, 10)} ${iso.slice(11, 16)}`;

/**
 * 流转记录写成 Timeline 的各项（setup 里调用）：`<Timeline items={records.value} reverse />`。
 * read 里读到的响应式数据变了，各项跟着重算
 */
export function useWorkflowTimeline(
  read: () => WorkflowTimelineOptions,
): ComputedRef<TimelineItem[]> {
  const messages = useMessages('workflow', workflowMessages);
  return computed(() => {
    const {
      events,
      definition,
      hide = ['arrived'],
      actorName = (id: string) => id,
      formatTime = shortTime,
      renderAttachment = (attachment: string) => attachment,
    } = read();
    const graph = definition && processGraph(definition);
    const nodeName = (ids: string | null) =>
      (ids ?? '')
        .split(',')
        .filter(Boolean)
        .map((id) => graph?.node(id)?.name ?? id)
        .join('、');
    return events
      .filter((event) => !hide.includes(event.type))
      .map((event): TimelineItem => {
        const outcome =
          event.outcome != null
            ? processOutcome(graph?.node(event.node ?? ''), event.outcome)
            : undefined;
        const text: WorkflowEventText = {
          actor: event.actor === 'system' ? messages.system : actorName(event.actor),
          node: nodeName(event.node),
          outcome: outcome?.label ?? event.outcome ?? '',
          // 指定承办人时意见里是被指定的人
          target: event.type === 'designated' ? actorName(event.comment) : '',
        };
        const look =
          event.type === 'completed'
            ? { text: () => messages.eventCompleted, ...outcomeLook[outcome?.kind ?? 'approve'] }
            : eventLook[event.type];
        const comment = event.type === 'designated' ? '' : event.comment;
        return {
          key: event.id,
          title: look.text(messages)(text),
          time: formatTime(event.at),
          dateTime: event.at,
          tone: look.tone,
          icon: look.icon,
          description:
            comment || event.attachments.length ? (
              <>
                {comment && <div {...css.attrs(workflowTimelineStyles.comment)}>{comment}</div>}
                {event.attachments.length > 0 && (
                  <div
                    {...css.attrs(workflowTimelineStyles.attachments)}
                    aria-label={messages.attachments}
                  >
                    {event.attachments.map((attachment) => (
                      <span key={attachment} {...css.attrs(workflowTimelineStyles.attachment)}>
                        {renderAttachment(attachment)}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : undefined,
        };
      });
  });
}
