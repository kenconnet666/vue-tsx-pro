/**
 * 请求上下文（ROADMAP 13.6，只在服务端）：应用的 createContext(request) 的结果在这次请求里处处可取，
 * loader、action 和它们调用的代码（包括 easy-query 的 tenant 拦截器）不用一层层传参：
 *
 *   // src/server/context.ts
 *   export const useContext = () => currentContext<AppContext>();
 *   // 拦截器里
 *   tenant('tenantId', () => useContext().tenant)
 */
import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<object>();

/** 在这个上下文里执行 run（服务端每个请求一次） */
export const runInContext = <T>(context: object, run: () => T): T => storage.run(context, run);

/** 当前请求的上下文；不在请求里（启动时、定时任务里没包一层）时报错 */
export function currentContext<C extends object>(): C {
  const context = storage.getStore();
  if (!context) {
    throw new Error(
      '不在请求里：请求上下文只在 loader、action 与它们调用的代码里能取（别处先用 runInContext 包一层）',
    );
  }
  return context as C;
}
