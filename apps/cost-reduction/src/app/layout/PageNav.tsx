/**
 * 本页的导航（页签、视图切换）放进顶栏：页面里写 <PageNav>…</PageNav>，内容传送到外壳顶栏的那一格。
 * 外壳只渲染一次，换页时只换这一格的内容
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Teleport, type VNodeChild } from 'vue';

/** 顶栏里本页导航那一格的 id */
export const PAGE_NAV_ID = 'page-nav';

/** 本页的导航，显示在顶栏里 */
export const PageNav = _component(({ children }: { children?: VNodeChild }) => () => (
  // defer：等外壳这一轮渲染完，顶栏里的那一格一定已经在了
  <Teleport to={`#${PAGE_NAV_ID}`} defer>
    {children}
  </Teleport>
));
