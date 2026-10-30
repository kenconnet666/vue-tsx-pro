# 全栈框架（@zerodep-dev/vue-tsx-pro-kit）

组件库 + Nitro：按页面选服务端渲染、浏览器渲染或构建时预渲染；页面的数据（loader）在服务端渲染时直接调用、浏览器里经接口取；
写操作是带类型的 action（Standard Schema 校验）；请求上下文、会话与权限两端一致。从 `apps/fullstack-demo` 与 `apps/flow-demo`
的重复里抽出来（ROADMAP 阶段 15），还没发布（`private`）。

| 入口                                   | 内容                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/vue-tsx-pro-kit`         | 两端通用：`definePages`、`defineApp`、`startClient`、`pageDataHook`、`defineAction`、`actionClient`、`useSession`、`PageView`、`listenInvalidation` |
| `@zerodep-dev/vue-tsx-pro-kit/page`    | 页面声明的纯函数（`nitro.config.ts` 在 Node 里加载它）                                                                                              |
| `@zerodep-dev/vue-tsx-pro-kit/context` | 请求上下文 `runInContext`、`currentContext`（只依赖 `node:async_hooks`，`server/api` 下的接口也能用）                                               |
| `@zerodep-dev/vue-tsx-pro-kit/server`  | `createRenderer`：整页 HTML、`/_data`、`/_action/<名字>`、`/_session`、`/_invalidation`；`createInvalidationHub`                                    |
| `@zerodep-dev/vue-tsx-pro-kit/vite`    | `kit()`：按约定的入口配好两个环境，服务端用 ESM 的 Vue 运行时版本                                                                                   |

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

## 前端缓存的失效推送

服务端的写入报出改了的表（easy-query-ts-cache 的 `tableChanges`），`createInvalidationHub()` 把同一轮里的合成一条、经 SSE（`GET /_invalidation`）
推给连着的浏览器；浏览器里 `listenInvalidation` 收到后让前端缓存（`@zerodep-dev/storage`）按表名标签失效，正显示着的 `useRequest` 自动重新请求。
断线重连时补发错过的；隔太久或服务端重启过时发 reset，浏览器全部失效。推出去的只有表名，不带数据。
多实例部署时每个实例只看得到自己的写入：`tableChanges(bus)` 把变更发进消息通道（easy-query-ts-cache 的 `createBus`），
每个实例订阅后推给连着自己的浏览器：`bus.subscribe((m) => hub.publish(m.tables), () => hub.reset())`；通道断过时 `hub.reset()` 让浏览器全部失效。
