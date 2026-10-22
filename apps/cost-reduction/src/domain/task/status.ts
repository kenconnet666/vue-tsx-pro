/**
 * 任务状态的规则：八个正常状态按流程先后、只进不跳（唯一的回退是验证不达标从待认定退回方案设计中），
 * 三个异常状态（暂停、终止、挂账待定）；状态分组是任务池的页签、统计看板矩阵的行，两处一致
 */
import { daysBetween } from '@vue-tsx-pro/ui';
import { TODAY } from '../clock';
import type { CostTask, DmcNode, TaskStatus } from './types';

/** 正常流程里的先后（异常状态不在里面） */
export const taskFlow: readonly TaskStatus[] = [
  'pending',
  'designing',
  'verifying',
  'awaiting',
  'confirmed',
  'negotiating',
  'realized',
  'closed',
];

/** 异常状态 */
export const abnormalStatuses: readonly TaskStatus[] = ['paused', 'terminated', 'unpriced'];

/** 状态分组：任务池的页签、统计看板矩阵的行 */
export const statusGroups = [
  { value: 'doing', label: '执行中', statuses: ['pending', 'designing', 'verifying'] },
  { value: 'awaiting', label: '待认定', statuses: ['awaiting'] },
  { value: 'business', label: '商务中', statuses: ['confirmed', 'negotiating'] },
  { value: 'realized', label: '已兑现', statuses: ['realized'] },
  { value: 'closed', label: '已关闭', statuses: ['closed'] },
  { value: 'abnormal', label: '异常', statuses: abnormalStatuses },
] as const satisfies readonly {
  value: string;
  label: string;
  statuses: readonly TaskStatus[];
}[];

/** 状态分组的标识 */
export type StatusGroup = (typeof statusGroups)[number]['value'];

/** 状态是否属于某个分组 */
export const inStatusGroup = (status: TaskStatus, group: StatusGroup) =>
  (statusGroups.find((item) => item.value === group)!.statuses as readonly TaskStatus[]).includes(
    status,
  );

/** 已经走到 step 这一步或之后（异常状态不算走到任何一步） */
export const reached = (status: TaskStatus, step: TaskStatus) =>
  taskFlow.includes(status) && taskFlow.indexOf(status) >= taskFlow.indexOf(step);

/** 已经结束的任务（关闭、终止）：不再算超时 */
export const isFinished = (task: Pick<CostTask, 'status'>) =>
  task.status === 'closed' || task.status === 'terminated';

/** 超时天数：过了计划完成时间还没结束的天数；没超时为 0 */
export const overdueDays = (task: Pick<CostTask, 'status' | 'due'>) =>
  isFinished(task) ? 0 : Math.max(0, daysBetween(task.due, TODAY));

/** 离计划完成还有几天（过了为负） */
export const daysToDue = (task: Pick<CostTask, 'due'>) => daysBetween(TODAY, task.due);

/** 下一个没完成的实施节点（降 DMC）；全部完成时为 undefined */
export const nextDmcNode = (task: Pick<CostTask, 'dmcNodes'>) =>
  task.dmcNodes.find((node) => node.done == null);

/** 没完成的实施节点超过计划日期几天；完成了或没超为 0 */
export const nodeLateDays = (node: Pick<DmcNode, 'done' | 'due'>) =>
  node.done ? 0 : Math.max(0, -daysToDue(node));

/** 关闭三材料缺几项 */
export const missingClosing = (task: Pick<CostTask, 'closing'>) =>
  Object.values(task.closing).filter((ok) => !ok).length;

/** 能不能关闭：已兑现且三材料齐全 */
export const canClose = (task: Pick<CostTask, 'status' | 'closing'>) =>
  task.status === 'realized' && missingClosing(task) === 0;

/** 关注：跨状态的快捷筛选，PEMO 每天要看的几类（台账的第二组页签、统计看板的“需要处理”） */
export const taskFocuses = [
  { value: 'overdue', label: '超时', test: (task: CostTask) => overdueDays(task) > 0 },
  {
    value: 'soon',
    label: '7 天内到期',
    test: (task: CostTask) => !isFinished(task) && daysToDue(task) >= 0 && daysToDue(task) <= 7,
  },
  { value: 'closable', label: '可关闭', test: canClose },
  {
    value: 'missing',
    label: '关闭材料不全',
    test: (task: CostTask) => task.status === 'realized' && !canClose(task),
  },
] as const;

/** 关注的标识 */
export type TaskFocus = (typeof taskFocuses)[number]['value'];
