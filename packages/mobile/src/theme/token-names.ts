// 由 scripts/css-docs/generate.mjs 根据 tokens.ts 生成，请勿手改。
// 主题 tokens 字符串写法的类型（COMPONENTS.md §4）：每组一个短写的接口、一个带组名的接口
declare module '@zerodep-dev/vue-tsx-pro-tsx/styles' {
  /** 颜色：slate 中性色、indigo 品牌色、red 危险、green 成功、amber 警告、blue 信息 */
  interface ColorsTokens {
    /**
     * 页面底色：分组列表、卡片下面的灰底。slate 3：亮色 `#f0f0f3`，暗色 slate 1 `#111113`
     *
     * `colors.background`
     */
    _background: unknown;
    /**
     * 单元格、卡片、弹出层的表面。亮色白色，暗色 slate 2 `#18191b`
     *
     * `colors.surface`
     */
    _surface: unknown;
    /**
     * 表面里再分一层：搜索框、步进器、标签的底。slate 2：亮色 `#f9f9fb`，暗色 slate 3 `#212225`
     *
     * `colors.surfaceMuted`
     */
    _surfaceMuted: unknown;
    /**
     * 填充：弱按钮、开关关闭态、骨架。slate 3：亮色 `#f0f0f3`，暗色 slate 4 `#272a2d`
     *
     * `colors.fill`
     */
    _fill: unknown;
    /**
     * 按下时的底色：单元格、菜单项按住。slate 4：亮色 `#e8e8ec`，暗色 slate 5 `#2e3135`
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
     * 占位文字。slate 10：亮色 `#80838d`，暗色 `#777b84`
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
     * 分隔线、单元格之间的细线。slate 6：亮色 `#d9d9e0`，暗色 `#363a3f`
     *
     * `colors.border`
     */
    _border: unknown;
    /**
     * 输入框、描边按钮的边框。slate 7：亮色 `#cdced6`，暗色 `#43484e`
     *
     * `colors.borderStrong`
     */
    _borderStrong: unknown;
    /**
     * 品牌色：主要按钮、选中、开关打开。indigo 9 `#3e63dd`
     *
     * `colors.accent`
     */
    _accent: unknown;
    /**
     * 品牌色按下。indigo 10：亮色 `#3358d4`，暗色 `#3758d4`
     *
     * `colors.accentActive`
     */
    _accentActive: unknown;
    /**
     * 品牌色上的文字。白色
     *
     * `colors.accentContrast`
     */
    _accentContrast: unknown;
    /**
     * 品牌色的文字（链接、浅色按钮的字）。indigo 11：亮色 `#3a5bc7`，暗色 `#9eb1ff`
     *
     * `colors.accentText`
     */
    _accentText: unknown;
    /**
     * 品牌色的浅底。indigo 3：亮色 `#edf2fe`，暗色 `#182449`
     *
     * `colors.accentSoft`
     */
    _accentSoft: unknown;
    /**
     * 品牌色的浅底按下。indigo 4：亮色 `#e1e9ff`，暗色 `#1d2e62`
     *
     * `colors.accentSoftActive`
     */
    _accentSoftActive: unknown;
    /**
     * 品牌色的边框。indigo 7：亮色 `#abbdf9`，暗色 `#3a4f97`
     *
     * `colors.accentBorder`
     */
    _accentBorder: unknown;
    /**
     * 危险：删除、错误。red 9：亮色 `#ce2c31`，暗色 `#b54548`
     *
     * `colors.danger`
     */
    _danger: unknown;
    /**
     * 危险按下。red 10：亮色 `#b8272c`，暗色 `#a33b3e`
     *
     * `colors.dangerActive`
     */
    _dangerActive: unknown;
    /**
     * 危险色上的文字。白色
     *
     * `colors.dangerContrast`
     */
    _dangerContrast: unknown;
    /**
     * 危险的文字。red 11：亮色 `#b8272c`，暗色 `#ff9592`
     *
     * `colors.dangerText`
     */
    _dangerText: unknown;
    /**
     * 危险的浅底。red 3：亮色 `#feebec`，暗色 `#3b1219`
     *
     * `colors.dangerSoft`
     */
    _dangerSoft: unknown;
    /**
     * 危险的浅底按下。red 4：亮色 `#ffdbdc`，暗色 `#500f1c`
     *
     * `colors.dangerSoftActive`
     */
    _dangerSoftActive: unknown;
    /**
     * 危险的边框。red 7：亮色 `#f4a9aa`，暗色 `#8c333a`
     *
     * `colors.dangerBorder`
     */
    _dangerBorder: unknown;
    /**
     * 成功。green 9：亮色 `#008751`，暗色 `#30a46c`
     *
     * `colors.success`
     */
    _success: unknown;
    /**
     * 成功按下。亮色 `#007143`，暗色 `#52af7d`
     *
     * `colors.successActive`
     */
    _successActive: unknown;
    /**
     * 成功色上的文字。亮色白色，暗色 slate 1
     *
     * `colors.successContrast`
     */
    _successContrast: unknown;
    /**
     * 成功的文字。green 11：亮色 `#193b2d`，暗色 `#3dd68c`
     *
     * `colors.successText`
     */
    _successText: unknown;
    /**
     * 成功的浅底。green 3：亮色 `#e6f6eb`，暗色 `#132d21`
     *
     * `colors.successSoft`
     */
    _successSoft: unknown;
    /**
     * 成功的浅底按下。green 4：亮色 `#d6f1df`，暗色 `#113b29`
     *
     * `colors.successSoftActive`
     */
    _successSoftActive: unknown;
    /**
     * 成功的边框。green 7：亮色 `#8eceaa`，暗色 `#28684a`
     *
     * `colors.successBorder`
     */
    _successBorder: unknown;
    /**
     * 警告。amber 9 `#ffc53d`
     *
     * `colors.warning`
     */
    _warning: unknown;
    /**
     * 警告按下。amber 10 `#ffcd5f`
     *
     * `colors.warningActive`
     */
    _warningActive: unknown;
    /**
     * 警告色上的文字（深色）。亮色 `#4f3422`，暗色 slate 1
     *
     * `colors.warningContrast`
     */
    _warningContrast: unknown;
    /**
     * 警告的文字。amber 11：亮色 `#4f3422`，暗色 `#ffca16`
     *
     * `colors.warningText`
     */
    _warningText: unknown;
    /**
     * 警告的浅底。amber 3：亮色 `#fff7c2`，暗色 `#302008`
     *
     * `colors.warningSoft`
     */
    _warningSoft: unknown;
    /**
     * 警告的浅底按下。amber 4：亮色 `#ffee9c`，暗色 `#3f2700`
     *
     * `colors.warningSoftActive`
     */
    _warningSoftActive: unknown;
    /**
     * 警告的边框。amber 7：亮色 `#e9c162`，暗色 `#714f19`
     *
     * `colors.warningBorder`
     */
    _warningBorder: unknown;
    /**
     * 信息。blue 9：亮色 `#0073e0`，暗色 `#0090ff`
     *
     * `colors.info`
     */
    _info: unknown;
    /**
     * 信息按下。亮色 `#0060bd`，暗色 `#3d9fff`
     *
     * `colors.infoActive`
     */
    _infoActive: unknown;
    /**
     * 信息色上的文字。亮色白色，暗色 slate 1
     *
     * `colors.infoContrast`
     */
    _infoContrast: unknown;
    /**
     * 信息的文字。blue 11：亮色 `#113264`，暗色 `#70b8ff`
     *
     * `colors.infoText`
     */
    _infoText: unknown;
    /**
     * 信息的浅底。blue 3：亮色 `#e6f4fe`，暗色 `#0d2847`
     *
     * `colors.infoSoft`
     */
    _infoSoft: unknown;
    /**
     * 信息的浅底按下。blue 4：亮色 `#d5efff`，暗色 `#003362`
     *
     * `colors.infoSoftActive`
     */
    _infoSoftActive: unknown;
    /**
     * 信息的边框。blue 7：亮色 `#8ec8f6`，暗色 `#205d9e`
     *
     * `colors.infoBorder`
     */
    _infoBorder: unknown;
    /**
     * 反色表面：轻提示（Toast）、气泡。亮色 slate 12 `#1c2024`，暗色 slate 12 `#edeef0`
     *
     * `colors.inverseSurface`
     */
    _inverseSurface: unknown;
    /**
     * 反色表面上的文字
     *
     * `colors.inverseText`
     */
    _inverseText: unknown;
    /**
     * 遮罩：弹出层、对话框下面的半透明黑。亮色 0.5，暗色 0.7
     *
     * `colors.overlay`
     */
    _overlay: unknown;
    /**
     * 焦点环（H5 的键盘焦点）
     *
     * `colors.focusRing`
     */
    _focusRing: unknown;
  }
  /** 颜色：slate 中性色、indigo 品牌色、red 危险、green 成功、amber 警告、blue 信息 */
  interface QualifiedColorsTokens {
    /**
     * 页面底色：分组列表、卡片下面的灰底。slate 3：亮色 `#f0f0f3`，暗色 slate 1 `#111113`
     *
     * `colors.background`
     */
    '_colors.background': unknown;
    /**
     * 单元格、卡片、弹出层的表面。亮色白色，暗色 slate 2 `#18191b`
     *
     * `colors.surface`
     */
    '_colors.surface': unknown;
    /**
     * 表面里再分一层：搜索框、步进器、标签的底。slate 2：亮色 `#f9f9fb`，暗色 slate 3 `#212225`
     *
     * `colors.surfaceMuted`
     */
    '_colors.surfaceMuted': unknown;
    /**
     * 填充：弱按钮、开关关闭态、骨架。slate 3：亮色 `#f0f0f3`，暗色 slate 4 `#272a2d`
     *
     * `colors.fill`
     */
    '_colors.fill': unknown;
    /**
     * 按下时的底色：单元格、菜单项按住。slate 4：亮色 `#e8e8ec`，暗色 slate 5 `#2e3135`
     *
     * `colors.fillActive`
     */
    '_colors.fillActive': unknown;
    /**
     * 主要文字。slate 12：亮色 `#1c2024`，暗色 `#edeef0`
     *
     * `colors.text`
     */
    '_colors.text': unknown;
    /**
     * 次要文字、说明、图标。slate 11：亮色 `#60646c`，暗色 `#b0b4ba`
     *
     * `colors.textMuted`
     */
    '_colors.textMuted': unknown;
    /**
     * 占位文字。slate 10：亮色 `#80838d`，暗色 `#777b84`
     *
     * `colors.textPlaceholder`
     */
    '_colors.textPlaceholder': unknown;
    /**
     * 不可用的文字。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169`
     *
     * `colors.textDisabled`
     */
    '_colors.textDisabled': unknown;
    /**
     * 分隔线、单元格之间的细线。slate 6：亮色 `#d9d9e0`，暗色 `#363a3f`
     *
     * `colors.border`
     */
    '_colors.border': unknown;
    /**
     * 输入框、描边按钮的边框。slate 7：亮色 `#cdced6`，暗色 `#43484e`
     *
     * `colors.borderStrong`
     */
    '_colors.borderStrong': unknown;
    /**
     * 品牌色：主要按钮、选中、开关打开。indigo 9 `#3e63dd`
     *
     * `colors.accent`
     */
    '_colors.accent': unknown;
    /**
     * 品牌色按下。indigo 10：亮色 `#3358d4`，暗色 `#3758d4`
     *
     * `colors.accentActive`
     */
    '_colors.accentActive': unknown;
    /**
     * 品牌色上的文字。白色
     *
     * `colors.accentContrast`
     */
    '_colors.accentContrast': unknown;
    /**
     * 品牌色的文字（链接、浅色按钮的字）。indigo 11：亮色 `#3a5bc7`，暗色 `#9eb1ff`
     *
     * `colors.accentText`
     */
    '_colors.accentText': unknown;
    /**
     * 品牌色的浅底。indigo 3：亮色 `#edf2fe`，暗色 `#182449`
     *
     * `colors.accentSoft`
     */
    '_colors.accentSoft': unknown;
    /**
     * 品牌色的浅底按下。indigo 4：亮色 `#e1e9ff`，暗色 `#1d2e62`
     *
     * `colors.accentSoftActive`
     */
    '_colors.accentSoftActive': unknown;
    /**
     * 品牌色的边框。indigo 7：亮色 `#abbdf9`，暗色 `#3a4f97`
     *
     * `colors.accentBorder`
     */
    '_colors.accentBorder': unknown;
    /**
     * 危险：删除、错误。red 9：亮色 `#ce2c31`，暗色 `#b54548`
     *
     * `colors.danger`
     */
    '_colors.danger': unknown;
    /**
     * 危险按下。red 10：亮色 `#b8272c`，暗色 `#a33b3e`
     *
     * `colors.dangerActive`
     */
    '_colors.dangerActive': unknown;
    /**
     * 危险色上的文字。白色
     *
     * `colors.dangerContrast`
     */
    '_colors.dangerContrast': unknown;
    /**
     * 危险的文字。red 11：亮色 `#b8272c`，暗色 `#ff9592`
     *
     * `colors.dangerText`
     */
    '_colors.dangerText': unknown;
    /**
     * 危险的浅底。red 3：亮色 `#feebec`，暗色 `#3b1219`
     *
     * `colors.dangerSoft`
     */
    '_colors.dangerSoft': unknown;
    /**
     * 危险的浅底按下。red 4：亮色 `#ffdbdc`，暗色 `#500f1c`
     *
     * `colors.dangerSoftActive`
     */
    '_colors.dangerSoftActive': unknown;
    /**
     * 危险的边框。red 7：亮色 `#f4a9aa`，暗色 `#8c333a`
     *
     * `colors.dangerBorder`
     */
    '_colors.dangerBorder': unknown;
    /**
     * 成功。green 9：亮色 `#008751`，暗色 `#30a46c`
     *
     * `colors.success`
     */
    '_colors.success': unknown;
    /**
     * 成功按下。亮色 `#007143`，暗色 `#52af7d`
     *
     * `colors.successActive`
     */
    '_colors.successActive': unknown;
    /**
     * 成功色上的文字。亮色白色，暗色 slate 1
     *
     * `colors.successContrast`
     */
    '_colors.successContrast': unknown;
    /**
     * 成功的文字。green 11：亮色 `#193b2d`，暗色 `#3dd68c`
     *
     * `colors.successText`
     */
    '_colors.successText': unknown;
    /**
     * 成功的浅底。green 3：亮色 `#e6f6eb`，暗色 `#132d21`
     *
     * `colors.successSoft`
     */
    '_colors.successSoft': unknown;
    /**
     * 成功的浅底按下。green 4：亮色 `#d6f1df`，暗色 `#113b29`
     *
     * `colors.successSoftActive`
     */
    '_colors.successSoftActive': unknown;
    /**
     * 成功的边框。green 7：亮色 `#8eceaa`，暗色 `#28684a`
     *
     * `colors.successBorder`
     */
    '_colors.successBorder': unknown;
    /**
     * 警告。amber 9 `#ffc53d`
     *
     * `colors.warning`
     */
    '_colors.warning': unknown;
    /**
     * 警告按下。amber 10 `#ffcd5f`
     *
     * `colors.warningActive`
     */
    '_colors.warningActive': unknown;
    /**
     * 警告色上的文字（深色）。亮色 `#4f3422`，暗色 slate 1
     *
     * `colors.warningContrast`
     */
    '_colors.warningContrast': unknown;
    /**
     * 警告的文字。amber 11：亮色 `#4f3422`，暗色 `#ffca16`
     *
     * `colors.warningText`
     */
    '_colors.warningText': unknown;
    /**
     * 警告的浅底。amber 3：亮色 `#fff7c2`，暗色 `#302008`
     *
     * `colors.warningSoft`
     */
    '_colors.warningSoft': unknown;
    /**
     * 警告的浅底按下。amber 4：亮色 `#ffee9c`，暗色 `#3f2700`
     *
     * `colors.warningSoftActive`
     */
    '_colors.warningSoftActive': unknown;
    /**
     * 警告的边框。amber 7：亮色 `#e9c162`，暗色 `#714f19`
     *
     * `colors.warningBorder`
     */
    '_colors.warningBorder': unknown;
    /**
     * 信息。blue 9：亮色 `#0073e0`，暗色 `#0090ff`
     *
     * `colors.info`
     */
    '_colors.info': unknown;
    /**
     * 信息按下。亮色 `#0060bd`，暗色 `#3d9fff`
     *
     * `colors.infoActive`
     */
    '_colors.infoActive': unknown;
    /**
     * 信息色上的文字。亮色白色，暗色 slate 1
     *
     * `colors.infoContrast`
     */
    '_colors.infoContrast': unknown;
    /**
     * 信息的文字。blue 11：亮色 `#113264`，暗色 `#70b8ff`
     *
     * `colors.infoText`
     */
    '_colors.infoText': unknown;
    /**
     * 信息的浅底。blue 3：亮色 `#e6f4fe`，暗色 `#0d2847`
     *
     * `colors.infoSoft`
     */
    '_colors.infoSoft': unknown;
    /**
     * 信息的浅底按下。blue 4：亮色 `#d5efff`，暗色 `#003362`
     *
     * `colors.infoSoftActive`
     */
    '_colors.infoSoftActive': unknown;
    /**
     * 信息的边框。blue 7：亮色 `#8ec8f6`，暗色 `#205d9e`
     *
     * `colors.infoBorder`
     */
    '_colors.infoBorder': unknown;
    /**
     * 反色表面：轻提示（Toast）、气泡。亮色 slate 12 `#1c2024`，暗色 slate 12 `#edeef0`
     *
     * `colors.inverseSurface`
     */
    '_colors.inverseSurface': unknown;
    /**
     * 反色表面上的文字
     *
     * `colors.inverseText`
     */
    '_colors.inverseText': unknown;
    /**
     * 遮罩：弹出层、对话框下面的半透明黑。亮色 0.5，暗色 0.7
     *
     * `colors.overlay`
     */
    '_colors.overlay': unknown;
    /**
     * 焦点环（H5 的键盘焦点）
     *
     * `colors.focusRing`
     */
    '_colors.focusRing': unknown;
  }
  /** 字体族：系统字体优先，数字用等宽数字（组件里 fontVariantNumeric: 'tabular-nums'） */
  interface FontsTokens {
    /**
     * 正文与标题
     *
     * `fonts.sans`
     */
    _sans: unknown;
    /**
     * 代码、验证码这类等宽内容
     *
     * `fonts.mono`
     */
    _mono: unknown;
  }
  /** 字体族：系统字体优先，数字用等宽数字（组件里 fontVariantNumeric: 'tabular-nums'） */
  interface QualifiedFontsTokens {
    /**
     * 正文与标题
     *
     * `fonts.sans`
     */
    '_fonts.sans': unknown;
    /**
     * 代码、验证码这类等宽内容
     *
     * `fonts.mono`
     */
    '_fonts.mono': unknown;
  }
  /** 字号（375 宽的设计稿）：组件根元素的字号决定内部尺寸（em） */
  interface FontSizesTokens {
    /**
     * 辅助说明、标签、角标 `12px`
     *
     * `fontSizes.xs`
     */
    _xs: unknown;
    /**
     * 次要正文、小按钮 `13px`
     *
     * `fontSizes.sm`
     */
    _sm: unknown;
    /**
     * 正文、单元格 `14px`
     *
     * `fontSizes.md`
     */
    _md: unknown;
    /**
     * 按钮、导航栏标题、强调正文 `16px`
     *
     * `fontSizes.lg`
     */
    _lg: unknown;
    /**
     * 弹窗标题 `18px`
     *
     * `fontSizes.xl`
     */
    _xl: unknown;
    /**
     * 页面标题 `20px`
     *
     * `fontSizes.xxl`
     */
    _xxl: unknown;
    /**
     * 数值、结果页标题 `24px`
     *
     * `fontSizes.xxxl`
     */
    _xxxl: unknown;
  }
  /** 字号（375 宽的设计稿）：组件根元素的字号决定内部尺寸（em） */
  interface QualifiedFontSizesTokens {
    /**
     * 辅助说明、标签、角标 `12px`
     *
     * `fontSizes.xs`
     */
    '_fontSizes.xs': unknown;
    /**
     * 次要正文、小按钮 `13px`
     *
     * `fontSizes.sm`
     */
    '_fontSizes.sm': unknown;
    /**
     * 正文、单元格 `14px`
     *
     * `fontSizes.md`
     */
    '_fontSizes.md': unknown;
    /**
     * 按钮、导航栏标题、强调正文 `16px`
     *
     * `fontSizes.lg`
     */
    '_fontSizes.lg': unknown;
    /**
     * 弹窗标题 `18px`
     *
     * `fontSizes.xl`
     */
    '_fontSizes.xl': unknown;
    /**
     * 页面标题 `20px`
     *
     * `fontSizes.xxl`
     */
    '_fontSizes.xxl': unknown;
    /**
     * 数值、结果页标题 `24px`
     *
     * `fontSizes.xxxl`
     */
    '_fontSizes.xxxl': unknown;
  }
  /** 字重 */
  interface FontWeightsTokens {
    /**
     * 常规 `400`
     *
     * `fontWeights.normal`
     */
    _normal: unknown;
    /**
     * 中等：按钮、标签页 `500`
     *
     * `fontWeights.medium`
     */
    _medium: unknown;
    /**
     * 半粗：标题 `600`
     *
     * `fontWeights.semibold`
     */
    _semibold: unknown;
    /**
     * 粗：数值 `700`
     *
     * `fontWeights.bold`
     */
    _bold: unknown;
  }
  /** 字重 */
  interface QualifiedFontWeightsTokens {
    /**
     * 常规 `400`
     *
     * `fontWeights.normal`
     */
    '_fontWeights.normal': unknown;
    /**
     * 中等：按钮、标签页 `500`
     *
     * `fontWeights.medium`
     */
    '_fontWeights.medium': unknown;
    /**
     * 半粗：标题 `600`
     *
     * `fontWeights.semibold`
     */
    '_fontWeights.semibold': unknown;
    /**
     * 粗：数值 `700`
     *
     * `fontWeights.bold`
     */
    '_fontWeights.bold': unknown;
  }
  /** 行高（不带单位） */
  interface LineHeightsTokens {
    /**
     * 单行控件 `1`
     *
     * `lineHeights.none`
     */
    _none: unknown;
    /**
     * 标题 `1.25`
     *
     * `lineHeights.tight`
     */
    _tight: unknown;
    /**
     * 正文 `1.5`
     *
     * `lineHeights.normal`
     */
    _normal: unknown;
    /**
     * 长段落 `1.75`
     *
     * `lineHeights.relaxed`
     */
    _relaxed: unknown;
  }
  /** 行高（不带单位） */
  interface QualifiedLineHeightsTokens {
    /**
     * 单行控件 `1`
     *
     * `lineHeights.none`
     */
    '_lineHeights.none': unknown;
    /**
     * 标题 `1.25`
     *
     * `lineHeights.tight`
     */
    '_lineHeights.tight': unknown;
    /**
     * 正文 `1.5`
     *
     * `lineHeights.normal`
     */
    '_lineHeights.normal': unknown;
    /**
     * 长段落 `1.75`
     *
     * `lineHeights.relaxed`
     */
    '_lineHeights.relaxed': unknown;
  }
  /** 字距 */
  interface LetterSpacingsTokens {
    /**
     * 默认 `0`
     *
     * `letterSpacings.normal`
     */
    _normal: unknown;
    /**
     * 大号数字、标题略收 `-0.01em`
     *
     * `letterSpacings.tight`
     */
    _tight: unknown;
    /**
     * 全大写的小字略放 `0.02em`
     *
     * `letterSpacings.wide`
     */
    _wide: unknown;
  }
  /** 字距 */
  interface QualifiedLetterSpacingsTokens {
    /**
     * 默认 `0`
     *
     * `letterSpacings.normal`
     */
    '_letterSpacings.normal': unknown;
    /**
     * 大号数字、标题略收 `-0.01em`
     *
     * `letterSpacings.tight`
     */
    '_letterSpacings.tight': unknown;
    /**
     * 全大写的小字略放 `0.02em`
     *
     * `letterSpacings.wide`
     */
    '_letterSpacings.wide': unknown;
  }
  /** 间距（em，随字号缩放） */
  interface SpaceTokens {
    /**
     * 没有间距 `0`
     *
     * `space.none`
     */
    _none: unknown;
    /**
     * 极小：图标与文字之间 `0.25em`
     *
     * `space.xs`
     */
    _xs: unknown;
    /**
     * 小：紧凑的内边距 `0.5em`
     *
     * `space.sm`
     */
    _sm: unknown;
    /**
     * 中：常用的间隔 `0.75em`
     *
     * `space.md`
     */
    _md: unknown;
    /**
     * 大：单元格的左右内边距 `1em`
     *
     * `space.lg`
     */
    _lg: unknown;
    /**
     * 很大：分组之间 `1.5em`
     *
     * `space.xl`
     */
    _xl: unknown;
    /**
     * 特大：页面区块之间 `2em`
     *
     * `space.xxl`
     */
    _xxl: unknown;
  }
  /** 间距（em，随字号缩放） */
  interface QualifiedSpaceTokens {
    /**
     * 没有间距 `0`
     *
     * `space.none`
     */
    '_space.none': unknown;
    /**
     * 极小：图标与文字之间 `0.25em`
     *
     * `space.xs`
     */
    '_space.xs': unknown;
    /**
     * 小：紧凑的内边距 `0.5em`
     *
     * `space.sm`
     */
    '_space.sm': unknown;
    /**
     * 中：常用的间隔 `0.75em`
     *
     * `space.md`
     */
    '_space.md': unknown;
    /**
     * 大：单元格的左右内边距 `1em`
     *
     * `space.lg`
     */
    '_space.lg': unknown;
    /**
     * 很大：分组之间 `1.5em`
     *
     * `space.xl`
     */
    '_space.xl': unknown;
    /**
     * 特大：页面区块之间 `2em`
     *
     * `space.xxl`
     */
    '_space.xxl': unknown;
  }
  /** 尺寸 */
  interface SizesTokens {
    /**
     * 单行控件（输入框、单元格）的最小高度 `2.75em`（14px 字号时 38.5px，16px 时 44px）
     *
     * `sizes.control`
     */
    _control: unknown;
    /**
     * 触控目标的最小尺寸 `44px`（iOS 人机界面指南）
     *
     * `sizes.touchTarget`
     */
    _touchTarget: unknown;
    /**
     * 占满容器 `100%`
     *
     * `sizes.full`
     */
    _full: unknown;
  }
  /** 尺寸 */
  interface QualifiedSizesTokens {
    /**
     * 单行控件（输入框、单元格）的最小高度 `2.75em`（14px 字号时 38.5px，16px 时 44px）
     *
     * `sizes.control`
     */
    '_sizes.control': unknown;
    /**
     * 触控目标的最小尺寸 `44px`（iOS 人机界面指南）
     *
     * `sizes.touchTarget`
     */
    '_sizes.touchTarget': unknown;
    /**
     * 占满容器 `100%`
     *
     * `sizes.full`
     */
    '_sizes.full': unknown;
  }
  /** 圆角（em） */
  interface RadiiTokens {
    /**
     * 直角 `0`
     *
     * `radii.none`
     */
    _none: unknown;
    /**
     * 极小：角标、复选框 `0.125em`
     *
     * `radii.xs`
     */
    _xs: unknown;
    /**
     * 小：标签、小按钮 `0.25em`
     *
     * `radii.sm`
     */
    _sm: unknown;
    /**
     * 中：按钮、输入框 `0.5em`
     *
     * `radii.md`
     */
    _md: unknown;
    /**
     * 大：卡片、分组 `0.75em`
     *
     * `radii.lg`
     */
    _lg: unknown;
    /**
     * 很大：弹出层、对话框 `1em`
     *
     * `radii.xl`
     */
    _xl: unknown;
    /**
     * 全圆：胶囊按钮、头像 `9999px`
     *
     * `radii.full`
     */
    _full: unknown;
  }
  /** 圆角（em） */
  interface QualifiedRadiiTokens {
    /**
     * 直角 `0`
     *
     * `radii.none`
     */
    '_radii.none': unknown;
    /**
     * 极小：角标、复选框 `0.125em`
     *
     * `radii.xs`
     */
    '_radii.xs': unknown;
    /**
     * 小：标签、小按钮 `0.25em`
     *
     * `radii.sm`
     */
    '_radii.sm': unknown;
    /**
     * 中：按钮、输入框 `0.5em`
     *
     * `radii.md`
     */
    '_radii.md': unknown;
    /**
     * 大：卡片、分组 `0.75em`
     *
     * `radii.lg`
     */
    '_radii.lg': unknown;
    /**
     * 很大：弹出层、对话框 `1em`
     *
     * `radii.xl`
     */
    '_radii.xl': unknown;
    /**
     * 全圆：胶囊按钮、头像 `9999px`
     *
     * `radii.full`
     */
    '_radii.full': unknown;
  }
  /** 边框宽度（px） */
  interface BorderWidthsTokens {
    /**
     * 没有边框 `0`
     *
     * `borderWidths.none`
     */
    _none: unknown;
    /**
     * 细线：单元格分隔线（高分屏上的半像素） `0.5px`
     *
     * `borderWidths.hairline`
     */
    _hairline: unknown;
    /**
     * 常规边框 `1px`
     *
     * `borderWidths.xs`
     */
    _xs: unknown;
    /**
     * 焦点环、选中描边 `2px`
     *
     * `borderWidths.sm`
     */
    _sm: unknown;
  }
  /** 边框宽度（px） */
  interface QualifiedBorderWidthsTokens {
    /**
     * 没有边框 `0`
     *
     * `borderWidths.none`
     */
    '_borderWidths.none': unknown;
    /**
     * 细线：单元格分隔线（高分屏上的半像素） `0.5px`
     *
     * `borderWidths.hairline`
     */
    '_borderWidths.hairline': unknown;
    /**
     * 常规边框 `1px`
     *
     * `borderWidths.xs`
     */
    '_borderWidths.xs': unknown;
    /**
     * 焦点环、选中描边 `2px`
     *
     * `borderWidths.sm`
     */
    '_borderWidths.sm': unknown;
  }
  /** 阴影：亮色主题用，暗色主题靠表面的层级区分 */
  interface ShadowsTokens {
    /**
     * 没有阴影
     *
     * `shadows.none`
     */
    _none: unknown;
    /**
     * 卡片
     *
     * `shadows.sm`
     */
    _sm: unknown;
    /**
     * 悬浮按钮、吸顶的栏
     *
     * `shadows.md`
     */
    _md: unknown;
    /**
     * 弹出层、对话框
     *
     * `shadows.lg`
     */
    _lg: unknown;
  }
  /** 阴影：亮色主题用，暗色主题靠表面的层级区分 */
  interface QualifiedShadowsTokens {
    /**
     * 没有阴影
     *
     * `shadows.none`
     */
    '_shadows.none': unknown;
    /**
     * 卡片
     *
     * `shadows.sm`
     */
    '_shadows.sm': unknown;
    /**
     * 悬浮按钮、吸顶的栏
     *
     * `shadows.md`
     */
    '_shadows.md': unknown;
    /**
     * 弹出层、对话框
     *
     * `shadows.lg`
     */
    '_shadows.lg': unknown;
  }
  /** 动效时长；系统开了"减少动态效果"时为 0 */
  interface DurationsTokens {
    /**
     * 没有过渡 `0ms`
     *
     * `durations.none`
     */
    _none: unknown;
    /**
     * 按压反馈 `100ms`
     *
     * `durations.xs`
     */
    _xs: unknown;
    /**
     * 颜色、开关 `160ms`
     *
     * `durations.sm`
     */
    _sm: unknown;
    /**
     * 展开收起、提示进出 `240ms`
     *
     * `durations.md`
     */
    _md: unknown;
    /**
     * 弹出层滑入滑出 `300ms`
     *
     * `durations.lg`
     */
    _lg: unknown;
  }
  /** 动效时长；系统开了"减少动态效果"时为 0 */
  interface QualifiedDurationsTokens {
    /**
     * 没有过渡 `0ms`
     *
     * `durations.none`
     */
    '_durations.none': unknown;
    /**
     * 按压反馈 `100ms`
     *
     * `durations.xs`
     */
    '_durations.xs': unknown;
    /**
     * 颜色、开关 `160ms`
     *
     * `durations.sm`
     */
    '_durations.sm': unknown;
    /**
     * 展开收起、提示进出 `240ms`
     *
     * `durations.md`
     */
    '_durations.md': unknown;
    /**
     * 弹出层滑入滑出 `300ms`
     *
     * `durations.lg`
     */
    '_durations.lg': unknown;
  }
  /** 缓动 */
  interface EasingsTokens {
    /**
     * 一般的过渡
     *
     * `easings.standard`
     */
    _standard: unknown;
    /**
     * 进场：快出慢停
     *
     * `easings.enter`
     */
    _enter: unknown;
    /**
     * 离场：慢起快走
     *
     * `easings.exit`
     */
    _exit: unknown;
  }
  /** 缓动 */
  interface QualifiedEasingsTokens {
    /**
     * 一般的过渡
     *
     * `easings.standard`
     */
    '_easings.standard': unknown;
    /**
     * 进场：快出慢停
     *
     * `easings.enter`
     */
    '_easings.enter': unknown;
    /**
     * 离场：慢起快走
     *
     * `easings.exit`
     */
    '_easings.exit': unknown;
  }
  /** 不透明度 */
  interface OpacitiesTokens {
    /**
     * 不可用 `0.5`
     *
     * `opacities.disabled`
     */
    _disabled: unknown;
    /**
     * 按下时叠在内容上的暗层（实底按钮） `0.1`
     *
     * `opacities.pressed`
     */
    _pressed: unknown;
  }
  /** 不透明度 */
  interface QualifiedOpacitiesTokens {
    /**
     * 不可用 `0.5`
     *
     * `opacities.disabled`
     */
    '_opacities.disabled': unknown;
    /**
     * 按下时叠在内容上的暗层（实底按钮） `0.1`
     *
     * `opacities.pressed`
     */
    '_opacities.pressed': unknown;
  }
  /** SVG 描边宽度（图标） */
  interface StrokeWidthsTokens {
    /**
     * 细 `1.5`
     *
     * `strokeWidths.sm`
     */
    _sm: unknown;
    /**
     * 常规 `2`
     *
     * `strokeWidths.md`
     */
    _md: unknown;
    /**
     * 粗 `2.5`
     *
     * `strokeWidths.lg`
     */
    _lg: unknown;
  }
  /** SVG 描边宽度（图标） */
  interface QualifiedStrokeWidthsTokens {
    /**
     * 细 `1.5`
     *
     * `strokeWidths.sm`
     */
    '_strokeWidths.sm': unknown;
    /**
     * 常规 `2`
     *
     * `strokeWidths.md`
     */
    '_strokeWidths.md': unknown;
    /**
     * 粗 `2.5`
     *
     * `strokeWidths.lg`
     */
    '_strokeWidths.lg': unknown;
  }
}

export {};
