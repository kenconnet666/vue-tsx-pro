/**
 * 全栈框架（ROADMAP 15）：组件库 + Nitro 上按页面选服务端渲染、浏览器渲染或预渲染。两端通用的部分在这里，
 * 服务端的在 `@zerodep-dev/vue-tsx-pro-kit/server`，Vite 插件在 `@zerodep-dev/vue-tsx-pro-kit/vite`。
 * 从 apps/fullstack-demo 与 apps/flow-demo 的重复里抽出来（两个应用各写过一遍同样的接线）
 */
export {
  definePages,
  pageRoutes,
  pageTitle,
  prerenderRules,
  type PageDef,
  type RenderMode,
} from './page.ts';
export { defineApp, startClient, type AppDefinition } from './app.ts';
export {
  defineLoaders,
  pageDataHook,
  type LoadContext,
  type Loader,
  type Loaders,
} from './data.ts';
export {
  actionClient,
  ActionError,
  defineAction,
  defineActions,
  type Action,
  type ActionIssue,
  type Actions,
  type InputSchema,
} from './action.ts';
export { useSession, type Session, type SessionData } from './session.ts';
export { PageView, type PageViewProps } from './PageView.tsx';
