# 发布

`node scripts/release.mjs <版本>` 打标签，CI 带 provenance 发布到 npm（下面“每次发布”）。
发布的四个包都在 npm 组织 `zerodep-dev` 下（和 query 的包同一个组织，npm 上没有 `@vue-tsx-pro` 这个范围），版本号一起走：

| 包                                | 内容                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/vue-tsx-pro-tsx`    | TSX 编译器（符文、组件边界）、运行时样式引擎、Vite 预设；`dist` 与 `types`                                          |
| `@zerodep-dev/vue-tsx-pro-ui`     | 组件库与各子路径（`/diagram`、`/charts`、`/patterns`、`/three`…），编译好的 JS；依赖 `@zerodep-dev/vue-tsx-pro-tsx` |
| `@zerodep-dev/vue-tsx-pro-mobile` | 移动端组件库（H5 为主）与子路径 `/area`，编译好的 JS；依赖 `@zerodep-dev/vue-tsx-pro-tsx`                           |
| `@zerodep-dev/vue-tsx-pro-mini`   | 小程序运行时、构建（`/build`）、测试工具（`/testing`）、命令 `vtp-mini` 与新项目模板（`template`）；`tsx` 是 peer   |

`ui`、`mobile`、`mini` 对 `tsx` 的依赖写成 `workspace:^`，`pnpm publish` 发布时换成实际版本号，所以必须用 pnpm 发布，不能用 `npm publish`。

## 下一版对使用方的变化

发版时 `release.mjs` 把下面的条目搬进 CHANGELOG.md（也是 GitHub Release 的说明）。组件库照样能在不做服务端渲染的普通 Vue 项目里用，下面是能察觉到的行为变化：

- **服务端渲染后存的状态、媒体查询生效**：`usePersistentState`（QueryTable 的列设置、自己存的布局）与 `useMediaQuery`
  （连带 `usePrefersDark`、`useReducedMotion`、AppShell 的宽屏判断）水合时先按服务端的值渲染，挂载后换成真实的。
  之前直接用存的值渲染，和服务端的节点对不上，存的状态刷新后反而显示不出来（生产构建里不报错）。不做服务端渲染的项目没有变化。
  新增 `isHydrating()`（在 setup 里判断这个组件是不是正在水合）。
- **`sameValue`**：`Map` 逐项比、`Set` 比成员。之前任何两个 `Map` / `Set` 都被当成相等（表单看不出改过、`useRequest` 的参数变了不重新请求）。
- **`tableToXlsx` / `exportXlsx`**：`Date` 实例、带时区的 ISO 字符串按 `timeZone`（新选项，默认浏览器的时区）的墙上时间写进表格，
  和页面上看到的一致；之前按 UTC 写，东八区零点的日期会差一天。不带时区的日期照字面写，没有变化。
- **TagsInput** 允许自己输入（默认）时，打字不再自动高亮第一条建议：回车加的是打的字，要选建议按 ↓ 再回车。
  `allowCustomValue={false}` 时照旧高亮第一条。
- **触屏**：NavList 紧凑时的分组点图标弹出子项（之前只能悬停、键盘聚焦，触屏上子项到不了）；ContextMenu 按住 700ms 打开
  （iOS 的 Safari 长按不发 `contextmenu`）；Splitter、ResizeHandle 能按到的范围扩到 24px 以上（布局不变）。
- **新的属性**：Switch 的 `description` / `propsDescription`（同 Checkbox、Radio）；ColumnTable 的 `empty`（没有行时表体里一行，
  默认“暂无数据”，之前只剩表头）；CodeEditor 实例的 `setReadonly`。页面组合的文案新增 `notificationsNoMatch`。
- **只读、不可用的表单里**：ConditionBuilder 增删条件的按钮不可用；CodeEditor 不能改（`readonly` 之后再变也跟着）；
  Autocomplete 不可用时隐藏的 input 不随原生表单提交。
- **NotificationList** 有通知、只是筛选后一条都没有时显示“没有符合条件的通知”，不再说“没有通知”；**NavBar** 收进下拉、
  “更多”菜单的项也带徽标。
- **Diagram** `fitView`：用缩放按钮、小地图动过视口之后，尺寸变化不再把视口重新适应回去（之前只认拖动、滚轮、键盘）；
  卸载时结束进行中的拖动。

## 每次发布

只有一条线：每批改动在 master 上 CI 全部通过后就发一版，使用方一律用最新版；没有补丁分支，也不来回改版本号。

1. **写变化**：这一版对使用方能察觉的变化写进上面的“下一版对使用方的变化”（破坏性改动写清怎么改）。
2. **发版**：推送后直接 `node scripts/release.mjs <版本> --wait`。它先确认在 master、工作区干净、与 origin 一致，再等 HEAD 的 CI 里把关的任务
   全部通过（只报告的截图比对 `visual` 不等；有一个失败就停），
   再把四个包的 `version` 改成这个版本、把上面那一节搬进 [CHANGELOG.md](CHANGELOG.md)（原处清回“（暂无）”），提交 `chore(release): <版本>`，
   打标签 `v<版本>` 并推送。
3. **发布**由标签触发的 `.github/workflows/release.yml` 完成：核对版本号，`pnpm test:consumer`（`pnpm pack` 的包在仓库外的独立应用里安装、
   类型检查、构建、真实浏览器里运行），带 provenance 发布四个包（`-r` 按依赖顺序先发 `tsx`；各包的 `prepack` 重新构建），用 CHANGELOG
   这一节建 GitHub Release。令牌是 `release` 环境（只允许 master 分支与 `v*` 标签）的 secret `NPM_TOKEN`。
4. **之后**：npm 上新版本要经过几分钟校验才出现在版本列表里（这期间显示 `0.0.0-stage`）；能装了以后把 easy-query-ts 文档站升到这一版，
   两个文档站都到线上核对。

## 一次性准备（已做好）

1. npm 账号开启 2FA，建一个范围是 `@zerodep-dev`、勾选 Bypass 2FA 的 Granular Access Token：放进 GitHub 仓库 `release` 环境的
   secret `NPM_TOKEN`（CI 发布用），本机也放进用户级环境变量 `NPM_TOKEN`、`~/.npmrc` 写 `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`（手动发布用）。
2. 组织 `zerodep-dev` 在 npm 上已建好，账号是它的 owner。

## 手动发布（CI 发布出问题时）

在打了标签的提交上（必须用 pnpm 发布，见开头）：

```bash
pnpm install --frozen-lockfile && pnpm build && pnpm test:consumer
pnpm -r --filter "./packages/tsx" --filter "./packages/ui" --filter "./packages/mobile" --filter "./packages/mini" publish --access public --no-git-checks
```

发布中途报 `409 Cannot publish over previously staged version` 说明上传已被接收，等一会儿，不要重发。

## 使用方怎样装

```bash
pnpm add @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx vue
```

`vite.config.ts` 用 `@zerodep-dev/vue-tsx-pro-tsx/vite` 的预设；`@zerodep-dev/vue-tsx-pro-ui` 的可选依赖（图表、3D、Excel、Shiki、拼音、zod、Pinia、vue-router）
按用到的子路径另装，列在 `packages/ui/package.json` 的 `peerDependencies` 里。组件库缺的能力，使用方的 TSX 文件由同一个预设编译，
直接写在自己的项目里即可，不必等组件库发版。

移动端：

```bash
npx @zerodep-dev/vue-tsx-pro-mini create my-app   # H5 加两端小程序的新项目
# 或在已有项目里
pnpm add @zerodep-dev/vue-tsx-pro-mobile @zerodep-dev/vue-tsx-pro-tsx vue @lucide/icons
pnpm add -D @zerodep-dev/vue-tsx-pro-mini
```

小程序工程由 `vtp-mini build` 按 `mini.config.ts` 出到 `dist/wx`、`dist/my`，见 `packages/mini/README.md`。
