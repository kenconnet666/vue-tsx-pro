/**
 * 状态的名称与色调：标记、表格的状态列、筛选的选项、步骤条共用，同一种状态在哪儿都是同一个颜色、同一个叫法。
 * 状态本身（有哪些、先后、分组）在 domain 里，这里只管怎么显示
 */
import { createStatusMap, type StatusDefinition, type StatusTone } from '@vue-tsx-pro/ui';
import type { TaskFocus } from '../domain/task/status';
import type { TaskStatus, ValueState } from '../domain/task/types';

/** 任务状态：八个正常状态按流程先后，后三个是异常状态（options() 的顺序就是这个顺序） */
export const taskStatuses = createStatusMap({
  pending: { label: '待启动', tone: 'neutral' },
  designing: { label: '方案设计中', tone: 'info' },
  verifying: { label: '验证中', tone: 'info' },
  awaiting: { label: '待认定', tone: 'warning' },
  confirmed: { label: '已认定', tone: 'accent' },
  negotiating: { label: '商务洽谈中', tone: 'warning' },
  realized: { label: '已兑现', tone: 'success' },
  closed: { label: '关闭', tone: 'neutral' },
  paused: { label: '暂停', tone: 'neutral' },
  terminated: { label: '终止', tone: 'danger' },
  unpriced: { label: '挂账待定', tone: 'warning' },
} satisfies Record<TaskStatus, StatusDefinition>);

/** 收益状态（一本账的栏） */
export const valueStates = createStatusMap({
  forecast: { label: '预测值', tone: 'info' },
  committed: { label: '承诺值', tone: 'accent' },
  realized: { label: '实现值', tone: 'success' },
  unpriced: { label: '挂账待定', tone: 'warning' },
} satisfies Record<ValueState, StatusDefinition>);

/** 关注页签的色调：条数用色调提示轻重 */
export const focusTones: Readonly<Record<TaskFocus, StatusTone>> = {
  overdue: 'danger',
  soon: 'warning',
  closable: 'success',
  missing: 'warning',
};
