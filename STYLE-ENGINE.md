# 样式引擎：从编译期 StyleX 换成运行时引擎（草案，2026-10-24）

> 状态：调研完成，待确认。确认后先做原型、量指标，再整体迁移。

## 1. 结论

自己做一个**运行时的原子样式引擎**，API 与现在的 `stylex.create` / `stylex.attrs` 保持一致，挂在我们自己的入口
`@vue-tsx-pro/tsx/stylex` 后面（组件库与文档站 368 处导入全部经过它，182 个组件文件不用改）。

- 样式在运行时第一次用到时才计算、插入（惰性），按内容哈希缓存；原子类、属性优先级、`sx` 覆盖合并的语义照搬 StyleX。
- 组件库发布**编译好的纯 JS**：使用方不需要 StyleX 的 Babel 插件，开发服务器能预构建整个组件库。
- 组件库自己构建时可以再做一步预计算（同 Griffel 的 `__styles`）：把样式对象算成“类名表 + 规则”数据，
  运行时只剩查表与插入，没有解析成本。应用代码不预计算也能跑（运行时兜底）。
- 生产环境可选提取成静态 CSS 文件（同 Griffel 的提取插件），默认运行时插入。

设计主干取 Griffel（原子类 + 按属性键合并 + 惰性计算 + 可选预计算），优先级规则取 StyleX 的源码，
规则登记、SSR 请求隔离、主题变量与动态值取 zerodep-css / zerodep-js 的经验。

## 2. 现状的问题（实测）

| 场景                                        | 现在                                                        | 原因                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 使用方开发服务器首次打开（10 个组件的页面） | 修预构建前 14–16 秒、2,500 个请求；修后 8–10 秒、302 个请求 | 组件库保留 `stylex.create` 源码，不能预构建，275 个模块逐个过 StyleX 的 Babel（单线程约 10 秒）          |
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
import * as stylex from '@vue-tsx-pro/tsx/stylex';

const styles = stylex.create({
  root: { padding: '_md', color: { default: '_text', ':hover': '_accent' } },
  size: (width: string) => ({ width }), // 动态样式：同现在
});
<div {...stylex.attrs(styles.root, active && styles.active, sx)} />;
```

- `create`、`attrs`、`keyframes`、`createTheme`、`defineConsts`、`when.*`、`defineMarker` 写法不变。
- `defineVars` 加一个显式的名字：`defineVars('colors', { … })`（运行时没有导出名可哈希；两个文件改一下）。
- `'_md'`、`'_colors.text'` 的 token 短写改在运行时按 `token-map.ts` 解析，不再需要编译期改写。

### 4.2 运行时机制

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
export const buttonRecipe = stylex.recipe({
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

- 配方按“档位组合”缓存每个部件的类名串：渲染时是一次查表，比现在每次 `stylex.attrs` 拼几个数组还快；
- 合并按参与者的序号缓存（Griffel 的做法），同一组 `sx` 反复渲染不再重算；
- 规则只在第一次渲染出来时插入，没打开的页面的样式不进样式表；
- 组件库构建时预计算配方（`__styles` 形态），运行时不解析样式对象。

**7. 迁移**：引擎同时支持 `create`/`attrs` 与配方；组件逐个改成配方，改一个测一个（视觉回归兜底），不必一次切完。

## 5. 实施步骤

1. **原型**（约 3–5 天）：在 `@vue-tsx-pro/tsx/stylex` 后面实现运行时引擎（create、attrs、动态样式、token、伪类、
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

- 换运行时引擎后：样式对象可以原地替换，问题消失。
- 不换的话：热更新单独识别 `stylex.create` 的导出，原地更新对象内容而不让导入方重新执行（约半天）。
