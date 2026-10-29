/**
 * 按权限点显示：有权限才渲染里面的内容，没有时渲染 fallback（默认什么都不画）。权限从哪来由应用在 createUi / Provider 的
 * permissions 里接入（`(权限点) => 用户有没有`）；没接入时一律放行。给数组时有其中任意一个就算有。
 *
 *   <Can permission="cost:project:add"><Button icon={Plus}>新建</Button></Can>
 *   <Can permission={['cost:project:edit', 'cost:project:add']} fallback={<Small tone="muted">只读</Small>}>…</Can>
 *
 * 只控制界面，不是安全边界：接口上的权限校验才是（见后端的 @RequirePermission）。要自己判断（禁用按钮、过滤菜单项）时用 useCan。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { useCan } from '../config/context';

/** Can 的属性 */
export interface CanProps {
  /** 需要的权限点；数组时有其中任意一个即可 */
  permission: string | readonly string[];
  /** 没有权限时显示的内容，默认不显示 */
  fallback?: VNodeChild;
  /** 有权限时显示的内容 */
  children?: VNodeChild;
}

/** 按权限点显示：有权限才渲染 children，否则渲染 fallback */
export const Can = _component(({ permission, fallback, children }: CanProps) => {
  const can = useCan();
  return () => <>{can(permission) ? children : fallback}</>;
});
