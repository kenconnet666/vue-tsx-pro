# 样式引擎：从编译期 StyleX 换成运行时引擎（2026-10-24）

> 状态：已实现并合并（2026-10-24），同日完全去掉 StyleX 的依赖（§9.5）；实测见 §9。最初的“运行时原子类（复刻 StyleX）”原型已放弃，
> 改为下面的组合类 + 响应式绑定；§3、§4.2 里原子类的部分保留作调研记录。

## 1. 结论

**写法像 StyleX，底层像 Emotion / zerodep-css，和响应式深度结合：状态变化只更新该更新的那一处。**
入口仍是 `@vue-tsx-pro/tsx/styles`（`create`、`attrs`、`createTheme`、`keyframes`、`when`、`sx` 写法不变）。

- **组合类**：`create` 只产出片段（声明表）；一个元素一次 `attrs` 把片段合成**一个类**，第一次出现时插入一条规则
  （含条件块）。按片段对象逐层缓存，命中时不拼字符串、不算哈希、返回同一个结果对象，Vue 比对 class 相同就不碰 DOM。
  没有原子类之间的优先级问题，不需要 StyleX 的优先级大表（块内按属性优先级排序，用 `priority.ts` 的小表）。
- **合并语义**：后面的普通值整体替换该属性（同 StyleX）；条件对象按条件逐项合并，条件里的 `null` 表示“不改”
  （StyleX 会把前面的默认值清掉——Tabs 未选中文字本该是弱化色，就是被这个坑盖成了正文色）。
- **状态样式走 DOM 属性**：条件别名（`_selected`、`_disabled`、`_open`…）跟着 aria / data 属性，状态变化只改属性；
  任意属性选择器也能当条件（`color: { default: null, '[data-hot]': … }`，包成 `:is(…)`）。aria / data 属性本来就要写时
  （无障碍、状态标记）用它，去掉重复的 `selected && styles.x`；只为样式加的布尔开关用条件类就行（实测不更快，§9.1）。
- **动态值绕过组件渲染**：编译器把 JSX 里的 `styles.bar(item.width)` 改写成 `css.bind(styles.bar, () => [item.width])`；
  渲染时只算类名（不追踪），元素上的响应式 effect 直接改那个 CSS 变量，组件不重新渲染。
  一直没变过的属性写死在类里（元素上不挂变量），变过的才转成变量（StyleX 一律转变量，重算更慢）；
  变量不注册 `@property`（引用变量的元素自己一定写着它，不会继承到祖先的值），重算再省 15–20%。
  参数只读渲染函数外面的来源时，编译器把绑定标成稳定（第三个参数 `true`），组件因别的原因重渲染时不重跑 effect；
  动态样式按参数记忆求值结果，重渲染时不重复展开声明。
- **换主题只换根上的变量类**，组件不渲染。
- **热更新原地生效**：顶层 `create` / `recipe` 由编译器包上 `hotStyles(id, …)`，模块重新执行时把新声明写进旧片段、
  按原类名改写规则；只改了样式（“骨架”不变）就不连锁、不重载组件。
- **组件库发布纯 JS**，使用方不需要 StyleX 的 Babel，开发服务器能预构建整个组件库。
  变量组、主题、标记、token 短写也都在运行时处理，仓库不再依赖任何 `@stylexjs/*` 包（§9.5）。

## 2. 现状的问题（实测）

| 场景                                        | 现在                                                        | 原因                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 使用方开发服务器首次打开（10 个组件的页面） | 修预构建前 14–16 秒、2,500 个请求；修后 8–10 秒、302 个请求 | 组件库保留 `css.create` 源码，不能预构建，275 个模块逐个过 StyleX 的 Babel（单线程约 10 秒）             |
| 文档站改一个组件的样式值，到页面生效        | 约 2 秒                                                     | 组件文件导出了样式对象，热更新让导入方连锁重新执行（Badge → NavList、PropsTable → App、AppShell），见 §8 |
| 改示例文件                                  | 约 0.5 秒                                                   | 正常                                                                                                     |
| 使用方类型检查                              | 多 0.5 秒（TS 7）/ 1.9 秒（TS 5.9）                         | 读 280 个声明文件，可以接受                                                                              |
| 生产构建                                    | 多约 3 秒                                                   | 可以接受                                                                                                 |

