# 样式体系联合改造计划：架构、整理、API、美学（2026-11-06）

依据：`.claude/reports/style-merge-performance.md`（性能对比与原型）与三份只读调研：组件的样式写法与重复、外观与定制 API 的一致性、
视觉审查（亮暗主题 64 张截图，在 `node_modules/.cache/docs-shots`）。各节的数字来自这些调研，正则统计的是量级。
状态：2026-11-06 批准，无人值守按阶段执行（决定见 §10）；写代码的工作全部在主线程里做。
总原则：维护好基础设施与基础组件，上层组件一律依赖它们构建；上层需要的能力先在基础层补齐再用，不写平行实现。

## 1. 一起做的原则

四件事放在一个计划里，但**按"会不会改外观"排顺序**，每个阶段单独落到 master：

| 阶段 | 内容 | 预期外观变化 | 验收 |
| ---- | ---- | ------------ | ---- |
| 0 护栏 | 合入性能原型；全站示例截图基线；样式的"有效声明"快照测试 | 无 | CI 绿 |
| 1 引擎 | 分段输出 + `@layer`（含 SSR、热更新、绑定、小程序、测试工具） | **0 像素** | 截图逐像素无差异 |
| 2 架构与 API | 组件配置合一、组件侧一个钩子、属性合并一遍完成、补齐配方 | **0 像素** | 同上 |
| 3 整理 | 共用片段收拢、裸值换 token、命名与导出统一、删死代码 | 0（个别有意的改动单列） | 同上，差异逐张解释 |
| 4 美学 | 先 token 与主题，再组件级修正 | 有意的变化 | 联系表逐页过目、对比度检查 |
| 5 文档与发布 | 指南、规范、迁移说明、版本 | — | — |

理由：前三个阶段承诺外观不变，截图对比"差异为 0"就是最强的回归检查；美学放最后，它的每一处差异都是有意的，
不会和重构的副作用混在一起。架构与 API 先于整理：整理时直接按新 API 写，不改两遍。

## 2. 阶段 0：护栏

1. 合入 `exp/style-merge-opt` 的原型与基准（`scripts/docs/style-merge.mjs`）、性能报告。
2. **截图基线**：`scripts/docs/shots-batch.mjs` 现在只截固定的 22 页；扩成全部组件页（445 个示例 × 亮暗约 900 张，
   可以复用 `docs:review` 的逐示例截图），存成 `before`；之后每个阶段 `shots-compare.mjs before after`。
   这是 ROADMAP 8.3（视觉回归进 CI）的本地版，先用起来；容器化进 CI 可以在阶段 4 之前做，美学阶段的基线以它为准。
3. **有效声明快照**：给几十个代表性组件（每类挑几个，覆盖档位、状态、定制层、sx）记下"每个状态下元素得到的声明"，
   由引擎自己的模型算（不读 CSSOM），阶段 1、2 的改动必须让它逐字不变。比截图更细，跑在单元测试里。

## 3. 阶段 1：引擎

**分段输出**（按合并来源，每段一个类，段数不限）：

- 段的边界：`mergeProps` 的三层（组件默认、使用方、受管）各是一段；配方的结果按扩展层分段（组件自己、`createUi`、每层 `Provider`）。
  同一段里的片段照旧在 JS 里合并成一个类；空段不出类，不做定制的元素仍是一个类。
- 段 k 的规则进子层 `vtp.s{k}`：样式表开头声明 `@layer vtp.vars, vtp.s0, …, vtp.s7;`（上限 8 段，超出的合进最后一段）。
  变量组、主题类、标记进 `vtp.vars`。宿主不分层的 CSS 不论特异性都盖过组件库（已确认可以接受）。
- 语义不变：后段输出它改到的属性族（属性 + 有简写 / 长属性关系的属性）在前面所有段合并后的完整结果。
  依赖关系记下来：前段的片段热更新时，带入过它的后段一起改写。
- 顶层 `null`（去掉属性）在后段输出 `unset`。

**跟着改的部分**：

