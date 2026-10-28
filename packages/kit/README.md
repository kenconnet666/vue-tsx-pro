# 全栈框架（@zerodep-dev/vue-tsx-pro-kit）

组件库 + Nitro：按页面选服务端渲染、浏览器渲染或构建时预渲染；页面的数据（loader）在服务端渲染时直接调用、浏览器里经接口取；
写操作是带类型的 action（Standard Schema 校验）；请求上下文、会话与权限两端一致。从 `apps/fullstack-demo` 与 `apps/flow-demo`
的重复里抽出来（ROADMAP 阶段 15），还没发布（`private`）。

| 入口                                   | 内容                                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/vue-tsx-pro-kit`         | 两端通用：`definePages`、`defineApp`、`startClient`、`pageDataHook`、`defineAction`、`actionClient`、`useSession`、`PageView` |
| `@zerodep-dev/vue-tsx-pro-kit/page`    | 页面声明的纯函数（`nitro.config.ts` 在 Node 里加载它）                                                                        |
| `@zerodep-dev/vue-tsx-pro-kit/context` | 请求上下文 `runInContext`、`currentContext`（只依赖 `node:async_hooks`，`server/api` 下的接口也能用）                         |
| `@zerodep-dev/vue-tsx-pro-kit/server`  | `createRenderer`：整页 HTML、`/_data`、`/_action/<名字>`、`/_session`                                                         |
| `@zerodep-dev/vue-tsx-pro-kit/vite`    | `kit()`：按约定的入口配好两个环境，服务端用 ESM 的 Vue 运行时版本                                                             |

```ts
// vite.config.ts
plugins: [workspaceSource(), ...vueTsxPro(), kit(), nitro()];
// src/entry-server.ts
export default {
  fetch: createRenderer({ ...app, assets, loaders, actions, createContext, session }),
};
// src/entry-client.ts
startClient(app);
```

用法看两个示例应用：`apps/fullstack-demo`（三种渲染模式、loader、action、权限、按租户隔离的 easy-query）、
`apps/flow-demo`（流程引擎的审批应用）。
