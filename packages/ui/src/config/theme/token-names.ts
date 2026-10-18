// 由 scripts/css-docs/generate.mjs 根据 tokens.stylex.ts 生成，请勿手改。
// 主题 tokens 字符串写法的类型（COMPONENTS.md §4）：每组一个接口
declare module '@vue-tsx-pro/tsx/stylex' {
  /** 颜色：slate 中性色、indigo 品牌色、red 危险、green 成功、amber 警告、blue 信息 */
  interface ColorsTokens {
    /**
     * 页面背景。slate 1：亮色 `#fcfcfd`，暗色 `#111113`
     *
     * `colors.background`
     */
    _background: unknown;
    /**
     * 卡片、输入框等表面。亮色 slate 1 `#fcfcfd`，暗色 slate 2 `#18191b`
     *
     * `colors.surface`
     */
    _surface: unknown;
    /**
     * 弱化的区域背景：表头、侧栏、代码块。slate 2：亮色 `#f9f9fb`，暗色 `#18191b`
     *
     * `colors.surfaceMuted`
     */
    _surfaceMuted: unknown;
    /**
     * 浮层（弹出框、菜单、对话框）表面。亮色 slate 1 `#fcfcfd`（靠阴影区分），暗色 slate 3 `#212225`
     *
     * `colors.surfaceRaised`
     */
    _surfaceRaised: unknown;
    /**
     * 填充：标签、开关关闭态、弱按钮。slate 3：亮色 `#f0f0f3`，暗色 `#212225`
     *
     * `colors.fill`
     */
    _fill: unknown;
    /**
     * 填充悬停；也用于幽灵按钮、菜单项的悬停背景。slate 4：亮色 `#e8e8ec`，暗色 `#272a2d`
     *
     * `colors.fillHover`
     */
    _fillHover: unknown;
    /**
     * 填充按下、选中。slate 5：亮色 `#e0e1e6`，暗色 `#2e3135`
     *
     * `colors.fillActive`
     */
    _fillActive: unknown;
    /**
     * 主要文字。slate 12：亮色 `#1c2024`，暗色 `#edeef0`
     *
     * `colors.text`
     */
    _text: unknown;
    /**
     * 次要文字、说明、图标。slate 11：亮色 `#60646c`，暗色 `#b0b4ba`
     *
     * `colors.textMuted`
     */
    _textMuted: unknown;
    /**
     * 输入框占位文字。slate 10：亮色 `#80838d`，暗色 `#777b84`
     *
     * `colors.textPlaceholder`
     */
    _textPlaceholder: unknown;
    /**
     * 不可用的文字。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169`
     *
     * `colors.textDisabled`
     */
    _textDisabled: unknown;
    /**
     * 弱边框：分割线、表格线。slate 6：亮色 `#d9d9e0`，暗色 `#363a3f`
     *
     * `colors.borderMuted`
     */
    _borderMuted: unknown;
    /**
     * 普通边框：输入框、卡片、浮层。slate 7：亮色 `#cdced6`，暗色 `#43484e`
     *
     * `colors.border`
     */
    _border: unknown;
    /**
     * 强调边框：悬停。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169`
     *
     * `colors.borderStrong`
     */
    _borderStrong: unknown;
    /**
     * 品牌色实色：主按钮、选中的复选框。indigo 9：两套主题都是 `#3e63dd`
     *
     * `colors.accent`
     */
    _accent: unknown;
    /**
     * 品牌色实色悬停。indigo 10：亮色 `#3358d4`，暗色 `#5472e4`
     *
     * `colors.accentHover`
     */
    _accentHover: unknown;
    /**
     * 品牌色实色上的文字与图标。Radix 规定 indigo 9 上用白字：`#ffffff`
     *
     * `colors.accentContrast`
     */
    _accentContrast: unknown;
    /**
     * 品牌色文字：链接、选中项的文字。indigo 11：亮色 `#3a5bc7`，暗色 `#9eb1ff`
     *
     * `colors.accentText`
     */
    _accentText: unknown;
    /**
     * 品牌色浅底：选中行、弱主按钮。indigo 3：亮色 `#edf2fe`，暗色 `#182449`
     *
     * `colors.accentSoft`
     */
    _accentSoft: unknown;
    /**
     * 品牌色浅底悬停。indigo 4：亮色 `#e1e9ff`，暗色 `#1d2e62`
     *
     * `colors.accentSoftHover`
     */
    _accentSoftHover: unknown;
    /**
     * 品牌色边框：选中的卡片、弱主按钮描边。indigo 7：亮色 `#abbdf9`，暗色 `#3a4f97`
     *
     * `colors.accentBorder`
     */
    _accentBorder: unknown;
    /**
     * 危险实色：危险按钮。red 9：两套主题都是 `#e5484d`
     *
     * `colors.danger`
     */
    _danger: unknown;
    /**
     * 危险实色悬停。red 10：亮色 `#dc3e42`，暗色 `#ec5d5e`
     *
     * `colors.dangerHover`
     */
    _dangerHover: unknown;
    /**
     * 危险实色上的文字与图标：`#ffffff`
     *
     * `colors.dangerContrast`
     */
    _dangerContrast: unknown;
    /**
     * 危险文字：错误提示。red 11：亮色 `#ce2c31`，暗色 `#ff9592`
     *
     * `colors.dangerText`
     */
    _dangerText: unknown;
    /**
     * 危险浅底：错误提示条。red 3：亮色 `#feebec`，暗色 `#3b1219`
     *
     * `colors.dangerSoft`
     */
    _dangerSoft: unknown;
    /**
     * 危险浅底悬停。red 4：亮色 `#ffdbdc`，暗色 `#500f1c`
     *
     * `colors.dangerSoftHover`
     */
    _dangerSoftHover: unknown;
    /**
     * 危险边框：校验失败的输入框。red 7：亮色 `#f4a9aa`，暗色 `#8c333a`
     *
     * `colors.dangerBorder`
     */
    _dangerBorder: unknown;
    /**
     * 成功文字与图标。green 11：亮色 `#218358`，暗色 `#3dd68c`
     *
     * `colors.successText`
     */
    _successText: unknown;
    /**
     * 成功浅底。green 3：亮色 `#e6f6eb`，暗色 `#132d21`
     *
     * `colors.successSoft`
     */
    _successSoft: unknown;
    /**
     * 成功边框。green 7：亮色 `#8eceaa`，暗色 `#28684a`
     *
     * `colors.successBorder`
     */
    _successBorder: unknown;
    /**
     * 警告文字与图标。亮色 amber 12 `#4f3422`，暗色 amber 11 `#ffca16`。
     * 亮色不用 11 级：amber 11（`#ab6400`）在页面背景上对比度 4.49，不到 WCAG AA 的 4.5
     *
     * `colors.warningText`
     */
    _warningText: unknown;
    /**
     * 警告浅底。amber 3：亮色 `#fff7c2`，暗色 `#302008`
     *
     * `colors.warningSoft`
     */
    _warningSoft: unknown;
    /**
     * 警告边框。amber 7：亮色 `#e9c162`，暗色 `#714f19`
     *
     * `colors.warningBorder`
     */
    _warningBorder: unknown;
    /**
     * 信息文字与图标。blue 11：亮色 `#0d74ce`，暗色 `#70b8ff`
     *
     * `colors.infoText`
     */
    _infoText: unknown;
    /**
     * 信息浅底。blue 3：亮色 `#e6f4fe`，暗色 `#0d2847`
     *
     * `colors.infoSoft`
     */
    _infoSoft: unknown;
    /**
     * 信息边框。blue 7：亮色 `#8ec8f6`，暗色 `#205d9e`
     *
     * `colors.infoBorder`
     */
    _infoBorder: unknown;
    /**
     * 反色表面。slate 12：亮色 `#1c2024`，暗色 `#edeef0`
     *
     * `colors.inverseSurface`
     */
    _inverseSurface: unknown;
    /**
     * 反色表面上的文字。slate 1：亮色 `#fcfcfd`，暗色 `#111113`
     *
     * `colors.inverseText`
     */
    _inverseText: unknown;
    /**
     * 焦点环（:focus-visible）。indigo 9：两套主题都是 `#3e63dd`。
     * Radix 建议 7–8 级，但亮色下对比度不到 3:1（WCAG 2.2 焦点外观要求），所以用 9 级
     *
     * `colors.focusRing`
     */
    _focusRing: unknown;
    /**
     * 模态遮罩。亮色 blackA 6 `rgba(0, 0, 0, 0.4)`，暗色 blackA 8 `rgba(0, 0, 0, 0.6)`
     *
     * `colors.overlay`
     */
    _overlay: unknown;
  }
  /** 字体族 */
  interface FontsTokens {
    /**
     * 正文字体
     *
     * `fonts.sans`
     */
    _sans: unknown;
    /**
     * 等宽字体：代码、需要数字对齐的地方
     *
     * `fonts.mono`
     */
    _mono: unknown;
  }
  /** 字号：xs–xl 用于界面文字（也是组件 size 档位对应的字号），xxl、xxxl 用于标题 */
  interface FontSizesTokens {
    /**
     * `12px`：辅助说明、标签
     *
     * `fontSizes.xs`
     */
    _xs: unknown;
    /**
     * `13px`：紧凑控件
     *
     * `fontSizes.sm`
     */
    _sm: unknown;
    /**
     * `14px`：正文与默认控件；Provider 用它设置区域的基准字号
     *
     * `fontSizes.md`
     */
    _md: unknown;
    /**
     * `16px`：宽松控件、小标题
     *
     * `fontSizes.lg`
     */
    _lg: unknown;
    /**
     * `18px`：强调文字、卡片标题
     *
     * `fontSizes.xl`
     */
    _xl: unknown;
    /**
     * `24px`：页面标题
     *
     * `fontSizes.xxl`
     */
    _xxl: unknown;
    /**
     * `30px`：大标题
     *
     * `fontSizes.xxxl`
     */
    _xxxl: unknown;
  }
  /** 字重 */
  interface FontWeightsTokens {
    /**
     * `300`
     *
     * `fontWeights.light`
     */
    _light: unknown;
    /**
     * `400`：正文
     *
     * `fontWeights.normal`
     */
    _normal: unknown;
    /**
     * `500`：标签、表头
     *
     * `fontWeights.medium`
     */
    _medium: unknown;
    /**
     * `600`：按钮、标题
     *
     * `fontWeights.semibold`
     */
    _semibold: unknown;
    /**
     * `700`
     *
     * `fontWeights.bold`
     */
    _bold: unknown;
  }
  /** 行高（不带单位，随字号缩放） */
  interface LineHeightsTokens {
    /**
     * `1`：图标、单行徽标
     *
     * `lineHeights.none`
     */
    _none: unknown;
    /**
     * `1.25`：按钮等单行控件、标题
     *
     * `lineHeights.tight`
     */
    _tight: unknown;
    /**
     * `1.375`：紧凑的多行文字
     *
     * `lineHeights.snug`
     */
    _snug: unknown;
    /**
     * `1.5`：正文
     *
     * `lineHeights.normal`
     */
    _normal: unknown;
    /**
     * `1.75`：长文阅读
     *
     * `lineHeights.relaxed`
     */
    _relaxed: unknown;
  }
  /** 字间距（em，随字号缩放）：中文正文保持 normal，大字号标题可以略收紧 */
  interface LetterSpacingsTokens {
    /**
     * `-0.02em`：大标题
     *
     * `letterSpacings.tighter`
     */
    _tighter: unknown;
    /**
     * `-0.01em`：小标题
     *
     * `letterSpacings.tight`
     */
    _tight: unknown;
    /**
     * `0`：正文
     *
     * `letterSpacings.normal`
     */
    _normal: unknown;
    /**
     * `0.02em`：小字号的标签
     *
     * `letterSpacings.wide`
     */
    _wide: unknown;
    /**
     * `0.05em`：全大写的英文标签
     *
     * `letterSpacings.wider`
     */
    _wider: unknown;
  }
  /** 间距：em，随组件字号缩放；页面级布局间距由宿主决定 */
  interface SpaceTokens {
    /**
     * `0`
     *
     * `space.none`
     */
    _none: unknown;
    /**
     * `0.25em`：图标与文字之间、控件的上下内边距
     *
     * `space.xs`
     */
    _xs: unknown;
    /**
     * `0.5em`：控件内部元素之间
     *
     * `space.sm`
     */
    _sm: unknown;
    /**
     * `0.75em`：输入框水平内边距、浮层内边距
     *
     * `space.md`
     */
    _md: unknown;
    /**
     * `1em`：按钮水平内边距、表单项之间
     *
     * `space.lg`
     */
    _lg: unknown;
    /**
     * `1.5em`：卡片、对话框内边距
     *
     * `space.xl`
     */
    _xl: unknown;
  }
  /**
   * 尺寸：宽、高、最小最大尺寸。控件规格用 em 随字号缩放；
   * 容器宽度（Container 与页面内容的最大宽度）是页面级的，用 rem，跟随浏览器的字号设置
   */
  interface SizesTokens {
    /**
     * `2.25em`：单行控件（按钮、输入框、下拉框）的高度
     *
     * `sizes.control`
     */
    _control: unknown;
    /**
     * `24px`：可点击区域的最小尺寸（WCAG 2.2 目标尺寸 24×24），与 control 取较大值
     *
     * `sizes.minTarget`
     */
    _minTarget: unknown;
    /**
     * `30rem`（480px）：窄内容，如登录表单
     *
     * `sizes.xs`
     */
    _xs: unknown;
    /**
     * `40rem`（640px）：表单页、设置页
     *
     * `sizes.sm`
     */
    _sm: unknown;
    /**
     * `48rem`（768px）：文章、详情页
     *
     * `sizes.md`
     */
    _md: unknown;
    /**
     * `64rem`（1024px）：常规页面
     *
     * `sizes.lg`
     */
    _lg: unknown;
    /**
     * `80rem`（1280px）：宽表格、仪表盘
     *
     * `sizes.xl`
     */
    _xl: unknown;
    /**
     * `100%`：占满容器
     *
     * `sizes.full`
     */
    _full: unknown;
  }
  /** 圆角：em，随组件字号缩放；整体改成直角或更圆时覆盖这一组 */
  interface RadiiTokens {
    /**
     * `0`
     *
     * `radii.none`
     */
    _none: unknown;
    /**
     * `0.15em`：控件内的小元素
     *
     * `radii.xs`
     */
    _xs: unknown;
    /**
     * `0.25em`：标签、复选框
     *
     * `radii.sm`
     */
    _sm: unknown;
    /**
     * `0.4em`：按钮、输入框
     *
     * `radii.md`
     */
    _md: unknown;
    /**
     * `0.7em`：卡片、浮层
     *
     * `radii.lg`
     */
    _lg: unknown;
    /**
     * `1em`：对话框
     *
     * `radii.xl`
     */
    _xl: unknown;
    /**
     * 全圆：胶囊按钮、头像、开关
     *
     * `radii.full`
     */
    _full: unknown;
  }
  /** 边框与描边宽度（px，不随字号缩放）：边框、分隔线、焦点环的宽度与间隔 */
  interface BorderWidthsTokens {
    /**
     * `0`
     *
     * `borderWidths.none`
     */
    _none: unknown;
    /**
     * `1px`：边框、分隔线
     *
     * `borderWidths.xs`
     */
    _xs: unknown;
    /**
     * `2px`：焦点环宽度与间隔、选中态的强调边框
     *
     * `borderWidths.sm`
     */
    _sm: unknown;
    /**
     * `3px`：提示条侧边的色条
     *
     * `borderWidths.md`
     */
    _md: unknown;
    /**
     * `4px`
     *
     * `borderWidths.lg`
     */
    _lg: unknown;
    /**
     * `6px`
     *
     * `borderWidths.xl`
     */
    _xl: unknown;
  }
  /** 阴影：取自 Radix Themes 的第 2–6 级，去掉了模拟边框的 1px 描边（组件自己画边框）；暗色主题另有一套 */
  interface ShadowsTokens {
    /**
     * 无阴影
     *
     * `shadows.none`
     */
    _none: unknown;
    /**
     * 贴近表面：卡片
     *
     * `shadows.xs`
     */
    _xs: unknown;
    /**
     * 轻微浮起：悬停的卡片
     *
     * `shadows.sm`
     */
    _sm: unknown;
    /**
     * 浮起：下拉面板
     *
     * `shadows.md`
     */
    _md: unknown;
    /**
     * 浮层：弹出框、菜单、提示
     *
     * `shadows.lg`
     */
    _lg: unknown;
    /**
     * 对话框
     *
     * `shadows.xl`
     */
    _xl: unknown;
  }
  /** 动效时长（参考 Material 3）；开启“减少动态效果”时自动为 0 */
  interface DurationsTokens {
    /**
     * `0ms`
     *
     * `durations.none`
     */
    _none: unknown;
    /**
     * `75ms`：按下反馈
     *
     * `durations.xs`
     */
    _xs: unknown;
    /**
     * `120ms`：悬停的颜色变化
     *
     * `durations.sm`
     */
    _sm: unknown;
    /**
     * `200ms`：展开、淡入、浮层出现
     *
     * `durations.md`
     */
    _md: unknown;
    /**
     * `300ms`：对话框、抽屉
     *
     * `durations.lg`
     */
    _lg: unknown;
    /**
     * `500ms`：大面积的页面切换
     *
     * `durations.xl`
     */
    _xl: unknown;
  }
  /** 缓动曲线（参考 Material 3） */
  interface EasingsTokens {
    /**
     * 标准：位置与尺寸变化
     *
     * `easings.standard`
     */
    _standard: unknown;
    /**
     * 进入：元素出现（先快后慢）
     *
     * `easings.enter`
     */
    _enter: unknown;
    /**
     * 退出：元素消失（先慢后快）
     *
     * `easings.exit`
     */
    _exit: unknown;
  }
  /** 不透明度 */
  interface OpacitiesTokens {
    /**
     * `0.5`：不可用的元素
     *
     * `opacities.disabled`
     */
    _disabled: unknown;
  }
  /** SVG 线宽（图标 24 格画布上的单位，不带单位）；Icon 默认 md，strokeWidth 可以逐个覆盖 */
  interface StrokeWidthsTokens {
    /**
     * `1`：细线图标
     *
     * `strokeWidths.xs`
     */
    _xs: unknown;
    /**
     * `1.5`
     *
     * `strokeWidths.sm`
     */
    _sm: unknown;
    /**
     * `2`：Lucide 的默认线宽
     *
     * `strokeWidths.md`
     */
    _md: unknown;
    /**
     * `2.5`
     *
     * `strokeWidths.lg`
     */
    _lg: unknown;
    /**
     * `3`：粗线图标
     *
     * `strokeWidths.xl`
     */
    _xl: unknown;
  }
}

export {};
