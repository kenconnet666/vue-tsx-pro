# @zerodep-dev/vue-tsx-pro-mini

在微信、支付宝小程序里渲染 vue-tsx-pro 的组件：同一份 TSX 页面、同一个发布的组件库，H5 直接渲染 DOM，小程序经这里渲染。
还在概念验证之后的补全阶段（ROADMAP 阶段 17），没有发布。

## 怎么工作

- **渲染**：Vue 的自定义渲染器（`renderer.ts`）把虚拟节点落到 `MiniNode` 树上（`node.ts`）；页面（`page.ts`）在微任务里把这一轮的变化
  合成一次 setData——子节点变了的整段发，只是字段变了的按路径只发变了的那几个。
- **模板**：每种元素一套通用模板，按层展开（小程序的模板不能递归调用自己），数据里的 `t` 选模板（`build/templates.ts`）。
- **样式**：小程序不能在运行时插规则。样式引擎照常生成组合类，渲染时用 tsx 的 `inlineStyle` 按类名查回声明表，条件（属性选择器、
  `:active`、`@media` 宽度）由 `style.ts` 按节点状态判定，展开成行内样式。主题变量与关键帧在构建时从包里收集成 app 样式表。
  展开不了的写法（伪元素、`:nth-child`、标签与类名选择器、`@supports`）按不成立处理，开发构建的 console 里每种提示一次；
  app 样式表里留着 WXSS 不认的写法（`:root`、`:not` 里的选择器列表）时构建时提示。
- **事件**：模板一律 catch 绑定，原生冒泡停在最内层，冒泡由运行时按节点树做（两端冒泡时 `target` 的含义不同，不能靠它去重）。
- **SVG**：小程序没有 SVG，`svg` 子树序列化成遮罩（`mask-image`），底色取 `currentColor`。

## 用法

新项目从模板建（`template/`：H5 与两端小程序共用页面）：

```sh
npx @zerodep-dev/vue-tsx-pro-mini create my-app
```

```ts
// src/app.ts：声明页面，第一个是首页
import { definePages } from '@zerodep-dev/vue-tsx-pro-mini';
export default definePages({ index: HomePage });

// mini.config.ts：构建配置（MiniBuildOptions 去掉 root、platform）
import { defineMiniConfig } from '@zerodep-dev/vue-tsx-pro-mini/build';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';
export default defineMiniConfig({ plugins: vueTsxPro(), appId: 'wx…', darkmode: true });
```

命令（`vtp-mini`，在应用目录里运行）：`build [wx] [my]` 构建两端或指定的一端；`dev [wx|my]` 监听；
`open [wx|my]` 在开发者工具里打开产物（微信按安装位置找命令行，装在别处时设 `WECHAT_DEVTOOLS_CLI`；支付宝用 `minidev ide`）；
`create <目录>` 从模板建项目。也可以在脚本里直接调 `buildMini` / `watchMini`。

页面组件收到 `query` 属性（跳转时带的参数，已解码）。页面级的回调与跳转：`onPageShow`、`onPageHide`、`onReachBottom`（在 H5 里调用什么也不做），
`navigateTo('detail', { id: 42 })`、`redirectTo`、`reLaunch`、`navigateBack`（按 definePages 的页面名）。

监听模式（`vtp-mini dev`、`watchMini`）：依赖（Vue、运行时、组件库）单独打成 `vtp-vendor.js`，只在依赖的列表变了时重打；
改了源码只重打应用自己的代码（约 0.3–0.5 s，带源码映射），开发者工具看到产物变了会自己重新编译。

授权类能力（`capability.ts`）是宿主约定的一部分：设备权限按微信的 scope、支付宝的 authSetting 查与申请，存储、登录、
支付、订阅消息、手机号按两端各自的接口调用，支付结果统一成 success / cancel / pending / fail；微信的隐私协议回调交给组件库的弹窗。
带 `open-type` 的 button 换成原生按钮模板（`btn`），平台事件统一成 `opentype`。`mini.config.ts` 的 `permissions`（位置权限的用途说明）
与 `requiredPrivateInfos` 写进微信的 app.json。

完整的例子是 `apps/mobile-demo`（`node build.ts` 两端都构建，`pnpm dev:mini` 监听微信端，`pnpm dev` 看 H5）。

## 验证与踩过的坑

- 微信：开发者工具自带技能 CLI，`wechatide -c <客户端名> <工具>`（导入项目、打开窗口、截图、读 console、自动化点击输入、执行 JS）；
  第一次调用要在开发者工具里点授权。项目要有真实 AppID，`touristappid` 会报 APPID_ERROR。
  `wcsc.exe`（开发者工具安装目录的 `resources/app.asar.unpacked/node_modules/wcc-exec/`）能单独编译 WXSS，报错带行列。
- 支付宝：没有官方 MCP。`minidev build` 离线编译检查，`minidev ide -p <目录>` 在开发者工具里打开；IDE 有编译缓存，改了包要"清除构建缓存"。
- WXSS 不认 `:root`，和 `page` 写在同一个选择器列表里会让整条规则失效；`:not(a,b)` 这种选择器列表编不过。
- 支付宝的逻辑层跑在 Worker 里，旧环境没有 `globalThis`；编译器要看产物根目录的 `.browserslistrc` 才按新语法解析；
  Vue 选项式 API 里 `computed` 那段（`set:e=>i.value=e`）它解析不了，构建时关掉选项式 API。
- 依赖（animejs）在模块顶层取 `setImmediate` / `requestAnimationFrame`，逻辑层没有：`./globals` 补上，排在打包入口最前面。
  补上了微信里裸写的 `requestAnimationFrame` 仍然取不到（报 not a function）：组件里要等视图层画完用宿主的 `nextFrame`（等 setData 生效）。
- 模板层数（24）用完后，更深的节点交给递归的自定义组件 `vtp-comp`（模板从第 0 层重新开始）。它要在 app.json 的 usingComponents 里全局登记，`n 只在页面的 json 里登记时微信不实例化；组件里的原生 tap 不可靠（按下时整段子树重发给组件属性，tap 会丢），
  那一段的点击由运行时按 touchstart / touchend 合成（同一节点、移动不到 10px、不到 700ms）。
- 行内样式走字典：页面数据的 `ss` 里每种样式串只发一次，节点只带编号（`st`），模板写 `sd[i.st]`。1000 行单元格的首屏
  setData 从 1.9 MB 降到 320 KB（微信单次上限 1 MB）；基准在 `packages/mobile/src/.test/setdata.bench.test.tsx`。
  传给模板时写成 `data="{{i: item, ss: ss}}"`（键与变量同名）微信的模板里取不到，换了名字（`sd: ss`）才行。
- Taro 按使用方源码扫描裁剪模板，预编译库里动态创建的元素没有模板；这里的模板按元素全量生成，不扫描源码。