| 模块 | 改动 |
| ---- | ---- |
| `compose.ts` / `fragment.ts` | 组合缓存按段；返回多个类；"类 ← 片段"与带入的依赖 |
| `sheet.ts` | 层顺序声明；`renderStyleTag` 先写顺序声明；接管服务端样式表时识别层 |
| `bindings.ts` | 绑定只重算所在的段（与依赖它的后段），`classList.replace` 换那几个类 |
| `hot.ts` | 按段改写，连带带入过的后段 |
| `inline.ts` + `packages/mini` | 小程序按类的顺序拼各段的行内样式；app 样式表剥掉 `@layer` |
| 测试工具 | happy-dom 21 不认 `@layer`（语句和块都插不进）：`styleOf` 改成从引擎的模型取（同 inline.ts 的展开），不读 CSSOM；引擎在不支持 `@layer` 的环境里插不带层的规则 |
| 浏览器下限 | `@layer` 要 Chrome 99 / Safari 15.4，低于已在用的 `:has`、`color-mix`，不新增要求 |
| `packages/mobile` | 它有自己的 `mergeProps`（独立实现，按既定决定不从 ui 抽公共部分），三层同样要按段交给引擎 |

验收：截图 0 差异；有效声明快照不变；`style-merge.mjs` 的 explode 场景规则数、字节数下降一个数量级；水合检查、小程序构建通过。

## 4. 阶段 2：架构与 API

### 4.1 组件配置合一：一个组件一个入口

现在给全局 Button 换风格要分别写 `defaults`（浅合并）和 `styles`（追加数组）两处；`ComponentDefaults`、`ComponentStyles` 是手工维护的两张表，
`UiOptions`、`ProviderProps`、`UiConfig`、`context.ts` 四处同步。已经出了错位：`useDefaults('Tabs')` 对 `name: 'Tab'`，
TabList、TabPanel 和指示条没有定制入口，`recipe.name as keyof ComponentStyles` 的强转让写错的名字静默失效。

改成一个入口（参考 MUI 的 `components.MuiButton.{defaultProps, styleOverrides, variants}`、Chakra v3 的 slot recipe）：

```ts
createUi({
  components: {
    Button: {
      defaults: { variant: 'outline', radius: 'full' },   // 档位的默认值（原 defaults）
      styles: { root: { letterSpacing: '.02em' }, icon: { … } },   // 追加在组件样式之后（原 styles.base）
      variants: { variant: { outline: { root: { borderStyle: 'dashed' } } } },   // 键受档位类型约束
    },
  },
});
```

- `<Provider components>` 同形；每一层定制在阶段 1 的分段里正好是一段。
- 登记表由脚本生成（同 `pnpm exports`）：扫描 `css.recipe({ name })`，生成 `UiComponents` 接口（档位类型取 `XxxVariants` / `XxxOptions`，部件取 `XxxPart`），
  `components` 的键、`variants` 的档位与取值都有类型检查，不再手写登记、不再强转。
- `defaults`、`styles` 两个旧选项保留一个版本、打废弃提示，迁移说明里给出一一对应。

### 4.2 组件侧一个钩子

Button、输入框、勾选、标记四个家族各有一套 `useXAppearance` + `xParts` / `xSx` + `XOptions` + `XPart` + `xRecipe`，
默认值散在配方的 `defaults`、`useDefaults` 的 fallback、解构默认值和 `@default` 四处。合成：

```ts
const ui = useComponent(buttonRecipe, () => ({ variant, tone, size, radius }));   // 名字取自配方
return () => {
  const { parts, options } = ui();   // options：合并后的档位；parts：每个部件的默认层（样式 + data-scope / data-part）
  return <button {...mergeAttrs<'button'>(parts.root, rest, behavior())}>…</button>;
};
```

- 默认值只写在配方的 `defaults` 一处（`@default` 注释由脚本对照检查）。
- **size、radius、tone 进配方的档位**：现在它们排在配方之后（`buttonSx` 里 `recipe().root.sx` 后面跟 `radiusStyles[radius]`、`fontSizeStyles[size]`），
  所以 `styles.Button` 改的圆角会被 `radius` 默认值盖掉。共用的档位做成可组合的配方片段（`sizeVariants`、`radiusVariants`、`toneVariants`），
  每个配方引用，定制顺序才名副其实。
- `mergeAttrs` 一遍合出元素属性（不再经 `elementProps` 复制第二遍），三层按段交给引擎；样式数组按档位记住，命中缓存时跳过 `css.attrs`。

