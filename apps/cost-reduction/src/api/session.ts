/** 会话与主数据的接口：当前用户、主数据与字典、我的任务与通知；演示环境的数据重置 */
import type { MasterData, Person } from '../domain/master';
import type { CostTask } from '../domain/task/types';
import type { WorkflowNotification } from '../domain/workflow/notifications';
import { apiPaths, http } from './client';
import { decodeTask, type Wire } from './wire';

/** 主数据与字典：启动时取一次 */
export const getMaster = () => http.get<MasterData>(apiPaths.master);

/** 当前用户 */
export const getMe = () => http.get<Person>(apiPaths.me);

/** 当前用户主办、还没结束的任务（按计划完成时间） */
export async function getMyTasks(signal?: AbortSignal): Promise<CostTask[]> {
  const rows = await http.get<Wire<CostTask>[]>(apiPaths.myTasks, { signal });
  return rows.map(decodeTask);
}

/** 当前用户的通知（近 14 天，新的在前） */
export const getNotifications = (signal?: AbortSignal) =>
  http.get<WorkflowNotification[]>(apiPaths.myNotifications, { signal });

/** 标为已读 */
export const markNotificationsRead = (ids: readonly string[]) =>
  http.post<void>(apiPaths.myNotificationsRead, { ids });

/** 演示：把数据恢复成初始状态 */
export const resetDemoData = () => http.post<void>(apiPaths.demoReset);
