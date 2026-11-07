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

- 新组件 ErrorBoundary：一块内容出错时只把这一块换成出错提示，可以重试、`resetKeys` 变了自动恢复；语言包加了 `errorTitle`、`errorRetry`。
- 部件（带 `data-part` 的元素）一律 `box-sizing: border-box`：使用方给部件写的宽高就是整个部件的宽高。以前没设的组件（如 Listbox 的根）
  写 `height` 时实际高度会少算内边距，现在按写的高度。
- 条件别名 `_hover`、`_active` 在不可用（`disabled`、`aria-disabled="true"`、`data-disabled`）时不算：不可用的项不再有悬停、按下的反馈。
- 键盘焦点的样式（`_focusVisible`、`_focusWithin`）排在悬停之后，鼠标停在已聚焦的元素上时不再盖掉焦点样式。
- 日期输入（DateField、DateRangePicker）点后面的段，焦点就在那一段（以前会被拉回第一段）；输入框外壳只在点到空白处时才转交焦点。
- CodeBlock 的展开按钮焦点环画在里面，不再被外框裁掉。
- 内容安全策略：`createUi({ nonce })` 或 Vite 的 `html.cspNonce` 让样式引擎的 `<style>` 带上 nonce；服务端渲染用 `renderStyleTag(html, { nonce })`。
- 样式引擎新增 `css.globalRule`：登记放在最前面级联层（`vtp.base`）的基础规则。
- 服务端渲染：RelativeTime、Countdown 把渲染时的“现在”写在根元素的 `data-now` 上，水合时先按它渲染、挂载后再换成此刻，
  隔了几天打开静态页面不再报水合不匹配（“16天前”与“17天前”）；服务端不再起计时器。自己用 `useNow` 做的计时组件，
  根元素写上新导出的 `nowAttrs(now.value)` 得到同样的效果。
- CommentThread、NotificationCenter 的时间改用 RelativeTime：随时间自动更新，悬停显示完整的日期时间。
- ProportionBar 的图例从起始边依次排开（以前两端对齐）。
- Grid、GridList 新增 `balanced`（和 `minItemWidth` 一起用）：按项数取列数，最后一行最多空一格，4 项不排成 3 + 1。
  `provideGridColumns` 的返回值改成 `{ ref, columns }`（以前直接是 ref）。
- FilterBar 重排：第一排是 `start`、条件与全部按钮（展开、重置、查询，再隔一条竖线是 `end`），按钮在结束边；按剩下的宽度
  量出放得下几个条件，这几个铺满第一排，放不下的与展开的条件从第二排起排成整行的栅格。`minFieldWidth` 默认改成 14em；
  新增部件属性 `propsBody`、`propsRow`；`propsMore` 现在是第二排起那个栅格。QueryTable 的标题与工具栏按钮并进查询栏第一排，
  所有按钮在同一排。
- 单选、复选的卡片外观：RadioGroup、CheckboxGroup（以及单个 Radio、Checkbox）加 `card`，每项是一张卡片、整块可点，
  选中时边框与底色换成色调色；横排时按 `minItemWidth`（默认 14em）分列。Radio、Checkbox 加 `end`（结束边：价格、标记）与 `propsEnd`，
  勾选类的配方多一个 `end` 部件。
- 可选中的 Tag：写了 `_selected` 时整个标签是按钮（`aria-pressed`），点一下切换；没选中时有描边，选中时实底色加对勾，
  不写色调时用 accent、字号默认 sm。筛选条件的一排标签用它。
- ItemListItem 整条可点：`href`（标题是 Link，走路由适配）或 `onSelect`（标题是 ButtonBase），标题伸展盖住整条，结束边的操作叠在上面照常可点；
  `selected` 是正在看的一条（选中色、aria-current），`disabled` 变淡点不了；`propsLink`、`propsButton` 转发给标题的链接、按钮。
- 界面里的链接默认悬停才有下划线：ItemList、Card 的页头、Stat、StatGroup、Timeline、Descriptions、Checklist 里的 Link
  不写 `underline` 时是 hover（新导出 `LinkUnderlineScope`、`LinkUnderlineContext` 给自己的容器用）；正文里的照旧带下划线。
  Upload 的文件名、CommentThread 的附件链接同样悬停才有下划线。
- Upload：父级放进 value 的“已选择”文件（带 `file`）在给了 `upload` 时也马上开始上传（拖到页面别处、恢复的草稿）。
- ScrollArea 的根、视口、内容层、滚动条、滑块带上部件标记（`data-scope="scroll-area"`），一样 border-box：Tree、Listbox
  这类以视口为主体、带内边距的组件，写的高度（`maxHeight`）就是整块的高度。Tree 写 `maxHeight` 时节点少按内容高、多了才滚动。
- Listbox 的根带上部件标记（`data-scope="listbox" data-part="root"`），和别的部件一样 border-box：写的高度就是整个列表的高度。
- 静态 Table 新增 `stickyHeader`（外层限高、竖向滚动时表头吸顶），TableHeaderCell、TableCell 新增 `sticky`（第一列固定在起始边）。
- Sparkline 的柱（`type="bar"`）在 `showLast` 时最新的一根实色、前面的淡下去。**破坏性**：删掉已废弃的 `variant` 属性与
  `SparklineVariants` 类型，改用 `type` 与 `SparklineTypes`。

## 每次发布

只有一条线：每批改动在 master 上 CI 全部通过后就发一版，使用方一律用最新版；没有补丁分支，也不来回改版本号。

1. **写变化**：这一版对使用方能察觉的变化写进上面的“下一版对使用方的变化”（破坏性改动写清怎么改）。
2. **发版**：`node scripts/release.mjs <版本>`。它先确认在 master、工作区干净、与 origin 一致、HEAD 的 CI 全部通过，
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
