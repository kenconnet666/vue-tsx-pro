/**
 * 变更记录：谁在什么时候做了什么。任务池接入流程之前，从任务卡的里程碑、金额与状态推出来（演示数据没有单独的日志）；
 * 接入后换成后端的流转记录
 */
import { shiftIsoDate, type TimelineItem } from '@vue-tsx-pro/ui';
import type Decimal from 'decimal.js';
import { dictLabel, personName } from '../../../app/master';
import { TODAY } from '../../../domain/clock';
import { milestoneDone } from '../../../domain/task/benefit';
import type { CostTask } from '../../../domain/task/types';
import { taskStatuses } from '../../../shared/statuses';

/** 变更记录，新的在前；money 把金额写成带单位的文字 */
export function taskHistory(task: CostTask, money: (value: Decimal) => string): TimelineItem[] {
  const firstDone = task.milestones.find((item) => item.done)?.done;
  const items: (TimelineItem & { at: string })[] = [
    {
      at: shiftIsoDate(firstDone ?? TODAY, { days: -21 }),
      title: '进入任务池',
      description: `${dictLabel('channels', task.channel)}（${task.sourceCode}）派单，主办 ${personName(task.owner)}`,
    },
  ];
  for (const item of task.milestones) {
    if (item.done)
      items.push({
        at: item.done,
        title: `里程碑：${item.label}`,
        description: item.evidence ? `交付证据 ${item.evidence}` : undefined,
        tone: 'success',
      });
  }
  const confirmed = milestoneDone(task, '收益确认');
  if (task.a && confirmed)
    items.push({
      at: confirmed,
      title: '测算金额 A 锁定',
      description: money(task.a),
      tone: 'accent',
    });
  if (task.b)
    items.push({
      at: shiftIsoDate(confirmed ?? TODAY, { days: 14 }),
      title: '商务金额 B 回填',
      description: `B ${money(task.b)}，差额 D ${money(task.b.minus(task.a ?? task.b))}（${task.gapReason ?? '—'}）`,
      tone: 'success',
    });
  if (task.status === 'paused' || task.status === 'terminated' || task.status === 'unpriced')
    items.push({
      at: TODAY,
      title: `状态改为“${taskStatuses.label(task.status)}”`,
      tone: task.status === 'terminated' ? 'danger' : 'warning',
    });
  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ at, ...item }) => ({ ...item, time: at, dateTime: at }));
}
