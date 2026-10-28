/**
 * 框架的服务端部分：整页渲染与接口（createRenderer）、请求上下文（runInContext、currentContext）。
 * 只在服务端导入：用到 node:async_hooks 与 vue/server-renderer
 */
export {
  createRenderer,
  type ClientAssets,
  type KitModule,
  type RendererOptions,
} from './server.ts';
export { currentContext, runInContext } from './context.ts';
