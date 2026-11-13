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

- **部件属性的合并规则**（`mergeProps` / `mergeAttrs` / `mergePartProps`，所有组件的 `...rest` 与 `propsXxx` 都经过它）：
  - 值是 `undefined` 的属性不再盖掉前面几层的：组件没有值可给时（没有错误时的 `title`、不在 Field 里时的 `aria-describedby`），
    你写的照常落到元素上；`propsIcon={{ size: undefined }}` 这样的写法保留组件的默认值。确实要去掉默认值写 `null`。
  - `aria-describedby` 各层拼在一起：控件在 Field 里时，你自己写的提示与 Field 的说明、错误都念得到。
  - 嵌套的部件属性（`propsTag={{ propsRemove: … }}`）与组件给这个子部件的默认合并，不再整个替换。
  - 展开的属性与显式写的属性都有同名事件（`<Menu {...propsMenu} onOpenChange={…}>`）时两个都调用，不再报错。
- **NumberField** 的 `format={{ style: 'percent' }}` 编辑时输入的是百分数：显示 `85%`，输入 `90` 得到 `90%`（值是 `0.9`）。
  之前聚焦后显示 `0.85`，输入 `90` 会被夹成 `100%`。
- **TableHeaderCell** 在表体、表尾里默认 `scope="row"`（之前都是 `col`）；要列标题时写 `scope="col"`。
- **Link** `external` 的 `target`、`rel` 是默认值，可以改（`rel="noopener noreferrer nofollow"`），同 LinkButton。
- **Upload** 不可用时“重试”也不可用；**Listbox**（连带 Transfer）不可用时点选项不再改值；**TagsInput** 只读时粘贴不再加标签，
  从建议里选的也受 `max` 限制；不可用的日期输入框按 Enter 不再提交表单。
- **Popconfirm**：`onConfirm` 还在进行时被 Esc、点外面关掉，不再触发 `onCancel`（没确认成才触发）。
- **DatePicker** 的“今天”和当前值同一种类型写回（绑定 `CalendarDate` 时不再变成字符串）；**DateRangePicker** 清空后父级再给值、
  再清空，输入框都跟着，表单重置时半截输入也清掉。
- **TreeDataTable**：开了表头筛选后行不再串（展开、勾选落在对的行上）；`multiSort` 生效。
- **useForm**：单字段校验的接口出错时清掉上一个值留下的错误、不挡提交；提交等校验期间值又改了，按最新的值再校验。
- **QueryTable**：`propsTable` 里的 `resizable`、`columnMenu` 等生效，新增 `propsColumnSettings`；只改了固定、列宽时“重置”可用。
- **Field**：控件自己写了 `id` 时，标签的 `for` 与错误汇总的链接跟着指过去。
- **Rating** 只读时名称里总有分数（自己的 `aria-label` 或 Field 的标签后面接上“4 星，满分 5 星”）。
- **新的部件属性**：NavBar 的 `propsItem` / `propsLink` / `propsTrigger` / `propsMore`，QuarterCalendar 的 `propsHeader` / `propsHeading` /
  `propsGrid` / `propsCell` / `propsCellButton`，DataTable 的 `propsFilterButton` / `propsColumnMenuButton`，ImageCropper 的 `propsImage`
  （图片默认 `crossorigin="anonymous"`），ColumnSettings 的 `changed`；Upload 的 `propsItem`、`propsIcon` 在图片墙里也生效。
- **类型更严**：组件自己管理的属性从部件属性的类型里去掉了（Splitter、Carousel、Ellipsis、Sortable、ConditionBuilder、
  FormErrorSummary、CommandPalette 的 `propsInput`、DataTable、Tab、NavItem、LoadingBar、Marquee）。之前写了不报错、
  运行时被丢掉，现在类型检查会指出来。AlertDialog / `useConfirm` 的类型去掉了没有效果的 `draggable`。
- 其余修正：Splitter 收起开始那一栏时布局正确；FloatButton 的 `badge={false}` 照常固定在角落；CSV 导出对没登记的状态值、
  数字与日期列里的字符串同样防公式；`pivot` 的 `avg` / `min` / `max` 认十进制字符串；MenuSub 的 `description` 照常显示；
  PaginationBar 的 `size` 也作用于每页条数的下拉，页码的 `onClick` 里 `preventDefault` 可以拦下换页；图片在监听接上之前就加载好
  （服务端渲染后水合）时照常显示；Textarea 宽度变了重新算高度；输入法组合中的 Enter、Esc 不再提交或取消表格的单元格编辑；
  LoadingBar、Breadcrumbs、Checklist、VirtualList（`scroll="window"` 的服务端渲染）的几处边界情况。

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