### 4.3 部件补齐

- 每个内部节点都是部件（COMPONENTS.md §2.1 的承诺）：由配方的 `parts` 统一产生 `propsXxx` 的类型约束和 `data-part`。
  现在 212 个组件文件里 44 个核心组件一个 `propsXxx` 都没有；Button 的配方只有 `root`，内容、图标、加载指示没有 `data-part`，`styles` 也改不到；
  Input 的配方部件与 `propsXxx` 对不上（`affix` 对 `propsPrefix` / `propsSuffix`，`button` 对四个按钮）。
- `data-scope` 用实际组件名（Tag 不再是 `badge`、Select 不再是 `input`），定制仍按家族（`components.Badge` 作用于 Badge、Tag），可以再按组件细分。
- 配方覆盖面：有外观选项却没有登记的组件约 33 个（Text、Heading、Banner、Toast、Menu、Pagination、Steps、Slider、Container…），逐个改成配方。

### 4.4 外观词表统一（API 改名，进迁移说明）

| 问题 | 现在 | 改成 |
| ---- | ---- | ---- |
| 语义色 | UI 叫 `tone`，图表叫 `color`；`Tone`（8 值，含 muted、inherit）与 `StatusTone`（6 值）混用；Result 4 值、Menu 项 2 值 | 状态色统一 `tone: StatusTone`；文字的弱化另用 `muted` 布尔或 `color` 档位；图表 `color` 只收色板与任意色 |
| `variant` 被挪作他用 | Skeleton 的形状、Sparkline 的图类型、TimelineChart、marks | 改成 `shape`、`type` 等，`variant` 只表示外观词表里的变体 |
| `size` 三种意思 | 字号档；Container / Dialog / Drawer 的宽度；StatusDot、ProportionBar 两档 | 宽度改 `width`（档位或长度）；`size` 只表示字号档（§3） |
| 密度 | `density`（表格三档）、`compact`（NavList 布尔）、ItemList 两档 | 统一 `density`，取值同一套 |
| 方向、位置 | 12 个各自的 `*Orientations`，默认值不一；`placement` 与 `side` 并存 | 共用一个 `Orientation`、一个 `Placement` |
| 状态码当外观 | Result 的 `status: '403' \| '404' \| '500'` | `status` 只表示状态，插图另给 `illustration` |

这一节与 ROADMAP 8.5（1.0 前的 API 审计）合并做；改名保留一个版本的旧名与废弃提示。

### 4.5 引擎公开 API 收口

- 编译器专用的 `hotStyles`、`bind`、`select` 与小程序专用的 `inlineStyle`、`ConditionMatcher` 挪到内部子路径（`/styles/internal`），
  编译产物与 `packages/mini` 改从那里导入；`defineTokens` 留在公开入口，但注释标明"主题库用"。
- 去重与改名：`StyleAttrs` / `Attrs` 两份同样的接口合一；tsx 的 `Theme<Group>`（只改变量的类）改名 `VarTheme`，不再与 ui 的 `Theme` 重名；
  配方的 `compound: [{ when }]` 改 `match`，与 `css.when.*`（关系选择器）分开；配方的 `name` 不再覆盖函数自带的 `name`（改 `recipe.component`）。
- ui 主入口不再导出合并的内部件：`mergeDefaults`、`mergeStyles`、`StyleLayers`、`PartLayer`、`partAttrs`、`buttonSx`、`controlParts`、`useXAppearance` 等
  （COMPONENTS.md §2.5 的"工具都导出"只针对使用方定制要用的；这些被新 API 取代）。

## 5. 阶段 3：整理

承诺外观不变；个别有意的改动（只在强制颜色、从右到左时才看得出的）单列、逐张解释截图差异。

### 5.1 重复的片段收进共用件（`utils/style`，或做成可组合的配方片段）