开发服务器慢的根因是“发布的组件库还要使用方再编译一遍样式”。StyleX 的设计如此（原子类要在应用里统一提取），
在它的框架里只能缓解（预构建依赖、缓存、换 Rust 编译器），去不掉。

## 3. 调研要点

**StyleX 0.19.1 源码**（克隆在 `C:\Users\lionheart\src\stylex-main`）

- 运行时（`packages/@stylexjs/stylex/src/stylex.js`）除了 `props`（用 styleq 按键合并）以外，
  `create`、`defineVars`、`keyframes` 等一调用就抛错，全部靠 Babel 插件替换。
- 编译期做的事都是纯计算，没有一样非得在编译期：
  - `shared/stylex-create.js`：展开嵌套条件 → 每个“属性 + 值 + 条件”一条规则，类名是哈希；同一属性后写覆盖先写；
  - `shared/src/utils/property-priorities.js`（约 850 行的表）：简写的简写 1000、简写 2000、逻辑长属性 3000、
    物理长属性 4000，伪类按 LVFHA 加权（:hover 130、:focus 150、:active 170），`@supports` 30、`@media` 200、
    `@container` 300，伪元素 5000；合成 CSS 时按这个数排序，所以长属性总能压过简写、`:active` 压过 `:hover`；
  - `defineVars` 的变量名由“文件路径 + 导出名”哈希而来，所以变量必须写在 `*.stylex.ts` 里——运行时拿不到导出名，要换成显式命名。
- 运行时注入：`stylesheet/createOrderedCSSStyleSheet.js` 已经有“按优先级分组插入”的实现，可以参考。

**Griffel**（微软 Fluent UI v9，克隆在 `C:\Users\lionheart\src\griffel`）——最接近我们要的形态

- `makeStyles` 在模块里只建闭包，第一次用到才计算并缓存（`core/src/makeStyles.ts`）。
- 原子类名 = 哈希(选择器 + at-rule + 属性 + 值)；另有不含值的“属性键”，`mergeClasses` 按属性键合并实现后者覆盖前者，
  合并结果按序列号缓存（`mergeClasses.ts`、`runtime/reduceToClassNameForSlots.ts`）。
- 简写：写简写时把它的长属性置空；简写规则放进优先级更低的样式表（`runtime/shorthands.ts`）。
- 样式表按伪类分桶、媒体查询排序（`renderer/createDOMRenderer.ts`）。
- 预计算：Babel / Vite 插件把 `makeStyles(obj)` 换成 `__styles(类名表, 规则)`，库发布的就是这种 JS；提取插件再把规则挪进 CSS 文件。

**Emotion**（克隆在 `C:\Users\lionheart\src\emotion`）：每次渲染重新序列化、哈希；合并是把 CSS 文本拼起来生成新类，
没有原子去重。只借它的哈希（murmur2）、样式表插入（`insertRule`、CSP nonce）、SSR 收集方式，不借合并模型。

**zerodep-css / zerodep-js**：分子类（一段声明一个类）+ 链式 API，不建议照搬；可借鉴：
内容哈希的规则登记表（`zerodep-css/core/src/registry.ts`）、SSR 的 AsyncLocalStorage 请求隔离与 hydrate 清单校验
（`server.ts`、`browser.ts`）、主题变量随主题实例走的类型、动态值走元素级变量并只放行安全值（`zerodep-js/packages/css/src/util/values.ts`）。

## 4. 方案

### 4.1 API：保持现在的写法，只放宽限制

```ts
import * as css from '@vue-tsx-pro/tsx/styles';

const styles = css.create({
  root: { padding: '_md', color: { default: '_text', ':hover': '_accent' } },
  size: (width: string) => ({ width }), // 动态样式：同现在
});
<div {...css.attrs(styles.root, active && styles.active, sx)} />;
```

