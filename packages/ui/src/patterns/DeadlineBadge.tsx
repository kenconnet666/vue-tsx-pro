/**
 * 时限标记：按工作日算还剩几天、今天到期、超时几天，颜色随状态（超时 danger、今天到期与快到期 warning、
 * 还早 neutral、完成 success 或超时完成 danger）。用在收件箱、待办、各种有时限的列表里。
 *
 *   <DeadlineBadge due="2026-10-23" />                           截止日直接给
 *   <DeadlineBadge start={verifiedOn} workdays={10} />           开始日加几个工作日（验证完成后 10 个工作日内认定）
 *   <DeadlineBadge due={item.dueOn} done={item.completedOn} />   完成了按完成那天算
 *
 * 工作日按 createUi / Provider 的 workCalendar（法定节假日与调休），没给时只按周末。今天默认按浏览器，
 * 业务以服务器的日期为准时传 today。悬停与读屏有完整说明（截止日）。算法见 utils/data/workdays 的 deadlineOf。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Badge, type BadgeProps } from '../base/Badge';
import { useMessages } from '../config/lang/messages';
import { patternsMessages } from './messages';
import { VisuallyHidden } from '../base/VisuallyHidden';
import {
  deadlineOf,
  useWorkCalendar,
  type Deadline,
  type DeadlineStates,
} from '../utils/data/workdays';
import type { StatusTone } from '../utils/style/tone-styles';

/** 未声明的属性落到 Badge 上 */
export interface DeadlineBadgeProps extends Omit<BadgeProps, 'tone' | 'children' | 'title'> {
  /** 截止日（ISO 日期）；与 start + workdays 二选一 */
  due?: string | null;
  /** 开始日（ISO 日期）：截止日是它加 workdays 个工作日 */
  start?: string;
  /** 开始日之后几个工作日截止 */
  workdays?: number;
  /** 完成的日期：完成了按完成那天算，显示按时或超时完成 */
  done?: string | null;
  /** 今天（ISO 日期），默认按浏览器的今天 */
  today?: string;
  /**
   * 剩下几个工作日以内算快到期（warning）
   * @default 2
   */
  soon?: number;
}

const TONES: Record<keyof DeadlineStates, StatusTone> = {
  pending: 'neutral',
  soon: 'warning',
  due: 'warning',
  overdue: 'danger',
  done: 'success',
};

/** 时限标记 */
export const DeadlineBadge = _component(
  ({ due, start, workdays, done, today, soon, ...rest }: DeadlineBadgeProps) => {
    const messages = useMessages('patterns', patternsMessages);
    const calendar = useWorkCalendar();
    const deadline = (): Deadline | null => {
      if (due) return deadlineOf({ due, done, today, soon }, calendar);
      if (start && workdays != null)
        return deadlineOf({ start, workdays, done, today, soon }, calendar);
      return null;
    };
    const text = ({ state, remaining }: Deadline) => {
      switch (state) {
        case 'overdue':
          return messages.deadlineOverdue(-remaining);
        case 'due':
          return messages.deadlineDue;
        case 'done':
          return remaining < 0 ? messages.deadlineDoneLate(-remaining) : messages.deadlineDone;
        default:
          return messages.deadlineRemaining(remaining);
      }
    };
    return () => {
      const current = deadline();
      if (!current) return null;
      const late = current.state === 'done' && current.remaining < 0;
      return (
        <Badge
          {...rest}
          tone={late ? 'danger' : TONES[current.state]}
          title={messages.deadlineOn(current.due)}
          data-state={current.state}
        >
          {text(current)}
          {/* title 读屏不一定念：截止日另写一份给读屏 */}
          <VisuallyHidden> {messages.deadlineOn(current.due)}</VisuallyHidden>
        </Badge>
      );
    };
  },
);
