/**
 * 会话（ROADMAP 13.7）：当前用户与他的权限，服务端按请求上下文算出、写进页面，两端都能取。
 * 服务端靠它拦页面与 action，浏览器靠它藏按钮、生成菜单——浏览器这边只是体验，真正的拦截在服务端。
 *
 *   const session = useSession();
 *   session.can('todo.write') && <Button>新建</Button>
 */
import { inject, type App, type InjectionKey, type ShallowRef } from 'vue';

/** 会话的内容（会写进页面，只放浏览器可以知道的） */
export interface SessionData {
  /** 当前用户的显示名，没登录时是 null */
  user: string | null;
  permissions: readonly string[];
}

/** 会话：内容加上判断权限 */
export interface Session extends SessionData {
  /** 有这个权限；不要求权限（undefined）时总是 true */
  can: (permission: string | undefined) => boolean;
}

/** 预渲染的页面挂载后取会话的接口 */
export const SESSION_PATH = '/_session';

const SessionKey: InjectionKey<ShallowRef<Session>> = Symbol('session');

/** 由内容建会话 */
export const createSession = (data: SessionData): Session => ({
  ...data,
  can: (permission) => permission === undefined || data.permissions.includes(permission),
});

/** 把会话交给应用（服务端每个请求一次、浏览器启动时一次）；浏览器里预渲染的页面挂载后会换成真正的会话 */
export const provideSession = (app: App, session: ShallowRef<Session>): void => {
  app.provide(SessionKey, session);
};

/** 当前会话（组件里调用；会话换了时跟着变） */
export function useSession(): Session {
  const session = inject(SessionKey, null);
  if (!session) throw new Error('useSession：应用没有会话（服务端入口与浏览器入口会提供它）');
  return {
    get user() {
      return session.value.user;
    },
    get permissions() {
      return session.value.permissions;
    },
    can: (permission) => session.value.can(permission),
  };
}
