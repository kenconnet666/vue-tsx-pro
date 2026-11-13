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

- **Provider / ConfigScope** 只在这一层配置了语言时才往元素上写 `lang`、`dir`；没配置时沿用外层的（宿主页面自己的 `lang` / `dir`
  不再被盖成默认的中文、从左到右）。
- **数字格式**：取整后是 0 的负数不带负号（`-0.4` 保留整数显示 `0`，不是 `-0`）；要保留写 `signDisplay`。
  `format.fileSize` 遇到不是数的值返回占位符，`999,999 B` 显示 `1 MB`。
- **`defineTheme` / `defineLang` / 组件默认值**（`createUi` 与 Provider 的 `components`）：值是 `undefined` 的键不再把外层写好的盖掉
  （同上一版部件属性的规则）；主题里写了不认识的 token 会报错并带上名字。
- **StepsForm**：不在最后一步时，表单的提交（点“下一步”、输入框里按回车）是下一步，不再提交整份表单；这一步没通过时焦点到
  第一个出错的控件上。“下一步”按钮是 `type="submit"`（`propsNext` 的类型里去掉了 `type`）。
- **表头的关键字筛选**（DataTable 列的 `filter: { options: 'text' }`）：停手 300ms 才生效，回车、清空立即生效；服务端筛选时
  不再每敲一个字发一次请求。
- **Steps** `navigable` 时出错的步骤也能点回去。
- **KanbanBoard** 在触屏、触控笔下只能从把手拖，卡片留给手指滚动（之前手机上整个看板滚不动）；鼠标下照旧整张卡片都能拖。
- **CodeEditor**：父级改值时只替换有差别的那一段（光标、滚动位置留在原处），这次替换不进撤销历史。
- **新的属性**：
  - Avatar `decorative`（旁边已经有名字时不让读屏再念一遍头像；UserButton 展开时自动带上）。
  - Listbox `readonly`，Transfer / TreeTransfer 在只读的 Field、Form 里不能移动；ControlGroup 把 Field 的不可用、只读交给组里的控件。
  - Pagination、PaginationBar `disabled`。
  - ModelViewer 的状态多了 `fallback`（没有 WebGL、显示的是 `fallback` 内容时：不转圈、不标忙碌）；环境贴图在模型加载完之后才生成。
  - `themeSettingsCode` 第四个参数 `base`：圆角按基础主题自己的取值缩放，导出的代码与预览一致。
  - 语言包新增 `floatButtonMore`（FloatButton 展开按钮的默认名称）、`copyFailed`（复制失败时播报）；页面组合的文案新增
    `dataImportFailed`。自己写了完整语言包的要补上。
- **DataImport**：`onImport` 失败时在预览里显示原因（之前只进控制台）；换步后焦点跟到这一步的内容上。
- **图表**：柱子、瀑布图不再冲出数值轴的范围；折线、面积图在触屏上点得动下钻；全是负数时对齐轴的上端不再被改成 1；
  漏斗图（没有 svg）不再显示“导出图片”，导出的图片保留镂空、虚线偏移；从右到左的语言里坐标不再镜像；雷达图的轴按数据的最大值
  （不再至少是 1）；`zoomRange` 超出数据时夹回去；时间条图跳过无效的时间；MapChart 没有任何数据时显示 `empty`。
- **浮层与反馈**：LoadingOverlay 一开始加载就拦住点击（遮罩的外观仍然延迟出现）；没有箭头的 Popover 内容过高时在面板里滚，
  不再伸到视口外；嵌套的 ContextMenu 只弹里层的；Toast 超出 `max` 还没显示的通知被关掉后不再留着；模态、Lightbox、Tour
  快速关了再开时不会被上一次迟到的关闭事件关掉；ErrorBoundary 的默认内容是 `role="alert"`；CopyButton 复制失败会播报。
- **输入**：Upload 图片墙里失败、被拒绝的文件都显示原因，只收一个文件时同一批里的坏文件不再把好文件顶掉；ColorPicker 只有改了
  颜色的键才记进最近使用；Rating 不可用时悬停不预览；Carousel 用指针点了翻页按钮后自动播放照常，点“播放”一定恢复；
  Splitter、ResizeHandle 右键按下不再卡在“拖动中”；Descriptions 没有值的项显示占位符。
- **画布与 3D**：Diagram 节点里的输入框能正常打字（空格、回车、方向键不再被画布拿走），按住空格拖动时页面不跟着滚；
  ModelViewer 在“减少动态效果”下拖动也跟手，键盘聚焦看得见焦点环。
- **工具函数**：`usePanZoom` 捏合后单指继续拖不再跳回、滚轮按行滚动的鼠标换算成像素；`useInfiniteList` 滚动加载不再清掉等待中的
  防抖刷新；`useHistory` 截断重做段后保存点正确；`useHotkeys` 在非拉丁键盘布局下不串键；`useRequest` 命中缓存时清掉上一次的错误；
  `useAutosave` 保存中再改不并发保存；`http` 读响应体也受超时管，调用方写的请求头大小写不同也能覆盖默认的。
- **无障碍与样式**：Windows 高对比（强制颜色）下日历选中的日期、区间与表格选中、正在看的行看得出来；AppShell 进入、退出全屏后焦点
  跟到对应的按钮上；SchemaForm 的明细添加行后焦点到新行、删行后到相邻的行；QRCode 加载中读屏念得到；ActionBar 吸底时让开手机
  底部的安全区；SlideCaptcha 的结果条跟主题的状态色走；CodeBlock 的复制按钮不再压住第一行代码；FloatButton 展开按钮默认有名称。
- 其余修正：QueryTable 加载失败且没有行时表格里写“加载失败”；Countdown 的 `to` 从过去改到将来立即更新；Avatar 的缩写不再取到
  半个字符；xlsx 没写小数位的数字列整数不再显示成 `1,234.`；英文语言包 1 条时是 `1 item`；代码高亮、示例源码下载失败后下次再试；
  主题定制的对比度检查读不到颜色时不再显示“全部通过”；实色底上的文字色在白、深灰都不够对比度时用纯黑。

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
