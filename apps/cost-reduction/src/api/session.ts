/** 会话与主数据的接口：当前用户、主数据与字典、我的任务与收件箱；演示环境的数据重置 */
import type { MasterData, Person } from '../domain/master';
import type { CostTask } from '../domain/task/types';
import { apiPaths, http } from './client';
import { decodeTask, type Wire } from './wire';

/** 收件箱的一条（顶栏里最近几条） */
export interface InboxMessage {
  /** 标识 */
  id: string;
  /** 色调：新到的、快到期的、被退回的 */
  tone: 'accent' | 'warning' | 'danger';
  /** 标题 */
  title: string;
  /** 环节、时限、状态 */
  meta: string;
  /** 多久之前 */
  time: string;
}

/** 主数据与字典：启动时取一次 */
export const getMaster = () => http.get<MasterData>(apiPaths.master);

/** 当前用户 */
export const getMe = () => http.get<Person>(apiPaths.me);

/** 当前用户主办、还没结束的任务（按计划完成时间） */
export async function getMyTasks(signal?: AbortSignal): Promise<CostTask[]> {
  const rows = await http.get<Wire<CostTask>[]>(apiPaths.myTasks, { signal });
  return rows.map(decodeTask);
}

/** 当前用户收件箱里最近的几条 */
export const getMyInbox = (signal?: AbortSignal) =>
  http.get<InboxMessage[]>(apiPaths.myInbox, { signal });

/** 演示：把数据恢复成初始状态 */
export const resetDemoData = () => http.post<void>(apiPaths.demoReset);
