# 手动发布到 npm

发布由维护者在本机手动执行，CI 不发布（changesets 与带 provenance 的发布工作流见 ROADMAP 8.4，还没做）。
发布的四个包都在 npm 组织 `zerodep-dev` 下（和 query 的包同一个组织，npm 上没有 `@vue-tsx-pro` 这个范围），版本号一起走：

| 包                                | 内容                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/vue-tsx-pro-tsx`    | TSX 编译器（符文、组件边界）、运行时样式引擎、Vite 预设；`dist` 与 `types`                                          |
| `@zerodep-dev/vue-tsx-pro-ui`     | 组件库与各子路径（`/diagram`、`/charts`、`/patterns`、`/three`…），编译好的 JS；依赖 `@zerodep-dev/vue-tsx-pro-tsx` |
| `@zerodep-dev/vue-tsx-pro-mobile` | 移动端组件库（H5 为主）与子路径 `/area`，编译好的 JS；依赖 `@zerodep-dev/vue-tsx-pro-tsx`                           |
| `@zerodep-dev/vue-tsx-pro-mini`   | 小程序运行时、构建（`/build`）、测试工具（`/testing`）、命令 `vtp-mini` 与新项目模板（`template`）；`tsx` 是 peer   |

`ui`、`mobile`、`mini` 对 `tsx` 的依赖写成 `workspace:^`，`pnpm publish` 发布时换成实际版本号，所以必须用 pnpm 发布，不能用 `npm publish`。

## 下一版对使用方的变化

发布时把这一节搬进 GitHub Release 的说明，再清空。组件库照样能在不做服务端渲染的普通 Vue 项目里用，下面是能察觉到的行为变化：

### 0.11：样式体系改造

**要改代码的**（旧写法标了 `@deprecated` 的这一版还能用，下一版去掉）：

- 组件定制合成一个入口 `components`：`createUi` / `Provider` 的 `defaults: { Button: {…} }` 与 `styles: { Button: { base, variants } }`
  改成 `components: { Button: { defaults, styles, variants } }`（原 `base` 改叫 `styles`）。只有新入口能改配方的档位（`variants`），
  定制登记在 `UiComponents` 里，组件名写错时类型检查报错。
- 主入口不再导出组件内部的样式表（约 220 张，如 `buttonStyles`、`alertStyles`、`tabListStyles`）：外观的定制改用 `components.Xxx`
  与部件的 `propsXxx.sx`。照常导出的有：配方（`xxxRecipe`）与部件类型（`XxxPart`）、共用件（`itemStyles`、`focusRingStyles`、
  `textStyles`、`disclosureStyles`…）、移动端复用的样式表（`navBarStyles`、`fieldStyles`…）、`buttonBaseStyles`、`visuallyHiddenStyles`。
- `variant` 只表示外观：Skeleton 的 `variant` → `shape`（`SkeletonVariants` → `SkeletonShapes`）；Sparkline、TimelineChart 的系列、
  WaveGrid 的 `variant` → `type`（`SparklineVariants` → `SparklineTypes`，`WaveGridVariants` → `WaveGridTypes`）。
- 文字色调的类型 `Tone` / `Tones` → `TextTone` / `TextTones`（状态色仍是 `StatusTone`）。
- 样式引擎（`@zerodep-dev/vue-tsx-pro-tsx/styles`）：配方组合档位的 `compound: [{ when }]` → `{ match }`；只改变量的主题类型 `Theme` → `VarTheme`；
  编译器与小程序用的 `hotStyles`、`inlineStyle` 挪到 `styles/internal`。
- 主题：去掉 `oceanTheme`（连同 `oceanColors`、`oceanShadows`、`oceanRadii`），记住了“海洋”的用户回到默认主题；要用的把 0.10 的
  `config/theme/ocean.ts` 抄进项目。语言包的 `themeOcean` 换成 `themeHighContrastDark`。
- `theme-customize` 去掉 Figma 变量导出：`themeDesignTokens`、`elementDesignTokens`、`designTokens` 与 `DesignToken*` 类型、
  ThemeCustomizer 的“下载 Figma 变量”按钮（`propsDownloadTokens`、语言包的 `downloadTokens`）；`themeValues`、`elementThemeValues` 保留。
- 层叠：组件的样式、每层主题定制、使用方的 `sx` 各成一段，进依次靠后的 `@layer`。宿主不分层的 CSS（包括按 `[data-scope][data-part]`
  选部件的）不论特异性都盖过组件库；宿主的全局样式只用类名选自己的元素，不要写会碰到组件内部的标签选择器（`button { … }`）。

**外观的变化**（不用改代码）：

- 亮色主题改成着色页面 + 白卡片：页面 `#f9f9fb`、卡片与浮层白色、`surfaceMuted` `#f4f4f7`；森林、柠檬、樱花、喜庆、薰衣草、墨白同样。
- 控件高度取整到 4px 网格：xs–xl 依次 24 / 28 / 32 / 36 / 40px（原来 27 / 29 / 31.5 / 36 / 40.5，1 倍屏上边框发虚）。
- 界面文字（按钮、标签页、Alert 标题、分组标签、表头）的字重 600 → 500（微软雅黑没有 600，原来落成粗体）；H6 默认 `sm`，与 H5 分开。
- 亮色的成功、警告、信息文字改中间调（原来近黑，与正文分不出）；`elevated` 卡片加一圈弱边框（深色下不再消失）。
- 占位文字到 4.5:1；高对比两套主题的文字都到 7:1。新增高对比暗色主题 `highContrastDarkTheme`（`'high-contrast-dark'`）；
  跟随系统时，系统开了“增强对比度”就选高对比的亮 / 暗一套。