- `create`、`attrs`、`keyframes`、`createTheme`、`when.*` 写法不变；`defineConsts` 换成普通常量。
- `defineVars`、`defineMarker` 加一个显式的名字：`defineVars('vtp-colors', { … })`（运行时没有导出名可哈希）。
- `'_md'`、`'_colors.text'` 的 token 短写改在运行时按 `token-map.ts` 解析，不再需要编译期改写。

### 4.2 运行时机制

> 下面 1–5 条是最初的原子类设计，已被 §1 的组合类取代（实现见 `packages/tsx/src/styles/runtime.ts` 文件开头的说明），
> 6、7 条仍然适用。

1. **惰性**：`create` 返回的对象，每个命名空间第一次被读时才展开（Proxy 或 getter），结果缓存在对象上。
2. **展开**：嵌套条件（伪类、`@media`、`@container`、`when.*`）拍平成 `{属性, 值, 条件}`；类名 = 哈希(条件 + 属性 + 值)，
   属性键 = 哈希(条件 + 属性)；token、单位（数字补 px）、逻辑属性在这一步规整。
3. **插入**：第一次出现在 `attrs` 的结果里时才插入（只插真正渲染出来的规则）；一张 `<style>`，按 StyleX 的优先级数
   分组（每组一个 `@layer`，或按组号排序插入），`insertRule` 插入，规则字符串去重。
4. **合并**：`attrs` 按属性键合并，后者覆盖前者（同 styleq / Griffel 的 `mergeClasses`），按参数组合缓存结果。
5. **动态样式**：同 StyleX 的输出——固定的类引用一个 CSS 变量，值写进行内 `style`，不为每个值生成新规则。
6. **主题**：`defineVars` 生成 `:root` 上的变量；`createTheme` 生成一个只改变量的类。
7. **SSR**（文档站暂时用不到，接口先留好）：每个请求一个登记表，输出 `<style>` 与清单，客户端接管时比对。

### 4.3 发布与构建

- 组件库：构建时把每个 `create` 预计算成“类名表 + 规则”数据（`__styles` 形态），发布纯 JS；使用方开发服务器预构建它，
  首次打开的成本降到与普通依赖相同。
- 应用：不需要任何样式插件（运行时兜底）；想要零运行时开销时，Vite 预设可选做同样的预计算与 CSS 提取。

### 4.4 能放宽的 StyleX 限制、能顺带改进的 API

- 样式里可以用函数、常量、展开、计算出来的键，可以写在工厂函数里（StyleX 要求能静态求值）。
- 主题变量不再必须写在 `*.stylex.ts`；运行时生成自定义主题（主题编辑器）也不用绕到行内变量。
- `sx` 可以直接写对象：`sx={{ marginTop: '_md' }}`，按内容缓存，不必为一次性的覆盖单独 `create`。
- 部件属性、默认值（`defaults`）里也能直接给样式对象，统一主题定制的入口。
- 热更新：样式对象可以原地替换，改样式只影响用到它的组件（§8 的连锁问题从根上消失）。

### 4.5 成本与风险

| 风险                                                        | 缓解                                                                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 运行时多一个引擎（预计 6–10 KB gzip，含约 3 KB 的优先级表） | 组件库预计算后运行时只剩查表与插入；优先级表可以只带用到的属性                                                                                        |
| 首次渲染要计算样式                                          | 惰性 + 缓存；组件库预计算；原型阶段量一个重页面（表格、地图）                                                                                         |
| 优先级与 StyleX 不完全一致导致样式回归                      | 直接移植 StyleX 的优先级表与展开逻辑；视觉回归（ROADMAP 8.3）提前做                                                                                   |
| 自己维护一套引擎                                            | 范围有限（我们的用法已统计：create 297 处、动态样式 96 处、伪类 95 处、媒体查询 55、容器查询 11、keyframes 13、createTheme 32、when 2），按用法补测试 |
| 生产环境 FOUC / SSR                                         | 客户端在渲染前同步插入；SSR 用请求级登记表；可选提取静态 CSS                                                                                          |

