# 手动发布到 npm

发布由维护者在本机手动执行，CI 不发布（changesets 与带 provenance 的发布工作流见 ROADMAP 8.4，还没做）。
发布的两个包都在 npm 组织 `zerodep-dev` 下（和 query 的包同一个组织，npm 上没有 `@vue-tsx-pro` 这个范围），版本号一起走：

| 包                             | 内容                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/vue-tsx-pro-tsx` | TSX 编译器（符文、组件边界）、运行时样式引擎、Vite 预设；`dist` 与 `types`                                          |
| `@zerodep-dev/vue-tsx-pro-ui`  | 组件库与各子路径（`/diagram`、`/charts`、`/patterns`、`/three`…），编译好的 JS；依赖 `@zerodep-dev/vue-tsx-pro-tsx` |

`ui` 对 `tsx` 的依赖写成 `workspace:^`，`pnpm publish` 发布时换成实际版本号，所以必须用 pnpm 发布，不能用 `npm publish`。

## 下一版对使用方的变化

发布时把这一节搬进 GitHub Release 的说明，再清空。组件库照样能在不做服务端渲染的普通 Vue 项目里用，下面是能察觉到的行为变化：

- 新组件：滑块验证 `SlideCaptcha`、认证页版式 `AuthLayout`、数据驱动菜单 `NavMenu`、按权限显示的 `Can` / `useCan`（`createUi` 的 `permissions` 接入）、
  表单对话框 `FormDialog` / `useFormDialog`、布局偏好 `createLayoutPreference` / `LayoutSwitcher`；AppShell 抽屉可以从四边滑出，PageTabs 支持 `tabs` 整体状态。
- `QueryTable` 查询区压成一行（更多条件收进“展开”），`fill` 让它占满到窗口底边；`ViewportFill` 的 `bottom` 默认改为 `xl`，和外壳的留白一致。
- 组件库支持服务端渲染（ROADMAP 阶段 12）：样式 `renderStyleTag`、首屏主题 `createUi(...).documentAttrs()`、只在浏览器里画的 `ClientOnly` / `useMounted`。
- Popover、HoverCard、Tooltip 的面板挂载后的下一次渲染才出现（关着时本来看不见）：测试里挂载完立刻找面板的，先 `await nextTick()`。
- `useFullscreen().supported` 挂载前总是 `false`，挂载后才按浏览器判断（全屏按钮挂载后才出现）。
- `useRequest` 一开始就请求时（默认），`loading` 从 `true` 开始，不再先是 `false`。
- LoadingBar 挂载前按空闲画；Gauge、RadarChart、Progress 的 SVG 坐标保留三位小数；日期分段里本地化格式带的窄空格、不换行空格统一成普通空格。
- JSX 展开属性与 `ref` 一起写时两个 ref 都生效（`mergeJsxProps`），之前展开里的 ref 会被覆盖。
- easy-query TS：实体多了 `fields`（声明的形状，值对象 `embed` 是嵌套的），`Row` / `Insert` / `Update` / 表引用改由它推导；`columns` 仍是展开后的列。
  不经 `entity()`、自己拼实体对象的要补上 `fields`。新增 `rightJoin` / `crossJoin`、`db.inSchema`、`sqlConvert`、`fillMany` / `fillOne`、`r.path` / `r.pathOne`、`groupJoin()`、`embed`。

## 一次性准备

1. npm 账号开启 2FA，建一个范围是 `@zerodep-dev`、勾选 Bypass 2FA 的 Granular Access Token，放进用户级环境变量 `NPM_TOKEN`。
2. `~/.npmrc` 写 `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`，不写明文。
3. 组织 `zerodep-dev` 在 npm 上已建好，账号是它的 owner。
4. 两个包都是新包，第一次发布后要经过一两分钟校验才出现在版本列表里；发布中途报 `409 Cannot publish over previously staged version` 说明上传已被接收，等一会儿，不要重发。

## 每次发布

1. **确认版本**：`packages/tsx/package.json`、`packages/ui/package.json` 的 `version` 相同且没发布过（npm 上已发布的版本不能覆盖）。
2. **确认 CI**：要发布的提交在 `master` 上，GitHub Actions 全部通过（check、test、browser、build、consumer）。
3. **本机预检**：

   ```bash
   pnpm install --frozen-lockfile
   pnpm check && pnpm typecheck && pnpm test
   pnpm build
   pnpm test:consumer   # pnpm pack 的包在仓库外的独立应用里安装、类型检查、构建、真实浏览器里运行
   ```

4. **发布**（`-r` 按依赖顺序先发 `tsx` 再发 `ui`）：

   ```bash
   pnpm -r --filter "./packages/*" publish --access public --no-git-checks
   ```

5. **打标签**：`git tag -a v0.1.0 -m "0.1.0"`，`git push origin v0.1.0`；在 GitHub 上用这个标签建 Release。
6. **进入下一个版本**：两个包的 `version` 一起改成下一个版本号，单独提交。

## 使用方怎样装

```bash
pnpm add @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx vue
```

`vite.config.ts` 用 `@zerodep-dev/vue-tsx-pro-tsx/vite` 的预设；`@zerodep-dev/vue-tsx-pro-ui` 的可选依赖（图表、3D、Excel、Shiki、拼音、zod、Pinia、vue-router）
按用到的子路径另装，列在 `packages/ui/package.json` 的 `peerDependencies` 里。组件库缺的能力，使用方的 TSX 文件由同一个预设编译，
直接写在自己的项目里即可，不必等组件库发版。
