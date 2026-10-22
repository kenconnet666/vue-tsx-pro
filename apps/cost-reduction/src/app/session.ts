/**
 * 会话：当前用户与角色。演示期间可以在顶栏切换身份（记在浏览器里），请求头带上工号，假后端按它判断“我”；
 * 接统一身份认证后，当前用户由登录决定，切换身份去掉
 */
import { usePersistentState } from '@vue-tsx-pro/ui';
import { shallowRef } from 'vue';
import { setRequestUser } from '../api/client';
import { getMe } from '../api/session';
import type { Person } from '../domain/master';
import type { RoleKey } from '../domain/roles';

// 选的身份：工号，空字符串是默认身份（由后端决定）
const chosen = usePersistentState('cost-reduction:user', '');
const user = shallowRef<Person | null>(null);

/** 启动时调用：请求头带上选的身份，再取当前用户 */
export async function initSession(): Promise<void> {
  setRequestUser(() => chosen.value || null);
  user.value = await getMe();
}

/** 当前用户（启动时已经取回） */
export function currentUser(): Person {
  if (!user.value) throw new Error('会话还没初始化：先在 main.ts 里等 initSession() 完成');
  return user.value;
}

/** 当前用户有没有这个角色 */
export const hasRole = (role: RoleKey) => currentUser().roles.includes(role);

/** 当前用户有没有其中任何一个角色；不限角色（空列表）时为 true */
export const hasAnyRole = (roles: readonly RoleKey[] | undefined) =>
  !roles?.length || roles.some(hasRole);

/** 切换演示身份：记住选择后重新加载，各页按新身份重新取数 */
export function switchUser(id: string): void {
  chosen.value = id;
  location.reload();
}