### 4.6 组件层的新 API：结合已有的东西

引擎之上加一层组件用的写法。出发点是现在组件库里的重复与别扭（统计自 `packages/ui/src`）：

| 现在的问题                                                                                   | 规模                                                                |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 色调 × 样式的矩阵手写展开（StyleX 不能用循环生成），按钮与标记各一份                         | 28 个文件、63 行带 `_danger*`，`button-core.ts` 的样式表就 200 多行 |
| 状态写两遍：DOM 上有 `aria-selected` / `data-state`，样式还要 `selected && tabStyles.active` | `条件 && 样式` 254 处；使用方的 `sx` 只能整个覆盖，不能只改“选中时” |
| 档位分散在三处：`XxxVariants` 接口、`xxxSizeStyles[size]` 查表、`useDefaults` 的默认值       | 查表 70 多处、`useDefaults` 18 个组件                               |
| 一次性的覆盖也要先 `create`                                                                  | `sx` 671 处                                                         |
| 通用片段手动拼：焦点环、高对比、减少动态效果                                                 | `focusRingStyles` 74、`forced-colors` 33、`reduced-motion` 15       |

**1. 条件别名：状态写进样式表，跟着 DOM 走**（借 Panda 的条件表，对齐我们 COMPONENTS.md §2.2 的 data 属性约定）

```ts
tab: {
  color: { default: '_textMuted', _hover: '_text', _selected: '_accentText', _disabled: '_textDisabled' },
}
```

引擎内置一张别名表：`_selected` = `:is([aria-selected="true"],[data-selected])`，`_open` = `:is([open],[data-state="open"])`，
`_disabled` = `:is(:disabled,[aria-disabled="true"],[data-disabled])`，还有 `_checked`、`_pressed`、`_invalid`、
`_readonly`、`_highlighted`、`_dragging`、`_focusVisible`，以及环境条件 `_forcedColors`、`_reducedMotion`、`_rtl`。
组件不再写 `selected && styles.active`，渲染时少算一次；使用方的 `sx` 也能写 `{ color: { _selected: 'red' } }`，只改选中时。

**2. 色调是一组变量，不是一张矩阵**

`tone` 只挂一个类，设置 `--tone`、`--tone-contrast`、`--tone-soft`、`--tone-text`、`--tone-border`、`--tone-hover` 等变量；
各样式只写一遍，引用 `_tone.*`：

```ts
solid: { color: '_tone.contrast', backgroundColor: { default: '_tone.solid', _hover: '_tone.hover' } },
soft:  { color: '_tone.text', backgroundColor: { default: '_tone.soft', _hover: '_tone.softHover' } },
```

6 × 6 的矩阵变成 6 段；`tone` 还可以是自定义的颜色（运行时用 `color-mix` 推出其余几级），品牌色以外的业务色不必改主题。

**3. 配方（recipe）：部件 × 档位 × 默认值在一处**（借 Panda 的 `sva`、MUI 的主题覆盖）

```ts
export const buttonRecipe = css.recipe({
  name: 'Button',                                   // 对应 useDefaults('Button')，也是 data-scope 的值
  parts: ['root', 'content', 'icon', 'spinner'],
  base: { root: { display: 'inline-flex', gap: '_xs', _focusVisible: focusRing, _disabled: { opacity: 0.6 } } },
  variants: {
    variant: { solid: { root: { … } }, soft: { root: { … } }, ghost: { root: { … } } },   // 键受 ButtonVariants 约束
    size: { sm: { root: { fontSize: '_sm' } }, md: { root: { fontSize: '_md' } } },
    fullWidth: { true: { root: { width: '100%' } } },
  },
  compound: [{ when: { variant: 'link', size: 'sm' }, root: { paddingInline: 0 } }],
  defaults: { variant: 'solid', size: 'md' },
});

// 组件里：一次调用拿到每个部件的属性，默认值、Provider 的 defaults、部件属性的 sx 都在里面合并好
const s = buttonRecipe.use(() => ({ variant, tone, size, fullWidth }), { root: rest, icon: propsIcon });
return () => <button {...s().root}>{icon && <Icon {...s().icon} icon={icon} />}</button>;
```