| 片段 | 现状 | 收成 |
| ---- | ---- | ---- |
| 可按下元素的基础（去默认外观 + 颜色过渡 + 焦点环 + 波纹） | ButtonBase、`buttonSx`、CalendarView、CalendarBoard、Menu 项各拼一遍 | 一个 `pressable` 片段 |
| 不可用 | `opacity: '_disabled'` 手写 13 处、`cursor: not-allowed` 12 处；禁用时靠写 `transparent` 盖掉 `:hover` | 一个 `disabledStyles`，悬停统一用“排除禁用”的条件（同 Button 的 `HOVER`） |
| 悬停与行状态 | `{ default: 'transparent', ':hover': '_fillHover' }` 手写约 15 处；`itemStyles` 只有 6 个组件用 | 扩充 `itemStyles` |
| 过渡 | 手写模板字符串约 44 处，`interactionTransitions` 只用 9 次 | 补齐 `interactionTransitions` 的几种组合 |
| 展开箭头的旋转 | 10 个组件各写一份（有的 `transform`、有的 `rotate`） | `disclosureStyles.chevron` |
| 截断、等宽数字 | 截断手写 14 处、等宽数字 24 处；`textStyles.truncate`、`numeric` 几乎没用 | 用现成的 |
| 最小点击高度 | `max(control, minTarget)` 手写 17 处 | 一个片段（阶段 4 的 S3 改高度时只改一处） |
| 焦点环 | 手写约 8 处（Diagram 与 `tight` 完全相同），缺内描边变体 | 补 `inset` 变体，手写的换掉 |
| 强制颜色、减少动态效果 | `_forcedColors` 只在 5 个组件里；Checkbox、Switch、Slider、Tabs 没处理；Rating、OtpField 手写 media | 共用片段，交互控件补上（只在强制颜色下可见的改动，单列） |
| 隐藏滚动条、半透明滑块 | 4 处、3 处重复 | `scrollbarStyles` |
| 浮层表面 | Popover、HoverCard、Menu、Tour、Tooltip 手拼 `anchored + surface + scale`；ModalCore、Toast 各写 | 用 `anchoredPanelSx` 与一个 `floatingSurface` |
| 根元素字号 | `size && fontSizeStyles[size]` 37 处 | 阶段 2 进配方档位后消失 |

### 5.2 状态写法统一到条件别名

- 状态类的 `cond && styles.x` 约 70–80 处（disabled 18、选中 / 当前 / 勾选约 22、展开约 11、无效 / 只读约 8、拖动等约 10），
  元素上都已有对应的 aria / data 属性（Listbox、Tree、CalendarBoard、Accordion、ButtonBase、NavBar、勾选类），换成 `_disabled`、`_selected`…
- 字面量与别名二选一：`':hover'` 62 次对 `_hover` 1 次、`':dir(rtl)'` 18 次对 `_rtl` 0 次、`':focus-visible'` 10 次对 `_focusVisible` 0 次——统一用别名。
- 日历两套日期格样式（CalendarView、CalendarBoard 各写选中、禁用、范围外、今天）合一。

### 5.3 裸值换 token

- 颜色：Upload、Lightbox、SlideCaptcha 的 `rgb(...)`、`white`（图片上的遮罩与文字）→ 新增 `scrim`、`onScrim` 一类 token。
- 尺寸：组件内部的 `rem` 约 38 行（`table-styles.ts` 最多）、`px` 约 19 行（`'2px'` 的 gap 8 处）→ em 或 token（COMPONENTS.md §3）；
  `fontSize: 'x.xem'` 19 处 → `relativeFontSizeStyles`。
- 动效：循环动画的时长（Spinner、Progress、OtpField、shimmer、Card 流光）与 SlideCaptcha 的 `cubic-bezier` → 新增循环时长与 `linear` 缓动 token。
- 物理方向属性：Tabs 的 `marginBottom` / `borderBottom*`、Steps 的 `paddingTop`、ToggleGroup 的 `left` / `right` → 逻辑属性。

### 5.4 配方与样式表去重

- Badge 的 24 条组合档位逐项抄的是 `tone-styles.ts` 的 4 × 6 色表，Button 有 36 条：都从同一张色调表取（值仍是字面 token，只是只有一处）。
- `tableRecipe` 与 `dataTableRecipe` 的密度、样式、斑马纹几乎逐字相同：抽共同的配方片段。Dialog、Drawer 的配方同理。
- OtpField 的格子自己写了一套输入框外观 → 用 `inputRecipe`。
- 色调语义：neutral 在 StatusDot 是弱化文字色、在 `toneStyles` 是正文色、在 Timeline 是强边框色 → 定一个意思（外观变化，放进阶段 4 的组件级修正）。

