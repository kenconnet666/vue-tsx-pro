# 更新记录

每一版对使用方的变化。发版时由 `node scripts/release.mjs` 从 [RELEASE.md](RELEASE.md) 的“下一版对使用方的变化”搬过来；
0.11.0 及更早的版本见 [GitHub Releases](https://github.com/kenconnet666/vue-tsx-pro/releases)。

## 0.12.0（2026-11-07）

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
- 选文件夹：FileDrop、Upload 加 `directory`，对话框里选整个文件夹（webkitdirectory），拖进来的文件夹递归读出里面的文件，
  补上 `webkitRelativePath`；Upload 的列表显示相对路径，隐含多选。
- 新组件 FloatButton、FloatButtonGroup：页面角落的常驻操作（客服、反馈、新建），圆形按钮、悬停提示名称、`badge` 角标；
  单个固定在视口的结束边底角（留出安全区），一组时竖排在一起；FloatButtonGroup 给了 `icon` 是速拨（主按钮展开、收起其余按钮，
  `_open` 双向，Esc 或点外面收起）。BackTop 现在是一个 FloatButton：悬停有提示，可以放进 FloatButtonGroup（没出现时不占位），
  位置同样留出安全区；`backTopStyles.root` 换成 `fade`（单独用时的淡入淡出）。
- 新组件 QRCode：自带编码器（ISO/IEC 18004，UTF-8 字节模式、四档纠错、自动选版本与掩码），输出一条 path 的 SVG；`logo`
  放在中间（此时纠错默认 H）、`size`、`margin`（静区）、`color`、`bgColor`；`status` 有 loading、expired（`onRefresh` 刷新）、
  scanned，状态层是 role="status"。颜色跟主题，深色主题下仍是白底深色模块。也导出 `encodeQr` 拿到矩阵。
  语言包加了 `qrCode`、`qrExpired`、`qrRefresh`、`qrScanned`。
- 新组件 SignaturePad（手写签名）：canvas 上用鼠标、笔、手指写，笔画随速度粗细，撤销上一笔、清空；`_value` 是透明底的 PNG
  （data URL），`name` 随表单提交；外框同输入框（认 Field 的出错、不可用、只读），只读时显示已签的图；`handle` 拿到 `toPng`、
  `toSvg`、`undo`、`clear`；`penColor`、`minWidth`、`maxWidth`、`height`。语言包加了 `signature` 等六条。
- 二维码与签名的颜色是“纸面”（新导出 `paperStyles`、`paperInk`、`paperBackground`）：浅色主题下跟主题，深色主题下仍是白底深色。
- 新组件 JsonViewer：接口返回、日志、配置的键值树，建在 Tree 上（虚拟滚动、树的键盘、搜索过滤）；值按类型着色（代码高亮的 token），
  bigint、Decimal 照实显示，Date 显示 ISO，Map、Set 可以展开，循环引用显示 [Circular]；`expandDepth`、`maxHeight`、`toolbar`
  （搜索与全部展开 / 收起）；选中一项后路径栏可复制路径（`$.items[0]["unit-price"]`）与值。语言包加了 `jsonItems` 等七条。
- 新子路径 `@zerodep-dev/vue-tsx-pro-ui/area`：全国省市区（与移动端 `/area` 同一份数据）。`areaTree({ depth })` 是三级
  （或两级、一级）的 `{ code, name, children }` 树，`{...areaAccessors}` 直接交给 Cascader、TreeSelect，`areaName`、`areaNames`
  把代码换回名称。约 100 KB，用不到的应用不打包。
- 新增 `useInfiniteList`（滚动加载）：一页页取、接在后面，按 `key` 去重，记住还有没有下一页；`onRangeChange` 直接交给
  VirtualList、DataTable，离末尾不到 `threshold` 项时取下一页；`params` 变了或 `refresh()` 从第一页重来，失败时停下等重试。
  新组件 InfiniteListStatus 放在列表下方：失败时显示原因与“重试”，取完了显示“没有更多了”；语言包加了 `listNoMore`。
- 远程选项可以分页：Select、Combobox、Mentions 的 `load` 多了第三个参数（第几页，从 1 开始），返回 `{ items, next }` 时
  滚到列表末尾取下一页，已有的选项留着、骨架接在后面，重复的值只留一个。ListboxView 的 `loading` 可以是 `'more'`（骨架接在末尾），
  新增 `onRangeChange`。TreeSelect 的 `load` 只收数组。
- Dialog 加 `draggable`：按住标题栏拖动（标题栏上的按钮照常点），不超出窗口，每次打开回到正中；位移用 `translate`。
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

## 0.11.2（2026-11-07）

- Calendar、DatePicker 的月份、年份视图里用指针点一格，逐级回到日期视图时焦点仍是原来那天（以前会变成那个月的 1 日、那年的 1 月；键盘一直是对的）。
- DataTable 的勾选列、单选列不再把表头和各行撑高（以前有勾选列的表头约高 5px），勾选框在格子里上下居中。
  部件 `selectAll`、`selectCheckbox`、`selectRadio` 的样式与 `data-part` 改加在 Checkbox / Radio 的外层 label 上（以前在里面的 input 上）；
  按 `input[data-part="selectCheckbox"]` 写的选择器要改成 `label[data-part="selectCheckbox"] input`。

## 0.11.1（2026-11-07）

- Checkbox、Radio、Switch（以及表格里的勾选列）的方框、圆、开关轨道按外层文字的字号算：以前原生 input 没继承字体，
  按浏览器的 13.333px 算，和文字、开关滑块的比例对不上，`size` 档位越大差得越多。
- ColorField 的取色器、OtpField 的输入框同样改为继承字体（外观不变）。