- 档位的类型从 `XxxVariants` 接口来（接口上的中文注释照旧给 API 表与悬停提示用），配方的键必须对得上；
  使用方用接口扩展加档位（如 `size: 'xl'`）后，在 `createUi({ defaults: { Button: { variants: { size: { xl: {…} } } } } })` 里给样式。
- 合并顺序固定：配方的基础 < 档位 < 组合档位 < Provider 里的主题覆盖 < 部件属性的 `sx`（按属性键合并，后写的赢）。
- 每个部件自动带 `data-scope="button" data-part="icon"`，使用方的全局 CSS、测试都能稳定地选中部件，不依赖哈希类名。

**4. `sx` 直接写对象**，一次性覆盖不用 `create`：`<Card sx={{ marginTop: '_md' }} />`；按内容缓存。

**5. 响应式的档位**（运行时只生成用到的“断点 × 取值”，静态提取的方案做不到）：
`<Button size={{ base: 'sm', md: 'lg' }} />`，断点取主题；表单、布局类组件还可以按容器宽度（`@container`）。

**6. 性能**

- 配方按“档位组合”缓存每个部件的类名串：渲染时是一次查表，比现在每次 `css.attrs` 拼几个数组还快；
- 合并按参与者的序号缓存（Griffel 的做法），同一组 `sx` 反复渲染不再重算；
- 规则只在第一次渲染出来时插入，没打开的页面的样式不进样式表；
- 组件库构建时预计算配方（`__styles` 形态），运行时不解析样式对象。

**7. 迁移**：引擎同时支持 `create`/`attrs` 与配方；组件逐个改成配方，改一个测一个（视觉回归兜底），不必一次切完。

## 5. 实施步骤

1. **原型**（约 3–5 天）：在 `@vue-tsx-pro/tsx/styles` 后面实现运行时引擎（create、attrs、动态样式、token、伪类、
   at-rule、优先级、keyframes、defineVars、createTheme），文档站切过去跑；再用配方重写 Button、Tabs、Badge 三个组件，
   看新写法的代码量与渲染开销。指标：
   - 视觉：文档站全部示例与现在逐像素对比（借 `docs:shot`），差异为 0 或可解释；
   - 速度：使用方项目开发服务器首开 ≤ 3 秒；改样式热更新 ≤ 0.3 秒；重页面首次渲染的样式计算 ≤ 10 ms；
   - 体积：运行时引擎 gzip ≤ 10 KB。
2. 原型达标后：组件库构建的预计算、`defineVars` 改名、去掉 StyleX 的 Babel 步骤与 `@stylexjs/*` 依赖、
   类型声明改为我们自己的（现有的 fork 类型直接沿用）、COMPONENTS.md §4 改写。
3. 可选：应用侧预计算与 CSS 提取、SSR。

## 6. 附：原生元素的属性补全与双向绑定（独立议题）

zerodep-js 的做法（`packages/core/src/native/`）：

- 用 `property-information` 与 `html-element-attributes` 两份数据**生成**每个标签的属性与取值类型
  （`scripts/generate-native.mjs` → `elements.ts`，约 1.1 万行），含 MathML。
- 原生元素的双向绑定 `bind:value`、`bind:checked`、`bind:group`（单选、多选组）、`bind:this`、`bind:open`、
  `bind:valueAsNumber`（`bindings.ts`）。

