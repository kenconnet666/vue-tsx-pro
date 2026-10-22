/** 假接口的共用写法：路径、响应延迟、出错的响应、当前用户 */
import { delay, HttpResponse } from 'msw';
import { API_BASE, apiPaths } from '../api/client';
import { DEFAULT_USER } from './seed/master';
import { WorkflowError } from './workflow/engine';

/** 接口路径的完整写法（MSW 的路由）：route('task') → '/api/tasks/:code' */
export const route = (name: keyof typeof apiPaths) => `${API_BASE}${apiPaths[name]}`;

/** 模拟网络的延迟：浏览器里 250 ms（看得到加载状态），测试里不等 */
export const latency = () => delay(import.meta.env.MODE === 'test' ? 0 : 250);

/** 出错的响应：状态码与给人看的说明（前端在提示里显示 message） */
export const fail = (status: number, message: string) => HttpResponse.json({ message }, { status });

/** 当前用户的工号：请求头 X-User-Id（演示的身份切换），没有时是默认身份 */
export const actorOf = (request: Request) => request.headers.get('x-user-id') ?? DEFAULT_USER;

/** 读 JSON 请求体；没有或不是 JSON 时为空对象 */
export async function bodyOf<T extends object>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}

/** 流转出错的状态码 */
const workflowStatus = { 'not-found': 404, forbidden: 403, conflict: 409, invalid: 400 } as const;

/** 执行一个可能出错的操作：流转出错给出对应的状态码与说明，其余的错误原样抛出（MSW 报 500） */
export function attempt(action: () => Response): Response {
  try {
    return action();
  } catch (error) {
    if (error instanceof WorkflowError) return fail(workflowStatus[error.code], error.message);
    throw error;
  }
}