- 表单标签 14px（中等字重），FormSection 的字段行距加宽；锚定的小浮层（Popover、Menu、Tooltip…）进出场更快。
- OtpField 的当前格画输入框聚焦时的焦点环，只读时同输入框变浅；SlideCaptcha 的滑块用组件库的焦点环；
  从右往左时树、表格子行、导航的展开箭头朝下（原来朝上），竖排 Tabs 的指示条位置正确。
- 按钮家族的内容层、前后图标、加载指示都是部件（`data-part`），可以经 `components.Button.styles` 定制。

**新增**：`components` 定制入口与 `useComponent`、`statusToneCompound`、`mixColors`、`usePrefersMoreContrast`、颜色 token `scrim` /
`scrimStrong` / `onScrim`（图片上的遮罩）、`transitions.pop`、`focusRingStyles.inset` / `virtual`、`disclosureStyles.flip` / `turn`。

## 一次性准备

1. npm 账号开启 2FA，建一个范围是 `@zerodep-dev`、勾选 Bypass 2FA 的 Granular Access Token，放进用户级环境变量 `NPM_TOKEN`。
2. `~/.npmrc` 写 `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`，不写明文。
3. 组织 `zerodep-dev` 在 npm 上已建好，账号是它的 owner。
4. 新包第一次发布后要经过一两分钟校验才出现在版本列表里；发布中途报 `409 Cannot publish over previously staged version` 说明上传已被接收，等一会儿，不要重发。

## 每次发布

1. **确认版本**：`packages/` 下 `tsx`、`ui`、`mobile`、`mini` 四个 `package.json` 的 `version` 相同且没发布过（npm 上已发布的版本不能覆盖）。
2. **确认 CI**：要发布的提交在 `master` 上，GitHub Actions 全部通过（check、test、browser、build、consumer、mini）。
3. **本机预检**：

   ```bash
   pnpm install --frozen-lockfile
   pnpm check && pnpm typecheck && pnpm test
   pnpm build
   pnpm test:consumer   # pnpm pack 的包在仓库外的独立应用里安装、类型检查、构建、真实浏览器里运行（桌面组件库，以及模板建的移动端项目）
   ```

4. **发布**（`-r` 按依赖顺序先发 `tsx`，再发 `ui`、`mobile`、`mini`；各包的 `prepack` 会重新构建，不会把旧的 `dist` 发出去；`kit` 还是 private，`storage` 不随这四个包发布）：

   ```bash
   pnpm -r --filter "./packages/tsx" --filter "./packages/ui" --filter "./packages/mobile" --filter "./packages/mini" publish --access public --no-git-checks
   ```

5. **打标签**：`git tag -a v0.1.0 -m "0.1.0"`，`git push origin v0.1.0`；在 GitHub 上用这个标签建 Release。
6. **进入下一个版本**：四个包的 `version` 一起改成下一个版本号，单独提交。

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