### 5.5 命名、文件与导出

- 配方的位置：多个组件共用的进 `<家族>-styles.ts`（现在后缀有 `-core`、`-styles` 两种，`dataTableRecipe` 在 `table-styles.ts` 而 `tableRecipe` 在 `Table.tsx`），
  只给一个组件用的留在组件文件里。部件相关的命名统一成 `<组件>Part` 类型 + 配方（去掉 `buttonPart` 常量、`badgeParts` / `controlParts` 这类函数）。
- 不合规则的导出名：`listStylesProse`、`transitions`、`CodeEditor` 的 `styles`、`modalPartStyles`（不是 `css.create` 的结果）。
- 导出面：主目录导出的样式表 254 个，约 170 个只在自己文件里用；有了 `components` 定制入口之后，组件内部的 `css.create` 不再导出，
  只导出配方与共用件——入口文件（现在 1976 行）随之变小（**这是公开 API 的收缩，要你拍板**）。
- 死代码与残留：`conditionBuilderStyles.range` 没人用；`Tabs.tsx` 两段连续的 JSDoc；ViewportFill、NotificationCenter 手写 `[内部, sx]` 交给子组件，改走 `mergePartProps`。

### 5.6 部件补齐的工作量（阶段 2 §4.3 的明细）

主目录有 191 个节点用 `css.attrs` 直接取样式、没有 `propsXxx`（CommentThread 16、Checklist 14、Cascader 10、CalendarBoard 10、KanbanBoard 9、Gauge 7…）；
部件多却没有配方的：AppShell 22、Transfer 14、NavList 13、NotificationCenter 12、FilterBar 11、Upload 11、Timeline 11、CalendarView 11、CodeBlock 11、Tour 10、Stat 10、Menu 9、Toast 9。
按目录逐批改成配方，每批截图 0 差异再合。

## 6. 阶段 4：美学

现状的好处要保住：token 纪律强（组件里几乎没有裸 hex / px），同尺寸的按钮、输入框、选择框高度一致，动效 token 全库统一，
“减少动态效果”在 token 层归零。问题集中在系统层，所以**先改 token 与主题，再修组件**。

### 6.0 主题集合调整（先做，后面的 token 改动直接作用在最终的这组主题上）

- **去掉海洋主题**：`config/theme/ocean.ts`、`builtin.ts` 的登记与名字、`boot.ts` 的防闪烁底色、语言包的 `themeOcean`（zh-CN、en-US、`lang.ts`）、
  ThemeSwitcher 的图标、`ThemeThumbnail` 注释里的例子、主题指南的列举；文档站 Code 页用 `oceanTheme` 的示例换成别的主题。
  主入口不再导出 `oceanTheme`（进迁移说明）。记住了“海洋”的用户：`createThemePreference` 遇到不认识的名字已经回到默认值，不会出错。
  MeshGradient、ShaderBackground 示例里叫“海洋”的是调色板名，不是主题，不动。
- **加高对比暗色**（`high-contrast-dark`，“高对比暗色”）：纯黑底、白字，文字与底色到 7:1（AAA），边框到 3:1 以上，焦点环醒目，
  提示色取亮的一档；阴影换成描边（深色下阴影看不见）。同现有的高对比（亮）一样另配圆角、阴影的覆盖。
  ThemeSwitcher 排在“高对比”后面；`boot.ts`、语言包、设计资源页跟着加。
- `themes:check` 从 `builtin.ts` 自动读到新主题；高对比的两套额外按 7:1 检查（现在只按 AA）。
- 可选：“跟随系统”时，系统开了“增强对比度”（`prefers-contrast: more`）就选高对比的亮 / 暗一套。
- Figma 文件里按主题建的变量模式要同步（删海洋、加高对比暗色）：这是改外部文件，到时候先问你。

### 6.1 系统级（一次改善全库）