我们现在：原生元素的类型沿用 Vue 的 JSX 类型（`packages/tsx/types/jsx-runtime.d.ts` 只补了 currentTarget 与多标签共用），
Vue 3.5 的类型里没有 `popover`、`popovertarget`、`commandfor`、`command`、`closedby`、`blocking`、
`writingsuggestions`、`shadowrootmode`、`hidden="until-found"` 等新属性；原生元素的 `_bind` 只支持 `value`、`checked`
（编译成 Vue 的 v-model）。

建议（与样式引擎无关，可以先做）：

1. 照 zerodep-js 的思路生成原生元素类型，替换 Vue 的 IntrinsicElements：补上新属性、按标签给出准确的取值，
   保留我们的 currentTarget 与多标签共用逻辑。
2. 扩充原生元素的 `_bind`（仍是 `属性={_bind(x)}` 的写法，补全与跳转不受影响）：`open`（details、dialog）、
   单选与多选组（`checked={_bind(list)}` 配 `value`，写清语义）、`files`（文件输入，只读）、
   媒体的 `currentTime`、`paused`、`volume`、`muted`、`playbackRate`，以及只读的尺寸 `clientWidth`、`clientHeight`
   （ResizeObserver，同 Svelte）。

## 7. 附：已经修掉的开发服务器问题

组件库在 `package.json` 的 `vueTsxPro.optimizeDeps` 声明运行时导入的第三方依赖，Vite 预设自动预构建它们
（使用方首开的请求从 2,502 降到 302）。换成运行时引擎后组件库本身也能预构建，剩下的 275 个请求也会消失。

## 8. 附：文档站改样式热更新要 2 秒的原因

不是文档站新加的功能造成的（API 表的监听只让数据失效、换页时在后台线程重算；示例的热更新 0.5 秒）。
原因是组件文件除了组件还导出样式对象（`badgeStyles` 等，COMPONENTS.md §2.5 的约定），
热更新运行时（`packages/tsx/src/vite/hmr.ts`）遇到“导出了组件以外的值”就让导入方重新执行，
连锁到 NavList、PropsTable，再到 `App.tsx` 与 AppShell，整个外壳重新渲染。

- 换运行时引擎后：样式对象原地替换，问题消失（已实现，见 §9.3）。
- 不换的话：热更新单独识别 `css.create` 的导出，原地更新对象内容而不让导入方重新执行（约半天）。

## 9. 实测（2026-10-24）

### 9.1 状态变化时动了什么（`node scripts/docs/style-updates.mjs`，文档站 `/bench/style-updates`）

1000 行、每次改状态后等 Vue 更新再强制布局，9 轮取中位数（`--rounds=9`）；各组的颜色都用同样的主题变量，只比样式层。
“渲染”是行组件的渲染次数（每次状态变化平均），DOM / CSSOM 是每次状态变化平均改了几处。
sx 组的 hot 是条件类（`item.hot && styles.hot`），attr 组是 `data-hot` 属性 + `'[data-hot]'` 条件。

| 场景                    | 新引擎 sx                                    | 新引擎 attr         | Emotion                           | 手写类 + 元素变量           | 原子类原型（复刻 StyleX） |
| ----------------------- | -------------------------------------------- | ------------------- | --------------------------------- | --------------------------- | ------------------------- |
| 1000 行宽度各变一次 ×20 | **477 ms**，重算 178，渲染 0，DOM style×1000 | 490 ms，渲染 0      | 842 ms，重算 136，渲染 1000，换类 | 721 ms，重算 191，渲染 1000 | 1520 ms，重算 400         |
| 一行宽度变化 ×20        | 15 ms，渲染 0，DOM style×1                   | 15 ms，渲染 0       | 16 ms，渲染 1，换类               | 18 ms，渲染 1               | 16 ms                     |
| 1000 行有限状态切换 ×10 | 492 ms，重算 213，渲染 1000，换类            | 549 ms，改 data-hot | 486 ms                            | **413 ms**                  | 795 ms                    |
| 无关状态 ×10            | 渲染 0，DOM 0，CSSOM 0                       | 同                  | 同                                | 同                          | 同                        |
| Tabs 切换               | 只改 aria-selected / data-state / tabindex   | 同                  | —                                 | —                           | 同                        |
| 换主题 ×4               | 86 ms，渲染 0                                | 91 ms               | 90 ms                             | 83 ms                       | 133 ms                    |
| 已见过的状态再出现      | CSSOM 改动 0                                 | 0                   | 0                                 | 0                           | 0                         |

