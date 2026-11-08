/**
 * 流程中心里的说法：流转记录、实例状态、时间的写法。页面与组合共用。
 */
import type { FlowEventView, InstanceStatus, NotificationView } from '@zerodep-dev/flow-ts-engine';
import type { StatusTone } from '@zerodep-dev/vue-tsx-pro-ui';
import { useFlowCenter } from '../runtime/center';

/** 流转记录要列出来的事件与它们的说法（推进的内部事件如 node.entered 不列） */
const EVENT_TEXT: Readonly<Record<string, string>> = {
  'instance.started': '发起',
  'workItem.claimed': '认领',
  'workItem.completed': '处理',
  'workItem.released': '放回收件箱',
  'workItem.reassigned': '改派',
  'workItem.delegated': '委托',
  'workItem.signAdded': '加签',
  'workItem.signersRemoved': '减签',
  'workItem.withdrawn': '撤回这一步',
  'workItem.reminded': '催办',
  'workItem.overdue': '超时',
  'workItem.assigned': '指定承办人',
  'workItem.reassignRequested': '申请改派',
  'instance.cc': '抄送',
  'instance.commented': '留言',
  'instance.dataChanged': '改了单据',
  'instance.jumped': '跳转',
  'instance.suspended': '暂停',
  'instance.migrated': '迁移版本',
  'node.skipped': '自动跳过',
  'node.overdue': '超时',
  'service.done': '自动处理完成',
  'job.failed': '自动处理失败',
  'job.skipped': '跳过自动处理',
  'call.started': '发起子流程',
  'call.finished': '子流程结束',
  'countersign.decided': '会签有了结果',
  'signal.received': '收到外部消息',
};

/** 这条事件列不列、怎么说 */
export const eventText = (event: FlowEventView): string | undefined => EVENT_TEXT[event.type];

/** 实例状态的说法与色调 */
export const STATUS: Readonly<Record<InstanceStatus, { label: string; tone: StatusTone }>> = {
  draft: { label: '草稿', tone: 'neutral' },
  active: { label: '审批中', tone: 'accent' },
  completed: { label: '已完成', tone: 'success' },
  terminated: { label: '已终止', tone: 'danger' },
  withdrawn: { label: '已撤回', tone: 'neutral' },
  suspended: { label: '已暂停', tone: 'warning' },
};

/** 结束时的结果说法（定义里结束节点的 result） */
export const RESULT_TEXT: Readonly<Record<string, string>> = {
  approved: '通过',
  rejected: '不通过',
  paid: '已付款',
  ordered: '已下单',
};

/** 时间写成“11-07 14:30”；不是今年时带上年 */
export function timeText(value: Date | string | null | undefined, now = new Date()): string {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return date.getFullYear() === now.getFullYear() ? day : `${date.getFullYear()}-${day}`;
}

/** 发起人等编号写成名字；库里没有时是编号 */
export const who = (id: string | null | undefined): string =>
  useFlowCenter().person(id)?.name ?? id ?? '';

/** 通知的说法：标题、第二行与色调（引擎只给事件，文案在这里；以后按语言包换） */
export function noticeText(notice: NotificationView): {
  title: string;
  description: string;
  tone?: StatusTone;
} {
  const title = notice.title ?? notice.processKey;
  const node = notice.nodeName ?? '';
  switch (notice.event) {
    case 'arrived':
      return { title: `待办：${title}`, description: `“${node}”到了你这里` };
    case 'returned':
      return {
        title: `退回：${title}`,
        description: `“${node}”退回给你，改好再提交`,
        tone: 'warning',
      };
    case 'reminded':
      return {
        title: `催办：${title}`,
        description: notice.sender
          ? `${who(notice.sender)}催你处理“${node}”`
          : `“${node}”很久没人认领`,
        tone: 'warning',
      };
    case 'dueSoon':
      return { title: `快到期：${title}`, description: `“${node}”快到时限了`, tone: 'warning' };
    case 'overdue':
      return { title: `已超时：${title}`, description: `“${node}”过了时限`, tone: 'danger' };
    case 'cc':
      return {
        title: `抄送：${title}`,
        description: notice.sender ? `${who(notice.sender)}抄送给你` : '流程抄送给你',
      };
    case 'finished':
      return { title: `已结束：${title}`, description: '你发起的这张单结束了', tone: 'success' };
  }
}
