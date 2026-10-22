/** 任务卡（降本项目）的接口：台账查询、看板、读写、推进与异常状态 */
import type { WorkItem } from '@vue-tsx-pro/ui';
import type { LedgerPage, LedgerRequest } from '../domain/task/query';
import type { CostKind, CostTask, PlanChange, TaskStatus } from '../domain/task/types';
import { apiPaths, fillPath, http } from './client';
import { decodeTask, type Wire } from './wire';

const taskPath = (pattern: string, code: string) => fillPath(pattern, { code });

/** 台账的一页，带上每张卡在任务池流程里正在处理的环节 */
export interface TaskLedgerPage extends LedgerPage {
  /** 编号 → 正在处理的环节（结束、暂停前没有待办的不在里面） */
  current: Record<string, WorkItem>;
}

/** 台账的一页：筛选条件、页签、排序与分页都写在查询参数里（sort=-key 是倒序） */
export async function listTasks(
  request: LedgerRequest,
  signal?: AbortSignal,
): Promise<TaskLedgerPage> {
  const { filters, sort, ...rest } = request;
  const page = await http.get<Wire<TaskLedgerPage>>(apiPaths.tasks, {
    query: {
      ...rest,
      ...filters,
      sort: sort ? `${sort.direction === 'descending' ? '-' : ''}${sort.key}` : null,
    },
    signal,
  });
  return { ...page, rows: page.rows.map(decodeTask) };
}

/** 看板上的一张卡：任务卡与任务池流程里正在处理的环节（结束、暂停的没有） */
export interface TaskBoardCard {
  /** 任务卡 */
  task: CostTask;
  /** 正在处理的环节 */
  item: WorkItem | null;
}

/** 任务看板：一种类型的全部任务卡 */
export async function getTaskBoard(kind: CostKind, signal?: AbortSignal): Promise<TaskBoardCard[]> {
  const cards = await http.get<Wire<TaskBoardCard>[]>(apiPaths.taskBoard, {
    query: { kind },
    signal,
  });
  return cards.map((card) => ({ ...card, task: decodeTask(card.task) }));
}

/** 按编号取一批任务（顺序同 codes，找不到的略过） */
export async function getTasks(codes: readonly string[]): Promise<CostTask[]> {
  const rows = await http.get<Wire<CostTask>[]>(apiPaths.taskSelection, { query: { codes } });
  return rows.map(decodeTask);
}

/** 一张任务卡 */
export async function getTask(code: string, signal?: AbortSignal): Promise<CostTask> {
  return decodeTask(await http.get<Wire<CostTask>>(taskPath(apiPaths.task, code), { signal }));
}

/** 新建：编号由后端按“类型-完成年度-团队缩写-序号”生成，code 留空 */
export async function createTask(task: CostTask): Promise<CostTask> {
  return decodeTask(await http.post<Wire<CostTask>>(apiPaths.tasks, task));
}

/** 保存（不存在时按这个编号新建：撤销删除时放回） */
export async function saveTask(task: CostTask): Promise<CostTask> {
  return decodeTask(await http.put<Wire<CostTask>>(taskPath(apiPaths.task, task.code), task));
}

/** 删除（只限待启动）；返回删掉的任务卡，撤销时原样放回 */
export async function deleteTask(code: string): Promise<CostTask> {
  return decodeTask(await http.delete<Wire<CostTask>>(taskPath(apiPaths.task, code)));
}

/** 推进到下一状态 */
export async function advanceTask(code: string, next: TaskStatus): Promise<CostTask> {
  return decodeTask(
    await http.post<Wire<CostTask>>(taskPath(apiPaths.taskAdvance, code), { next }),
  );
}

/** 提交计划调整：发起 PEMO 审批，同意后写回；返回记下了审批中申请的任务卡 */
export async function requestPlanChange(code: string, change: PlanChange): Promise<CostTask> {
  return decodeTask(
    await http.post<Wire<CostTask>>(taskPath(apiPaths.taskPlanChange, code), change),
  );
}

/** 暂停 */
export async function pauseTask(code: string): Promise<CostTask> {
  return decodeTask(await http.post<Wire<CostTask>>(taskPath(apiPaths.taskPause, code)));
}

/** 终止：原因写进变更记录，事项回流储备库 */
export async function terminateTask(code: string, reason = ''): Promise<CostTask> {
  return decodeTask(
    await http.post<Wire<CostTask>>(taskPath(apiPaths.taskTerminate, code), { reason }),
  );
}