- 连续值不渲染组件：比手写类 + 元素变量快 34%（后者每次也要渲染组件），比 Emotion 快 43%。
- 有限状态（组件反正要重渲染）：比手写慢 19%，与 Emotion 持平。这一轮的优化与各自的效果（同一场景，前后对比）：
  - 动态样式按参数记忆求值结果（渲染与 effect 重跑都不再展开声明）：677 → 573 ms；
  - 编译器把只读渲染函数外面来源的绑定标成稳定，重渲染时只换读取函数、不重跑 effect：573 → 526 ms；
  - 变量不注册 `@property`（引用变量的元素一定自己写着它）：样式重算与手写持平，526 → 492 ms。
  - 剩下约 8 µs / 行：每行 3 次 attrs、绑定元素多一个 ref（Vue 多比对、多调一次 setRef）。
- 状态写在 DOM 属性上（attr 组）在“反正要重渲染”的场景里不更快（属性选择器的失效处理比类稍贵）：
  它的价值是 aria / data 属性本来就要写时直接复用、去掉重复的条件样式，不是性能。
- 规则数：原子类原型 408 条，新引擎 215 条（同一页面）。

### 9.2 视觉

全量 222 张示例截图（22 个页面 × 亮暗）与改动前逐像素比对：除了动画、时钟，差异只有

- Tabs：未选中标签的文字变成设计本意的弱化色（编译版被 `default: null` 的坑盖成了正文色，见 §1）；
- 修过的回归：同一元素上普通动态样式与绑定并存时，绑定的 effect 误删了别的变量（Slider 填充条），已修并加测试。

### 9.3 开发体验

| 指标                                        | 之前                                                                     | 新引擎                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 改 Button 的样式值到页面生效                | 约 3 秒：连锁 17 次失效、9 次整页刷新                                    | **228 ms**，一条 `hmr update`，元素与类名不变                                    |
| 改组件文件里的配方（Tabs）                  | 连锁                                                                     | 227 ms，一条 `hmr update`                                                        |
| 改样式以外的代码                            | 连锁                                                                     | 照旧连锁（骨架变了），导入方拿到新代码                                           |
| 自动绑定的编译开销                          | —                                                                        | 1024 个文件 12.75 s → 12.98 s（+1.8%）                                           |
| 引擎体积（压缩 / gzip）                     | 原子类原型 25 KB / 8 KB                                                  | 21.6 KB / 7.9 KB（去掉 StyleX 后，含原来在编译器里的 token 对照表与 recipe）     |
| 新项目把组件库当 npm 依赖用：开发服务器就绪 | 8.3 s（载入预设就要 3.1 s：静态导入了 Babel 与 StyleX 插件）             | **1.0 s**（Babel、StyleX 插件、编译函数都按需载入）                              |
| 同上：打开页面到画出（10 个组件的页面）     | 冷 10.2 s、热 8.2 s，302 个请求，组件库 275 个模块逐个过 StyleX 的 Babel | 冷 **1.95 s**（含第一次预构建）、热 **0.78 s**，11 个请求，组件库源文件请求 0 个 |

### 9.4 代价与限制

- 每个绑定的元素一个响应式 effect（内存、挂载时的创建）；不稳定的绑定（读了渲染函数里的局部变量、map 回调的参数）
  在组件因别的原因重渲染时要重跑一次收集依赖。
- 自动改写只认本文件顶层 `create` 里写成函数的命名空间；导入来的动态样式要手写 `css.bind`。
- 值变了但组件没渲染，Vue devtools 里看不到更新。
- 热更新只认顶层 `create` / `recipe`；`createTheme`、`keyframes` 改了照旧连锁。注释也算骨架，改注释会连锁。
- 测试环境（happy-dom）会丢掉它不认识的声明（`-webkit-line-clamp`、`color-mix`），测试按引擎记下的规则原文断言
  （`styleTextOf`、`styleOf`）。

