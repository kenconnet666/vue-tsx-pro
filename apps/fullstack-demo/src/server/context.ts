/**
 * 示例的请求上下文（只在服务端）：当前用户从 cookie 读（示例的“登录”就是选一个用户，见 server/api/sign-in.ts），
 * 租户与权限跟着用户走。真实应用在这里校验会话令牌、查用户与角色
 */
// 只从 kit/context 导入：server/api 下的接口也用这个文件，不该带上整个渲染器
import { currentContext } from '@zerodep-dev/vue-tsx-pro-kit/context';
import type { SessionData } from '@zerodep-dev/vue-tsx-pro-kit';

interface DemoUser {
  name: string;
  tenant: string;
  permissions: readonly string[];
}

/** 示例的用户：同一租户里一个能改、一个只能看，另一个租户的看不到前两个的数据 */
export const USERS: Record<string, DemoUser> = {
  alice: { name: 'alice', tenant: 'acme', permissions: ['todo.read', 'todo.write'] },
  bob: { name: 'bob', tenant: 'acme', permissions: ['todo.read'] },
  carol: { name: 'carol', tenant: 'globex', permissions: ['todo.read', 'todo.write'] },
};

/** 选中的用户记在这个 cookie 里 */
export const USER_COOKIE = 'demo_user';

/** 请求上下文：当前用户与租户（没登录时都是 null） */
export interface AppContext {
  user: DemoUser | null;
  tenant: string | null;
}

/** 每个请求建一次 */
export function createContext(request: Request): AppContext {
  const cookie = request.headers.get('cookie') ?? '';
  const name = /(?:^|;\s*)demo_user=([^;]+)/.exec(cookie)?.[1];
  const user = name && Object.hasOwn(USERS, name) ? USERS[name]! : null;
  return { user, tenant: user?.tenant ?? null };
}

/** 写进页面的会话 */
export const sessionOf = (context: AppContext): SessionData => ({
  user: context.user?.name ?? null,
  permissions: context.user?.permissions ?? [],
});

/** 当前请求的上下文（loader、action、拦截器里） */
export const useContext = (): AppContext => currentContext<AppContext>();
