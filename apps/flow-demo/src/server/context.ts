/**
 * 示例的请求上下文（只在服务端）：当前用户从 cookie 读（示例的“登录”就是选一个用户，见 server/api/sign-in.ts），
 * 换成引擎要的 Actor（编号、角色）。真实应用在这里校验会话令牌、从组织表查角色与部门
 */
import type { Actor } from '@zerodep-dev/flow-ts-engine';
// 只从 kit/context 导入：server/api 下的接口也用这个文件，不该带上整个渲染器
import { currentContext } from '@zerodep-dev/vue-tsx-pro-kit/context';
import type { SessionData } from '@zerodep-dev/vue-tsx-pro-kit';

/** 示例的用户：申请人、经理（角色 1）、人事（角色 2）、管理员 */
export const USERS: Record<string, Actor & { name: string }> = {
  alice: { id: 'alice', name: '林小满', roles: [] },
  bob: { id: 'bob', name: '周启航', roles: ['1'] },
  carol: { id: 'carol', name: '沈若水', roles: ['2'] },
  admin: { id: 'admin', name: '管理员', roles: [], admin: true },
};

/** 选中的用户记在这个 cookie 里 */
export const USER_COOKIE = 'demo_user';

/** 请求上下文：当前用户（没登录时为 null） */
export interface AppContext {
  actor: (Actor & { name: string }) | null;
}

/** 每个请求建一次 */
export function createContext(request: Request): AppContext {
  const cookie = request.headers.get('cookie') ?? '';
  const name = /(?:^|;\s*)demo_user=([^;]+)/.exec(cookie)?.[1];
  return { actor: name && Object.hasOwn(USERS, name) ? USERS[name]! : null };
}

/** 写进页面的会话：登录了就能发起、看待办 */
export const sessionOf = (context: AppContext): SessionData => ({
  user: context.actor?.name ?? null,
  permissions: context.actor ? ['flow.use', ...(context.actor.admin ? ['flow.admin'] : [])] : [],
});

/** 当前请求的上下文（loader、action 里） */
export const useContext = (): AppContext => currentContext<AppContext>();

/** 当前用户；没登录时报错（页面与 action 都要求 flow.use，到这里的都登录了） */
export function currentActor(): Actor & { name: string } {
  const actor = useContext().actor;
  if (!actor) throw new Error('没登录');
  return actor;
}