### 9.5 完全去掉 StyleX（2026-10-24）

运行时引擎合并后，StyleX 只剩三处：`*.stylex.ts` 的 `defineVars` / `defineConsts` / `defineMarker` 仍过它的 Babel 插件，
`attrs` 为兼容编译模式转交它的 `props`，类型建立在它的 `CSSProperties` 上。这三处都换成了自己的实现：

- **变量组**：`defineVars(名字, 取值)` 在 `:root` 上声明 `--名字-token`，条件取值进对应的 @ 规则；同名再定义（热更新）换成新值。
  变量名可读（`--vtp-colors-accent`），源码、产物、SSR 一致，不再需要“`src/` 与 `dist/` 规范成同一模块”的模块解析。
- **token 短写**：`defineTokens({ 组名: 变量组 })` 登记，引擎展开声明时把整个值是 `'_md'` / `'_space.md'` 的换成变量；
  写错的 token、夹在值中间的短写在第一次用到那段样式时报错。编译期改写（要按导入关系找 token 模块、读源码或产物、
  算进编译缓存的键）整个删掉。组件库在 `utils/props.ts` 里导入登记 tokens 的模块，`sideEffects` 只列它。
- **主题与标记**：`createTheme` 按变量组的名字去重（同组后者覆盖前者），`defineMarker(名字)` 就是一个类；
  二者都是“固定类”，`attrs` 原样挂上。断点（原来的 `defineConsts`）是普通常量。
- **类型**：`css-properties.ts` 收录 StyleX 0.19.1 的 CSS 类型表（MIT，保留出处），`units.ts` 是补单位的两张表，
  引擎与 `scripts/css-docs` 共用；样式组、主题、标记的类型不透明，只能由对应的函数产出。生成的注释与之前逐字相同。
- **删掉的**：Vite 预设的编译模式（`styles: 'compile'`、`stylex` 与 `tokens` 选项、合成 CSS 的插件、模块解析）、
  编译器里的 StyleX 与 token 两步、优先级与 StyleX 逐项对照的测试、演练场的 `@babel/standalone` 替身与 token 名的传递，
  以及 `@stylexjs/*`、`lightningcss`、`browserslist` 依赖。
- **顺带修复**：组件库 package.json 的 `vueTsxPro.optimizeDeps` 原来只有编译模式读，切到运行时后没人读了，
  按源码读组件库的应用（文档站的浏览器测试）跑到图表才发现 `@unovis/ts` 等依赖、重新预构建，正在初始化的测试页卡住
  （合并后那次 CI 的 ComboChart 超时）。改由 `workspaceSource()` 读它，按“包 > 依赖”预构建。

### 9.6 改名（2026-10-24）

不再依赖 StyleX 之后，名字也不再沿用它：

| 原来                                                    | 现在                                         |
| ------------------------------------------------------- | -------------------------------------------- |
| 入口 `@vue-tsx-pro/tsx/stylex`，`import * as stylex`    | `@vue-tsx-pro/tsx/styles`，`import * as css` |
| `StyleXStyles`、`StyleXAttrs`                           | `SxStyles`、`StyleAttrs`                     |
| `packages/tsx/src/stylex/`，生成的 `styles.ts`          | `packages/tsx/src/styles/`，`documented.ts`  |
| `@vue-tsx-pro/ui/tokens.stylex`、`vars.stylex`          | `@vue-tsx-pro/ui/tokens`、`vars`             |
| `tokens.stylex.ts`（各组）+ `tokens.ts`（`t`）          | 合成 `tokens.ts`；主入口仍只导出 `t`         |
| `tone.stylex.ts`、`vars.stylex.ts`、`markers.stylex.ts` | `tone-vars.ts`、`vars.ts`、`markers.ts`      |