| # | 问题（证据） | 改法 | 风险 | 要你定 |
| - | ------------ | ---- | ---- | ------ |
| S1 | 浅色的 successText / warningText / infoText 是 12 级近黑色，dangerText 却是中间调：Alert 标题只有“失败”是红的，`+12.4%` 近黑；successText 与正文对比 1.33:1，分不出 | 浅色改中间调：success `#17714a`、info `#0c64b3`、warning `#8a5300`（在 soft、softHover、surface 上都 ≥ 5:1，已算过） | 低；勾选、开关的填充用到它们，看一眼 | — |
| S5 | 阴影不分尺寸：Menu、Popover、选项列表都用 `lg`（`0 12px 60px`），深色下看不见 | `md` 改紧凑，小浮层用 `md`、Toast 与大面板 `lg`、Dialog `xl`；深色阴影加 1px 的白色内高光 | 低 | — |
| S6 | 浅色 placeholder 在输入框底色上 3.33:1；深色焦点环 3.38:1；`textDisabled` 没有组件用（全用 `opacity .5`） | placeholder、焦点环按 4.5:1 调；不可用的文字改用 `textDisabled`，删掉 14 处 `opacity .5` | 低 | — |
| S3 | 控件高度是小数像素（`control: 2.25em` → 27 / 29.25 / 31.5 / 36 / 40.5 px），1x 屏上边框发虚；sm 与 md 只差 2 px 几乎看不出 | 按档位给整数高度并落在 4 px 网格（如 24 / 28 / 32 / 40 / 48），sm、md 的字号拉开 | 中；表单、表格行高全变，浏览器测试重跑 | 高度表 |
| S4 | 中文 500 / 600 在 Windows 上塌缩（微软雅黑只有 Regular、Bold）：600 变粗体显得笨重，500 与正文一样；`semibold` 52 处、`medium` 29 处 | 中文环境下按钮、标签页、Alert 标题用 500，层级交给底色、字号、颜色；600 只留给 H1–H4 | 中；mac 与 Windows 两边核对 | 字重策略 |
| S2 | 表面层级塌成一层：浅色 background = surface = surfaceRaised；深色三者同色；卡片只靠 1.5:1 的边框分层，`elevated` 卡片在深色下消失 | 着色页面 + 白卡片（浅色 background `#f9f9fb`、surface `#ffffff`、surfaceMuted `#f4f4f7`；深色 surfaceRaised 提亮）；16 套主题跟着调 | **高**：全局观感变化 | 要不要走这个方向 |
| S7 | 标题阶梯：H3 / H4 只差 1.125 倍，H5 与 H6 都是 14 px；没有展示字号；中文长文行高 1.5 偏紧；accent 与 info 色相太近 | 拉开标题阶梯、加 `display` 档；`Prose` 行高 1.7；info 偏青 | 低到中 | — |

动效：小浮层进场 200 ms + 0.96 缩放偏慢，改 `sm` + `enter`，离场 `xs`；补一个 `linear` 缓动 token；
`durations.lg` 的注释写“对话框、抽屉”，实际只有 Drawer 用，对齐文档或实现。

### 6.2 组件级

| # | 问题 | 改法 |
| - | ---- | ---- |
| C1 | **bug**：DataTable 里可排序的列头 400、不可排序的 600，同一行字重不一致 | `buttonBaseStyles.root` 加 `fontWeight: 'inherit'`（同已有的 fontFamily、fontSize、lineHeight），核对其他 ButtonBase 使用方 |
| C2 | `Card` 的 `elevated` 只有阴影，深色下消失 | 加一圈弱边框 |
| C3 | Field 的标签和提示都是 13 px，只靠颜色分层；字段间距 14 px 偏紧 | 提示降到 `xs` 或标签升到 14 px；字段间距 1.25em |
| C4 | NavList 的计数是圆形，Badge 是 3 px 方角 | 统一成 `Badge radius="full" size="xs"` |
| C5 | 按钮默认开波纹（Material 的手法），和整体偏 Radix 的扁平风格不协调 | 默认关，或只给 solid（要你定） |
| C6 | 文档站示例的预览容器用 `surface`，深色下掩盖了层级问题 | 预览容器改 background 底 |

### 6.3 顺序与验收

6.0 主题集合 → C1、S6 → S1、S5 → S3、S4 → S2（影响最大，先拍板方向）。每批跑全部示例截图，生成联系表（`docs:sheets`）逐页过目，
`themes:check` 逐对检查对比度（16 套主题），浏览器测试重跑。美学阶段之前把截图基线容器化进 CI（ROADMAP 8.3），之后外观的任何改动都由 CI 拦。

