/**
 * 链接与路由适配（config 的 router，参考 React Aria 的 RouterProvider）：
 * 组件渲染真正的 <a href>（右键菜单、新标签页打开、读屏都正常），普通左键点击站内链接时交给路由跳转。
 * Link、LinkButton、导航组件共用。
 */
import { useConfig } from '../../config/context';

/** 这次点击该不该交给路由：只拦普通左键点击同源、在当前窗口打开、不是下载的链接 */
export function shouldRouteClick(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  return anchor.origin === window.location.origin;
}

/** 外部链接（external）的属性：新窗口打开，不把本页交给对方（window.opener）、不带来源地址 */
export const externalLinkAttrs = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** 外部链接（带协议、// 开头）与页内锚点（#…）不经过路由 */
const isRoutable = (href: string) => !/^([a-z][\w+.-]*:|\/\/|#)/i.test(href);

/** 链接的路由能力：渲染的地址、点击处理（展开到 <a> 的 onClick）与“是不是当前页” */
export interface RouterLink {
  /** 渲染到 <a href> 上的地址：站内链接经路由的 resolve 补上 base 与 hash 模式的 #；没有 resolve 时原样 */
  href: (href: string) => string;
  /** 站内链接的普通点击改由路由跳转，交给路由的是写在组件上的原文 href；没有配置路由时什么也不做 */
  onClick: (event: MouseEvent, href: string) => void;
  /** href 是不是当前页；没有配置 isActive 时为 false。在渲染里调用以跟随路由变化 */
  isActive: (href: string | undefined) => boolean;
}

/** 在组件 setup 里调用 */
export function useRouterLink(): RouterLink {
  const config = useConfig();
  return {
    href: (href) => {
      const resolve = config.router?.resolve;
      return resolve && isRoutable(href) ? resolve(href) : href;
    },
    onClick(event, href) {
      const router = config.router;
      const anchor = event.currentTarget;
      if (!router || !(anchor instanceof HTMLAnchorElement) || !shouldRouteClick(event, anchor)) {
        return;
      }
      event.preventDefault();
      // 交给路由的是原文（不是渲染出的带 base 的地址）：base、相对路径由路由自己处理
      router.navigate(href);
    },
    isActive: (href) => (href != null && config.router?.isActive?.(href)) || false,
  };
}
