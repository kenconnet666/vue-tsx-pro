/**
 * 当前页面（代替 RouterView 放在根组件里）：会话没有页面要求的权限时画“没有权限”，服务端同样回 403。
 *
 *   <PageView forbidden={() => <Alert tone="warning">没有权限</Alert>} />
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useSession } from './session.ts';

/** PageView 的属性 */
export interface PageViewProps {
  /** 没有权限时画的内容 */
  forbidden: () => VNodeChild;
}

/** 当前页面，或没有权限的提示 */
export const PageView = _component(({ forbidden }: PageViewProps) => {
  const route = useRoute();
  const session = useSession();
  return () => (session.can(route.meta.permission) ? <RouterView /> : forbidden());
});