## 7. 阶段 5：文档与发布

- 规范：COMPONENTS.md §1（词表、默认值）、§2（部件、合并、导出）、§4（样式、定制）、§6（Provider）、§8（完成标准加“配方 + 部件齐全”），
  STYLE-ENGINE.md 加分段输出与层一节，README 的宿主覆盖说明（不分层的 CSS 盖过组件库）。
- 文档站：样式指南的“定制组件”、主题指南、Provider 页改成 `components` 入口；每个组件页的 API 表列出部件（`propsXxx`、`data-part`）与可定制的档位。
  现在文档里的 `variants: { size: { xl } }` 示例按代码根本选不到（Button 的配方没有 size 档），一并修掉。
- 迁移说明：`defaults` / `styles` → `components`；外观词表的改名；宿主 CSS 的层叠变化；`ui` 主入口不再导出的内部件；
  去掉 `oceanTheme`、新增 `highContrastDarkTheme`。0.x 的小版本发布，旧名保留一个版本。
- ROADMAP：新开一个阶段，按本文拆条目；8.3（视觉回归进 CI）与 8.5（API 审计）的相关部分并进来。

## 8. 范围、并行与风险

**规模**：引擎（tsx/styles 约 10 个模块）、ui 的配置层与合并（config/、utils/props）、约 50 个组件改配方或补部件、
外观词表的改名（约 20 个组件）、主题 16 套、文档站指南与组件页。

**并行**：写代码的工作全部在主线程里串行做（不拆给子代理或别的会话）。能并行的只有不写代码的部分：
阶段 4 的 token 取值（S2、S3、S4）可以在阶段 1、2 进行时由调研代理先出对比图与对比度计算；全量截图、测试、浏览器测试放后台跑，
主线程同时继续写代码。计时类的基准不和别的任务并行。

**风险与对策**：

| 风险 | 对策 |
| ---- | ---- |
| 分段后的合并语义与现在不一致 | 有效声明快照逐字比对；截图 0 差异才合 |
| happy-dom 不认 `@layer`，单元测试读不到样式 | 测试工具改读引擎的模型；不支持层的环境插不带层的规则 |
| 宿主原有的重置样式在分层后盖过组件库 | 已确认可以接受；迁移说明写清楚，需要时宿主把重置放进更低的层 |
| API 改名打断使用方 | 旧名保留一个版本、废弃提示；迁移说明逐条对应 |
| 美学改动范围大、主观 | 先 token 后组件；S2、S3、S4、C5 由你拍板；联系表逐页过目 |
| 小程序端 | 行内展开按段拼接、app 样式表剥层；小程序构建与 WXSS 检查进验收 |

## 9. 与 C# 版本的同步

CSharpUi、Blazor 两个会话是同一套组件库设计的 C# / Blazor 版本。计划定稿后把它发给两边；之后每完成一个阶段再通知一次，
写清这一阶段改了什么、对外 API 与设计决定的变化、哪些需要它们跟进（如分段与层的输出规则、`components` 配置入口、外观词表、token 取值），
附上相关文件与提交，要求它们按各自的技术栈适当跟进。

## 10. 已定的决定（2026-11-06，按推荐）

1. 顺序：阶段 0 → 5，前三个阶段外观不变，每个阶段单独合进 master。
2. 配置入口改成 `components: { Button: { defaults, styles, variants } }`，旧的 `defaults` / `styles` 留一个版本并给出废弃提示。
3. 外观词表按 §4.4 改名，旧名留一个版本。
4. 主入口不再导出组件内部的样式表（§5.5），只导出配方与共用件。
5. 美学：S2 着色页面 + 白卡片；S3 控件高度 xs 24 / sm 28 / md 32 / lg 36 / xl 40（整数、4 px 网格，最接近现在的 27 / 29 / 31.5 / 36 / 40.5）；
   S4 中文 600 只给 H1–H4，按钮、标签页、Alert 标题用 500；C5 波纹默认关（`createUi({ ripple: true })` 照样能开）。
6. 主题：去掉海洋，加高对比暗色。Figma 文件的同步是改外部文件，到时候先问。
