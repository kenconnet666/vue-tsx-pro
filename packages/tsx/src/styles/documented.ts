// 由 scripts/css-docs/generate.mjs 生成，请勿手改；数据来源见 scripts/css-docs/NOTICE.md。
// 主题库填入 token 接口之前，`keyof FontSizesTokens` 这类 token 名都是 never（联合里多余、彼此重复）
// oxlint-disable no-redundant-type-constituents, no-duplicate-type-constituents
import type { CSSProperties } from './css-properties';
import type { KeywordValue, OpenValue, StyleValue } from './value';
import type {
  BorderWidthsTokens,
  ColorsTokens,
  DurationsTokens,
  EasingsTokens,
  FontSizesTokens,
  FontWeightsTokens,
  FontsTokens,
  LetterSpacingsTokens,
  LineHeightsTokens,
  OpacitiesTokens,
  QualifiedBorderWidthsTokens,
  QualifiedColorsTokens,
  QualifiedDurationsTokens,
  QualifiedEasingsTokens,
  QualifiedFontSizesTokens,
  QualifiedFontWeightsTokens,
  QualifiedFontsTokens,
  QualifiedLetterSpacingsTokens,
  QualifiedLineHeightsTokens,
  QualifiedOpacitiesTokens,
  QualifiedRadiiTokens,
  QualifiedShadowsTokens,
  QualifiedSizesTokens,
  QualifiedSpaceTokens,
  QualifiedStrokeWidthsTokens,
  RadiiTokens,
  ShadowsTokens,
  SizesTokens,
  SpaceTokens,
  StrokeWidthsTokens,
} from './index';

/** 样式对象：每个属性带中文说明，值类型引用 CSS 类型表（css-properties.ts） */
export interface DocumentedStyles {
  /**
   * 非标准键：StyleX 类型中保留的名称，不对应任何 CSS 属性，不要使用。（theme）
   */
  theme?: StyleValue<OpenValue<CSSProperties['theme']> | keyof CssWideKeywords>;
  /**
   * Firefox 在 macOS 上的字体平滑方式（-moz-osx-font-smoothing），非标准；grayscale 可让深色背景上的浅色文字更细。
   *
   * 常用值：
   * - `grayscale`：macOS 上改用灰度抗锯齿而非次像素渲染，文字更细，常用于深色背景上的浅色文字。非标准，仅 Firefox（macOS）支持。
   */
  MozOsxFontSmoothing?: StyleValue<
    KeywordValue<MozOsxFontSmoothingValues, CSSProperties['MozOsxFontSmoothing']>
  >;
  /**
   * 控制表单控件是否使用系统原生外观（-webkit-appearance）；标准写法是 appearance，常用 none 去掉原生样式后自绘。
   *
   * 常用值：`none`、`button`、`button-bevel`、`caret`、`checkbox`、`default-button`、`inner-spin-button`、`listbox`、`listitem`、`media-controls-background`、`media-controls-fullscreen-background`、`media-current-time-display`、`media-enter-fullscreen-button`、`media-exit-fullscreen-button`、`media-fullscreen-button`、`media-mute-button`、`media-overlay-play-button`、`media-play-button`、`media-seek-back-button`、`media-seek-forward-button`、`media-slider`、`media-sliderthumb`、`media-time-remaining-display`、`media-toggle-closed-captions-button`、`media-volume-slider`、`media-volume-slider-container`、`media-volume-sliderthumb`、`menulist`、`menulist-button`、`menulist-text`、`menulist-textfield`、`meter`、`progress-bar`、`progress-bar-value`、`push-button`、`radio`、`searchfield`、`searchfield-cancel-button`、`searchfield-decoration`、`searchfield-results-button`、`searchfield-results-decoration`、`slider-horizontal`、`slider-vertical`、`sliderthumb-horizontal`、`sliderthumb-vertical`、`square-button`、`textarea`、`textfield`、`apple-pay-button`
   *
   * 初始值 `noneButOverriddenInUserAgentCSS`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/appearance
   */
  WebkitAppearance?: StyleValue<
    | OpenValue<CSSProperties['WebkitAppearance']>
    | keyof CssWideKeywords
    | keyof WebkitAppearanceKeywords
  >;
  /**
   * WebKit 在 macOS 上的字体抗锯齿方式（-webkit-font-smoothing），非标准；antialiased 让文字显得更细。
   *
   * 常用值：
   * - `antialiased`：在 macOS 上改用灰度抗锯齿，文字比默认的子像素渲染更细；非标准，仅 macOS 的 WebKit/Blink 生效。
   */
  WebkitFontSmoothing?: StyleValue<
    KeywordValue<WebkitFontSmoothingValues, CSSProperties['WebkitFontSmoothing']>
  >;
  /**
   * 移动端点击元素时出现的高亮颜色（-webkit-tap-highlight-color），非标准；设为 transparent 可去掉高亮。
   *
   * 初始值 `black`；继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-tap-highlight-color
   */
  WebkitTapHighlightColor?: StyleValue<
    | OpenValue<CSSProperties['WebkitTapHighlightColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedColorsTokens
  >;
  /**
   * 带 WebKit 前缀的遮罩图像（-webkit-mask-image）；标准写法是 maskImage，只在兼容旧版 Safari 时使用。
   *
   * 初始值 `none`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-image
   */
  WebkitMaskImage?: StyleValue<
    OpenValue<CSSProperties['WebkitMaskImage']> | keyof CssWideKeywords | keyof CssMaskReference
  >;
  /**
   * 文字的填充颜色（-webkit-text-fill-color），优先于 color；常与 backgroundClip: text 配合做渐变文字。
   *
   * 初始值 `currentcolor`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-text-fill-color
   */
  WebkitTextFillColor?: StyleValue<
    | OpenValue<CSSProperties['WebkitTextFillColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 无前缀的文字填充颜色，浏览器尚未支持；请使用 WebkitTextFillColor。（text-fill-color）
   */
  textFillColor?: StyleValue<OpenValue<CSSProperties['textFillColor']> | keyof CssWideKeywords>;
  /**
   * 文字描边的宽度（-webkit-text-stroke-width）。
   *
   * 数字值自动加 `px`；初始值 `0`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-text-stroke-width
   */
  WebkitTextStrokeWidth?: StyleValue<
    | OpenValue<CSSProperties['WebkitTextStrokeWidth']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 文字描边的颜色（-webkit-text-stroke-color）。
   *
   * 初始值 `currentcolor`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-text-stroke-color
   */
  WebkitTextStrokeColor?: StyleValue<
    | OpenValue<CSSProperties['WebkitTextStrokeColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 带 WebKit 前缀的背景裁剪区域（-webkit-background-clip）；取值 text 时背景只画在文字里，用于渐变文字。
   *
   * 常用值：
   * - `border-box`：背景延伸到边框外沿，会画在边框下方，是默认行为。
   * - `content-box`：背景只绘制在内容区内，内边距和边框区域不显示背景。
   * - `padding-box`：背景只绘制到内边距外沿，边框区域不显示背景。
   * - `text`：把背景裁剪成文字形状，只在字形内可见，配合透明文字颜色可做渐变文字。
   */
  WebkitBackgroundClip?: StyleValue<
    KeywordValue<WebkitBackgroundClipValues, CSSProperties['WebkitBackgroundClip']>
  >;
  /**
   * 指定旧版弹性盒的排列方向；仅为多行截断兼容保留，常规布局请使用 Flex/Grid。（-webkit-box-orient）
   *
   * 常用值：
   * - `block-axis`：旧版弹性盒的子元素沿块轴排列，横排文字下等同 `vertical`。
   * - `horizontal`：旧版弹性盒的子元素水平排列。
   * - `inline-axis`：旧版弹性盒的子元素沿行内轴排列，横排文字下等同 `horizontal`。
   * - `vertical`：旧版弹性盒的子元素垂直排列，与 `WebkitLineClamp` 配合实现多行截断。
   */
  WebkitBoxOrient?: StyleValue<
    KeywordValue<WebkitBoxOrientValues, CSSProperties['WebkitBoxOrient']>
  >;
  /**
   * 限制多行文本显示的行数；需要同时写 display: '-webkit-box'、WebkitBoxOrient: 'vertical' 和 overflow: 'hidden'，不删除文本内容。（-webkit-line-clamp）
   *
   * 常用值：
   * - `none`：不限制显示行数，文本完整显示，是默认值。
   *
   * 数字值不加单位；初始值 `none`；不继承。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-line-clamp
   */
  WebkitLineClamp?: StyleValue<
    | OpenValue<CSSProperties['WebkitLineClamp']>
    | keyof CssWideKeywords
    | keyof WebkitLineClampKeywords
  >;
  /**
   * 设置复选框、单选框等原生控件的强调色；具体使用部位由浏览器决定。（accent-color）
   *
   * 常用值：
   * - `auto`：使用浏览器或系统默认的强调色，通常跟随系统主题。
   *
   * 初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/accent-color
   */
  accentColor?: StyleValue<
    | OpenValue<CSSProperties['accentColor']>
    | keyof CssWideKeywords
    | keyof AccentColorKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置盒子的首选宽高比，参与自动尺寸计算。（aspect-ratio）
   *
   * 通常需要至少一个轴为自动尺寸才参与尺寸计算；两个轴都被明确尺寸约束时，不会强行保持比例。
   *
   * 常用值：
   * - `auto`：使用元素自身的固有宽高比（如图片、视频），没有固有比例时不施加比例约束；可与比例组合，如 `auto 16 / 9`，无固有比例时才用给定比例。
   *
   * 适用场景：图片占位、视频和卡片封面区域。
   *
   * 数字值不加单位；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/aspect-ratio
   */
  aspectRatio?: StyleValue<
    OpenValue<CSSProperties['aspectRatio']> | keyof CssWideKeywords | keyof AspectRatioKeywords
  >;
  /**
   * 同时设置 align-content 与 justify-content。（place-content）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-content
   */
  placeContent?: StyleValue<
    | OpenValue<CSSProperties['placeContent']>
    | keyof CssWideKeywords
    | keyof AlignContentKeywords
    | keyof CssBaselinePosition
    | keyof CssContentDistribution
    | keyof CssOverflowPosition
    | keyof CssContentPosition
    | keyof JustifyContentKeywords
  >;
  /**
   * 分配布局容器交叉轴或块轴上的剩余空间，控制内容整体的对齐。（align-content）
   *
   * 常用值：
   * - `normal`：按布局模式取默认行为：Flex 和 Grid 容器中表现为 `stretch`，块布局中表现为 `start`。
   * - `first baseline`：按首条基线对齐：让容器第一行（或第一条轨道）的首基线与同一基线共享组中的其他元素对齐；无法对齐时回退为 `start`。
   * - `last baseline`：按末条基线对齐：让容器最后一行（或最后一条轨道）的末基线与同一基线共享组中的其他元素对齐；无法对齐时回退为 `end`。
   * - `safe center`：内容整体居中；若居中会使内容溢出容器，就改为 `start` 对齐，避免内容超出起始侧而无法滚动到。
   * - `unsafe center`：无论是否溢出都严格居中；内容比容器大时会向两端溢出，起始侧的部分可能无法滚动到。
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/align-content
   */
  alignContent?: StyleValue<KeywordValue<AlignContentValues, CSSProperties['alignContent']>>;
  /**
   * 分配布局主轴或行内轴的剩余空间，控制内容整体对齐。（justify-content）
   *
   * Flex 中沿主轴分配空间，Grid 中沿行内轴对齐网格整体。没有剩余空间时，空间分配效果可能不明显。
   *
   * 常用值：
   * - `center`：将整体内容放在主轴或行内轴的中间，不改变项目内部文字对齐。
   * - `space-between`：首尾项目贴两端，剩余空间等分到相邻项目之间。只有一个项目时靠起始侧，不会自动居中。space-evenly 在两端也保留等量空间；space-around 的边缘空间只有项目之间的一半。
   * - `space-around`：每个项目两侧分配相等空间，容器边缘的空间是相邻项目间的一半。
   * - `space-evenly`：容器两端和相邻项目之间分配相等空间。
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/justify-content
   */
  justifyContent?: StyleValue<KeywordValue<JustifyContentValues, CSSProperties['justifyContent']>>;
  /**
   * 同时设置 align-items 与 justify-items。（place-items）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-items
   */
  placeItems?: StyleValue<
    | OpenValue<CSSProperties['placeItems']>
    | keyof CssWideKeywords
    | keyof AlignItemsKeywords
    | keyof CssBaselinePosition
    | keyof CssOverflowPosition
    | keyof CssSelfPosition
    | keyof JustifyItemsKeywords
  >;
  /**
   * 同时设置 align-self 与 justify-self。（place-self）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-self
   */
  placeSelf?: StyleValue<
    | OpenValue<CSSProperties['placeSelf']>
    | keyof CssWideKeywords
    | keyof AlignSelfKeywords
    | keyof CssBaselinePosition
    | keyof CssOverflowPosition
    | keyof CssSelfPosition
    | keyof JustifySelfKeywords
  >;
  /**
   * 设置容器内项目在交叉轴或块轴上的默认对齐方式。（align-items）
   *
   * Flex 中沿交叉轴对齐；Grid 中通常沿块轴对齐。单个项目可以用 align-self 覆盖。
   *
   * 常用值：
   * - `stretch`：在自动尺寸及最小/最大约束允许时拉伸项目，不强制覆盖显式尺寸。项目在对齐轴有显式尺寸或受最小/最大尺寸约束时，不一定填满可用区域。center 保持项目尺寸并居中；stretch 尝试扩大自动尺寸。
   * - `center`：将各项目在交叉轴或块轴的对齐区域中居中。justify-content 控制 Flex 主轴上的内容分布；align-items 控制交叉轴。
   * - `baseline`：按项目的对齐基线对齐，不等同于底边对齐。
   * - `start`：按对齐轴的逻辑起始侧对齐。
   * - `end`：按对齐轴的逻辑结束侧对齐。
   *
   * 适用场景：图标与文字居中、表单控件基线对齐或项目拉伸。
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/align-items
   */
  alignItems?: StyleValue<KeywordValue<AlignItemsValues, CSSProperties['alignItems']>>;
  /**
   * 设置容器内项目在行内轴上的默认对齐方式；不控制 Flex 项目的主轴对齐。（justify-items）
   *
   * 常用值：`normal`、`stretch`、`left`、`right`、`legacy`、`center`、`anchor-center`、`first baseline`、`last baseline`、`legacy center`、`legacy left`、`legacy right`、`safe center`、`unsafe center`
   *
   * 初始值 `legacy`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/justify-items
   */
  justifyItems?: StyleValue<KeywordValue<JustifyItemsValues, CSSProperties['justifyItems']>>;
  /**
   * 单独覆盖一个项目的交叉轴或块轴对齐方式。（align-self）
   *
   * 常用值：
   * - `auto`：使用父容器的 align-items 对齐方式。
   * - `stretch`：在自动尺寸和最小/最大约束允许时拉伸当前项目。
   * - `baseline`：让当前项目参与基线对齐，不等同于底边对齐。
   *
   * 适用场景：只改变某一个项目的交叉轴或块轴对齐，不改变同组其他项目。
   *
   * 初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/align-self
   */
  alignSelf?: StyleValue<KeywordValue<AlignSelfValues, CSSProperties['alignSelf']>>;
  /**
   * 单独设置项目在其布局区域内的行内轴对齐方式。（justify-self）
   *
   * 常用值：
   * - `auto`：采用父容器 justify-items 等上下文决定的对齐方式；不用于 Flex 项目的主轴分配。
   * - `stretch`：在自动尺寸和最小/最大约束允许时沿行内轴拉伸。
   * - `normal`：采用布局模式的默认对齐：Grid 中通常表现为 `stretch`，有固有尺寸的元素（如图片）表现为 `start`。
   * - `left`：项目靠所在区域的物理左侧，不受书写方向影响。
   * - `right`：项目靠所在区域的物理右侧，不受书写方向影响。
   * - `anchor-center`：让锚点定位的元素沿该轴对齐到锚点元素的中心；只对使用 CSS 锚点定位的绝对定位元素有效。
   * - `first baseline`：按首行基线与同组项目对齐；无法参与基线对齐时回退为 `start`。
   * - `last baseline`：按末行基线与同组项目对齐；无法参与基线对齐时回退为 `end`。
   * - `safe center`：项目居中；当项目比所在区域大会溢出时，改为靠起点对齐，保证内容不被推到不可见的一侧。
   * - `unsafe center`：项目严格居中，即使溢出也不回退；溢出的一侧可能超出可滚动范围而无法访问。
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/justify-self
   */
  justifySelf?: StyleValue<KeywordValue<JustifySelfValues, CSSProperties['justifySelf']>>;
  /**
   * 选择行内或 SVG 文本参与对齐时使用的基线。（alignment-baseline）
   *
   * 常用值：
   * - `after-edge`：SVG 1.1 遗留值：按下缘（书写模式中的“后”边）对齐，效果接近 `text-after-edge`。
   * - `alphabetic`：把盒子的字母基线（拉丁文字所坐落的基线）对齐到父元素的字母基线。
   * - `auto`：SVG 1.1 遗留值，效果等同 `baseline`。
   * - `baseline`：使用父元素主基线所对应的那条基线对齐，是初始值。
   * - `before-edge`：SVG 1.1 遗留值：按上缘（书写模式中的“前”边）对齐，效果接近 `text-before-edge`。
   * - `central`：对齐中心基线，位于表意字符上下边缘的正中间。
   * - `hanging`：对齐悬挂基线，即天城文等文字字形顶部悬挂的那条线；SVG 1.1 遗留值，浏览器支持不一致。
   * - `ideographic`：对齐表意基线，即中日韩等表意文字字形的底部。
   * - `mathematical`：对齐数学基线，即数学公式里运算符所居的垂直中间位置。
   * - `middle`：对齐中间基线，约在 x 字高的一半处，常用来让行内元素与小写字母垂直居中。
   * - `text-after-edge`：把盒子的下缘对齐到父元素文本区域的下缘，相当于 `text-bottom`。
   * - `text-before-edge`：把盒子的上缘对齐到父元素文本区域的上缘，相当于 `text-top`。
   *
   * 初始值 `baseline`；不继承；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/alignment-baseline
   */
  alignmentBaseline?: StyleValue<
    KeywordValue<AlignmentBaselineValues, CSSProperties['alignmentBaseline']>
  >;
  /**
   * 旧版瀑布流布局提案中沿块轴对齐轨道的属性；使用前核对实现与规范版本。（align-tracks）
   *
   * 常用值：
   * - `normal`：采用该布局模式的默认轨道对齐行为，不额外指定对齐方式；该属性来自旧版瀑布流提案，仅实验性支持。
   *
   * 初始值 `normal`；不继承；非标准。
   */
  alignTracks?: StyleValue<
    | OpenValue<CSSProperties['alignTracks']>
    | keyof CssWideKeywords
    | keyof AlignTracksKeywords
    | keyof CssBaselinePosition
    | keyof CssContentDistribution
    | keyof CssOverflowPosition
    | keyof CssContentPosition
  >;
  /**
   * 旧版瀑布流布局提案中沿行内轴对齐轨道的属性；使用前核对实现与规范版本。（justify-tracks）
   *
   * 常用值：
   * - `normal`：采用默认分布方式放置对应轨道；属于旧版瀑布流提案，浏览器暂无稳定支持。
   * - `left`：对应轨道整体靠容器的物理左侧；属于旧版瀑布流提案，浏览器暂无稳定支持。
   * - `right`：对应轨道整体靠容器的物理右侧；属于旧版瀑布流提案，浏览器暂无稳定支持。
   *
   * 初始值 `normal`；不继承；非标准。
   */
  justifyTracks?: StyleValue<
    | OpenValue<CSSProperties['justifyTracks']>
    | keyof CssWideKeywords
    | keyof JustifyTracksKeywords
    | keyof CssContentDistribution
    | keyof CssOverflowPosition
    | keyof CssContentPosition
  >;
  /**
   * 旧版瀑布流布局提案中的自动放置策略；使用前核对实现与规范版本。（masonry-auto-flow）
   *
   * 常用值：
   * - `pack`：每个项目放入当前最靠前（最短）的轨道，使各轨道尽量紧凑；属于旧版瀑布流提案，浏览器暂无稳定支持。
   * - `next`：项目按顺序依次放入下一个轨道，到末尾后回到第一个，不寻找最短轨道；属于旧版瀑布流提案，浏览器暂无稳定支持。
   * - `definite-first`：先放置有明确位置的项目，再放置其余自动放置的项目；属于旧版瀑布流提案，浏览器暂无稳定支持。
   * - `ordered`：所有项目按文档顺序放置，包括有明确位置的项目；属于旧版瀑布流提案，浏览器暂无稳定支持。
   *
   * 初始值 `pack`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-flow
   */
  masonryAutoFlow?: StyleValue<
    | OpenValue<CSSProperties['masonryAutoFlow']>
    | keyof CssWideKeywords
    | keyof MasonryAutoFlowKeywords
  >;
  /**
   * 为元素声明锚点名称，供锚点定位的元素引用。（anchor-name）
   *
   * 常用值：
   * - `none`：不声明锚点名称，元素不能被其他元素按名称引用为锚点。
   *
   * 初始值 `none`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/anchor-name
   */
  anchorName?: StyleValue<
    OpenValue<CSSProperties['anchorName']> | keyof CssWideKeywords | keyof AnchorNameKeywords
  >;
  /**
   * 集中设置关键帧动画的名称、时长、缓动、延迟、次数及播放行为。（animation）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation
   */
  animation?: StyleValue<
    | OpenValue<CSSProperties['animation']>
    | keyof CssWideKeywords
    | keyof CssSingleAnimation
    | keyof AnimationDurationKeywords
    | keyof CssLinearEasingFunction
    | keyof CssCubicBezierEasingFunction
    | keyof CssStepEasingFunction
    | keyof CssSingleAnimationIterationCount
    | keyof CssSingleAnimationDirection
    | keyof CssSingleAnimationFillMode
    | keyof CssSingleAnimationPlayState
    | keyof CssSingleAnimationTimeline
    | keyof QualifiedDurationsTokens
    | keyof QualifiedEasingsTokens
  >;
  /**
   * 设置动画效果与底层属性值的替换、叠加或累积方式。（animation-composition）
   *
   * 初始值 `replace`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-composition
   */
  animationComposition?: StyleValue<
    | OpenValue<CSSProperties['animationComposition']>
    | keyof CssWideKeywords
    | keyof CssSingleAnimationComposition
  >;
  /**
   * 设置动画开始前的延迟；负值表示从动画中途开始播放。（animation-delay）
   *
   * 初始值 `0s`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-delay
   */
  animationDelay?: StyleValue<
    | OpenValue<CSSProperties['animationDelay']>
    | keyof CssWideKeywords
    | keyof DurationsTokens
    | keyof QualifiedDurationsTokens
  >;
  /**
   * 设置动画按正向、反向或交替方向播放。（animation-direction）
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-direction
   */
  animationDirection?: StyleValue<
    KeywordValue<AnimationDirectionValues, CSSProperties['animationDirection']>
  >;
  /**
   * 设置动画完成一次循环的时长。（animation-duration）
   *
   * 常用值：
   * - `auto`：不指定固定时长：基于时间的动画视为 `0s`，滚动驱动动画则按时间线范围自动决定。
   *
   * 初始值 `0s`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-duration
   */
  animationDuration?: StyleValue<
    | OpenValue<CSSProperties['animationDuration']>
    | keyof CssWideKeywords
    | keyof AnimationDurationKeywords
    | keyof DurationsTokens
    | keyof QualifiedDurationsTokens
  >;
  /**
   * 设置动画在有效播放区间之外是否应用关键帧样式。（animation-fill-mode）
   *
   * 控制动画有效播放区间之外的样式，不会把最终值写回普通 CSS 声明。
   *
   * 常用值：
   * - `none`：动画有效区间之外不应用动画关键帧值。
   * - `forwards`：播放结束后保留最后生效关键帧的效果；最后帧取决于方向和循环次数。
   * - `backwards`：延迟阶段应用最先生效关键帧的效果，具体帧取决于播放方向。
   * - `both`：同时应用 backwards 和 forwards 的区间外效果。
   *
   * 适用场景：控制延迟阶段和播放结束后的动画呈现。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-fill-mode
   */
  animationFillMode?: StyleValue<
    KeywordValue<AnimationFillModeValues, CSSProperties['animationFillMode']>
  >;
  /**
   * 设置动画循环次数，或无限循环。（animation-iteration-count）
   *
   * 数字值不加单位；初始值 `1`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-iteration-count
   */
  animationIterationCount?: StyleValue<
    KeywordValue<AnimationIterationCountValues, CSSProperties['animationIterationCount']>
  >;
  /**
   * 选择要播放的 @keyframes 动画名称。（animation-name）
   *
   * 常用值：
   * - `none`：不应用任何关键帧动画，可用来取消其他规则设置的动画。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-name
   */
  animationName?: StyleValue<
    OpenValue<CSSProperties['animationName']> | keyof CssWideKeywords | keyof AnimationNameKeywords
  >;
  /**
   * 控制动画运行或暂停，暂停后可从原位置继续。（animation-play-state）
   *
   * 初始值 `running`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-play-state
   */
  animationPlayState?: StyleValue<
    KeywordValue<AnimationPlayStateValues, CSSProperties['animationPlayState']>
  >;
  /**
   * 设置动画每个关键帧区间内进度变化的缓动函数。（animation-timing-function）
   *
   * 初始值 `ease`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-timing-function
   */
  animationTimingFunction?: StyleValue<
    | OpenValue<CSSProperties['animationTimingFunction']>
    | keyof CssWideKeywords
    | keyof CssLinearEasingFunction
    | keyof CssCubicBezierEasingFunction
    | keyof CssStepEasingFunction
    | keyof EasingsTokens
    | keyof QualifiedEasingsTokens
  >;
  /**
   * 选择驱动动画的时间线，例如文档时间或滚动进度。（animation-timeline）
   *
   * 初始值 `auto`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-timeline
   */
  animationTimeline?: StyleValue<
    | OpenValue<CSSProperties['animationTimeline']>
    | keyof CssWideKeywords
    | keyof CssSingleAnimationTimeline
  >;
  /**
   * 设置动画附着到时间线的起止范围。（animation-range）
   *
   * 简写属性，初始值见各分项；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range
   */
  animationRange?: StyleValue<
    | OpenValue<CSSProperties['animationRange']>
    | keyof CssWideKeywords
    | keyof AnimationRangeEndKeywords
    | keyof CssTimelineRangeName
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置动画在时间线上的附着范围起点。（animation-range-start）
   *
   * 常用值：
   * - `normal`：不收窄附着范围：起点取时间线起点，终点取时间线终点，动画覆盖整条时间线。
   *
   * 初始值 `normal`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range-start
   */
  animationRangeStart?: StyleValue<
    | OpenValue<CSSProperties['animationRangeStart']>
    | keyof CssWideKeywords
    | keyof AnimationRangeEndKeywords
    | keyof CssTimelineRangeName
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置动画在时间线上的附着范围终点。（animation-range-end）
   *
   * 常用值：
   * - `normal`：不收窄附着范围：起点取时间线起点，终点取时间线终点，动画覆盖整条时间线。
   *
   * 初始值 `normal`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range-end
   */
  animationRangeEnd?: StyleValue<
    | OpenValue<CSSProperties['animationRangeEnd']>
    | keyof CssWideKeywords
    | keyof AnimationRangeEndKeywords
    | keyof CssTimelineRangeName
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 控制元素是否采用平台原生控件外观。（appearance）
   *
   * 常用值：
   * - `none`：关闭平台原生控件外观，只使用 CSS 指定的样式，便于自绘表单控件。
   * - `auto`：采用元素类型默认的平台原生外观；元素没有原生外观时表现得像 `none`。
   *
   * 初始值 `none`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/appearance
   */
  appearance?: StyleValue<
    | OpenValue<CSSProperties['appearance']>
    | keyof CssWideKeywords
    | keyof AppearanceKeywords
    | keyof CssCompatAuto
    | keyof CssCompatSpecial
  >;
  /**
   * 语音合成中声音的水平方位（azimuth），来自已废弃的 CSS2 听觉样式，浏览器不支持。
   */
  azimuth?: StyleValue<OpenValue<CSSProperties['azimuth']> | keyof CssWideKeywords>;
  /**
   * 对元素背后的图像区域应用模糊等滤镜，通常需要透明或半透明背景。（backdrop-filter）
   *
   * 常用值：
   * - `none`：不对元素背后的内容应用任何滤镜。
   *
   * 初始值 `none`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/backdrop-filter
   */
  backdropFilter?: StyleValue<
    | OpenValue<CSSProperties['backdropFilter']>
    | keyof CssWideKeywords
    | keyof BackdropFilterKeywords
  >;
  /**
   * 控制经过三维变换后背向观察者的元素背面是否可见。（backface-visibility）
   *
   * 常用值：
   * - `hidden`：元素背面朝向观察者时不渲染，常用于翻转卡片时隐藏背面。
   * - `visible`：背面朝向观察者时照常渲染，内容呈镜像，是默认值。
   *
   * 初始值 `visible`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/backface-visibility
   */
  backfaceVisibility?: StyleValue<
    KeywordValue<BackfaceVisibilityValues, CSSProperties['backfaceVisibility']>
  >;
  /**
   * 集中设置背景颜色、图像、位置、尺寸、重复及绘制区域。（background）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background
   */
  background?: StyleValue<
    | OpenValue<CSSProperties['background']>
    | keyof CssWideKeywords
    | keyof CssBgImage
    | keyof CssBgPosition
    | keyof CssBgSize
    | keyof CssRepeatStyle
    | keyof CssAttachment
    | keyof CssVisualBox
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置背景图像相对于视口、元素或局部滚动内容的固定方式。（background-attachment）
   *
   * 初始值 `scroll`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-attachment
   */
  backgroundAttachment?: StyleValue<
    KeywordValue<BackgroundAttachmentValues, CSSProperties['backgroundAttachment']>
  >;
  /**
   * 设置背景图层彼此之间以及与背景色之间的混合模式。（background-blend-mode）
   *
   * 初始值 `normal`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-blend-mode
   */
  backgroundBlendMode?: StyleValue<
    KeywordValue<BackgroundBlendModeValues, CSSProperties['backgroundBlendMode']>
  >;
  /**
   * 设置背景允许绘制到的边界区域。（background-clip）
   *
   * 常用值：
   * - `text`：把背景裁剪到文字字形；显示背景文字效果通常还需要透明的文字颜色。
   *
   * 初始值 `border-box`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-clip
   */
  backgroundClip?: StyleValue<KeywordValue<BackgroundClipValues, CSSProperties['backgroundClip']>>;
  /**
   * 设置元素背景颜色，位于背景图像下方。（background-color）
   *
   * 初始值 `transparent`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-color
   */
  backgroundColor?: StyleValue<
    | OpenValue<CSSProperties['backgroundColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置一个或多个背景图像或渐变图层。（background-image）
   *
   * 常用值：
   * - `none`：不绘制这一层背景图像；背景颜色仍然可以显示。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-image
   */
  backgroundImage?: StyleValue<
    | OpenValue<CSSProperties['backgroundImage']>
    | keyof CssWideKeywords
    | keyof BackgroundImageKeywords
    | keyof CssBgImage
  >;
  /**
   * 设置背景图像定位所依据的盒子区域。（background-origin）
   *
   * 初始值 `padding-box`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-origin
   */
  backgroundOrigin?: StyleValue<
    KeywordValue<BackgroundOriginValues, CSSProperties['backgroundOrigin']>
  >;
  /**
   * 设置背景图像在定位区域内的位置。（background-position）
   *
   * 初始值 `0% 0%`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position
   */
  backgroundPosition?: StyleValue<
    | OpenValue<CSSProperties['backgroundPosition']>
    | keyof CssWideKeywords
    | keyof CssBgPosition
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置背景图像的水平位置。（background-position-x）
   *
   * 常用值：
   * - `center`：背景图像在水平方向居中，等同于 `50%`。
   * - `left`：对齐到容器左边缘，等同于 `0%`；可后接偏移量，如 `left 10px`，表示从左边缘向内偏移。
   * - `right`：对齐到容器右边缘，等同于 `100%`；后接偏移量时表示距右边缘向内的距离。
   * - `x-start`：对齐到水平方向的起始侧，由书写模式和方向决定（普通从左到右的横排中为左边）；较新的逻辑写法，浏览器支持有限。
   * - `x-end`：对齐到水平方向的结束侧，由书写模式和方向决定（普通从左到右的横排中为右边）；较新的逻辑写法，浏览器支持有限。
   *
   * 初始值 `0%`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position-x
   */
  backgroundPositionX?: StyleValue<
    | OpenValue<CSSProperties['backgroundPositionX']>
    | keyof CssWideKeywords
    | keyof BackgroundPositionXKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置背景图像的垂直位置。（background-position-y）
   *
   * 常用值：
   * - `center`：背景图像在垂直方向居中，等同于 `50%`。
   * - `top`：对齐到容器上边缘，等同于 `0%`；可后接偏移量，如 `top 10px`，表示从上边缘向内偏移。
   * - `bottom`：对齐到容器下边缘，等同于 `100%`；后接偏移量时表示距下边缘向内的距离。
   * - `y-start`：对齐到垂直方向的起始侧，由书写模式决定（普通横排中为上边）；较新的逻辑写法，浏览器支持有限。
   * - `y-end`：对齐到垂直方向的结束侧，由书写模式决定（普通横排中为下边）；较新的逻辑写法，浏览器支持有限。
   *
   * 初始值 `0%`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position-y
   */
  backgroundPositionY?: StyleValue<
    | OpenValue<CSSProperties['backgroundPositionY']>
    | keyof CssWideKeywords
    | keyof BackgroundPositionYKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置背景图像在水平和垂直方向上的重复方式。（background-repeat）
   *
   * 初始值 `repeat`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-repeat
   */
  backgroundRepeat?: StyleValue<
    OpenValue<CSSProperties['backgroundRepeat']> | keyof CssWideKeywords | keyof CssRepeatStyle
  >;
  /**
   * 设置背景图像尺寸，以及覆盖或完整容纳图像的缩放方式。（background-size）
   *
   * 改变背景图像的尺寸，不改变元素尺寸；位置由 background-position 决定。
   *
   * 常用值：
   * - `auto`：依据图像内部尺寸、比例及另一维的设置确定尺寸。
   * - `contain`：保持图像比例并使整张图像容纳于定位区域，可能留下空白。
   * - `cover`：保持图像比例并覆盖整个定位区域，超出部分可能被裁剪。
   *
   * 适用场景：背景封面或需要完整显示的背景装饰。
   *
   * 初始值 `auto auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-size
   */
  backgroundSize?: StyleValue<
    | OpenValue<CSSProperties['backgroundSize']>
    | keyof CssWideKeywords
    | keyof MaskSizeKeywords
    | keyof CssBgSize
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 使 SVG 文本基线相对于其基准位置偏移。（baseline-shift）
   *
   * 常用值：
   * - `sub`：把文本基线降到父元素的下标位置，用于下标效果。
   * - `super`：把文本基线抬到父元素的上标位置，用于上标效果。
   * - `baseline`：不偏移，沿用父元素的基线，是默认值。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2026 年起新近可用。
   */
  baselineShift?: StyleValue<
    | OpenValue<CSSProperties['baselineShift']>
    | keyof CssWideKeywords
    | keyof BaselineShiftKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * IE 专有的 HTC 行为绑定（behavior），已废弃，现代浏览器不支持。
   */
  behavior?: StyleValue<OpenValue<CSSProperties['behavior']> | keyof CssWideKeywords>;
  /**
   * 设置逻辑块轴尺寸；水平书写时通常对应高度。（block-size）
   *
   * 水平书写时通常对应 height，竖直书写时通常对应 width。
   *
   * 常用值：
   * - `auto`：让布局算法决定尺寸，不保证等于父元素尺寸。
   * - `min-content`：采用内容的最小内部尺寸，文字会考虑可用的软换行机会。
   * - `max-content`：采用内容的最大内部尺寸，通常不进行软换行。
   * - `fit-content`：在最小和最大内部尺寸之间按可用空间夹取尺寸。
   *
   * 适用场景：使用逻辑轴表达内容块尺寸。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/block-size
   */
  blockSize?: StyleValue<
    | OpenValue<CSSProperties['blockSize']>
    | keyof CssWideKeywords
    | keyof WidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 同时设置四边边框的宽度、线型和颜色。（border）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border
   */
  border?: StyleValue<
    | OpenValue<CSSProperties['border']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑块轴起始侧和结束侧的边框。（border-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block
   */
  borderBlock?: StyleValue<
    | OpenValue<CSSProperties['borderBlock']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑块轴两侧边框颜色。（border-block-color）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-color
   */
  borderBlockColor?: StyleValue<
    | OpenValue<CSSProperties['borderBlockColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑块轴两侧的边框线型。（border-block-style）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-style
   */
  borderBlockStyle?: StyleValue<
    KeywordValue<BorderBlockStyleValues, CSSProperties['borderBlockStyle']>
  >;
  /**
   * 设置逻辑块轴两侧的边框宽度。（border-block-width）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-width
   */
  borderBlockWidth?: StyleValue<
    | OpenValue<CSSProperties['borderBlockWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴结束侧边框的宽度、线型和颜色。（border-block-end）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end
   */
  borderBlockEnd?: StyleValue<
    | OpenValue<CSSProperties['borderBlockEnd']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑块轴结束侧的边框颜色。（border-block-end-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-color
   */
  borderBlockEndColor?: StyleValue<
    | OpenValue<CSSProperties['borderBlockEndColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑块轴结束侧的边框线型。（border-block-end-style）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-style
   */
  borderBlockEndStyle?: StyleValue<
    KeywordValue<BorderBlockEndStyleValues, CSSProperties['borderBlockEndStyle']>
  >;
  /**
   * 设置逻辑块轴结束侧的边框宽度。（border-block-end-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-width
   */
  borderBlockEndWidth?: StyleValue<
    | OpenValue<CSSProperties['borderBlockEndWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴起始侧边框的宽度、线型和颜色。（border-block-start）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start
   */
  borderBlockStart?: StyleValue<
    | OpenValue<CSSProperties['borderBlockStart']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑块轴起始侧的边框颜色。（border-block-start-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-color
   */
  borderBlockStartColor?: StyleValue<
    | OpenValue<CSSProperties['borderBlockStartColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑块轴起始侧的边框线型。（border-block-start-style）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-style
   */
  borderBlockStartStyle?: StyleValue<
    KeywordValue<BorderBlockEndStyleValues, CSSProperties['borderBlockStartStyle']>
  >;
  /**
   * 设置逻辑块轴起始侧的边框宽度。（border-block-start-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-width
   */
  borderBlockStartWidth?: StyleValue<
    | OpenValue<CSSProperties['borderBlockStartWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置下边框的宽度、线型和颜色。（border-bottom）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom
   */
  borderBottom?: StyleValue<
    | OpenValue<CSSProperties['borderBottom']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置下边框颜色。（border-bottom-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-color
   */
  borderBottomColor?: StyleValue<
    | OpenValue<CSSProperties['borderBottomColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置下边框线型。（border-bottom-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-style
   */
  borderBottomStyle?: StyleValue<
    KeywordValue<BorderTopStyleValues, CSSProperties['borderBottomStyle']>
  >;
  /**
   * 设置下边框宽度。（border-bottom-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-width
   */
  borderBottomWidth?: StyleValue<
    | OpenValue<CSSProperties['borderBottomWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置表格相邻单元格边框合并还是分离。（border-collapse）
   *
   * 常用值：
   * - `collapse`：相邻单元格共用一条边框，冲突时按优先级规则取舍；`borderSpacing` 不再生效。
   * - `separate`：每个单元格保留各自独立的边框，相邻边框之间留出 `borderSpacing` 指定的间距，是默认值。
   *
   * 初始值 `separate`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-collapse
   */
  borderCollapse?: StyleValue<KeywordValue<BorderCollapseValues, CSSProperties['borderCollapse']>>;
  /**
   * 设置四边边框颜色，支持按上、右、下、左顺序简写。（border-color）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-color
   */
  borderColor?: StyleValue<
    | OpenValue<CSSProperties['borderColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置用作边框的图像及其切片、宽度、外扩和重复方式。（border-image）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image
   */
  borderImage?: StyleValue<
    | OpenValue<CSSProperties['borderImage']>
    | keyof CssWideKeywords
    | keyof BorderImageSourceKeywords
    | keyof BorderImageSliceKeywords
    | keyof BorderImageWidthKeywords
    | keyof BorderImageRepeatKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置边框图像超出边框盒的距离。（border-image-outset）
   *
   * 初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-outset
   */
  borderImageOutset?: StyleValue<
    | OpenValue<CSSProperties['borderImageOutset']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置边框图像切片沿边框的重复或拉伸方式。（border-image-repeat）
   *
   * 常用值：
   * - `stretch`：拉伸边框图像的边与中间切片，填满对应的边框区域。
   * - `repeat`：平铺切片以填满边框区域，两端可能被截断。
   * - `round`：平铺切片，并微调切片大小使整数个刚好铺满，不会被截断。
   * - `space`：平铺切片并保持原尺寸，把多余空间平均分成切片之间的间隙，不会被截断。
   *
   * 初始值 `stretch`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-repeat
   */
  borderImageRepeat?: StyleValue<
    | OpenValue<CSSProperties['borderImageRepeat']>
    | keyof CssWideKeywords
    | keyof BorderImageRepeatKeywords
  >;
  /**
   * 设置边框图像的切片位置及是否填充中间区域。（border-image-slice）
   *
   * 常用值：
   * - `fill`：保留切片后中间的区域，并把它作为背景绘制在元素内；省略时中间部分会被丢弃。
   *
   * 数字值不加单位；初始值 `100%`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-slice
   */
  borderImageSlice?: StyleValue<
    | OpenValue<CSSProperties['borderImageSlice']>
    | keyof CssWideKeywords
    | keyof BorderImageSliceKeywords
  >;
  /**
   * 指定边框使用的图像或渐变。（border-image-source）
   *
   * 常用值：
   * - `none`：不使用边框图像，边框回到 `borderStyle` 指定的普通样式。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-source
   */
  borderImageSource?: StyleValue<
    | OpenValue<CSSProperties['borderImageSource']>
    | keyof CssWideKeywords
    | keyof BorderImageSourceKeywords
  >;
  /**
   * 设置边框图像各边的绘制宽度。（border-image-width）
   *
   * 常用值：
   * - `auto`：边框图像宽度取对应切片自身的固有尺寸。
   *
   * 初始值 `1`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-width
   */
  borderImageWidth?: StyleValue<
    | OpenValue<CSSProperties['borderImageWidth']>
    | keyof CssWideKeywords
    | keyof BorderImageWidthKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴起始侧和结束侧的边框。（border-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline
   */
  borderInline?: StyleValue<
    | OpenValue<CSSProperties['borderInline']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑行内轴两侧边框颜色。（border-inline-color）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-color
   */
  borderInlineColor?: StyleValue<
    | OpenValue<CSSProperties['borderInlineColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑行内轴两侧边框线型。（border-inline-style）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-style
   */
  borderInlineStyle?: StyleValue<
    KeywordValue<BorderBlockStyleValues, CSSProperties['borderInlineStyle']>
  >;
  /**
   * 设置逻辑行内轴两侧边框宽度。（border-inline-width）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-width
   */
  borderInlineWidth?: StyleValue<
    | OpenValue<CSSProperties['borderInlineWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴结束侧边框的宽度、线型和颜色。（border-inline-end）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end
   */
  borderInlineEnd?: StyleValue<
    | OpenValue<CSSProperties['borderInlineEnd']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑行内轴结束侧边框颜色。（border-inline-end-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-color
   */
  borderInlineEndColor?: StyleValue<
    | OpenValue<CSSProperties['borderInlineEndColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑行内轴结束侧边框线型。（border-inline-end-style）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-style
   */
  borderInlineEndStyle?: StyleValue<
    KeywordValue<BorderBlockEndStyleValues, CSSProperties['borderInlineEndStyle']>
  >;
  /**
   * 设置逻辑行内轴结束侧边框宽度。（border-inline-end-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-width
   */
  borderInlineEndWidth?: StyleValue<
    | OpenValue<CSSProperties['borderInlineEndWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴起始侧边框的宽度、线型和颜色。（border-inline-start）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start
   */
  borderInlineStart?: StyleValue<
    | OpenValue<CSSProperties['borderInlineStart']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑行内轴起始侧边框颜色。（border-inline-start-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-color
   */
  borderInlineStartColor?: StyleValue<
    | OpenValue<CSSProperties['borderInlineStartColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置逻辑行内轴起始侧边框线型。（border-inline-start-style）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-style
   */
  borderInlineStartStyle?: StyleValue<
    KeywordValue<BorderBlockEndStyleValues, CSSProperties['borderInlineStartStyle']>
  >;
  /**
   * 设置逻辑行内轴起始侧边框宽度。（border-inline-start-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-width
   */
  borderInlineStartWidth?: StyleValue<
    | OpenValue<CSSProperties['borderInlineStartWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置左边框的宽度、线型和颜色。（border-left）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left
   */
  borderLeft?: StyleValue<
    | OpenValue<CSSProperties['borderLeft']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置左边框颜色。（border-left-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-color
   */
  borderLeftColor?: StyleValue<
    | OpenValue<CSSProperties['borderLeftColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置左边框线型。（border-left-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-style
   */
  borderLeftStyle?: StyleValue<
    KeywordValue<BorderTopStyleValues, CSSProperties['borderLeftStyle']>
  >;
  /**
   * 设置左边框宽度。（border-left-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-width
   */
  borderLeftWidth?: StyleValue<
    | OpenValue<CSSProperties['borderLeftWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置右边框的宽度、线型和颜色。（border-right）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right
   */
  borderRight?: StyleValue<
    | OpenValue<CSSProperties['borderRight']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置右边框颜色。（border-right-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-color
   */
  borderRightColor?: StyleValue<
    | OpenValue<CSSProperties['borderRightColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置右边框线型。（border-right-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-style
   */
  borderRightStyle?: StyleValue<
    KeywordValue<BorderTopStyleValues, CSSProperties['borderRightStyle']>
  >;
  /**
   * 设置右边框宽度。（border-right-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-width
   */
  borderRightWidth?: StyleValue<
    | OpenValue<CSSProperties['borderRightWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置分离边框模型下表格单元格之间的水平和垂直间距。（border-spacing）
   *
   * 数字值自动加 `px`；初始值 `0`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-spacing
   */
  borderSpacing?: StyleValue<
    | OpenValue<CSSProperties['borderSpacing']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置四边边框线型。（border-style）
   *
   * 常用值：
   * - `none`：不绘制边框，并使对应边框计算宽度为零。
   * - `hidden`：通常与 none 类似；在表格边框合并冲突中优先隐藏边框。
   * - `solid`：绘制连续实线边框。
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-style
   */
  borderStyle?: StyleValue<KeywordValue<BorderStyleValues, CSSProperties['borderStyle']>>;
  /**
   * 设置上边框的宽度、线型和颜色。（border-top）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top
   */
  borderTop?: StyleValue<
    | OpenValue<CSSProperties['borderTop']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置上边框颜色。（border-top-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-color
   */
  borderTopColor?: StyleValue<
    | OpenValue<CSSProperties['borderTopColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置四个角的圆角半径；斜杠语法可分别指定水平和垂直半径。（border-radius）
   *
   * 1/2/3/4 个半径依次控制四角、两组对角、三组角和逐角。它裁剪自身背景，但不会单独保证裁剪所有后代内容。
   *
   * 适用场景：卡片、按钮、头像的圆角外观。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-radius
   */
  borderRadius?: StyleValue<
    | OpenValue<CSSProperties['borderRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴结束侧与行内轴起始侧相交角的圆角。（border-end-start-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-end-start-radius
   */
  borderEndStartRadius?: StyleValue<
    | OpenValue<CSSProperties['borderEndStartRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴起始侧与行内轴起始侧相交角的圆角。（border-start-start-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-start-start-radius
   */
  borderStartStartRadius?: StyleValue<
    | OpenValue<CSSProperties['borderStartStartRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴起始侧与行内轴结束侧相交角的圆角。（border-start-end-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-start-end-radius
   */
  borderStartEndRadius?: StyleValue<
    | OpenValue<CSSProperties['borderStartEndRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴结束侧与行内轴结束侧相交角的圆角。（border-end-end-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-end-end-radius
   */
  borderEndEndRadius?: StyleValue<
    | OpenValue<CSSProperties['borderEndEndRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置左上角边框的圆角半径。（border-top-left-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-left-radius
   */
  borderTopLeftRadius?: StyleValue<
    | OpenValue<CSSProperties['borderTopLeftRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置右上角边框的圆角半径。（border-top-right-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-right-radius
   */
  borderTopRightRadius?: StyleValue<
    | OpenValue<CSSProperties['borderTopRightRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置左下角边框的圆角半径。（border-bottom-left-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-left-radius
   */
  borderBottomLeftRadius?: StyleValue<
    | OpenValue<CSSProperties['borderBottomLeftRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置右下角边框的圆角半径。（border-bottom-right-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-right-radius
   */
  borderBottomRightRadius?: StyleValue<
    | OpenValue<CSSProperties['borderBottomRightRadius']>
    | keyof CssWideKeywords
    | keyof RadiiTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置四个角的形状，如 round、squircle、bevel、notch（corner-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 简写属性，初始值见各分项；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-shape
   */
  cornerShape?: StyleValue<
    OpenValue<CSSProperties['cornerShape']> | keyof CssWideKeywords | keyof CssCornerShapeValue
  >;
  /**
   * 单独设置块起始、行内起始方向那个角的形状（corner-start-start-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-start-start-shape
   */
  cornerStartStartShape?: StyleValue<
    | OpenValue<CSSProperties['cornerStartStartShape']>
    | keyof CssWideKeywords
    | keyof CssCornerShapeValue
  >;
  /**
   * 单独设置块起始、行内结束方向那个角的形状（corner-start-end-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-start-end-shape
   */
  cornerStartEndShape?: StyleValue<
    | OpenValue<CSSProperties['cornerStartEndShape']>
    | keyof CssWideKeywords
    | keyof CssCornerShapeValue
  >;
  /**
   * 单独设置块结束、行内起始方向那个角的形状（corner-end-start-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-end-start-shape
   */
  cornerEndStartShape?: StyleValue<
    | OpenValue<CSSProperties['cornerEndStartShape']>
    | keyof CssWideKeywords
    | keyof CssCornerShapeValue
  >;
  /**
   * 单独设置块结束、行内结束方向那个角的形状（corner-end-end-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-end-end-shape
   */
  cornerEndEndShape?: StyleValue<
    | OpenValue<CSSProperties['cornerEndEndShape']>
    | keyof CssWideKeywords
    | keyof CssCornerShapeValue
  >;
  /**
   * 单独设置左上角的形状（corner-top-left-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-top-left-shape
   */
  cornerTopLeftShape?: StyleValue<
    | OpenValue<CSSProperties['cornerTopLeftShape']>
    | keyof CssWideKeywords
    | keyof CssCornerShapeValue
  >;
  /**
   * 单独设置右上角的形状（corner-top-right-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-top-right-shape
   */
  cornerTopRightShape?: StyleValue<
    | OpenValue<CSSProperties['cornerTopRightShape']>
    | keyof CssWideKeywords
    | keyof CssCornerShapeValue
  >;
  /**
   * 单独设置左下角的形状（corner-bottom-left-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-bottom-left-shape
   */
  cornerBottomLeftShape?: StyleValue<
    | OpenValue<CSSProperties['cornerBottomLeftShape']>
    | keyof CssWideKeywords
    | keyof CssCornerShapeValue
  >;
  /**
   * 单独设置右下角的形状（corner-bottom-right-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-bottom-right-shape
   */
  cornerBottomRightShape?: StyleValue<
    | OpenValue<CSSProperties['cornerBottomRightShape']>
    | keyof CssWideKeywords
    | keyof CssCornerShapeValue
  >;
  /**
   * 设置上边框线型。（border-top-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-style
   */
  borderTopStyle?: StyleValue<KeywordValue<BorderTopStyleValues, CSSProperties['borderTopStyle']>>;
  /**
   * 设置上边框宽度。（border-top-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-width
   */
  borderTopWidth?: StyleValue<
    | OpenValue<CSSProperties['borderTopWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置四边边框宽度；可见边框通常还需要非 none 的线型。（border-width）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-width
   */
  borderWidth?: StyleValue<
    | OpenValue<CSSProperties['borderWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置定位元素相对于其定位参照的下侧偏移。（bottom）
   *
   * 常用值：
   * - `auto`：不指定该侧偏移：绝对定位时位置由对侧偏移、元素尺寸或静态位置决定，相对定位时按 0 处理。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/bottom
   */
  bottom?: StyleValue<
    | OpenValue<CSSProperties['bottom']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 旧版弹性盒（display: -webkit-box）中子元素在交叉轴上的对齐（box-align），已废弃，请用 alignItems。
   *
   * 常用值：
   * - `baseline`：子元素按文字基线对齐，对应 `alignItems: 'baseline'`；旧版弹性盒写法，已废弃。
   * - `center`：子元素在交叉轴上居中，对应 `alignItems: 'center'`；旧版弹性盒写法，已废弃。
   * - `end`：子元素靠交叉轴结束侧对齐，对应 `alignItems: 'flex-end'`；旧版弹性盒写法，已废弃。
   * - `start`：子元素靠交叉轴起始侧对齐，对应 `alignItems: 'flex-start'`；旧版弹性盒写法，已废弃。
   * - `stretch`：子元素拉伸以填满交叉轴方向，是默认值，对应 `alignItems: 'stretch'`；旧版弹性盒写法，已废弃。
   *
   * 初始值 `stretch`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-align
   */
  boxAlign?: StyleValue<KeywordValue<BoxAlignValues, CSSProperties['boxAlign']>>;
  /**
   * 设置盒子被分成多行、多栏或多页时装饰如何绘制。（box-decoration-break）
   *
   * 常用值：
   * - `clone`：每个片段都独立绘制完整的边框、内边距、背景和圆角，如同各自是单独的盒子。
   * - `slice`：先按未断开的整体绘制，再在断口处切开：断口处不绘制边框和内边距，背景在片段间连续，是默认值。
   *
   * 初始值 `slice`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-decoration-break
   */
  boxDecorationBreak?: StyleValue<
    KeywordValue<BoxDecorationBreakValues, CSSProperties['boxDecorationBreak']>
  >;
  /**
   * 旧版弹性盒中子元素排列方向是否反转（box-direction），已废弃，请用 flexDirection。
   *
   * 常用值：
   * - `normal`：子元素沿排列轴按正常顺序排列，对应 `flexDirection` 的 `row` 或 `column`；旧版弹性盒写法，已废弃。
   * - `reverse`：子元素沿排列轴反向排列，对应 `flexDirection` 的 `row-reverse` 或 `column-reverse`；旧版弹性盒写法，已废弃。
   *
   * 初始值 `normal`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-direction
   */
  boxDirection?: StyleValue<KeywordValue<BoxDirectionValues, CSSProperties['boxDirection']>>;
  /**
   * 旧版弹性盒中子元素的伸缩比例（box-flex），已废弃，请用 flexGrow。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-flex
   */
  boxFlex?: StyleValue<OpenValue<CSSProperties['boxFlex']> | keyof CssWideKeywords>;
  /**
   * 旧版弹性盒中子元素的伸缩分组（box-flex-group），已废弃，浏览器基本不支持。
   *
   * 数字值自动加 `px`；初始值 `1`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-flex-group
   */
  boxFlexGroup?: StyleValue<OpenValue<CSSProperties['boxFlexGroup']> | keyof CssWideKeywords>;
  /**
   * 旧版弹性盒是否允许换行（box-lines），已废弃，请用 flexWrap。
   *
   * 常用值：
   * - `multiple`：子元素放不下时可换到新的一行（列），对应 `flexWrap: 'wrap'`；旧版弹性盒写法，已废弃。
   * - `single`：所有子元素排在同一行（列）内，不换行，对应 `flexWrap: 'nowrap'`；旧版弹性盒写法，已废弃。
   *
   * 初始值 `single`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-lines
   */
  boxLines?: StyleValue<KeywordValue<BoxLinesValues, CSSProperties['boxLines']>>;
  /**
   * 旧版弹性盒中子元素的显示顺序（box-ordinal-group），已废弃，请用 order。
   *
   * 数字值自动加 `px`；初始值 `1`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-ordinal-group
   */
  boxOrdinalGroup?: StyleValue<OpenValue<CSSProperties['boxOrdinalGroup']> | keyof CssWideKeywords>;
  /**
   * 旧版弹性盒的排列轴向（box-orient），已废弃；多行截断时用 WebkitBoxOrient。
   *
   * 常用值：
   * - `block-axis`：子元素沿块轴排列，横排文字下等同于 `vertical`；旧版弹性盒写法，已废弃。
   * - `horizontal`：子元素沿水平方向排列，对应 `flexDirection: 'row'`；旧版弹性盒写法，已废弃。
   * - `inline-axis`：子元素沿行内轴排列，横排文字下等同于 `horizontal`；旧版弹性盒写法，已废弃。
   * - `vertical`：子元素沿垂直方向排列，对应 `flexDirection: 'column'`；多行文本截断需配合 `WebkitBoxOrient: 'vertical'`。旧版弹性盒写法，已废弃。
   *
   * 初始值 `inline-axis`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-orient
   */
  boxOrient?: StyleValue<KeywordValue<BoxOrientValues, CSSProperties['boxOrient']>>;
  /**
   * 设置盒子的外部或内部阴影，可叠加多层。（box-shadow）
   *
   * 阴影不占布局空间，可用逗号叠加；与 border/outline 的用途和绘制位置不同。
   *
   * 常用值：
   * - `none`：不绘制盒子阴影，可用来清除其他规则设置的阴影。
   *
   * 适用场景：浮层层次、卡片边缘或内凹效果。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-shadow
   */
  boxShadow?: StyleValue<
    | OpenValue<CSSProperties['boxShadow']>
    | keyof CssWideKeywords
    | keyof BoxShadowKeywords
    | keyof CssShadow
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ShadowsTokens
    | keyof QualifiedShadowsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 决定 width、height 等尺寸是否包含内边距和边框。（box-sizing）
   *
   * 常用值：
   * - `content-box`：指定尺寸仅计算内容盒，内边距和边框额外增加外部尺寸。
   * - `border-box`：指定尺寸包含内容、内边距和边框，但不包含外边距。仍不包含 margin；最小/最大尺寸和布局约束仍参与计算。content-box 在声明宽高之外再加内边距和边框。
   *
   * 适用场景：确定组件声明宽高时是否把 padding 和 border 算在尺寸内。
   *
   * 初始值 `content-box`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-sizing
   */
  boxSizing?: StyleValue<KeywordValue<BoxSizingValues, CSSProperties['boxSizing']>>;
  /**
   * 旧版弹性盒中是否隐藏元素（box-suppress），草案属性，浏览器不支持。
   *
   * 常用值：
   * - `discard`：元素及其后代不生成盒子，效果近似 `display: none`。早期草案属性，浏览器不支持。
   * - `hide`：用于隐藏元素，与 `discard` 的具体区别以 CSS Display 草案为准。早期草案属性，浏览器不支持。
   * - `show`：元素按 `display` 正常生成盒子，即不做任何抑制，是默认值。早期草案属性，浏览器不支持。
   */
  boxSuppress?: StyleValue<KeywordValue<BoxSuppressValues, CSSProperties['boxSuppress']>>;
  /**
   * 设置元素之后的分页、分栏或区域分片行为。（break-after）
   *
   * 常用值：
   * - `auto`：既不强制也不禁止在该侧断开（`breakBefore` 指元素之前，`breakAfter` 指元素之后），由浏览器按内容自然决定。
   * - `avoid`：尽量避免在该侧断开，不论是分页、分栏还是分区。
   * - `avoid-column`：尽量避免在该侧分栏断开。
   * - `avoid-page`：尽量避免在该侧分页断开。
   * - `avoid-region`：尽量避免在该侧分区断开；属于 CSS Regions，浏览器基本不支持。
   * - `column`：在该侧强制分栏，后续内容从下一栏开始。
   * - `left`：在该侧强制分页，并使新起的一页是左页，必要时插入空白页；主要用于分页媒体（如打印）。
   * - `page`：在该侧强制分页，后续内容从新的一页开始；主要用于分页媒体（如打印）。
   * - `recto`：在该侧强制分页，并使新起的一页是正面页（从左到右书写时为右页，从右到左时为左页）；主要用于分页媒体（如打印）。
   * - `region`：在该侧强制切到下一个区域；属于 CSS Regions，浏览器基本不支持。
   * - `right`：在该侧强制分页，并使新起的一页是右页，必要时插入空白页；主要用于分页媒体（如打印）。
   * - `verso`：在该侧强制分页，并使新起的一页是反面页（从左到右书写时为左页，从右到左时为右页）；主要用于分页媒体（如打印）。
   *
   * 初始值 `auto`；不继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-after
   */
  breakAfter?: StyleValue<KeywordValue<BreakAfterValues, CSSProperties['breakAfter']>>;
  /**
   * 设置元素之前的分页、分栏或区域分片行为。（break-before）
   *
   * 常用值：
   * - `auto`：既不强制也不禁止在该侧断开（`breakBefore` 指元素之前，`breakAfter` 指元素之后），由浏览器按内容自然决定。
   * - `avoid`：尽量避免在该侧断开，不论是分页、分栏还是分区。
   * - `avoid-column`：尽量避免在该侧分栏断开。
   * - `avoid-page`：尽量避免在该侧分页断开。
   * - `avoid-region`：尽量避免在该侧分区断开；属于 CSS Regions，浏览器基本不支持。
   * - `column`：在该侧强制分栏，后续内容从下一栏开始。
   * - `left`：在该侧强制分页，并使新起的一页是左页，必要时插入空白页；主要用于分页媒体（如打印）。
   * - `page`：在该侧强制分页，后续内容从新的一页开始；主要用于分页媒体（如打印）。
   * - `recto`：在该侧强制分页，并使新起的一页是正面页（从左到右书写时为右页，从右到左时为左页）；主要用于分页媒体（如打印）。
   * - `region`：在该侧强制切到下一个区域；属于 CSS Regions，浏览器基本不支持。
   * - `right`：在该侧强制分页，并使新起的一页是右页，必要时插入空白页；主要用于分页媒体（如打印）。
   * - `verso`：在该侧强制分页，并使新起的一页是反面页（从左到右书写时为左页，从右到左时为右页）；主要用于分页媒体（如打印）。
   *
   * 初始值 `auto`；不继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-before
   */
  breakBefore?: StyleValue<KeywordValue<BreakAfterValues, CSSProperties['breakBefore']>>;
  /**
   * 设置元素内部是否允许分页、分栏或区域分片。（break-inside）
   *
   * 常用值：
   * - `auto`：不限制元素内部断开，需要时可在内部分页、分栏或分区。
   * - `avoid`：尽量避免在元素内部断开，不论是分页、分栏还是分区。
   * - `avoid-column`：尽量避免在元素内部分栏断开，常用于防止卡片被拆到两栏。
   * - `avoid-page`：尽量避免在元素内部分页断开，常用于打印时保持表格行、图片完整。
   * - `avoid-region`：尽量避免在元素内部分区断开；属于 CSS Regions，浏览器基本不支持。
   *
   * 初始值 `auto`；不继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-inside
   */
  breakInside?: StyleValue<KeywordValue<BreakInsideValues, CSSProperties['breakInside']>>;
  /**
   * 设置表格标题相对于表格的放置侧。（caption-side）
   *
   * 常用值：
   * - `block-end`：标题放在表格块轴的结束侧，横排文字中即下方；较新的逻辑写法，浏览器支持有限。
   * - `block-start`：标题放在表格块轴的起始侧，横排文字中即上方；较新的逻辑写法，浏览器支持有限。
   * - `bottom`：标题放在表格下方。
   * - `inline-end`：标题放在表格行内轴的结束侧，从左到右的横排中即右侧；较新的逻辑写法，浏览器支持有限。
   * - `inline-start`：标题放在表格行内轴的起始侧，从左到右的横排中即左侧；较新的逻辑写法，浏览器支持有限。
   * - `top`：标题放在表格上方，是默认值。
   *
   * 初始值 `top`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/caption-side
   */
  captionSide?: StyleValue<KeywordValue<CaptionSideValues, CSSProperties['captionSide']>>;
  /**
   * 集中设置文本插入光标的颜色和形状。（caret）
   *
   * 简写属性，初始值见各分项；继承。
   */
  caret?: StyleValue<
    | OpenValue<CSSProperties['caret']>
    | keyof CssWideKeywords
    | keyof CaretColorKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof CaretAnimationKeywords
    | keyof CaretShapeKeywords
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置可编辑内容中的文本插入光标颜色。（caret-color）
   *
   * 常用值：
   * - `auto`：由浏览器选择光标颜色，通常跟随文本的 `color`。
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/caret-color
   */
  caretColor?: StyleValue<
    | OpenValue<CSSProperties['caretColor']>
    | keyof CssWideKeywords
    | keyof CaretColorKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置文本插入光标的形状。（caret-shape）
   *
   * 常用值：
   * - `auto`：由浏览器选择光标形状，通常是竖条。
   * - `bar`：竖条光标，画在字符之间。
   * - `block`：方块光标，覆盖光标所在的字符。
   * - `underscore`：下划线光标，画在光标所在字符的下方。
   *
   * 初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   */
  caretShape?: StyleValue<
    OpenValue<CSSProperties['caretShape']> | keyof CssWideKeywords | keyof CaretShapeKeywords
  >;
  /**
   * 要求元素避让指定侧的前置浮动元素。（clear）
   *
   * 常用值：
   * - `both`：避让左右两侧的前置浮动元素：元素下移到两侧浮动都结束之后。
   * - `inline-end`：避让行内结束侧的前置浮动，从左到右的文本中即右浮动，从右到左的文本中即左浮动。
   * - `inline-start`：避让行内起始侧的前置浮动，从左到右的文本中即左浮动，从右到左的文本中即右浮动。
   * - `left`：避让左浮动元素：元素下移到左侧浮动结束之后。
   * - `none`：不避让浮动，允许元素与前置浮动元素并排，是默认值。
   * - `right`：避让右浮动元素：元素下移到右侧浮动结束之后。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clear
   */
  clear?: StyleValue<KeywordValue<ClearValues, CSSProperties['clear']>>;
  /**
   * 使用旧式矩形裁剪绝对定位元素；新代码优先考虑 clip-path。（clip）
   *
   * 常用值：
   * - `auto`：不裁剪，裁剪区域与元素的边框盒相同；`clip` 是旧属性，新代码用 `clipPath`。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip
   */
  clip?: StyleValue<OpenValue<CSSProperties['clip']> | keyof CssWideKeywords | keyof ClipKeywords>;
  /**
   * 通过基本形状、路径或引用裁剪元素的可见区域。（clip-path）
   *
   * 常用值：
   * - `none`：不裁剪，元素完整可见。
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip-path
   */
  clipPath?: StyleValue<
    | OpenValue<CSSProperties['clipPath']>
    | keyof CssWideKeywords
    | keyof ClipPathKeywords
    | keyof CssGeometryBox
    | keyof CssShapeBox
    | keyof CssVisualBox
  >;
  /**
   * 设置 SVG 裁剪路径判断内部区域所用的填充规则。（clip-rule）
   *
   * 常用值：
   * - `evenodd`：按射线穿过路径次数的奇偶性判断内部，适合交叠或有孔路径。
   * - `nonzero`：按有方向的绕数判断路径内部，子路径方向会影响结果。
   *
   * 初始值 `nonzero`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip-rule
   */
  clipRule?: StyleValue<KeywordValue<FillRuleValues, CSSProperties['clipRule']>>;
  /**
   * 设置文字前景色，同时作为 currentColor 的来源。（color）
   *
   * 改变文字和 currentColor 的来源，不会自动改变背景。
   *
   * 初始值 `canvastext`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/color
   */
  color?: StyleValue<
    | OpenValue<CSSProperties['color']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 声明元素支持的配色方案，影响原生控件、滚动条等浏览器绘制内容。（color-scheme）
   *
   * 声明支持的方案不等于为应用生成主题颜色；文字、背景和业务 token 仍需自行定义。
   *
   * 常用值：
   * - `dark`：声明元素使用深色方案，原生控件、滚动条和默认背景等按深色绘制。
   * - `light`：声明元素使用浅色方案，原生控件、滚动条和默认背景等按浅色绘制。
   * - `light dark`：同时支持浅色和深色，浏览器按用户的系统或浏览器偏好选择，常配合 `light-dark()` 使用。
   * - `normal`：不声明配色方案，按浏览器默认的浅色外观绘制，原生控件也不会自动适配深色。
   * - `only dark`：只使用深色方案，并禁止浏览器用强制深色等自动变暗功能再改动该元素。
   * - `only light`：只使用浅色方案，并禁止浏览器用强制深色等自动变暗功能改动该元素。
   *
   * 初始值 `normal`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/color-scheme
   */
  colorScheme?: StyleValue<KeywordValue<ColorSchemeValues, CSSProperties['colorScheme']>>;
  /**
   * 控制元素是否参与系统强制颜色模式的自动替换。（forced-color-adjust）
   *
   * 常用值：
   * - `auto`：在强制颜色模式下，浏览器按系统配色替换该元素的颜色相关属性。
   * - `none`：强制颜色模式下不替换该元素的颜色，沿用作者指定的值；需要自行保证文字对比度。
   *
   * 初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/forced-color-adjust
   */
  forcedColorAdjust?: StyleValue<
    KeywordValue<ForcedColorAdjustValues, CSSProperties['forcedColorAdjust']>
  >;
  /**
   * 设置打印时浏览器是否可以为节墨或可读性调整颜色。（print-color-adjust）
   *
   * 常用值：
   * - `economy`：允许浏览器为节省墨水或提高可读性调整颜色，例如弱化背景色和背景图。
   * - `exact`：要求按样式原样输出颜色和图像，不做节墨调整；适合颜色本身有含义的图表等内容。
   *
   * 初始值 `economy`；继承；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/print-color-adjust
   */
  printColorAdjust?: StyleValue<
    KeywordValue<PrintColorAdjustValues, CSSProperties['printColorAdjust']>
  >;
  /**
   * 同时设置多栏布局的首选栏宽和目标栏数。（columns）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/columns
   */
  columns?: StyleValue<
    | OpenValue<CSSProperties['columns']>
    | keyof CssWideKeywords
    | keyof ColumnWidthKeywords
    | keyof ColumnCountKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置多栏布局的目标栏数。（column-count）
   *
   * 常用值：
   * - `auto`：栏数由其他属性（如 `columnWidth`）决定，两者都是 `auto` 时不分栏。
   *
   * 数字值不加单位；初始值 `auto`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-count
   */
  columnCount?: StyleValue<
    OpenValue<CSSProperties['columnCount']> | keyof CssWideKeywords | keyof ColumnCountKeywords
  >;
  /**
   * 设置多栏布局的首选栏宽，实际栏宽由容器空间决定。（column-width）
   *
   * 常用值：
   * - `auto`：栏宽由其他属性（如 `columnCount`）决定，两者都是 `auto` 时不分栏。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-width
   */
  columnWidth?: StyleValue<
    | OpenValue<CSSProperties['columnWidth']>
    | keyof CssWideKeywords
    | keyof ColumnWidthKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置多栏之间分隔线的宽度、线型和颜色。（column-rule）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule
   */
  columnRule?: StyleValue<
    | OpenValue<CSSProperties['columnRule']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof CssLineStyle
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置多栏分隔线的颜色。（column-rule-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-color
   */
  columnRuleColor?: StyleValue<
    | OpenValue<CSSProperties['columnRuleColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置多栏分隔线的线型。（column-rule-style）
   *
   * 初始值 `none`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-style
   */
  columnRuleStyle?: StyleValue<
    KeywordValue<ColumnRuleStyleValues, CSSProperties['columnRuleStyle']>
  >;
  /**
   * 设置多栏分隔线的宽度。（column-rule-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-width
   */
  columnRuleWidth?: StyleValue<
    | OpenValue<CSSProperties['columnRuleWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置多栏内容顺序填充还是尽量均衡栏高。（column-fill）
   *
   * 常用值：
   * - `auto`：按顺序填充：先填满一栏再填下一栏，栏高由容器高度决定，最后一栏可能留白。
   * - `balance`：尽量让各栏内容高度均衡，是默认值。
   *
   * 初始值 `balance`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-fill
   */
  columnFill?: StyleValue<KeywordValue<ColumnFillValues, CSSProperties['columnFill']>>;
  /**
   * 设置布局中相邻列之间的间距。（column-gap）
   *
   * 常用值：
   * - `normal`：使用默认间距：多栏布局中为 `1em`，Flex、Grid 等其他布局中为 `0`。
   *
   * 数字值自动加 `px`；初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-gap
   */
  columnGap?: StyleValue<
    | OpenValue<CSSProperties['columnGap']>
    | keyof CssWideKeywords
    | keyof ColumnGapKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置多栏布局中的元素是否跨越所有栏。（column-span）
   *
   * 常用值：
   * - `all`：元素横跨多栏容器的所有栏，其前后的内容各自重新分栏。
   * - `none`：元素只在当前栏内，不跨栏，是默认值。
   *
   * 初始值 `none`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-span
   */
  columnSpan?: StyleValue<KeywordValue<ColumnSpanValues, CSSProperties['columnSpan']>>;
  /**
   * 声明尺寸、布局、绘制或样式隔离，限制子树对外部的影响。（contain）
   *
   * 不同隔离类型会改变布局和绘制语义，不能仅当作无副作用的性能开关。
   *
   * 常用值：
   * - `content`：组合 layout、style 和 paint 隔离，不包含 size 隔离。
   * - `strict`：组合 size、layout、style 和 paint 隔离；尺寸隔离可能影响自动尺寸。
   * - `size`：计算盒子尺寸时不依赖后代内容，通常需要显式或替代内部尺寸。
   * - `paint`：将后代绘制限制在隔离边界内。
   * - `style`：隔离计数器等特定样式副作用，不会阻止普通 CSS 继承或选择器匹配。
   *
   * 适用场景：边界明确且尺寸、溢出行为经过验证的独立区域。
   *
   * 初始值 `none`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain
   */
  contain?: StyleValue<
    OpenValue<CSSProperties['contain']> | keyof CssWideKeywords | keyof ContainKeywords
  >;
  /**
   * 集中设置尺寸隔离时使用的替代内部宽高。（contain-intrinsic-size）
   *
   * 常用值：
   * - `auto`：放在长度之前，如 `auto 300px`：元素渲染过则记住最近一次的实际尺寸，没有记录时才用后面的长度。
   * - `none`：不提供替代内部尺寸，尺寸隔离时该方向的内部尺寸按 `0` 计算。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-size
   */
  containIntrinsicSize?: StyleValue<
    | OpenValue<CSSProperties['containIntrinsicSize']>
    | keyof CssWideKeywords
    | keyof ContainIntrinsicSizeKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置块轴尺寸隔离或跳过内容渲染时使用的替代内部尺寸。（contain-intrinsic-block-size）
   *
   * 常用值：
   * - `auto`：放在长度之前，如 `auto 300px`：元素渲染过则记住该方向最近一次的实际尺寸，没有记录时才用后面的长度。
   * - `none`：不提供该方向的替代内部尺寸，尺寸隔离时按 `0` 计算。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-block-size
   */
  containIntrinsicBlockSize?: StyleValue<
    | OpenValue<CSSProperties['containIntrinsicBlockSize']>
    | keyof CssWideKeywords
    | keyof ContainIntrinsicWidthKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置行内轴尺寸隔离或跳过内容渲染时使用的替代内部尺寸。（contain-intrinsic-inline-size）
   *
   * 常用值：
   * - `auto`：放在长度之前，如 `auto 300px`：元素渲染过则记住该方向最近一次的实际尺寸，没有记录时才用后面的长度。
   * - `none`：不提供该方向的替代内部尺寸，尺寸隔离时按 `0` 计算。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-inline-size
   */
  containIntrinsicInlineSize?: StyleValue<
    | OpenValue<CSSProperties['containIntrinsicInlineSize']>
    | keyof CssWideKeywords
    | keyof ContainIntrinsicWidthKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置高度隔离或跳过内容渲染时使用的替代内部高度。（contain-intrinsic-height）
   *
   * 常用值：
   * - `auto`：放在长度之前，如 `auto 300px`：元素渲染过则记住该方向最近一次的实际尺寸，没有记录时才用后面的长度。
   * - `none`：不提供该方向的替代内部尺寸，尺寸隔离时按 `0` 计算。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-height
   */
  containIntrinsicHeight?: StyleValue<
    | OpenValue<CSSProperties['containIntrinsicHeight']>
    | keyof CssWideKeywords
    | keyof ContainIntrinsicWidthKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置宽度隔离或跳过内容渲染时使用的替代内部宽度。（contain-intrinsic-width）
   *
   * 常用值：
   * - `auto`：放在长度之前，如 `auto 300px`：元素渲染过则记住该方向最近一次的实际尺寸，没有记录时才用后面的长度。
   * - `none`：不提供该方向的替代内部尺寸，尺寸隔离时按 `0` 计算。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-width
   */
  containIntrinsicWidth?: StyleValue<
    | OpenValue<CSSProperties['containIntrinsicWidth']>
    | keyof CssWideKeywords
    | keyof ContainIntrinsicWidthKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 同时声明查询容器的名称和类型。（container）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/container
   */
  container?: StyleValue<
    | OpenValue<CSSProperties['container']>
    | keyof CssWideKeywords
    | keyof ContainerNameKeywords
    | keyof ContainerTypeKeywords
  >;
  /**
   * 为查询容器命名，供 @container 条件规则选择。（container-name）
   *
   * 常用值：
   * - `none`：不为容器命名，`@container` 无法按名称引用它，只能由不带名称的查询匹配。
   *
   * 初始值 `none`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/container-name
   */
  containerName?: StyleValue<
    OpenValue<CSSProperties['containerName']> | keyof CssWideKeywords | keyof ContainerNameKeywords
  >;
  /**
   * 建立指定类型的查询容器，并施加所需的隔离行为。（container-type）
   *
   * 建立尺寸查询容器会同时引入必要的隔离语义；容器本身的样式通常由祖先查询容器决定。
   *
   * 常用值：
   * - `normal`：不建立尺寸查询容器；仍可用于支持的样式查询。
   * - `inline-size`：建立行内轴尺寸查询容器，不同时隔离块轴尺寸。
   * - `size`：建立两个轴的尺寸查询容器，内容不再直接决定其隔离尺寸。
   *
   * 适用场景：让组件按所在容器尺寸响应，而不是只按视口响应。
   *
   * 初始值 `normal`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/container-type
   */
  containerType?: StyleValue<KeywordValue<ContainerTypeValues, CSSProperties['containerType']>>;
  /**
   * 控制是否渲染元素内容，并允许浏览器跳过暂时不可见的子树。（content-visibility）
   *
   * 允许跳过子树渲染；跳过时的占位尺寸可由 contain-intrinsic-size 提供。
   *
   * 常用值：
   * - `visible`：正常渲染内容，不由此属性跳过子树。
   * - `auto`：允许浏览器跳过与用户暂不相关的内容渲染，仍需维护布局和可访问性语义。
   * - `hidden`：跳过内容渲染，行为不同于只隐藏绘制的 visibility:hidden。
   *
   * 适用场景：页面中较长、暂时位于视口外的独立内容区域。
   *
   * 初始值 `visible`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/content-visibility
   */
  contentVisibility?: StyleValue<
    KeywordValue<ContentVisibilityValues, CSSProperties['contentVisibility']>
  >;
  /**
   * 设置生成内容、替换内容或伪元素的内容。（content）
   *
   * 常用值：
   * - `normal`：元素本身按正常内容显示；在 `::before`、`::after` 上等同于 `none`，不生成伪元素。
   * - `none`：不生成内容，伪元素不会被创建，也不会显示。
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/content
   */
  content?: StyleValue<
    | OpenValue<CSSProperties['content']>
    | keyof CssWideKeywords
    | keyof ContentKeywords
    | keyof CssQuote
  >;
  /**
   * 增加或减少指定 CSS 计数器的值。（counter-increment）
   *
   * 常用值：
   * - `none`：不改变任何计数器。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-increment
   */
  counterIncrement?: StyleValue<
    | OpenValue<CSSProperties['counterIncrement']>
    | keyof CssWideKeywords
    | keyof CounterIncrementKeywords
  >;
  /**
   * 创建或重置 CSS 计数器。（counter-reset）
   *
   * 常用值：
   * - `none`：不创建也不重置任何计数器。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-reset
   */
  counterReset?: StyleValue<
    OpenValue<CSSProperties['counterReset']> | keyof CssWideKeywords | keyof CounterResetKeywords
  >;
  /**
   * 设置已有 CSS 计数器的值，必要时创建计数器。（counter-set）
   *
   * 常用值：
   * - `none`：不设置任何计数器的值。
   *
   * 数字值不加单位；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-set
   */
  counterSet?: StyleValue<
    OpenValue<CSSProperties['counterSet']> | keyof CssWideKeywords | keyof CounterSetKeywords
  >;
  /**
   * 语音合成在元素前后播放的提示音（cue），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  cue?: StyleValue<OpenValue<CSSProperties['cue']> | keyof CssWideKeywords>;
  /**
   * 语音合成在元素之后播放的提示音（cue-after），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  cueAfter?: StyleValue<OpenValue<CSSProperties['cueAfter']> | keyof CssWideKeywords>;
  /**
   * 语音合成在元素之前播放的提示音（cue-before），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  cueBefore?: StyleValue<OpenValue<CSSProperties['cueBefore']> | keyof CssWideKeywords>;
  /**
   * 设置指针位于元素上方时显示的光标。（cursor）
   *
   * 常用值：
   * - `-webkit-grab`：张开的抓手光标，早期 WebKit 的前缀写法，已被标准的 `grab` 取代。
   * - `-webkit-grabbing`：握紧的抓手光标，表示正在拖拽，早期 WebKit 的前缀写法，已被标准的 `grabbing` 取代。
   *
   * 初始值 `auto`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/cursor
   */
  cursor?: StyleValue<KeywordValue<CursorValues, CSSProperties['cursor']>>;
  /**
   * 设置文本基本方向，参与双向文本及部分布局计算。（direction）
   *
   * 常用值：
   * - `ltr`：文本和行内内容的基本方向为从左到右，是默认值。
   * - `rtl`：基本方向为从右到左，用于阿拉伯语、希伯来语等；Flex、Grid、表格的行内方向会随之翻转。
   *
   * 初始值 `ltr`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/direction
   */
  direction?: StyleValue<KeywordValue<DirectionValues, CSSProperties['direction']>>;
  /**
   * 决定元素是否生成布局盒子，以及元素自身和内部内容如何排版。（display）
   *
   * 外部显示类型决定元素自身以块级还是行内级方式参与周围布局；内部布局方式决定内容使用普通流、Flex 或 Grid 等布局。此属性不继承；例如 div 通常由浏览器默认样式设置为 block。
   *
   * 常用值：
   * - `block`：生成块级盒子，内部默认采用普通流布局。
   * - `inline`：生成行内盒子，参与行内排版；普通非替换行内盒子的宽高不按块盒规则应用。
   * - `flex`：生成块级弹性容器，直接子元素参与 Flex 布局。默认主轴为 row，默认不换行；主轴方向还受书写方向影响。inline-flex 使用相同的内部布局，但容器对外按行内级盒子排列。
   * - `inline-flex`：创建行内级的 Flex 容器。子项换行由 flex-wrap 控制。当容器自身是 Flex/Grid 项目时，其外部排版还受父布局控制。与 flex 的区别是容器自身的外部排版方式，内部弹性布局机制相同；inline-flex 对应双关键字写法 inline flex。
   * - `grid`：生成块级网格容器，直接子元素参与 Grid 布局。Flex 更侧重单个主轴；Grid 可以同时控制行和列。inline-grid 则改变容器对外的显示类型。
   * - `none`：不生成元素及其后代的布局盒子，通常也从可访问性树中移除。不能靠它保留可聚焦交互；重新显示时需按组件需求管理焦点。visibility:hidden 通常保留布局空间；opacity:0 只改变透明度，通常仍能交互。
   *
   * 适用场景：选择容器的布局方式；具体对齐、间距和换行由对应布局属性控制。
   *
   * 初始值 `inline`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/display
   */
  display?: StyleValue<KeywordValue<DisplayValues, CSSProperties['display']>>;
  /**
   * 单独设置 display 的内部布局方式（display-inside），早期草案，浏览器不支持；请用 display 的双值写法。
   *
   * 常用值：
   * - `auto`：由浏览器按元素类型决定内部布局方式。早期草案属性，浏览器不支持。
   * - `block`：元素内部使用块布局（普通流）。早期草案属性，浏览器不支持。
   * - `flex`：元素内部使用弹性盒布局。早期草案属性，浏览器不支持。
   * - `grid`：元素内部使用网格布局。早期草案属性，浏览器不支持。
   * - `ruby`：元素内部使用 ruby 注音布局。早期草案属性，浏览器不支持。
   * - `table`：元素内部使用表格布局。早期草案属性，浏览器不支持。
   */
  displayInside?: StyleValue<KeywordValue<DisplayInsideValues, CSSProperties['displayInside']>>;
  /**
   * 单独设置元素是否生成列表项标记（display-list），早期草案，浏览器不支持。
   *
   * 常用值：
   * - `list-item`：元素生成列表项标记（如圆点、序号），相当于 `display: list-item`。早期草案属性，浏览器不支持。
   * - `none`：元素不生成列表项标记，按普通盒子显示。早期草案属性，浏览器不支持。
   */
  displayList?: StyleValue<KeywordValue<DisplayListValues, CSSProperties['displayList']>>;
  /**
   * 单独设置 display 的外部显示类型（display-outside），早期草案，浏览器不支持。
   *
   * 常用值：`block-level`、`contents`、`inline-level`、`none`、`ruby-base`、`ruby-base-container`、`ruby-text`、`ruby-text-container`、`run-in`、`table-caption`、`table-cell`、`table-column`、`table-column-group`、`table-footer-group`、`table-header-group`、`table-row`、`table-row-group`
   */
  displayOutside?: StyleValue<KeywordValue<DisplayOutsideValues, CSSProperties['displayOutside']>>;
  /**
   * 选择 SVG 文本布局的主导基线及基线表。（dominant-baseline）
   *
   * 常用值：
   * - `alphabetic`：以字母基线（拉丁字母底部）为主导基线，西文横排的常用对齐方式。
   * - `auto`：由浏览器按书写模式选择：横排用字母基线，竖排且字形直立时用 `central`。
   * - `central`：以字符 em 盒垂直方向的中心为主导基线，竖排文字常用。
   * - `hanging`：以悬挂基线为主导基线，梵文、藏文等字形悬挂在这条线之下的文字使用。
   * - `ideographic`：以表意基线为主导基线，位于 CJK 等表意文字字形的底部。
   * - `mathematical`：以数学基线为主导基线，用于数学公式排版。
   * - `middle`：以字母基线上方约半个 x 高度处为主导基线，常用来让文字在垂直方向居中。
   * - `no-change`：沿用父元素的主导基线，不重新计算；SVG 1.1 旧值，已废弃。
   * - `reset-size`：沿用父元素的主导基线，并按当前字号重新计算基线表；SVG 1.1 旧值，已废弃。
   * - `text-after-edge`：以文本区域的下边缘为主导基线；SVG 1.1 旧值，已废弃，改用 `text-bottom`。
   * - `text-before-edge`：以文本区域的上边缘为主导基线；SVG 1.1 旧值，已废弃，改用 `text-top`。
   * - `use-script`：按文字所属书写系统选择默认基线；SVG 1.1 旧值，已废弃。
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/dominant-baseline
   */
  dominantBaseline?: StyleValue<
    KeywordValue<DominantBaselineValues, CSSProperties['dominantBaseline']>
  >;
  /**
   * 控制分离边框表格中空单元格的边框和背景是否绘制。（empty-cells）
   *
   * 常用值：
   * - `hide`：分离边框表格中，不绘制空单元格的边框和背景。
   * - `show`：分离边框表格中，仍绘制空单元格的边框和背景，是默认值。
   *
   * 初始值 `show`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/empty-cells
   */
  emptyCells?: StyleValue<KeywordValue<EmptyCellsValues, CSSProperties['emptyCells']>>;
  /**
   * 非标准键，不对应 CSS 属性；定位请用 insetInlineEnd。（end）
   *
   * 数字值自动加 `px`。
   */
  end?: StyleValue<OpenValue<CSSProperties['end']> | keyof CssWideKeywords>;
  /**
   * 设置 SVG 图形内部的填充绘制方式。（fill）
   *
   * 初始值 `black`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/fill
   */
  fill?: StyleValue<
    | OpenValue<CSSProperties['fill']>
    | keyof CssWideKeywords
    | keyof CssPaint
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置 SVG 填充的不透明度，不影响描边。（fill-opacity）
   *
   * 数字值不加单位；初始值 `1`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/fill-opacity
   */
  fillOpacity?: StyleValue<
    OpenValue<CSSProperties['fillOpacity']> | keyof CssWideKeywords | keyof QualifiedOpacitiesTokens
  >;
  /**
   * 设置复杂 SVG 路径的内部区域判定规则。（fill-rule）
   *
   * 常用值：
   * - `evenodd`：按射线穿过路径次数的奇偶性判断内部，适合交叠或有孔路径。
   * - `nonzero`：按有方向的绕数判断路径内部，子路径方向会影响结果。
   *
   * 初始值 `nonzero`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/fill-rule
   */
  fillRule?: StyleValue<KeywordValue<FillRuleValues, CSSProperties['fillRule']>>;
  /**
   * 对元素的最终图像应用模糊、亮度等滤镜。（filter）
   *
   * 常用值：
   * - `none`：不应用任何滤镜。
   *
   * 初始值 `none`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/filter
   */
  filter?: StyleValue<
    OpenValue<CSSProperties['filter']> | keyof CssWideKeywords | keyof FilterKeywords
  >;
  /**
   * 集中设置弹性项目的增长系数、收缩系数和基础尺寸。（flex）
   *
   * 依次对应 flex-grow、flex-shrink、flex-basis。作用于弹性项目，应先由父容器建立 Flex 布局。
   *
   * 常用值：
   * - `auto`：等价于 1 1 auto：可增长、可收缩，基础尺寸由主尺寸属性或内容决定。最终比例还受最小/最大尺寸约束，不保证所有项目等宽。1 1 0% 以零百分比为基础分配，auto 的基础尺寸通常受内容或主尺寸属性影响。
   * - `none`：等价于 0 0 auto：不增长也不收缩，保留自动基础尺寸。auto 会增长和收缩；none 两者都不参与。
   *
   * 适用场景：分配弹性布局中的剩余空间，或让项目保持自身尺寸。
   *
   * 数字值不加单位；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex
   */
  flex?: StyleValue<
    | OpenValue<CSSProperties['flex']>
    | keyof CssWideKeywords
    | keyof FlexKeywords
    | keyof FlexBasisKeywords
    | keyof WidthKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置弹性项目分配剩余空间之前的主轴基础尺寸。（flex-basis）
   *
   * 在剩余空间分配前确定项目的主轴基础尺寸；设置为 auto 时先参考对应的 width/height。
   *
   * 常用值：
   * - `auto`：先参考主轴对应的 width 或 height；该值也为 auto 时由内容决定。
   * - `content`：按内容确定基础尺寸，而不直接使用 width 或 height 作为基础尺寸。
   *
   * 适用场景：为侧栏、内容区或重复项目指定弹性分配的起始尺寸。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-basis
   */
  flexBasis?: StyleValue<
    | OpenValue<CSSProperties['flexBasis']>
    | keyof CssWideKeywords
    | keyof FlexBasisKeywords
    | keyof WidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置弹性容器的主轴方向及项目排列方向。（flex-direction）
   *
   * row 沿行内轴，column 沿块轴；不能始终按“水平/垂直”理解。反转只改变视觉排列，不改变 DOM 顺序。
   *
   * 常用值：
   * - `row`：主轴沿行内方向排列；不一定是从左到右，取决于书写方向。
   * - `column`：主轴沿块方向排列；水平书写时通常从上到下。
   * - `row-reverse`：反转行内方向的视觉排列，不改变 DOM 顺序。
   * - `column-reverse`：反转块方向的视觉排列，不改变 DOM 顺序。
   *
   * 初始值 `row`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-direction
   */
  flexDirection?: StyleValue<KeywordValue<FlexDirectionValues, CSSProperties['flexDirection']>>;
  /**
   * 同时设置弹性布局的主轴方向和换行方式。（flex-flow）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-flow
   */
  flexFlow?: StyleValue<KeywordValue<FlexFlowValues, CSSProperties['flexFlow']>>;
  /**
   * 设置弹性项目分配正剩余空间时的增长系数。（flex-grow）
   *
   * 数值是分配正剩余空间的相对权重，不是最终宽度百分比。只有容器存在剩余空间时才发挥作用。
   *
   * 适用场景：让主内容区填充工具栏或行布局的剩余空间。
   *
   * 数字值不加单位；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-grow
   */
  flexGrow?: StyleValue<OpenValue<CSSProperties['flexGrow']> | keyof CssWideKeywords>;
  /**
   * 设置弹性项目空间不足时的收缩系数。（flex-shrink）
   *
   * 实际收缩还与 flex-basis 成比例；自动最小尺寸可能阻止项目继续缩小。
   *
   * 适用场景：控制空间不足时是否允许缩小；设置为 0 可避免图标或固定控件收缩。
   *
   * 数字值不加单位；初始值 `1`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-shrink
   */
  flexShrink?: StyleValue<OpenValue<CSSProperties['flexShrink']> | keyof CssWideKeywords>;
  /**
   * 设置弹性项目是否换行，以及多行的排列方向。（flex-wrap）
   *
   * 常用值：
   * - `nowrap`：保持单行；项目仍可能收缩或溢出。
   * - `wrap`：空间不足时形成多行，沿交叉轴正常方向排列。换行不会自动均分每行项目宽度，尺寸仍由各项目的 flex 配置决定。nowrap 保持单行；wrap-reverse 反转交叉轴上各行的排列方向。
   * - `wrap-reverse`：允许换行并反转交叉轴上各行的排列方向。
   *
   * 适用场景：标签、按钮等项目不足一行时允许分行。
   *
   * 初始值 `nowrap`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-wrap
   */
  flexWrap?: StyleValue<KeywordValue<FlexWrapValues, CSSProperties['flexWrap']>>;
  /**
   * 将元素浮动到指定侧，使相邻行内内容围绕它排列。（float）
   *
   * 常用值：
   * - `end`：StyleX 类型里保留的写法，浏览器不认；按书写方向靠结束边浮动请用 `inline-end`。
   * - `inline-end`：元素浮动到行内结束侧，从左到右的文本中即右侧，其余内容在另一侧环绕。
   * - `inline-start`：元素浮动到行内起始侧，从左到右的文本中即左侧，其余内容在另一侧环绕。
   * - `left`：元素浮动到容器左侧，后续行内内容在其右侧环绕。
   * - `none`：元素不浮动，保持在正常文档流中，是默认值。
   * - `right`：元素浮动到容器右侧，后续行内内容在其左侧环绕。
   * - `start`：StyleX 类型里保留的写法，浏览器不认；按书写方向靠起始边浮动请用 `inline-start`。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/float
   */
  float?: StyleValue<KeywordValue<FloatValues, CSSProperties['float']>>;
  /**
   * 集中设置字体样式、粗细、大小、行高和字体族等信息。（font）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font
   */
  font?: StyleValue<
    | OpenValue<CSSProperties['font']>
    | keyof CssWideKeywords
    | keyof FontStyleKeywords
    | keyof CssFontVariantCss2
    | keyof FontWeightKeywords
    | keyof CssFontWeightAbsolute
    | keyof CssFontWidthCss3
    | keyof FontSizeKeywords
    | keyof CssAbsoluteSize
    | keyof CssRelativeSize
    | keyof LineHeightKeywords
    | keyof CssGenericFamily
    | keyof CssGenericComplete
    | keyof CssGenericIncomplete
    | keyof CssSystemFamilyName
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedFontsTokens
    | keyof QualifiedFontWeightsTokens
    | keyof QualifiedLineHeightsTokens
  >;
  /**
   * 设置按优先级排列的字体族及通用字体回退。（font-family）
   *
   * 初始值 `dependsOnUserAgent`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-family
   */
  fontFamily?: StyleValue<
    | OpenValue<CSSProperties['fontFamily']>
    | keyof CssWideKeywords
    | keyof CssGenericFamily
    | keyof CssGenericComplete
    | keyof CssGenericIncomplete
    | keyof FontsTokens
    | keyof QualifiedFontsTokens
  >;
  /**
   * 通过 OpenType 特性标签控制字体的底层排版功能。（font-feature-settings）
   *
   * 常用值：
   * - `normal`：不额外开关 OpenType 特性，按字体和其他 `font-*` 属性的默认排版。
   *
   * 初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-feature-settings
   */
  fontFeatureSettings?: StyleValue<
    | OpenValue<CSSProperties['fontFeatureSettings']>
    | keyof CssWideKeywords
    | keyof FontFeatureSettingsKeywords
    | keyof CssFeatureTagValue
  >;
  /**
   * 设置是否应用字体提供的字偶间距调整。（font-kerning）
   *
   * 常用值：
   * - `auto`：由浏览器决定是否应用字偶间距调整，通常默认启用。
   * - `none`：关闭字偶间距调整，字符按各自的默认字宽排列。
   * - `normal`：强制启用字体提供的字偶间距调整。
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-kerning
   */
  fontKerning?: StyleValue<KeywordValue<FontKerningValues, CSSProperties['fontKerning']>>;
  /**
   * 覆盖字体排版使用的语言系统标签，不改变文本实际语言。（font-language-override）
   *
   * 常用值：
   * - `normal`：不覆盖，按文本实际语言（`lang`）选用字体的语言相关字形和规则。
   *
   * 初始值 `normal`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-language-override
   */
  fontLanguageOverride?: StyleValue<
    | OpenValue<CSSProperties['fontLanguageOverride']>
    | keyof CssWideKeywords
    | keyof FontLanguageOverrideKeywords
  >;
  /**
   * 设置字体大小，也影响 em 等相对单位的计算。（font-size）
   *
   * 改变字形大小，并影响 em 等相对长度；行盒高度还由 line-height 决定。
   *
   * 常用值：
   * - `math`：按 `math-depth` 对继承的字号做缩放，主要用于 MathML 上下标、分式等嵌套内容；较新的值，浏览器支持有限。
   *
   * 适用场景：建立文字层级，根字号相对尺寸可用 rem 表达。
   *
   * 数字值自动加 `px`；初始值 `medium`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-size
   */
  fontSize?: StyleValue<
    | OpenValue<CSSProperties['fontSize']>
    | keyof CssWideKeywords
    | keyof FontSizeKeywords
    | keyof CssAbsoluteSize
    | keyof CssRelativeSize
    | keyof FontSizesTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 按字体特征尺寸调整字号，减少字体回退造成的视觉变化。（font-size-adjust）
   *
   * 常用值：
   * - `none`：不按字体特征调整字号，使用声明的 `fontSize`。
   *
   * 数字值自动加 `px`；初始值 `none`；继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-size-adjust
   */
  fontSizeAdjust?: StyleValue<KeywordValue<FontSizeAdjustValues, CSSProperties['fontSizeAdjust']>>;
  /**
   * 选择字体的宽窄字面；font-width 是其较新的名称。（font-stretch）
   *
   * 初始值 `normal`；继承；已废弃；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-stretch
   */
  fontStretch?: StyleValue<
    OpenValue<CSSProperties['fontStretch']> | keyof CssWideKeywords | keyof CssFontStretchAbsolute
  >;
  /**
   * 选择正常、斜体或倾斜字体样式。（font-style）
   *
   * 常用值：
   * - `normal`：使用字体的直立正体。
   * - `italic`：使用字体的斜体字形；字体没有时退回倾斜字形，再没有则由浏览器合成。
   * - `oblique`：使用倾斜字形，可后接角度，如 `oblique 10deg`；不写角度时默认为 `14deg`。
   *
   * 初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-style
   */
  fontStyle?: StyleValue<KeywordValue<FontStyleValues, CSSProperties['fontStyle']>>;
  /**
   * 控制缺少真实字体字形时浏览器可否合成粗体、斜体等样式。（font-synthesis）
   *
   * 常用值：
   * - `none`：禁止浏览器合成任何缺失的粗体、斜体、小型大写和上下标字形，缺少时直接用字体已有的字形。
   * - `weight`：字体没有粗体字形时，允许浏览器合成粗体；写在哪个值上，就允许合成哪一类。
   * - `style`：字体没有斜体字形时，允许浏览器合成斜体。
   * - `small-caps`：字体没有小型大写字形时，允许浏览器合成小型大写字母。
   * - `position`：字体没有上标、下标字形时，允许浏览器缩小并平移普通字形来合成。
   *
   * 初始值 `weight style small-caps position `；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis
   */
  fontSynthesis?: StyleValue<
    OpenValue<CSSProperties['fontSynthesis']> | keyof CssWideKeywords | keyof FontSynthesisKeywords
  >;
  /**
   * 控制浏览器是否可以合成加粗字体。（font-synthesis-weight）
   *
   * 常用值：
   * - `auto`：字体没有对应粗体字形时，允许浏览器加粗已有字形，合成伪粗体。
   * - `none`：禁止合成粗体，只使用字体自带的字重；字体没有时保持原字重。
   *
   * 初始值 `auto`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-weight
   */
  fontSynthesisWeight?: StyleValue<
    KeywordValue<FontSynthesisWeightValues, CSSProperties['fontSynthesisWeight']>
  >;
  /**
   * 控制浏览器是否可以合成倾斜字体。（font-synthesis-style）
   *
   * 常用值：
   * - `auto`：字体没有斜体或倾斜字形时，允许浏览器把直立字形倾斜，合成伪斜体。
   * - `none`：禁止合成斜体，只使用字体自带的斜体字形；字体没有时保持直立。
   *
   * 初始值 `auto`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-style
   */
  fontSynthesisStyle?: StyleValue<
    KeywordValue<FontSynthesisStyleValues, CSSProperties['fontSynthesisStyle']>
  >;
  /**
   * 控制浏览器是否可以合成小型大写字形。（font-synthesis-small-caps）
   *
   * 常用值：
   * - `auto`：字体没有原生小型大写字形时，允许浏览器缩小大写字母来合成小型大写。
   * - `none`：禁止合成小型大写；字体没有原生字形时，按普通字形显示。
   *
   * 初始值 `auto`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-small-caps
   */
  fontSynthesisSmallCaps?: StyleValue<
    KeywordValue<FontSynthesisSmallCapsValues, CSSProperties['fontSynthesisSmallCaps']>
  >;
  /**
   * 控制浏览器是否可以合成上标和下标字形。（font-synthesis-position）
   *
   * 常用值：
   * - `auto`：字体没有上标、下标字形时，允许浏览器缩小并平移普通字形来合成。
   * - `none`：禁止合成上标、下标字形，缺少时直接用字体已有的字形。
   *
   * 初始值 `none`；继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-position
   */
  fontSynthesisPosition?: StyleValue<
    KeywordValue<FontSynthesisPositionValues, CSSProperties['fontSynthesisPosition']>
  >;
  /**
   * 集中设置字体的连字、大小写、数字及其他变体。（font-variant）
   *
   * 常用值：
   * - `normal`：所有 `font-variant-*` 子属性都取 `normal`，不启用任何变体字形。
   * - `none`：关闭所有连字（等同 `font-variant-ligatures: none`），其余子属性取 `normal`。
   * - `historical-forms`：使用字体提供的历史字形（OpenType `hist`），属于 `font-variant-alternates` 的一部分。
   * - `small-caps`：小写字母改用小型大写字形，大写字母保持不变。
   * - `all-small-caps`：大写和小写字母都改用小型大写字形。
   * - `petite-caps`：小写字母改用比小型大写更小的 petite 小型大写字形，需要字体提供 `pcap` 特性。
   * - `all-petite-caps`：大写和小写字母都改用 petite 小型大写字形，需要字体提供 `c2pc` 特性。
   * - `unicase`：大写字母改用小型大写字形，小写字母保持普通字形，得到大小写混合的统一视觉高度。
   * - `titling-caps`：使用标题专用大写字形，笔画通常更纤细，避免全大写标题显得过重；需要字体提供 `titl` 特性。
   * - `ordinal`：使用序数标记专用字形，如 1st、2nd 中上标的字母（OpenType `ordn`）。
   * - `slashed-zero`：数字零带斜线，避免与大写字母 O 混淆（OpenType `zero`）。
   * - `ruby`：使用适合注音（ruby）小字的东亚字形，主要影响日文假名（OpenType `ruby`）。
   *
   * 初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant
   */
  fontVariant?: StyleValue<
    | OpenValue<CSSProperties['fontVariant']>
    | keyof CssWideKeywords
    | keyof FontVariantKeywords
    | keyof CssCommonLigValues
    | keyof CssDiscretionaryLigValues
    | keyof CssHistoricalLigValues
    | keyof CssContextualAltValues
    | keyof CssNumericFigureValues
    | keyof CssNumericSpacingValues
    | keyof CssNumericFractionValues
    | keyof CssEastAsianVariantValues
    | keyof CssEastAsianWidthValues
  >;
  /**
   * 选择字体提供的替代字形。（font-variant-alternates）
   *
   * 常用值：
   * - `normal`：不启用任何替代字形，使用字体的默认字形。
   * - `historical-forms`：使用字体提供的历史字形（OpenType `hist`），如旧式书写形态。
   *
   * 初始值 `normal`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-alternates
   */
  fontVariantAlternates?: StyleValue<
    | OpenValue<CSSProperties['fontVariantAlternates']>
    | keyof CssWideKeywords
    | keyof FontVariantAlternatesKeywords
  >;
  /**
   * 设置小型大写等大小写字形变体。（font-variant-caps）
   *
   * 常用值：
   * - `all-petite-caps`：大写和小写字母都改用 petite 小型大写字形，需要字体提供 `c2pc` 特性。
   * - `all-small-caps`：大写和小写字母都改用小型大写字形，需要字体提供 `c2sc` 特性。
   * - `normal`：不使用小型大写等特殊字形，字母按自身大小写显示。
   * - `petite-caps`：小写字母改用比小型大写更小的 petite 小型大写字形，需要字体提供 `pcap` 特性。
   * - `small-caps`：小写字母改用小型大写字形，大写字母保持不变；字体缺少该特性时可能由浏览器合成。
   * - `titling-caps`：使用标题专用大写字形，笔画通常更纤细，适合全大写的标题；需要字体提供 `titl` 特性。
   * - `unicase`：大写字母改用小型大写字形，小写字母保持普通字形，得到大小写混合的统一视觉高度。
   *
   * 初始值 `normal`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-caps
   */
  fontVariantCaps?: StyleValue<
    KeywordValue<FontVariantCapsValues, CSSProperties['fontVariantCaps']>
  >;
  /**
   * 设置东亚文字字形及宽度变体。（font-variant-east-asian）
   *
   * 常用值：
   * - `normal`：不启用东亚字形变体，使用字体的默认字形和宽度。
   * - `ruby`：使用适合注音（ruby）小字的东亚字形，主要影响日文假名（OpenType `ruby`）。
   *
   * 初始值 `normal`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-east-asian
   */
  fontVariantEastAsian?: StyleValue<
    | OpenValue<CSSProperties['fontVariantEastAsian']>
    | keyof CssWideKeywords
    | keyof FontVariantEastAsianKeywords
    | keyof CssEastAsianVariantValues
    | keyof CssEastAsianWidthValues
  >;
  /**
   * 设置字体连字的启用方式。（font-variant-ligatures）
   *
   * 常用值：
   * - `normal`：按字体默认启用常规连字和上下文替代，不启用可选连字和历史连字。
   * - `none`：关闭所有连字和上下文替代，包括默认启用的常规连字。
   *
   * 初始值 `normal`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-ligatures
   */
  fontVariantLigatures?: StyleValue<
    | OpenValue<CSSProperties['fontVariantLigatures']>
    | keyof CssWideKeywords
    | keyof FontVariantLigaturesKeywords
    | keyof CssCommonLigValues
    | keyof CssDiscretionaryLigValues
    | keyof CssHistoricalLigValues
    | keyof CssContextualAltValues
  >;
  /**
   * 设置数字的等宽、比例、分数及其他排版变体。（font-variant-numeric）
   *
   * 常用值：
   * - `normal`：不启用数字变体，使用字体的默认数字字形。
   * - `ordinal`：使用序数标记专用字形，如 1st、2nd 中上标的字母（OpenType `ordn`）。
   * - `slashed-zero`：数字零带斜线，避免与大写字母 O 混淆（OpenType `zero`）。
   *
   * 初始值 `normal`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-numeric
   */
  fontVariantNumeric?: StyleValue<
    | OpenValue<CSSProperties['fontVariantNumeric']>
    | keyof CssWideKeywords
    | keyof FontVariantNumericKeywords
    | keyof CssNumericFigureValues
    | keyof CssNumericSpacingValues
    | keyof CssNumericFractionValues
  >;
  /**
   * 选择字体提供的上标或下标字形。（font-variant-position）
   *
   * 常用值：
   * - `normal`：不使用上标或下标专用字形。
   * - `sub`：使用字体提供的下标字形（OpenType `subs`），字形的大小和位置由字体设计，不同于 `vertical-align: sub`。
   * - `super`：使用字体提供的上标字形（OpenType `sups`），字形的大小和位置由字体设计，不同于 `vertical-align: super`。
   *
   * 初始值 `normal`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-position
   */
  fontVariantPosition?: StyleValue<
    KeywordValue<FontVariantPositionValues, CSSProperties['fontVariantPosition']>
  >;
  /**
   * 设置字体粗细，实际可用字重取决于字体。（font-weight）
   *
   * 最终字形取决于已加载字体和可用字重；变量字体可支持连续的字重范围。
   *
   * 常用值：
   * - `normal`：正常字重，等价于数值 400。
   * - `bold`：粗体字重，等价于数值 700。
   * - `bolder`：相对于继承字重选择更粗的字重，不是简单加一个固定数值。
   * - `lighter`：相对于继承字重选择更细的字重，不是简单减一个固定数值。
   *
   * 适用场景：正文、强调文字和标题的视觉层级。
   *
   * 数字值不加单位；初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-weight
   */
  fontWeight?: StyleValue<
    | OpenValue<CSSProperties['fontWeight']>
    | keyof CssWideKeywords
    | keyof FontWeightKeywords
    | keyof CssFontWeightAbsolute
    | keyof FontWeightsTokens
    | keyof QualifiedFontWeightsTokens
  >;
  /**
   * 控制支持光学尺寸轴的字体是否按字号优化字形。（font-optical-sizing）
   *
   * 常用值：
   * - `auto`：浏览器按当前字号自动设置字体的光学尺寸轴（`opsz`），是默认值。
   * - `none`：不自动调整光学尺寸，字形保持字体的默认光学尺寸。
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-optical-sizing
   */
  fontOpticalSizing?: StyleValue<
    KeywordValue<FontOpticalSizingValues, CSSProperties['fontOpticalSizing']>
  >;
  /**
   * 选择或覆盖彩色字体使用的调色板。（font-palette）
   *
   * 常用值：
   * - `normal`：使用字体的默认调色板。
   * - `light`：使用字体中标明适合浅色背景的调色板，没有则退回默认调色板。
   * - `dark`：使用字体中标明适合深色背景的调色板，没有则退回默认调色板。
   *
   * 初始值 `normal`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-palette
   */
  fontPalette?: StyleValue<
    OpenValue<CSSProperties['fontPalette']> | keyof CssWideKeywords | keyof FontPaletteKeywords
  >;
  /**
   * 直接设置可变字体各个轴的数值。（font-variation-settings）
   *
   * 常用值：
   * - `normal`：不额外覆盖可变字体各轴的取值，各轴按 `font-weight`、`font-stretch` 等属性及字体默认值确定。
   *
   * 初始值 `normal`；继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variation-settings
   */
  fontVariationSettings?: StyleValue<
    | OpenValue<CSSProperties['fontVariationSettings']>
    | keyof CssWideKeywords
    | keyof FontVariationSettingsKeywords
  >;
  /**
   * 设置行与列之间的间距，用于 Grid、Flex 和多栏等布局。（gap）
   *
   * 两个值依次为 row-gap 和 column-gap；在 Flex 中对应项目还是行间距取决于 flex-direction。它不增加容器外缘的间距。
   *
   * 适用场景：给 Flex/Grid 项目设置统一间隔，避免逐个项目添加 margin。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/gap
   */
  gap?: StyleValue<
    | OpenValue<CSSProperties['gap']>
    | keyof CssWideKeywords
    | keyof RowGapKeywords
    | keyof ColumnGapKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * SVG 横排文字中字形的旋转角度（glyph-orientation-horizontal），已废弃。
   *
   * 数字值自动加 `px`。
   */
  glyphOrientationHorizontal?: StyleValue<
    OpenValue<CSSProperties['glyphOrientationHorizontal']> | keyof CssWideKeywords
  >;
  /**
   * 设置竖排 SVG 字形方向的旧属性；新代码优先考虑 text-orientation。（glyph-orientation-vertical）
   *
   * 数字值自动加 `px`；Baseline：尚未在所有主流浏览器可用。
   */
  glyphOrientationVertical?: StyleValue<
    OpenValue<CSSProperties['glyphOrientationVertical']> | keyof CssWideKeywords
  >;
  /**
   * 集中设置显式和隐式网格的轨道、区域及自动放置方式。（grid）
   *
   * 常用值：
   * - `auto-flow`：声明该方向的轨道由自动放置生成：写在 `/` 前表示按行填充（`grid-auto-flow: row`），写在 `/` 后表示按列填充（`grid-auto-flow: column`）。
   * - `dense`：与 `auto-flow` 搭配，启用 dense 紧凑装箱：回头填补前面的空洞，项目可能偏离源码顺序。
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid
   */
  grid?: StyleValue<
    | OpenValue<CSSProperties['grid']>
    | keyof CssWideKeywords
    | keyof GridKeywords
    | keyof GridTemplateKeywords
    | keyof GridTemplateRowsKeywords
    | keyof CssTrackBreadth
    | keyof CssInflexibleBreadth
    | keyof CssAutoRepeat
    | keyof CssNameRepeat
    | keyof GridTemplateColumnsKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置网格项目的区域名，或行起点、列起点、行终点、列终点。（grid-area）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-area
   */
  gridArea?: StyleValue<
    OpenValue<CSSProperties['gridArea']> | keyof CssWideKeywords | keyof CssGridLine
  >;
  /**
   * 设置隐式生成的网格列尺寸。（grid-auto-columns）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-columns
   */
  gridAutoColumns?: StyleValue<
    | OpenValue<CSSProperties['gridAutoColumns']>
    | keyof CssWideKeywords
    | keyof CssTrackBreadth
    | keyof CssInflexibleBreadth
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置网格自动放置算法的行列方向及是否密集填洞。（grid-auto-flow）
   *
   * dense 可能改变视觉顺序，但不改变 DOM 和键盘导航顺序。
   *
   * 常用值：
   * - `row`：优先沿行放置项目，必要时创建新的隐式行。
   * - `column`：优先沿列放置项目，必要时创建新的隐式列。
   * - `dense`：尝试回填前面留下的空洞，可能让视觉顺序与 DOM 顺序不同。
   *
   * 适用场景：控制未明确指定位置的网格项目如何自动填入轨道。
   *
   * 初始值 `row`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-flow
   */
  gridAutoFlow?: StyleValue<
    OpenValue<CSSProperties['gridAutoFlow']> | keyof CssWideKeywords | keyof GridAutoFlowKeywords
  >;
  /**
   * 设置隐式生成的网格行尺寸。（grid-auto-rows）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-rows
   */
  gridAutoRows?: StyleValue<
    | OpenValue<CSSProperties['gridAutoRows']>
    | keyof CssWideKeywords
    | keyof CssTrackBreadth
    | keyof CssInflexibleBreadth
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置网格项目的列起点和列终点。（grid-column）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column
   */
  gridColumn?: StyleValue<
    OpenValue<CSSProperties['gridColumn']> | keyof CssWideKeywords | keyof CssGridLine
  >;
  /**
   * 设置网格项目的列终止线或跨越范围。（grid-column-end）
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column-end
   */
  gridColumnEnd?: StyleValue<
    OpenValue<CSSProperties['gridColumnEnd']> | keyof CssWideKeywords | keyof CssGridLine
  >;
  /**
   * 网格列间距的旧名（grid-column-gap），请改用 columnGap。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；已废弃。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-gap
   */
  gridColumnGap?: StyleValue<
    | OpenValue<CSSProperties['gridColumnGap']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置网格项目的列起始线或跨越范围。（grid-column-start）
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column-start
   */
  gridColumnStart?: StyleValue<
    OpenValue<CSSProperties['gridColumnStart']> | keyof CssWideKeywords | keyof CssGridLine
  >;
  /**
   * 网格行列间距的旧名（grid-gap），请改用 gap。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；已废弃。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/gap
   */
  gridGap?: StyleValue<
    | OpenValue<CSSProperties['gridGap']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置网格项目的行起点和行终点。（grid-row）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row
   */
  gridRow?: StyleValue<
    OpenValue<CSSProperties['gridRow']> | keyof CssWideKeywords | keyof CssGridLine
  >;
  /**
   * 设置网格项目的行终止线或跨越范围。（grid-row-end）
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row-end
   */
  gridRowEnd?: StyleValue<
    OpenValue<CSSProperties['gridRowEnd']> | keyof CssWideKeywords | keyof CssGridLine
  >;
  /**
   * 网格行间距的旧名（grid-row-gap），请改用 rowGap。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；已废弃。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/row-gap
   */
  gridRowGap?: StyleValue<
    | OpenValue<CSSProperties['gridRowGap']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置网格项目的行起始线或跨越范围。（grid-row-start）
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row-start
   */
  gridRowStart?: StyleValue<
    OpenValue<CSSProperties['gridRowStart']> | keyof CssWideKeywords | keyof CssGridLine
  >;
  /**
   * 集中设置显式网格的行、列和命名区域。（grid-template）
   *
   * 常用值：
   * - `none`：不定义显式轨道和命名区域，网格由隐式轨道（`grid-auto-*`）自动生成。
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template
   */
  gridTemplate?: StyleValue<
    | OpenValue<CSSProperties['gridTemplate']>
    | keyof CssWideKeywords
    | keyof GridTemplateKeywords
    | keyof GridTemplateRowsKeywords
    | keyof CssTrackBreadth
    | keyof CssInflexibleBreadth
    | keyof CssAutoRepeat
    | keyof CssNameRepeat
    | keyof GridTemplateColumnsKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 用区域名称矩阵定义网格布局区域。（grid-template-areas）
   *
   * 常用值：
   * - `none`：不定义命名网格区域。
   *
   * 初始值 `none`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-areas
   */
  gridTemplateAreas?: StyleValue<
    | OpenValue<CSSProperties['gridTemplateAreas']>
    | keyof CssWideKeywords
    | keyof GridTemplateAreasKeywords
  >;
  /**
   * 定义显式网格的列轨道尺寸及网格线名称。（grid-template-columns）
   *
   * 每个轨道值定义一列；fr 分配剩余空间。需要允许长内容所在列缩小时，可使用 minmax(0, 1fr)。
   *
   * 常用值：
   * - `none`：不定义显式列轨道，列由隐式轨道（`grid-auto-columns`）自动生成。
   * - `subgrid`：该元素在列方向不自建轨道，直接沿用父网格对应的列轨道，使子项目与父网格对齐；后面可追加网格线名称。
   *
   * 适用场景：响应式卡片、表单标签与输入框的列布局。
   *
   * 初始值 `none`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-columns
   */
  gridTemplateColumns?: StyleValue<
    | OpenValue<CSSProperties['gridTemplateColumns']>
    | keyof CssWideKeywords
    | keyof GridTemplateColumnsKeywords
    | keyof CssTrackBreadth
    | keyof CssInflexibleBreadth
    | keyof CssAutoRepeat
    | keyof CssNameRepeat
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 定义显式网格的行轨道尺寸及网格线名称。（grid-template-rows）
   *
   * 每个轨道值定义一行，未显式定义的行使用 grid-auto-rows。
   *
   * 常用值：
   * - `none`：不定义显式行轨道，行由隐式轨道（`grid-auto-rows`）自动生成。
   * - `subgrid`：该元素在行方向不自建轨道，直接沿用父网格对应的行轨道，使子项目与父网格对齐；后面可追加网格线名称。
   *
   * 适用场景：区分固定工具栏和可伸缩内容区域。
   *
   * 初始值 `none`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-rows
   */
  gridTemplateRows?: StyleValue<
    | OpenValue<CSSProperties['gridTemplateRows']>
    | keyof CssWideKeywords
    | keyof GridTemplateRowsKeywords
    | keyof CssTrackBreadth
    | keyof CssInflexibleBreadth
    | keyof CssAutoRepeat
    | keyof CssNameRepeat
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 控制标点是否可以悬挂在行盒边缘之外。（hanging-punctuation）
   *
   * 常用值：
   * - `none`：标点不悬挂，始终留在行盒内。
   * - `first`：首行行首的开括号或引号悬挂到行盒之外，让文字边缘对齐；目前仅 Safari 支持。
   * - `force-end`：行尾的句号、逗号总是悬挂到行盒之外，不占用行内空间；目前仅 Safari 支持。
   * - `allow-end`：行尾的句号、逗号只在行内放不下时才悬挂到行盒之外；目前仅 Safari 支持。
   * - `last`：末行行尾的闭括号或引号悬挂到行盒之外；目前仅 Safari 支持。
   *
   * 初始值 `none`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hanging-punctuation
   */
  hangingPunctuation?: StyleValue<
    | OpenValue<CSSProperties['hangingPunctuation']>
    | keyof CssWideKeywords
    | keyof HangingPunctuationKeywords
  >;
  /**
   * 设置自动断词时插入的断字符号。（hyphenate-character）
   *
   * 常用值：
   * - `auto`：由浏览器按文本语言选择断字符号，通常是连字符（U+2010）。
   *
   * 初始值 `auto`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphenate-character
   */
  hyphenateCharacter?: StyleValue<
    | OpenValue<CSSProperties['hyphenateCharacter']>
    | keyof CssWideKeywords
    | keyof HyphenateCharacterKeywords
  >;
  /**
   * 限制可断词的最小单词长度以及断点两侧的最少字符数。（hyphenate-limit-chars）
   *
   * 常用值：
   * - `auto`：该位置使用浏览器的默认限制值，具体数字由浏览器决定。
   *
   * 数字值不加单位；初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphenate-limit-chars
   */
  hyphenateLimitChars?: StyleValue<
    | OpenValue<CSSProperties['hyphenateLimitChars']>
    | keyof CssWideKeywords
    | keyof HyphenateLimitCharsKeywords
  >;
  /**
   * 设置文字断词和连字符插入的方式；自动断词依赖语言和词典。（hyphens）
   *
   * 常用值：
   * - `auto`：允许浏览器按语言词典自动在合适位置断词并插入连字符；需要在元素或祖先上设置正确的 `lang`。
   * - `manual`：只在文本里手写的软连字符（`&shy;` 或 U+00AD）处断词，不做自动断词。
   * - `none`：不断词，即使文本里有软连字符也不会在该处断开；已有的普通连字符 `-` 处仍可换行。
   *
   * 初始值 `manual`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphens
   */
  hyphens?: StyleValue<KeywordValue<HyphensValues, CSSProperties['hyphens']>>;
  /**
   * 设置元素的物理高度，盒子范围受 box-sizing 影响。（height）
   *
   * 百分比高度能否解析取决于包含块的尺寸确定方式；设置 100% 不自动等于视口高度。
   *
   * 常用值：
   * - `auto`：让布局算法决定尺寸，不保证等于父元素尺寸。
   * - `min-content`：采用内容的最小内部尺寸，文字会考虑可用的软换行机会。
   * - `max-content`：采用内容的最大内部尺寸，通常不进行软换行。
   * - `fit-content`：在最小和最大内部尺寸之间按可用空间夹取尺寸。
   *
   * 适用场景：控制物理高度；滚动面板通常结合 max-height 和 overflow。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/height
   */
  height?: StyleValue<
    | OpenValue<CSSProperties['height']>
    | keyof CssWideKeywords
    | keyof WidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置图像是否按元数据等信息调整方向。（image-orientation）
   *
   * 常用值：
   * - `from-image`：按图像文件自带的方向元数据（如 EXIF）旋转或翻转后再显示。
   * - `flip`：把图像水平翻转，可与角度值组合（如 `90deg flip`）；浏览器支持有限。
   *
   * 数字值自动加 `px`；初始值 `from-image`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/image-orientation
   */
  imageOrientation?: StyleValue<
    | OpenValue<CSSProperties['imageOrientation']>
    | keyof CssWideKeywords
    | keyof ImageOrientationKeywords
  >;
  /**
   * 向浏览器指定图像缩放时的插值与清晰度偏好。（image-rendering）
   *
   * 常用值：
   * - `auto`：由浏览器决定缩放算法，通常对放大的图像做平滑插值。
   * - `crisp-edges`：缩放时保留颜色对比和边缘，不做平滑，适合线稿、像素图；具体算法由浏览器决定。
   * - `pixelated`：放大时按最近邻取样，让每个像素呈清晰的方块，适合像素画。
   * - `smooth`：要求使用平滑缩放，偏重画质而非速度。
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/image-rendering
   */
  imageRendering?: StyleValue<
    | OpenValue<CSSProperties['imageRendering']>
    | keyof CssWideKeywords
    | keyof ImageRenderingKeywords
  >;
  /**
   * 设置图像的分辨率解释方式；使用前核对目标浏览器支持。（image-resolution）
   *
   * 常用值：
   * - `from-image`：采用图像文件自带的分辨率信息；可与具体分辨率值组合，作为文件没有该信息时的回退值。
   * - `snap`：把使用的分辨率取整，使图像像素对应整数个设备像素，避免缩放造成的模糊；需与其他分辨率取值搭配，浏览器基本不支持。
   *
   * 初始值 `1dppx`；继承；实验性。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/image-resolution
   */
  imageResolution?: StyleValue<
    | OpenValue<CSSProperties['imageResolution']>
    | keyof CssWideKeywords
    | keyof ImageResolutionKeywords
  >;
  /**
   * 控制输入框的输入法状态（ime-mode），已废弃，大多数浏览器不支持。
   *
   * 常用值：
   * - `active`：输入法默认处于开启状态，用户仍可手动关闭；已废弃，浏览器基本不支持。
   * - `auto`：不指定输入法状态，由浏览器决定；已废弃，浏览器基本不支持。
   * - `disabled`：禁用输入法，用户无法启用，常用于密码框；已废弃，浏览器基本不支持。
   * - `inactive`：输入法默认处于关闭状态，用户仍可手动开启；已废弃，浏览器基本不支持。
   * - `normal`：按普通方式处理输入法，忽略页面对该字段的设置，多用于用户样式覆盖；已废弃，浏览器基本不支持。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   */
  imeMode?: StyleValue<KeywordValue<ImeModeValues, CSSProperties['imeMode']>>;
  /**
   * 设置段落首字下沉或抬升时占用的行数与对齐位置。（initial-letter）
   *
   * 常用值：
   * - `normal`：不启用首字下沉，首字母与正文按普通文字排版。
   *
   * 初始值 `normal`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/initial-letter
   */
  initialLetter?: StyleValue<
    OpenValue<CSSProperties['initialLetter']> | keyof CssWideKeywords | keyof InitialLetterKeywords
  >;
  /**
   * 设置首字下沉时字形与正文使用的对齐基线。（initial-letter-align）
   *
   * 常用值：
   * - `auto`：由浏览器根据文字的书写系统选择对齐基线，拉丁文通常取字母基线。
   * - `alphabetic`：以字母基线（alphabetic）对齐首字下沉的字形与正文，适合拉丁文等字母文字。
   * - `hanging`：以悬挂基线（hanging）对齐，适合天城文、藏文等基线悬挂在字形顶端的文字。
   * - `ideographic`：以表意文字基线（ideographic）对齐，适合中日韩等方块字。
   *
   * 初始值 `auto`；不继承；实验性。
   */
  initialLetterAlign?: StyleValue<
    | OpenValue<CSSProperties['initialLetterAlign']>
    | keyof CssWideKeywords
    | keyof InitialLetterAlignKeywords
  >;
  /**
   * 设置逻辑行内轴尺寸；水平书写时通常对应宽度。（inline-size）
   *
   * 水平书写时通常对应 width，竖直书写时通常对应 height。实际尺寸还受 min-inline-size/max-inline-size 和 box-sizing 约束。
   *
   * 常用值：
   * - `auto`：让布局算法决定尺寸，不保证等于父元素尺寸。
   * - `min-content`：采用内容的最小内部尺寸，文字会考虑可用的软换行机会。
   * - `max-content`：采用内容的最大内部尺寸，通常不进行软换行。
   * - `fit-content`：在最小和最大内部尺寸之间按可用空间夹取尺寸。
   *
   * 适用场景：希望布局尺寸跟随书写模式变化的组件。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inline-size
   */
  inlineSize?: StyleValue<
    | OpenValue<CSSProperties['inlineSize']>
    | keyof CssWideKeywords
    | keyof WidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 控制动画是否允许在数值尺寸与内部尺寸关键字之间插值。（interpolate-size）
   *
   * 常用值：
   * - `allow-keywords`：允许受支持的内部尺寸关键字与长度/百分比之间插值，不保证两个关键字之间可以插值。
   * - `numeric-only`：保持仅数值尺寸之间的插值行为。
   *
   * 初始值 `numeric-only`；继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/interpolate-size
   */
  interpolateSize?: StyleValue<
    KeywordValue<InterpolateSizeValues, CSSProperties['interpolateSize']>
  >;
  /**
   * 同时设置定位元素的上、右、下、左偏移。（inset）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset
   */
  inset?: StyleValue<
    | OpenValue<CSSProperties['inset']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置定位元素沿逻辑块轴的起始和结束偏移。（inset-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block
   */
  insetBlock?: StyleValue<
    | OpenValue<CSSProperties['insetBlock']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置定位元素在逻辑块轴结束侧的偏移。（inset-block-end）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block-end
   */
  insetBlockEnd?: StyleValue<
    | OpenValue<CSSProperties['insetBlockEnd']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置定位元素在逻辑块轴起始侧的偏移。（inset-block-start）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block-start
   */
  insetBlockStart?: StyleValue<
    | OpenValue<CSSProperties['insetBlockStart']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置定位元素沿逻辑行内轴的起始和结束偏移。（inset-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline
   */
  insetInline?: StyleValue<
    | OpenValue<CSSProperties['insetInline']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置定位元素在逻辑行内轴结束侧的偏移。（inset-inline-end）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline-end
   */
  insetInlineEnd?: StyleValue<
    | OpenValue<CSSProperties['insetInlineEnd']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置定位元素在逻辑行内轴起始侧的偏移。（inset-inline-start）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline-start
   */
  insetInlineStart?: StyleValue<
    | OpenValue<CSSProperties['insetInlineStart']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 控制元素是否建立独立的层叠上下文，隔离混合效果。（isolation）
   *
   * 常用值：
   * - `auto`：由其他属性是否需要层叠上下文决定，不强制隔离。
   * - `isolate`：建立独立层叠上下文，使混合效果在该分组内处理。
   *
   * 适用场景：建立局部层叠边界，或限制混合模式影响范围。
   *
   * 初始值 `auto`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/isolation
   */
  isolation?: StyleValue<KeywordValue<IsolationValues, CSSProperties['isolation']>>;
  /**
   * SVG 文字的字距调整（kerning），已废弃，请用 fontKerning 或 letterSpacing。
   *
   * 数字值自动加 `px`。
   */
  kerning?: StyleValue<OpenValue<CSSProperties['kerning']> | keyof CssWideKeywords>;
  /**
   * 设置定位元素相对于其定位参照的左侧偏移。（left）
   *
   * 常用值：
   * - `auto`：不指定该侧偏移：绝对定位时位置由对侧偏移、元素尺寸或静态位置决定，相对定位时按 0 处理。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/left
   */
  left?: StyleValue<
    | OpenValue<CSSProperties['left']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置字符之间额外增加或减少的间距。（letter-spacing）
   *
   * 常用值：
   * - `normal`：使用字体默认的字符间距，不额外增减。
   *
   * 数字值自动加 `px`；初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/letter-spacing
   */
  letterSpacing?: StyleValue<
    | OpenValue<CSSProperties['letterSpacing']>
    | keyof CssWideKeywords
    | keyof LetterSpacingKeywords
    | keyof LetterSpacingsTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置东亚文字标点等字符的换行严格程度。（line-break）
   *
   * 常用值：
   * - `auto`：由浏览器自行决定换行严格程度，可能随文本长度调整（短文本偏严格，长文本偏宽松）。
   * - `loose`：采用最宽松的换行规则，允许在更多位置换行，适合行很短的场景，如报纸排版。
   * - `normal`：采用常规的换行规则，严格程度介于 `loose` 与 `strict` 之间。
   * - `strict`：采用最严格的换行规则，如不在小写假名、长音符前换行，适合要求规范排版的正文。
   *
   * 初始值 `auto`；继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/line-break
   */
  lineBreak?: StyleValue<KeywordValue<LineBreakValues, CSSProperties['lineBreak']>>;
  /**
   * 设置行盒高度；无单位数值按元素自身字号计算。（line-height）
   *
   * 无单位数字作为倍数继承；长度值按长度继承。单独设置行高不会自动实现多行文本垂直居中。
   *
   * 常用值：
   * - `normal`：由浏览器和字体度量确定行高，没有固定的跨字体倍数。
   *
   * 适用场景：控制正文行间节奏；可继承的字号倍数通常比固定长度更适合嵌套文字。
   *
   * 数字值不加单位；初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/line-height
   */
  lineHeight?: StyleValue<
    | OpenValue<CSSProperties['lineHeight']>
    | keyof CssWideKeywords
    | keyof LineHeightKeywords
    | keyof LineHeightsTokens
    | keyof QualifiedLineHeightsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置行盒高度向上取整使用的步长。（line-height-step）
   *
   * 数字值自动加 `px`；初始值 `0`；继承；实验性。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/line-height-step
   */
  lineHeightStep?: StyleValue<
    | OpenValue<CSSProperties['lineHeightStep']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 集中设置列表标记的类型、图像和位置。（list-style）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style
   */
  listStyle?: StyleValue<
    | OpenValue<CSSProperties['listStyle']>
    | keyof CssWideKeywords
    | keyof ListStyleTypeKeywords
    | keyof ListStylePositionKeywords
    | keyof ListStyleImageKeywords
  >;
  /**
   * 设置用作列表标记的图像。（list-style-image）
   *
   * 常用值：
   * - `none`：不使用图像作列表标记，改由 `list-style-type` 提供标记。
   *
   * 初始值 `none`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-image
   */
  listStyleImage?: StyleValue<
    | OpenValue<CSSProperties['listStyleImage']>
    | keyof CssWideKeywords
    | keyof ListStyleImageKeywords
  >;
  /**
   * 设置列表标记位于主块盒内部还是外部。（list-style-position）
   *
   * 常用值：
   * - `inside`：标记放在内容盒内部，作为首行行内内容的一部分，文字折行时会绕到标记下方。
   * - `outside`：标记放在内容盒之外，文字折行后与首行文字左对齐，这是默认行为。
   *
   * 初始值 `outside`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-position
   */
  listStylePosition?: StyleValue<
    KeywordValue<ListStylePositionValues, CSSProperties['listStylePosition']>
  >;
  /**
   * 设置列表标记或计数器的样式。（list-style-type）
   *
   * 常用值：
   * - `none`：不显示标记，列表项仍保持 `list-item` 显示类型，计数器照常递增。
   *
   * 初始值 `disc`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-type
   */
  listStyleType?: StyleValue<
    OpenValue<CSSProperties['listStyleType']> | keyof CssWideKeywords | keyof ListStyleTypeKeywords
  >;
  /**
   * 设置盒子四周的外边距，可使用负值或自动外边距。（margin）
   *
   * 1/2/3/4 个值依次表示：四边；上下/左右；上/左右/下；上/右/下/左。块布局中的垂直外边距可能折叠。
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 适用场景：控制盒子外侧与相邻内容的距离；布局项统一间隔可考虑容器 gap。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin
   */
  margin?: StyleValue<
    | OpenValue<CSSProperties['margin']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴起始侧和结束侧的外边距。（margin-block）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-block
   */
  marginBlock?: StyleValue<
    | OpenValue<CSSProperties['marginBlock']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴结束侧的外边距。（margin-block-end）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-block-end
   */
  marginBlockEnd?: StyleValue<
    | OpenValue<CSSProperties['marginBlockEnd']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴起始侧的外边距。（margin-block-start）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-block-start
   */
  marginBlockStart?: StyleValue<
    | OpenValue<CSSProperties['marginBlockStart']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置下外边距。（margin-bottom）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-bottom
   */
  marginBottom?: StyleValue<
    | OpenValue<CSSProperties['marginBottom']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴起始侧和结束侧的外边距。（margin-inline）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-inline
   */
  marginInline?: StyleValue<
    | OpenValue<CSSProperties['marginInline']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴结束侧的外边距。（margin-inline-end）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-inline-end
   */
  marginInlineEnd?: StyleValue<
    | OpenValue<CSSProperties['marginInlineEnd']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴起始侧的外边距。（margin-inline-start）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-inline-start
   */
  marginInlineStart?: StyleValue<
    | OpenValue<CSSProperties['marginInlineStart']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置左外边距。（margin-left）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-left
   */
  marginLeft?: StyleValue<
    | OpenValue<CSSProperties['marginLeft']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置右外边距。（margin-right）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-right
   */
  marginRight?: StyleValue<
    | OpenValue<CSSProperties['marginRight']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置上外边距。（margin-top）
   *
   * 常用值：
   * - `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-top
   */
  marginTop?: StyleValue<
    | OpenValue<CSSProperties['marginTop']>
    | keyof CssWideKeywords
    | keyof MarginKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 控制容器边缘处子元素外边距的裁减。（margin-trim）
   *
   * 常用值：
   * - `block`：裁掉子元素在块轴两端紧贴容器边缘的外边距，等同 `block-start block-end`；目前仅 Safari 支持。
   * - `block-end`：裁掉最后一个子元素紧贴容器块结束边的外边距，让容器与外部的间距由容器自己控制；目前仅 Safari 支持。
   * - `block-start`：裁掉第一个子元素紧贴容器块起始边的外边距，让容器与外部的间距由容器自己控制；目前仅 Safari 支持。
   * - `inline`：裁掉子元素在行内轴两端紧贴容器边缘的外边距，等同 `inline-start inline-end`；目前仅 Safari 支持。
   * - `inline-end`：裁掉紧贴容器行内结束边的子元素外边距；目前仅 Safari 支持。
   * - `inline-start`：裁掉紧贴容器行内起始边的子元素外边距；目前仅 Safari 支持。
   * - `none`：不裁减任何子元素外边距，保持各自设置的外边距。
   *
   * 初始值 `none`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-trim
   */
  marginTrim?: StyleValue<KeywordValue<MarginTrimValues, CSSProperties['marginTrim']>>;
  /**
   * 同时设置 SVG 路径起点、中间顶点和终点的标记图形。（marker）
   *
   * 常用值：
   * - `none`：不绘制标记图形。
   *
   * 简写属性，初始值见各分项；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker
   */
  marker?: StyleValue<
    OpenValue<CSSProperties['marker']> | keyof CssWideKeywords | keyof MarkerKeywords
  >;
  /**
   * 设置 SVG 路径终点的标记图形。（marker-end）
   *
   * 常用值：
   * - `none`：不绘制标记图形。
   *
   * 初始值 `none`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-end
   */
  markerEnd?: StyleValue<
    OpenValue<CSSProperties['markerEnd']> | keyof CssWideKeywords | keyof MarkerKeywords
  >;
  /**
   * 设置 SVG 路径中间顶点的标记图形。（marker-mid）
   *
   * 常用值：
   * - `none`：不在路径中间顶点绘制标记图形。
   *
   * 初始值 `none`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-mid
   */
  markerMid?: StyleValue<
    OpenValue<CSSProperties['markerMid']> | keyof CssWideKeywords | keyof MarkerMidKeywords
  >;
  /**
   * 列表标记与内容之间的距离（marker-offset），已从规范中移除。
   *
   * 数字值自动加 `px`。
   */
  markerOffset?: StyleValue<OpenValue<CSSProperties['markerOffset']> | keyof CssWideKeywords>;
  /**
   * 设置 SVG 路径起点的标记图形。（marker-start）
   *
   * 常用值：
   * - `none`：不绘制标记图形。
   *
   * 初始值 `none`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-start
   */
  markerStart?: StyleValue<
    OpenValue<CSSProperties['markerStart']> | keyof CssWideKeywords | keyof MarkerKeywords
  >;
  /**
   * 集中设置遮罩图层的图像、位置、尺寸、重复及合成方式。（mask）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask
   */
  mask?: StyleValue<
    | OpenValue<CSSProperties['mask']>
    | keyof CssWideKeywords
    | keyof CssMaskLayer
    | keyof CssMaskReference
    | keyof CssPosition
    | keyof CssBgSize
    | keyof CssRepeatStyle
    | keyof CssGeometryBox
    | keyof CssShapeBox
    | keyof CssVisualBox
    | keyof CssCompositingOperator
    | keyof CssMaskingMode
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置遮罩效果允许作用的裁剪区域。（mask-clip）
   *
   * 常用值：
   * - `no-clip`：不裁剪遮罩的作用范围，遮罩可作用于整个绘制区域，包括超出盒子的部分。
   *
   * 初始值 `border-box`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-clip
   */
  maskClip?: StyleValue<
    | OpenValue<CSSProperties['maskClip']>
    | keyof CssWideKeywords
    | keyof MaskClipKeywords
    | keyof CssCoordBox
    | keyof CssPaintBox
    | keyof CssVisualBox
  >;
  /**
   * 设置多个遮罩图层之间的合成运算。（mask-composite）
   *
   * 初始值 `add`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-composite
   */
  maskComposite?: StyleValue<KeywordValue<MaskCompositeValues, CSSProperties['maskComposite']>>;
  /**
   * 设置遮罩使用的图像、渐变或 SVG 遮罩引用。（mask-image）
   *
   * 初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-image
   */
  maskImage?: StyleValue<
    OpenValue<CSSProperties['maskImage']> | keyof CssWideKeywords | keyof CssMaskReference
  >;
  /**
   * 设置遮罩按 alpha、亮度或源类型解释。（mask-mode）
   *
   * 初始值 `match-source`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-mode
   */
  maskMode?: StyleValue<KeywordValue<MaskModeValues, CSSProperties['maskMode']>>;
  /**
   * 设置遮罩图像定位所依据的盒子。（mask-origin）
   *
   * 常用值：
   * - `margin-box`：以外边距盒（margin box）作为遮罩图像的定位区域。
   *
   * 初始值 `border-box`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-origin
   */
  maskOrigin?: StyleValue<KeywordValue<MaskOriginValues, CSSProperties['maskOrigin']>>;
  /**
   * 设置遮罩图像在定位区域中的位置。（mask-position）
   *
   * 初始值 `0% 0%`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-position
   */
  maskPosition?: StyleValue<
    | OpenValue<CSSProperties['maskPosition']>
    | keyof CssWideKeywords
    | keyof CssPosition
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置遮罩图像的重复方式。（mask-repeat）
   *
   * 初始值 `repeat`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-repeat
   */
  maskRepeat?: StyleValue<
    OpenValue<CSSProperties['maskRepeat']> | keyof CssWideKeywords | keyof CssRepeatStyle
  >;
  /**
   * 设置遮罩图像的尺寸。（mask-size）
   *
   * 常用值：
   * - `auto`：依据图像内部尺寸、比例及另一维的设置确定尺寸。
   * - `contain`：保持图像比例并使整张图像容纳于定位区域，可能留下空白。
   * - `cover`：保持图像比例并覆盖整个定位区域，超出部分可能被裁剪。
   *
   * 初始值 `auto`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-size
   */
  maskSize?: StyleValue<
    | OpenValue<CSSProperties['maskSize']>
    | keyof CssWideKeywords
    | keyof MaskSizeKeywords
    | keyof CssBgSize
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置 SVG mask 元素使用亮度还是 alpha 作为遮罩。（mask-type）
   *
   * 常用值：
   * - `alpha`：按遮罩内容的 alpha 值（不透明度）决定显示程度，颜色不参与计算。
   * - `luminance`：按遮罩内容的亮度决定显示程度：白色完全显示，黑色完全隐藏，这是默认行为。
   *
   * 初始值 `luminance`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-type
   */
  maskType?: StyleValue<KeywordValue<MaskTypeValues, CSSProperties['maskType']>>;
  /**
   * 设置基于九宫格图像切片的边框遮罩。（mask-border）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border
   */
  maskBorder?: StyleValue<
    | OpenValue<CSSProperties['maskBorder']>
    | keyof CssWideKeywords
    | keyof MaskBorderSourceKeywords
    | keyof MaskBorderSliceKeywords
    | keyof MaskBorderWidthKeywords
    | keyof MaskBorderRepeatKeywords
    | keyof MaskBorderModeKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置边框遮罩使用 alpha 还是亮度信息。（mask-border-mode）
   *
   * 常用值：
   * - `luminance`：按遮罩图像的亮度决定显示程度：越亮越不透明，越暗越透明。
   * - `alpha`：按遮罩图像的 alpha 通道决定显示程度：越不透明的区域内容越可见。
   *
   * 初始值 `alpha`；不继承。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-mode
   */
  maskBorderMode?: StyleValue<KeywordValue<MaskBorderModeValues, CSSProperties['maskBorderMode']>>;
  /**
   * 设置边框遮罩超出边框盒的距离。（mask-border-outset）
   *
   * 数字值不加单位；初始值 `0`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-outset
   */
  maskBorderOutset?: StyleValue<
    | OpenValue<CSSProperties['maskBorderOutset']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置边框遮罩切片的重复或拉伸方式。（mask-border-repeat）
   *
   * 常用值：
   * - `stretch`：切片拉伸以填满对应的边框区域。
   * - `repeat`：切片按原尺寸平铺，到边缘时可能被裁掉一部分。
   * - `round`：切片平铺，并整体缩放到恰好放下整数个，不裁剪。
   * - `space`：切片按原尺寸平铺，调整间距使恰好放下整数个，不缩放也不裁剪。
   *
   * 初始值 `stretch`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-repeat
   */
  maskBorderRepeat?: StyleValue<
    KeywordValue<MaskBorderRepeatValues, CSSProperties['maskBorderRepeat']>
  >;
  /**
   * 设置边框遮罩图像的切片位置。（mask-border-slice）
   *
   * 常用值：
   * - `fill`：保留切片后的中间区域并铺在元素中间；缺省时该区域会被丢弃。
   *
   * 数字值不加单位；初始值 `0`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-slice
   */
  maskBorderSlice?: StyleValue<
    | OpenValue<CSSProperties['maskBorderSlice']>
    | keyof CssWideKeywords
    | keyof MaskBorderSliceKeywords
  >;
  /**
   * 设置边框遮罩的源图像。（mask-border-source）
   *
   * 常用值：
   * - `none`：不使用边框遮罩图像，`mask-border` 不产生遮罩效果。
   *
   * 初始值 `none`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-source
   */
  maskBorderSource?: StyleValue<
    | OpenValue<CSSProperties['maskBorderSource']>
    | keyof CssWideKeywords
    | keyof MaskBorderSourceKeywords
  >;
  /**
   * 设置边框遮罩各边的宽度。（mask-border-width）
   *
   * 常用值：
   * - `auto`：取对应的 `mask-border-slice` 切片的固有尺寸作为该边宽度。
   *
   * 数字值不加单位；初始值 `auto`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-width
   */
  maskBorderWidth?: StyleValue<
    | OpenValue<CSSProperties['maskBorderWidth']>
    | keyof CssWideKeywords
    | keyof MaskBorderWidthKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 限制元素逻辑块轴的最大尺寸。（max-block-size）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-block-size
   */
  maxBlockSize?: StyleValue<
    | OpenValue<CSSProperties['maxBlockSize']>
    | keyof CssWideKeywords
    | keyof MaxWidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 限制元素的最大物理高度。（max-height）
   *
   * 常用值：
   * - `none`：不设上限，元素尺寸不受该属性限制。
   * - `min-content`：上限取内容的 min-content 尺寸，即内容尽可能压缩后所需的尺寸；行内轴方向相当于文字折到最窄。
   * - `max-content`：上限取内容的 max-content 尺寸，即内容不折行、不压缩时的自然尺寸。
   * - `fit-content`：上限取 fit-content：可用空间夹在 min-content 与 max-content 之间的值。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-height
   */
  maxHeight?: StyleValue<
    | OpenValue<CSSProperties['maxHeight']>
    | keyof CssWideKeywords
    | keyof MaxWidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 限制元素逻辑行内轴的最大尺寸。（max-inline-size）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-inline-size
   */
  maxInlineSize?: StyleValue<
    | OpenValue<CSSProperties['maxInlineSize']>
    | keyof CssWideKeywords
    | keyof MaxWidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 限制元素的最大物理宽度。（max-width）
   *
   * 限制最终宽度，不会单独要求元素达到该宽度。最小尺寸约束可能优先于较小的最大尺寸。
   *
   * 常用值：
   * - `none`：不设上限，元素尺寸不受该属性限制。
   * - `min-content`：上限取内容的 min-content 尺寸，即内容尽可能压缩后所需的尺寸；行内轴方向相当于文字折到最窄。
   * - `max-content`：上限取内容的 max-content 尺寸，即内容不折行、不压缩时的自然尺寸。
   * - `fit-content`：上限取 fit-content：可用空间夹在 min-content 与 max-content 之间的值。
   *
   * 适用场景：限制正文行长、弹窗宽度或响应式内容区。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-width
   */
  maxWidth?: StyleValue<
    | OpenValue<CSSProperties['maxWidth']>
    | keyof CssWideKeywords
    | keyof MaxWidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素逻辑块轴的最小尺寸。（min-block-size）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-block-size
   */
  minBlockSize?: StyleValue<
    | OpenValue<CSSProperties['minBlockSize']>
    | keyof CssWideKeywords
    | keyof MinWidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素的最小物理高度。（min-height）
   *
   * 常用值：
   * - `auto`：自动最小尺寸由布局模式决定；Flex/Grid 项目可能受内容最小宽度限制。
   * - `min-content`：下限取内容的 min-content 尺寸，即内容尽可能压缩后所需的尺寸；行内轴方向相当于文字折到最窄。
   * - `max-content`：下限取内容的 max-content 尺寸，即内容不折行、不压缩时的自然尺寸。
   * - `fit-content`：下限取 fit-content：可用空间夹在 min-content 与 max-content 之间的值。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-height
   */
  minHeight?: StyleValue<
    | OpenValue<CSSProperties['minHeight']>
    | keyof CssWideKeywords
    | keyof MinWidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素逻辑行内轴的最小尺寸。（min-inline-size）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-inline-size
   */
  minInlineSize?: StyleValue<
    | OpenValue<CSSProperties['minInlineSize']>
    | keyof CssWideKeywords
    | keyof MinWidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素的最小物理宽度。（min-width）
   *
   * Flex/Grid 项目的 auto 最小尺寸可能由内容决定。需要允许其收缩时，可以按布局目的设置 min-width:0。
   *
   * 常用值：
   * - `auto`：自动最小尺寸由布局模式决定；Flex/Grid 项目可能受内容最小宽度限制。
   * - `min-content`：下限取内容的 min-content 尺寸，即内容尽可能压缩后所需的尺寸；行内轴方向相当于文字折到最窄。
   * - `max-content`：下限取内容的 max-content 尺寸，即内容不折行、不压缩时的自然尺寸。
   * - `fit-content`：下限取 fit-content：可用空间夹在 min-content 与 max-content 之间的值。
   *
   * 适用场景：给控件设置最小可用宽度，或用 0 允许 Flex/Grid 子项突破自动内容最小宽度。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-width
   */
  minWidth?: StyleValue<
    | OpenValue<CSSProperties['minWidth']>
    | keyof CssWideKeywords
    | keyof MinWidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素整体与其背后内容的颜色混合方式。（mix-blend-mode）
   *
   * 初始值 `normal`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mix-blend-mode
   */
  mixBlendMode?: StyleValue<KeywordValue<MixBlendModeValues, CSSProperties['mixBlendMode']>>;
  /**
   * 设置运动路径的旧式简写；对应现代 offset 属性族。（motion）
   *
   * 数字值自动加 `px`。
   */
  motion?: StyleValue<OpenValue<CSSProperties['motion']> | keyof CssWideKeywords>;
  /**
   * 沿运动路径的位置（motion-offset），是 offsetDistance 的旧名，请改用 offsetDistance。
   *
   * 数字值自动加 `px`。
   */
  motionOffset?: StyleValue<OpenValue<CSSProperties['motionOffset']> | keyof CssWideKeywords>;
  /**
   * 设置运动路径的旧属性；对应 offset-path。（motion-path）
   */
  motionPath?: StyleValue<OpenValue<CSSProperties['motionPath']> | keyof CssWideKeywords>;
  /**
   * 设置运动路径旋转方式的旧属性；对应 offset-rotate。（motion-rotation）
   *
   * 数字值自动加 `px`。
   */
  motionRotation?: StyleValue<OpenValue<CSSProperties['motionRotation']> | keyof CssWideKeywords>;
  /**
   * IE 与旧版 Edge 的滚动条显示方式（-ms-overflow-style）；现代浏览器隐藏滚动条请用 scrollbarWidth。
   *
   * 常用值：
   * - `-ms-autohiding-scrollbar`：滚动条平时隐藏，滚动或指针移近时才出现。非标准，仅 IE 与旧版 Edge 支持。
   * - `auto`：使用默认的滚动条表现。非标准，仅 IE 与旧版 Edge 支持。
   * - `none`：隐藏滚动条，内容仍可滚动。非标准，仅 IE 与旧版 Edge 支持。
   * - `scrollbar`：显示传统的常驻滚动条，即使系统默认是自动隐藏样式。非标准，仅 IE 与旧版 Edge 支持。
   *
   * 初始值 `auto`；继承；非标准。
   */
  MsOverflowStyle?: StyleValue<
    KeywordValue<MsOverflowStyleValues, CSSProperties['MsOverflowStyle']>
  >;
  /**
   * 设置替换元素的内容如何适应其内容盒，例如图像的裁切和缩放。（object-fit）
   *
   * 控制 img、video 等替换内容在盒子内部的缩放与裁剪；不改变盒子本身的 width/height。
   *
   * 常用值：
   * - `fill`：把内容拉伸到内容盒，可能改变原有宽高比。
   * - `contain`：保留宽高比并完整放入内容盒，可能留下空白。cover 优先填满盒子并可能裁剪；contain 优先保留完整内容。
   * - `cover`：保留宽高比并填满内容盒，可能裁掉部分图像。裁剪位置由 object-position 控制，盒子尺寸仍需另外设置。contain 保证完整图像可见但可能留白；fill 可能改变图像比例。
   * - `none`：不按内容盒缩放替换内容。
   * - `scale-down`：在 none 和 contain 中选择得到较小内容尺寸的方案。
   *
   * 适用场景：封面裁剪、头像和完整图像预览。
   *
   * 初始值 `fill`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/object-fit
   */
  objectFit?: StyleValue<KeywordValue<ObjectFitValues, CSSProperties['objectFit']>>;
  /**
   * 设置替换元素内容在内容盒内的对齐位置。（object-position）
   *
   * 初始值 `50% 50%`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/object-position
   */
  objectPosition?: StyleValue<
    | OpenValue<CSSProperties['objectPosition']>
    | keyof CssWideKeywords
    | keyof CssPosition
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 集中设置运动路径、起始位置、距离、方向和锚点。（offset）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset
   */
  offset?: StyleValue<
    | OpenValue<CSSProperties['offset']>
    | keyof CssWideKeywords
    | keyof OffsetPositionKeywords
    | keyof CssPosition
    | keyof OffsetPathKeywords
    | keyof CssCoordBox
    | keyof CssPaintBox
    | keyof CssVisualBox
    | keyof OffsetRotateKeywords
    | keyof OffsetAnchorKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素沿运动路径移动时与路径相接的内部锚点。（offset-anchor）
   *
   * 常用值：
   * - `auto`：取 `transform-origin` 的值作为锚点。
   *
   * 初始值 `auto`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-anchor
   */
  offsetAnchor?: StyleValue<
    | OpenValue<CSSProperties['offsetAnchor']>
    | keyof CssWideKeywords
    | keyof OffsetAnchorKeywords
    | keyof CssPosition
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素沿运动路径行进的距离。（offset-distance）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-distance
   */
  offsetDistance?: StyleValue<
    | OpenValue<CSSProperties['offsetDistance']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素运动所沿用的路径。（offset-path）
   *
   * 常用值：
   * - `none`：不定义运动路径，元素不沿路径移动。
   *
   * 初始值 `none`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-path
   */
  offsetPath?: StyleValue<
    | OpenValue<CSSProperties['offsetPath']>
    | keyof CssWideKeywords
    | keyof OffsetPathKeywords
    | keyof CssCoordBox
    | keyof CssPaintBox
    | keyof CssVisualBox
  >;
  /**
   * 设置运动路径的初始位置。（offset-position）
   *
   * 常用值：
   * - `normal`：不指定路径的起始位置，元素没有 offset 起点。
   * - `auto`：以元素自身盒子所在的位置作为路径的起始位置。
   *
   * 初始值 `normal`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-position
   */
  offsetPosition?: StyleValue<
    | OpenValue<CSSProperties['offsetPosition']>
    | keyof CssWideKeywords
    | keyof OffsetPositionKeywords
    | keyof CssPosition
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素沿运动路径移动时的方向和附加旋转。（offset-rotate）
   *
   * 常用值：
   * - `auto`：元素朝向跟随路径的切线方向旋转，可再叠加一个角度。
   * - `reverse`：在 `auto` 基础上再旋转 180 度，使元素朝向与路径前进方向相反。
   *
   * 初始值 `auto`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-rotate
   */
  offsetRotate?: StyleValue<
    OpenValue<CSSProperties['offsetRotate']> | keyof CssWideKeywords | keyof OffsetRotateKeywords
  >;
  /**
   * 设置元素及其子树合成后的整体不透明度。（opacity）
   *
   * 0 完全透明，1 完全不透明；作用于整个子树的合成结果。透明元素仍可能接受点击和键盘焦点。
   *
   * 适用场景：统一调整整个元素子树的透明度；只需背景半透明时应使用带 alpha 的背景色。
   *
   * 数字值不加单位；初始值 `1`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/opacity
   */
  opacity?: StyleValue<
    | OpenValue<CSSProperties['opacity']>
    | keyof CssWideKeywords
    | keyof OpacitiesTokens
    | keyof QualifiedOpacitiesTokens
  >;
  /**
   * 设置 Flex 或 Grid 项目的视觉排列顺序，不改变 DOM 顺序。（order）
   *
   * 不改变源代码、朗读及通常的 Tab 顺序，避免用视觉重排破坏阅读顺序。
   *
   * 数字值不加单位；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/order
   */
  order?: StyleValue<OpenValue<CSSProperties['order']> | keyof CssWideKeywords>;
  /**
   * 设置分页或分栏断点前需保留的最少行数。（orphans）
   *
   * 数字值不加单位；初始值 `2`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/orphans
   */
  orphans?: StyleValue<OpenValue<CSSProperties['orphans']> | keyof CssWideKeywords>;
  /**
   * 设置盒子外围轮廓线的宽度、线型和颜色，不占布局空间。（outline）
   *
   * 不占布局空间，可用 outline-offset 调整距离；键盘焦点指示不应被无替代地移除。
   *
   * 适用场景：控件焦点指示和不影响布局的轮廓。
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline
   */
  outline?: StyleValue<
    | OpenValue<CSSProperties['outline']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof OutlineStyleKeywords
    | keyof CssOutlineLineStyle
    | keyof OutlineColorKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置轮廓线颜色。（outline-color）
   *
   * 常用值：
   * - `auto`：由浏览器自行选择轮廓颜色，通常与系统强调色或焦点环配色一致。
   *
   * 初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-color
   */
  outlineColor?: StyleValue<
    | OpenValue<CSSProperties['outlineColor']>
    | keyof CssWideKeywords
    | keyof OutlineColorKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置轮廓线与边框边缘之间的距离。（outline-offset）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-offset
   */
  outlineOffset?: StyleValue<
    | OpenValue<CSSProperties['outlineOffset']>
    | keyof CssWideKeywords
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置轮廓线线型。（outline-style）
   *
   * 常用值：
   * - `auto`：由浏览器绘制默认样式的轮廓，常用于焦点环，形状可能贴合元素圆角。
   * - `hidden`：`outline-style` 不接受该值（规范排除了 `hidden`），写了会被当作无效声明；要隐藏轮廓请用 `none`。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-style
   */
  outlineStyle?: StyleValue<KeywordValue<OutlineStyleValues, CSSProperties['outlineStyle']>>;
  /**
   * 设置轮廓线宽度。（outline-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-width
   */
  outlineWidth?: StyleValue<
    | OpenValue<CSSProperties['outlineWidth']>
    | keyof CssWideKeywords
    | keyof CssLineWidth
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置内容超出盒子时的裁剪和滚动行为。（overflow）
   *
   * 一个值同时设置两轴；两个值依次设置 overflow-x、overflow-y。通常需要尺寸约束才会出现可滚动的溢出。
   *
   * 常用值：
   * - `visible`：允许内容绘制到盒子外；与另一轴的设置组合时计算值可能变化。
   * - `hidden`：裁剪溢出且不显示滚动条，但仍是可通过脚本等方式滚动的滚动容器。可能成为 sticky 后代的滚动参照，不能把它仅理解成视觉裁剪。clip 不建立滚动容器；hidden 仍可通过脚本或焦点移动滚动。
   * - `clip`：在裁剪边界截断内容，不建立滚动容器，也不支持程序化滚动。两轴设置会影响计算结果；与另一轴 auto/scroll 等组合时，要检查最终溢出行为。与 hidden 不同，不支持程序化滚动，也不单独建立块格式化上下文。
   * - `auto`：按溢出情况提供滚动机制；滚动条外观和是否占空间由环境决定。scroll 通常始终预留或显示滚动机制；auto 根据溢出情况显示滚动条，外观由平台决定。
   * - `scroll`：建立滚动容器，通常即使未溢出也显示滚动条；具体外观由平台决定。
   *
   * 适用场景：滚动面板、内容裁剪和受限尺寸区域。
   *
   * 初始值 `visible`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow
   */
  overflow?: StyleValue<KeywordValue<OverflowValues, CSSProperties['overflow']>>;
  /**
   * 设置逻辑块轴上的溢出行为。（overflow-block）
   *
   * 常用值：
   * - `visible`：允许内容绘制到盒子外；与另一轴的设置组合时计算值可能变化。
   * - `hidden`：裁剪溢出且不显示滚动条，但仍是可通过脚本等方式滚动的滚动容器。可能成为 sticky 后代的滚动参照，不能把它仅理解成视觉裁剪。clip 不建立滚动容器；hidden 仍可通过脚本或焦点移动滚动。
   * - `clip`：在裁剪边界截断内容，不建立滚动容器，也不支持程序化滚动。两轴设置会影响计算结果；与另一轴 auto/scroll 等组合时，要检查最终溢出行为。与 hidden 不同，不支持程序化滚动，也不单独建立块格式化上下文。
   * - `auto`：按溢出情况提供滚动机制；滚动条外观和是否占空间由环境决定。scroll 通常始终预留或显示滚动机制；auto 根据溢出情况显示滚动条，外观由平台决定。
   * - `scroll`：建立滚动容器，通常即使未溢出也显示滚动条；具体外观由平台决定。
   *
   * 初始值 `auto`；不继承；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-block
   */
  overflowBlock?: StyleValue<KeywordValue<OverflowValues, CSSProperties['overflowBlock']>>;
  /**
   * 非标准键，不对应 CSS 属性；请用 overflowX 或 overflowBlock。（overflow-block-x）
   *
   * 常用值：
   * - `auto`：内容溢出时显示滚动条，不溢出则不显示。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   * - `clip`：在盒子边缘裁剪溢出内容，不建立滚动容器，不可滚动。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   * - `hidden`：裁剪溢出内容并建立滚动容器，用户不可滚动但程序仍可滚动。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   * - `scroll`：始终显示滚动条，内容可滚动。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   * - `visible`：溢出内容正常显示在盒子之外，不裁剪。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   */
  overflowBlockX?: StyleValue<KeywordValue<OverflowBlockXValues, CSSProperties['overflowBlockX']>>;
  /**
   * 设置水平方向的溢出行为。（overflow-x）
   *
   * 和 overflow-y 的组合可能改变计算值；例如另一轴是 auto 时，visible 可能按 auto 计算。
   *
   * 常用值：
   * - `auto`：按溢出情况提供滚动机制；滚动条外观和是否占空间由环境决定。scroll 通常始终预留或显示滚动机制；auto 根据溢出情况显示滚动条，外观由平台决定。
   * - `hidden`：裁剪溢出且不显示滚动条，但仍是可通过脚本等方式滚动的滚动容器。可能成为 sticky 后代的滚动参照，不能把它仅理解成视觉裁剪。clip 不建立滚动容器；hidden 仍可通过脚本或焦点移动滚动。
   * - `clip`：在裁剪边界截断内容，不建立滚动容器，也不支持程序化滚动。两轴设置会影响计算结果；与另一轴 auto/scroll 等组合时，要检查最终溢出行为。与 hidden 不同，不支持程序化滚动，也不单独建立块格式化上下文。
   *
   * 适用场景：横向滚动标签、宽表格或水平内容裁剪。
   *
   * 初始值 `visible`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-x
   */
  overflowX?: StyleValue<KeywordValue<OverflowValues, CSSProperties['overflowX']>>;
  /**
   * 设置垂直方向的溢出行为。（overflow-y）
   *
   * 通常配合 height/max-height 或可收缩的布局区域使用。
   *
   * 常用值：
   * - `auto`：按溢出情况提供滚动机制；滚动条外观和是否占空间由环境决定。scroll 通常始终预留或显示滚动机制；auto 根据溢出情况显示滚动条，外观由平台决定。
   * - `hidden`：裁剪溢出且不显示滚动条，但仍是可通过脚本等方式滚动的滚动容器。可能成为 sticky 后代的滚动参照，不能把它仅理解成视觉裁剪。clip 不建立滚动容器；hidden 仍可通过脚本或焦点移动滚动。
   * - `clip`：在裁剪边界截断内容，不建立滚动容器，也不支持程序化滚动。两轴设置会影响计算结果；与另一轴 auto/scroll 等组合时，要检查最终溢出行为。与 hidden 不同，不支持程序化滚动，也不单独建立块格式化上下文。
   *
   * 适用场景：纵向列表和弹窗内容区。
   *
   * 初始值 `visible`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-y
   */
  overflowY?: StyleValue<KeywordValue<OverflowValues, CSSProperties['overflowY']>>;
  /**
   * 控制元素是否参与滚动锚定，以减少内容变化造成的视口跳动。（overflow-anchor）
   *
   * 常用值：
   * - `auto`：允许该元素参与滚动锚定：上方内容尺寸变化时，浏览器自动调整滚动位置，避免可见内容跳动。
   * - `none`：该元素及其后代不会被选作滚动锚点，不参与自动保持滚动位置。
   *
   * 初始值 `auto`；不继承；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-anchor
   */
  overflowAnchor?: StyleValue<KeywordValue<OverflowAnchorValues, CSSProperties['overflowAnchor']>>;
  /**
   * 设置 overflow:clip 的裁剪边界允许向外扩展的距离。（overflow-clip-margin）
   *
   * 初始值 `0px`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-clip-margin
   */
  overflowClipMargin?: StyleValue<
    | OpenValue<CSSProperties['overflowClipMargin']>
    | keyof CssWideKeywords
    | keyof CssVisualBox
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置不可正常断开的长文本是否允许额外换行。（overflow-wrap）
   *
   * 常用值：
   * - `normal`：只使用正常换行机会，不为长单词额外断行。
   * - `anywhere`：必要时允许在长文本任意位置断行，这些机会参与 min-content 尺寸计算。break-word 的额外断点不按 anywhere 的方式参与最小内容宽度计算；word-break:break-all 更积极地拆分普通单词。
   * - `break-word`：必要时允许长文本断行，但新增断点不按 anywhere 的方式参与 min-content 计算。
   *
   * 适用场景：防止 URL、标识符等长文本撑破容器。
   *
   * 初始值 `normal`；继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-wrap
   */
  overflowWrap?: StyleValue<KeywordValue<OverflowWrapValues, CSSProperties['overflowWrap']>>;
  /**
   * 控制滚动到边界后的滚动链和越界反馈行为。（overscroll-behavior）
   *
   * 常用值：
   * - `auto`：采用默认滚动链和边界反馈。
   * - `contain`：阻止滚动链传播到祖先，同时可保留当前容器的边界反馈。
   * - `none`：阻止滚动链，并抑制当前容器的默认越界反馈。
   *
   * 适用场景：阻止弹窗或内部滚动面板到达边界后继续滚动外层页面。
   *
   * 初始值 `auto`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior
   */
  overscrollBehavior?: StyleValue<
    KeywordValue<OverscrollBehaviorValues, CSSProperties['overscrollBehavior']>
  >;
  /**
   * 控制逻辑块轴上到达滚动边界后的行为。（overscroll-behavior-block）
   *
   * 常用值：
   * - `auto`：采用默认滚动链和边界反馈。
   * - `contain`：阻止滚动链传播到祖先，同时可保留当前容器的边界反馈。
   * - `none`：阻止滚动链，并抑制当前容器的默认越界反馈。
   *
   * 初始值 `auto`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior-block
   */
  overscrollBehaviorBlock?: StyleValue<
    KeywordValue<OverscrollBehaviorValues, CSSProperties['overscrollBehaviorBlock']>
  >;
  /**
   * 控制垂直方向到达滚动边界后的行为。（overscroll-behavior-y）
   *
   * 常用值：
   * - `auto`：采用默认滚动链和边界反馈。
   * - `contain`：阻止滚动链传播到祖先，同时可保留当前容器的边界反馈。
   * - `none`：阻止滚动链，并抑制当前容器的默认越界反馈。
   *
   * 初始值 `auto`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior-y
   */
  overscrollBehaviorY?: StyleValue<
    KeywordValue<OverscrollBehaviorValues, CSSProperties['overscrollBehaviorY']>
  >;
  /**
   * 控制逻辑行内轴上到达滚动边界后的行为。（overscroll-behavior-inline）
   *
   * 常用值：
   * - `auto`：采用默认滚动链和边界反馈。
   * - `contain`：阻止滚动链传播到祖先，同时可保留当前容器的边界反馈。
   * - `none`：阻止滚动链，并抑制当前容器的默认越界反馈。
   *
   * 初始值 `auto`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior-inline
   */
  overscrollBehaviorInline?: StyleValue<
    KeywordValue<OverscrollBehaviorValues, CSSProperties['overscrollBehaviorInline']>
  >;
  /**
   * 控制水平方向到达滚动边界后的行为。（overscroll-behavior-x）
   *
   * 常用值：
   * - `auto`：采用默认滚动链和边界反馈。
   * - `contain`：阻止滚动链传播到祖先，同时可保留当前容器的边界反馈。
   * - `none`：阻止滚动链，并抑制当前容器的默认越界反馈。
   *
   * 初始值 `auto`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior-x
   */
  overscrollBehaviorX?: StyleValue<
    KeywordValue<OverscrollBehaviorValues, CSSProperties['overscrollBehaviorX']>
  >;
  /**
   * 设置内容与边框之间的四边内边距，不接受负值。（padding）
   *
   * 1/2/3/4 个值依次表示：四边；上下/左右；上/左右/下；上/右/下/左。不能使用负值或 auto。
   *
   * 适用场景：控制文字或子元素与组件边框之间的留白。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding
   */
  padding?: StyleValue<
    | OpenValue<CSSProperties['padding']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴起始侧和结束侧的内边距。（padding-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block
   */
  paddingBlock?: StyleValue<
    | OpenValue<CSSProperties['paddingBlock']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴结束侧的内边距。（padding-block-end）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block-end
   */
  paddingBlockEnd?: StyleValue<
    | OpenValue<CSSProperties['paddingBlockEnd']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑块轴起始侧的内边距。（padding-block-start）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block-start
   */
  paddingBlockStart?: StyleValue<
    | OpenValue<CSSProperties['paddingBlockStart']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴起始侧和结束侧的内边距。（padding-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline
   */
  paddingInline?: StyleValue<
    | OpenValue<CSSProperties['paddingInline']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴结束侧的内边距。（padding-inline-end）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline-end
   */
  paddingInlineEnd?: StyleValue<
    | OpenValue<CSSProperties['paddingInlineEnd']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置逻辑行内轴起始侧的内边距。（padding-inline-start）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline-start
   */
  paddingInlineStart?: StyleValue<
    | OpenValue<CSSProperties['paddingInlineStart']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置下内边距。（padding-bottom）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-bottom
   */
  paddingBottom?: StyleValue<
    | OpenValue<CSSProperties['paddingBottom']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置左内边距。（padding-left）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-left
   */
  paddingLeft?: StyleValue<
    | OpenValue<CSSProperties['paddingLeft']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置右内边距。（padding-right）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-right
   */
  paddingRight?: StyleValue<
    | OpenValue<CSSProperties['paddingRight']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置上内边距。（padding-top）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-top
   */
  paddingTop?: StyleValue<
    | OpenValue<CSSProperties['paddingTop']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 选择分页媒体中使用的命名页面类型。（page）
   *
   * 常用值：
   * - `auto`：不指定命名页面，沿用父元素的页面类型（根元素则使用默认页面）。
   *
   * 初始值 `auto`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page
   */
  page?: StyleValue<OpenValue<CSSProperties['page']> | keyof CssWideKeywords | keyof PageKeywords>;
  /**
   * 打印时元素之后是否分页（page-break-after），旧写法，请改用 breakAfter。
   *
   * 常用值：
   * - `always`：在此处强制分页：`page-break-before` 作用于元素之前，`page-break-after` 作用于元素之后。旧写法，改用 `break-before` 与 `break-after`。
   * - `auto`：既不强制也不禁止在此处分页，由浏览器按需决定。旧写法，改用 `break-before` 与 `break-after`。
   * - `avoid`：尽量避免在此处分页：`page-break-before` 针对元素之前，`page-break-after` 针对元素之后。旧写法，改用 `break-before` 与 `break-after`。
   * - `left`：在此处强制分页，并让下一页成为左页，必要时插入空白页。旧写法，改用 `break-before` 与 `break-after`。
   * - `right`：在此处强制分页，并让下一页成为右页，必要时插入空白页。旧写法，改用 `break-before` 与 `break-after`。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-after
   */
  pageBreakAfter?: StyleValue<KeywordValue<PageBreakAfterValues, CSSProperties['pageBreakAfter']>>;
  /**
   * 打印时元素之前是否分页（page-break-before），旧写法，请改用 breakBefore。
   *
   * 常用值：
   * - `always`：在此处强制分页：`page-break-before` 作用于元素之前，`page-break-after` 作用于元素之后。旧写法，改用 `break-before` 与 `break-after`。
   * - `auto`：既不强制也不禁止在此处分页，由浏览器按需决定。旧写法，改用 `break-before` 与 `break-after`。
   * - `avoid`：尽量避免在此处分页：`page-break-before` 针对元素之前，`page-break-after` 针对元素之后。旧写法，改用 `break-before` 与 `break-after`。
   * - `left`：在此处强制分页，并让下一页成为左页，必要时插入空白页。旧写法，改用 `break-before` 与 `break-after`。
   * - `right`：在此处强制分页，并让下一页成为右页，必要时插入空白页。旧写法，改用 `break-before` 与 `break-after`。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-before
   */
  pageBreakBefore?: StyleValue<
    KeywordValue<PageBreakAfterValues, CSSProperties['pageBreakBefore']>
  >;
  /**
   * 打印时是否允许在元素内部分页（page-break-inside），旧写法，请改用 breakInside。
   *
   * 常用值：
   * - `auto`：既不强制也不禁止在元素内部分页，由浏览器按需决定。旧写法，改用 `break-inside`。
   * - `avoid`：尽量避免在元素内部分页，内容一页放不下时才会拆开。旧写法，改用 `break-inside`。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-inside
   */
  pageBreakInside?: StyleValue<
    KeywordValue<PageBreakInsideValues, CSSProperties['pageBreakInside']>
  >;
  /**
   * 设置 SVG 填充、描边和标记的绘制先后顺序。（paint-order）
   *
   * 常用值：
   * - `fill`：先绘制填充，随后按默认顺序绘制描边和标记。
   * - `fill markers`：先绘制填充，再绘制标记，最后绘制描边。
   * - `markers`：先绘制标记，随后按默认顺序绘制填充和描边。
   * - `normal`：使用默认顺序：先填充，再描边，最后标记。
   * - `stroke`：先绘制描边，随后按默认顺序绘制填充和标记。
   * - `stroke fill`：先描边，再填充，最后标记，与单写 `stroke` 效果相同。
   * - `stroke fill markers`：显式写出完整顺序：描边、填充、标记。填充压在描边之上，常用于避免文字描边吞掉字形。
   * - `stroke markers`：先绘制描边，再绘制标记，最后绘制填充。
   *
   * 初始值 `normal`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/paint-order
   */
  paintOrder?: StyleValue<KeywordValue<PaintOrderValues, CSSProperties['paintOrder']>>;
  /**
   * 语音合成在元素前后的停顿（pause），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `medium`：插入中等强度的停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `none`：不插入停顿，等同于时长为 0。属于 CSS Speech，浏览器基本不支持。
   * - `strong`：插入较长的停顿，比 `medium` 更久，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `weak`：插入较短的停顿，比 `medium` 更短，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-strong`：插入最长的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-weak`：插入最短的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  pause?: StyleValue<KeywordValue<PauseValues, CSSProperties['pause']>>;
  /**
   * 语音合成在元素之后的停顿（pause-after），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `medium`：插入中等强度的停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `none`：不插入停顿，等同于时长为 0。属于 CSS Speech，浏览器基本不支持。
   * - `strong`：插入较长的停顿，比 `medium` 更久，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `weak`：插入较短的停顿，比 `medium` 更短，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-strong`：插入最长的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-weak`：插入最短的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  pauseAfter?: StyleValue<KeywordValue<PauseValues, CSSProperties['pauseAfter']>>;
  /**
   * 语音合成在元素之前的停顿（pause-before），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `medium`：插入中等强度的停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `none`：不插入停顿，等同于时长为 0。属于 CSS Speech，浏览器基本不支持。
   * - `strong`：插入较长的停顿，比 `medium` 更久，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `weak`：插入较短的停顿，比 `medium` 更短，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-strong`：插入最长的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-weak`：插入最短的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  pauseBefore?: StyleValue<KeywordValue<PauseValues, CSSProperties['pauseBefore']>>;
  /**
   * 设置观察子元素三维变换时的透视距离。（perspective）
   *
   * 常用值：
   * - `none`：不应用透视，子元素的 3D 变换没有近大远小的效果。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/perspective
   */
  perspective?: StyleValue<
    | KeywordValue<PerspectiveValues, CSSProperties['perspective']>
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置三维透视的观察原点。（perspective-origin）
   *
   * 初始值 `50% 50%`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/perspective-origin
   */
  perspectiveOrigin?: StyleValue<
    | OpenValue<CSSProperties['perspectiveOrigin']>
    | keyof CssWideKeywords
    | keyof CssPosition
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素何时可以成为指针命中目标；SVG 还支持按填充和描边命中。（pointer-events）
   *
   * 控制指针命中，不等同于原生 disabled，也不会单独阻止键盘交互。
   *
   * 常用值：
   * - `auto`：采用当前元素类型的默认命中规则。
   * - `none`：元素本身不成为指针命中目标；不等于禁用，仍可能通过 Tab 获焦，后代也可恢复命中。后代可以恢复命中；来自后代的事件仍可能经过祖先监听器。
   *
   * 适用场景：允许指针穿过装饰层；可交互控件的禁用应同时处理行为和语义。
   *
   * 初始值 `auto`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/pointer-events
   */
  pointerEvents?: StyleValue<KeywordValue<PointerEventsValues, CSSProperties['pointerEvents']>>;
  /**
   * 设置元素的定位方式，并决定偏移属性如何参与布局。（position）
   *
   * 偏移通常通过 top/right/bottom/left 或逻辑 inset 属性设置。fixed 和 absolute 的包含块也可能由 transform 等属性建立。
   *
   * 常用值：
   * - `static`：参与普通文档流，top/right/bottom/left 等定位偏移不生效。
   * - `relative`：保留普通流中的原位置，再按偏移移动绘制位置；不会为偏移后的区域重新排版。absolute 会脱离普通流；relative 仍保留原占位。
   * - `absolute`：脱离普通文档流，按包含块定位；包含块通常由定位祖先或 transform 等属性建立。通常在预期的容器上设置 position:relative；元素不为自己保留普通流占位。
   * - `fixed`：脱离普通流，通常相对视口固定；某些祖先属性会建立不同的包含块。祖先的 transform 等属性可能改变固定定位的包含块；z-index 仍受层叠上下文约束。absolute 通常跟随其包含块滚动；fixed 在以视口为包含块时保持视口位置。
   * - `sticky`：保留流内位置，在滚动范围内按 inset 约束吸附。对应轴至少一个 inset 须非 auto，并受滚动祖先和包含块限制。对应轴至少一个 inset 必须非 auto；祖先 overflow 可能改变滚动参照。与 fixed 不同，它保留流内占位，并受自身所在包含块的范围约束。
   *
   * 适用场景：建立定位参照、覆盖层、固定区域或滚动吸附内容。
   *
   * 初始值 `static`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position
   */
  position?: StyleValue<KeywordValue<PositionValues, CSSProperties['position']>>;
  /**
   * 选择绝对定位元素使用的默认锚点。（position-anchor）
   *
   * 常用值：
   * - `normal`：初始值，不指定显式锚点；默认锚点由规范的隐式锚点规则决定，不同上下文下行为有差异。
   * - `auto`：使用元素的隐式锚点作为默认锚点，例如 popover 的触发元素。
   * - `none`：元素没有默认锚点，也不使用隐式锚点。
   * - `match-parent`：默认锚点沿用父元素 `position-anchor` 的计算结果，较新，使用前核对浏览器支持。
   *
   * 初始值 `normal`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-anchor
   */
  positionAnchor?: StyleValue<
    | OpenValue<CSSProperties['positionAnchor']>
    | keyof CssWideKeywords
    | keyof PositionAnchorKeywords
  >;
  /**
   * 选择相对于锚点的定位区域。（position-area）
   *
   * 常用值：
   * - `none`：不指定相对锚点的定位区域，元素按常规的 `inset` 属性定位。
   *
   * 初始值 `none`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-area
   */
  positionArea?: StyleValue<KeywordValue<PositionAreaValues, CSSProperties['positionArea']>>;
  /**
   * 同时设置锚点定位的候选回退方式及尝试顺序。（position-try）
   *
   * 简写属性，初始值见各分项；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try
   */
  positionTry?: StyleValue<
    | OpenValue<CSSProperties['positionTry']>
    | keyof CssWideKeywords
    | keyof PositionTryOrderKeywords
    | keyof CssTrySize
    | keyof PositionTryFallbacksKeywords
    | keyof CssTryTactic
    | keyof PositionAreaKeywords
    | keyof CssPositionArea
  >;
  /**
   * 设置锚点定位溢出时尝试的替代位置。（position-try-fallbacks）
   *
   * 常用值：
   * - `none`：不提供备用位置方案，元素溢出时也不会自动换位。
   *
   * 初始值 `none`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try-fallbacks
   */
  positionTryFallbacks?: StyleValue<
    | OpenValue<CSSProperties['positionTryFallbacks']>
    | keyof CssWideKeywords
    | keyof PositionTryFallbacksKeywords
    | keyof CssTryTactic
    | keyof PositionAreaKeywords
    | keyof CssPositionArea
  >;
  /**
   * 锚点定位放不下时依次尝试的备选位置（position-try-options），是 positionTryFallbacks 的旧名，请改用后者。
   */
  positionTryOptions?: StyleValue<
    OpenValue<CSSProperties['positionTryOptions']> | keyof CssWideKeywords
  >;
  /**
   * 设置锚点定位元素根据锚点可见性和溢出情况是否显示。（position-visibility）
   *
   * 常用值：
   * - `always`：始终显示元素，不因锚点状态或溢出而隐藏。
   * - `anchors-visible`：默认锚点被包含块或滚动容器完全裁掉时隐藏元素，避免锚点看不见了浮层还留在原地。
   * - `no-overflow`：尝试完 `position-try-fallbacks` 后元素仍溢出其包含块时，隐藏元素。
   *
   * 初始值 `anchors-visible`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-visibility
   */
  positionVisibility?: StyleValue<
    KeywordValue<PositionVisibilityValues, CSSProperties['positionVisibility']>
  >;
  /**
   * 设置生成引号所用的开闭字符对。（quotes）
   *
   * 常用值：
   * - `none`：`open-quote`、`close-quote` 不生成任何字符。
   * - `auto`：按元素语言（`lang`）自动选用该语言的默认引号。
   *
   * 初始值 `dependsOnUserAgent`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/quotes
   */
  quotes?: StyleValue<
    OpenValue<CSSProperties['quotes']> | keyof CssWideKeywords | keyof QuotesKeywords
  >;
  /**
   * 设置用户是否能调整元素尺寸以及可调整的方向。（resize）
   *
   * 常用值：
   * - `both`：用户可沿水平和垂直两个方向拖动调整尺寸。
   * - `horizontal`：用户只能沿水平方向拖动，调整宽度。
   * - `none`：不显示拖拽手柄，用户不能调整元素尺寸。
   * - `vertical`：用户只能沿垂直方向拖动，调整高度。
   *
   * 初始值 `none`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/resize
   */
  resize?: StyleValue<KeywordValue<ResizeValues, CSSProperties['resize']>>;
  /**
   * 语音合成在元素前后的静默时长（rest），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `medium`：插入中等强度的停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `none`：不插入停顿，等同于时长为 0。属于 CSS Speech，浏览器基本不支持。
   * - `strong`：插入较长的停顿，比 `medium` 更久，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `weak`：插入较短的停顿，比 `medium` 更短，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-strong`：插入最长的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-weak`：插入最短的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  rest?: StyleValue<KeywordValue<PauseValues, CSSProperties['rest']>>;
  /**
   * 语音合成在元素之后的静默时长（rest-after），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `medium`：插入中等强度的停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `none`：不插入停顿，等同于时长为 0。属于 CSS Speech，浏览器基本不支持。
   * - `strong`：插入较长的停顿，比 `medium` 更久，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `weak`：插入较短的停顿，比 `medium` 更短，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-strong`：插入最长的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-weak`：插入最短的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  restAfter?: StyleValue<KeywordValue<PauseValues, CSSProperties['restAfter']>>;
  /**
   * 语音合成在元素之前的静默时长（rest-before），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `medium`：插入中等强度的停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `none`：不插入停顿，等同于时长为 0。属于 CSS Speech，浏览器基本不支持。
   * - `strong`：插入较长的停顿，比 `medium` 更久，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `weak`：插入较短的停顿，比 `medium` 更短，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-strong`：插入最长的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   * - `x-weak`：插入最短的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  restBefore?: StyleValue<KeywordValue<PauseValues, CSSProperties['restBefore']>>;
  /**
   * 设置定位元素相对于其定位参照的右侧偏移。（right）
   *
   * 常用值：
   * - `auto`：不指定该侧偏移：绝对定位时位置由对侧偏移、元素尺寸或静态位置决定，相对定位时按 0 处理。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/right
   */
  right?: StyleValue<
    | OpenValue<CSSProperties['right']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置布局中相邻行之间的间距。（row-gap）
   *
   * 常用值：
   * - `normal`：取布局模式的默认间距：flex、grid 中为 0，多列布局中列间距默认为 `1em`。
   *
   * 数字值自动加 `px`；初始值 `normal`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/row-gap
   */
  rowGap?: StyleValue<
    | OpenValue<CSSProperties['rowGap']>
    | keyof CssWideKeywords
    | keyof RowGapKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置注音文字与基底文字之间剩余空间的分配方式。（ruby-align）
   *
   * 常用值：
   * - `center`：注音与基底中较短的一方在另一方范围内居中，两侧留出剩余空间。
   * - `space-around`：较短一方的内容均匀分布，首尾各留半份间距，字符之间的间距是首尾的两倍。
   * - `space-between`：较短一方的内容均匀分布，首尾贴边，剩余空间平分到字符之间。
   * - `start`：较短一方靠起始侧对齐，剩余空间留在末端。
   *
   * 初始值 `space-around`；继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ruby-align
   */
  rubyAlign?: StyleValue<KeywordValue<RubyAlignValues, CSSProperties['rubyAlign']>>;
  /**
   * 设置相邻注音容器的合并方式；使用前核对目标浏览器。（ruby-merge）
   *
   * 常用值：
   * - `auto`：是否合并由浏览器决定；目前浏览器基本未实现该属性。
   * - `collapse`：把同一注音段内的多个注音容器合并为一个，跨越对应的全部基底。
   * - `separate`：各注音容器保持独立，分别与对应的基底配对，不合并。
   *
   * 初始值 `separate`；继承；实验性。
   */
  rubyMerge?: StyleValue<KeywordValue<RubyMergeValues, CSSProperties['rubyMerge']>>;
  /**
   * 设置注音文字相对于基底文字的位置。（ruby-position）
   *
   * 常用值：
   * - `inter-character`：注音放在基底字符的旁侧而不是上下，主要用于台湾注音符号（Bopomofo）。
   * - `over`：注音放在基底上方；竖排时在右侧。
   * - `under`：注音放在基底下方；竖排时在左侧。
   *
   * 初始值 `alternate`；继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ruby-position
   */
  rubyPosition?: StyleValue<KeywordValue<RubyPositionValues, CSSProperties['rubyPosition']>>;
  /**
   * 设置数学公式的嵌套深度，用于数学字号等排版计算。（math-depth）
   *
   * 常用值：
   * - `auto-add`：若继承的 `math-style` 为 `compact`，深度在父元素基础上加 1，否则沿用父元素的深度。
   *
   * 数字值不加单位；初始值 `0`；继承；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-depth
   */
  mathDepth?: StyleValue<
    OpenValue<CSSProperties['mathDepth']> | keyof CssWideKeywords | keyof MathDepthKeywords
  >;
  /**
   * 控制数学上标采用正常还是压缩的垂直偏移。（math-shift）
   *
   * 常用值：
   * - `compact`：上标使用较小的上移量，用于紧凑样式下节省垂直空间。
   * - `normal`：上标使用正常的上移量。
   *
   * 初始值 `normal`；继承；实验性；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-shift
   */
  mathShift?: StyleValue<KeywordValue<MathShiftValues, CSSProperties['mathShift']>>;
  /**
   * 设置数学公式采用正常还是紧凑排版。（math-style）
   *
   * 常用值：
   * - `compact`：采用紧凑（行内）样式，公式更靠拢，适合嵌入正文行。
   * - `normal`：采用展示（display）样式，公式空间更宽松，如大型运算符的上下限分居上下方。
   *
   * 初始值 `normal`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-style
   */
  mathStyle?: StyleValue<KeywordValue<MathStyleValues, CSSProperties['mathStyle']>>;
  /**
   * 设置由导航或滚动 API 触发的滚动采用即时还是平滑方式。（scroll-behavior）
   *
   * 主要影响导航和滚动 API 触发的滚动，不会把所有用户滚动强制变成动画。
   *
   * 常用值：
   * - `auto`：滚动立即跳到目标位置，没有动画。
   * - `smooth`：锚点跳转、`scrollTo` 等触发的滚动使用平滑动画；用户手动滚动不受影响。
   *
   * 适用场景：锚点跳转或程序化滚动；应同时考虑减少动态效果的用户偏好。
   *
   * 初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-behavior
   */
  scrollBehavior?: StyleValue<KeywordValue<ScrollBehaviorValues, CSSProperties['scrollBehavior']>>;
  /**
   * 设置元素滚动目标区域的四边外扩距离，不改变普通布局外边距。（scroll-margin）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin
   */
  scrollMargin?: StyleValue<
    | OpenValue<CSSProperties['scrollMargin']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域上侧的外扩距离。（scroll-margin-top）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-top
   */
  scrollMarginTop?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginTop']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域右侧的外扩距离。（scroll-margin-right）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-right
   */
  scrollMarginRight?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginRight']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域下侧的外扩距离。（scroll-margin-bottom）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-bottom
   */
  scrollMarginBottom?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginBottom']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域左侧的外扩距离。（scroll-margin-left）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-left
   */
  scrollMarginLeft?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginLeft']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域在逻辑块轴两侧的外扩距离。（scroll-margin-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block
   */
  scrollMarginBlock?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginBlock']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域在逻辑块轴结束侧的外扩距离。（scroll-margin-block-end）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block-end
   */
  scrollMarginBlockEnd?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginBlockEnd']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域在逻辑块轴起始侧的外扩距离。（scroll-margin-block-start）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block-start
   */
  scrollMarginBlockStart?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginBlockStart']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域在逻辑行内轴两侧的外扩距离。（scroll-margin-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline
   */
  scrollMarginInline?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginInline']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域在逻辑行内轴结束侧的外扩距离。（scroll-margin-inline-end）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline-end
   */
  scrollMarginInlineEnd?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginInlineEnd']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动目标区域在逻辑行内轴起始侧的外扩距离。（scroll-margin-inline-start）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline-start
   */
  scrollMarginInlineStart?: StyleValue<
    | OpenValue<CSSProperties['scrollMarginInlineStart']>
    | keyof CssWideKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域的四边内缩距离。（scroll-padding）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding
   */
  scrollPadding?: StyleValue<
    | OpenValue<CSSProperties['scrollPadding']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域上侧的内缩距离。（scroll-padding-top）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-top
   */
  scrollPaddingTop?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingTop']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingTopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域右侧的内缩距离。（scroll-padding-right）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-right
   */
  scrollPaddingRight?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingRight']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingTopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域下侧的内缩距离。（scroll-padding-bottom）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-bottom
   */
  scrollPaddingBottom?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingBottom']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingTopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域左侧的内缩距离。（scroll-padding-left）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-left
   */
  scrollPaddingLeft?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingLeft']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingTopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑块轴两侧的内缩距离。（scroll-padding-block）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block
   */
  scrollPaddingBlock?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingBlock']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingBlockKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑块轴结束侧的内缩距离。（scroll-padding-block-end）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block-end
   */
  scrollPaddingBlockEnd?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingBlockEnd']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingTopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑块轴起始侧的内缩距离。（scroll-padding-block-start）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block-start
   */
  scrollPaddingBlockStart?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingBlockStart']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingTopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑行内轴两侧的内缩距离。（scroll-padding-inline）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline
   */
  scrollPaddingInline?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingInline']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingBlockKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑行内轴结束侧的内缩距离。（scroll-padding-inline-end）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline-end
   */
  scrollPaddingInlineEnd?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingInlineEnd']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingTopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑行内轴起始侧的内缩距离。（scroll-padding-inline-start）
   *
   * 常用值：
   * - `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline-start
   */
  scrollPaddingInlineStart?: StyleValue<
    | OpenValue<CSSProperties['scrollPaddingInlineStart']>
    | keyof CssWideKeywords
    | keyof ScrollPaddingTopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置元素作为滚动吸附目标时在块轴和行内轴上的对齐位置。（scroll-snap-align）
   *
   * 常用值：
   * - `center`：元素中心与滚动容器吸附区域的中心对齐。
   * - `end`：元素末端边缘与吸附区域的末端边缘对齐。
   * - `none`：该轴上元素不产生吸附位置。
   * - `start`：元素起始边缘与吸附区域的起始边缘对齐。
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-align
   */
  scrollSnapAlign?: StyleValue<
    KeywordValue<ScrollSnapAlignValues, CSSProperties['scrollSnapAlign']>
  >;
  /**
   * 设置滚动时是否允许越过该元素的吸附位置。（scroll-snap-stop）
   *
   * 常用值：
   * - `always`：滚动必须在该元素的吸附位置停下，不允许一次快速滚动越过它。
   * - `normal`：快速滚动时可以越过该元素的吸附位置，不强制停下。
   *
   * 初始值 `normal`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-stop
   */
  scrollSnapStop?: StyleValue<KeywordValue<ScrollSnapStopValues, CSSProperties['scrollSnapStop']>>;
  /**
   * 设置滚动容器的吸附轴和吸附强度。（scroll-snap-type）
   *
   * 轴和吸附强度的组合通过 raw 写入，例如 x mandatory；单独声明轴时省略的强度按 CSS 规则处理。
   *
   * 常用值：`block`、`block mandatory`、`block proximity`、`both`、`both mandatory`、`both proximity`、`inline`、`inline mandatory`、`inline proximity`、`none`、`x`、`x mandatory`、`x proximity`、`y`、`y mandatory`、`y proximity`
   *
   * 初始值 `none`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-type
   */
  scrollSnapType?: StyleValue<KeywordValue<ScrollSnapTypeValues, CSSProperties['scrollSnapType']>>;
  /**
   * 同时声明滚动进度时间线的名称和轴。（scroll-timeline）
   *
   * 简写属性，初始值见各分项；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline
   */
  scrollTimeline?: StyleValue<
    | OpenValue<CSSProperties['scrollTimeline']>
    | keyof CssWideKeywords
    | keyof ScrollTimelineNameKeywords
    | keyof ScrollTimelineAxisKeywords
  >;
  /**
   * 设置滚动进度时间线所观察的滚动轴。（scroll-timeline-axis）
   *
   * 常用值：
   * - `block`：以块轴方向的滚动位置作为时间线进度（横排文字时即垂直方向）。
   * - `inline`：以行内轴方向的滚动位置作为时间线进度（横排文字时即水平方向）。
   * - `x`：以水平方向的滚动位置作为时间线进度，不随书写模式变化。
   * - `y`：以垂直方向的滚动位置作为时间线进度，不随书写模式变化。
   *
   * 初始值 `block`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline-axis
   */
  scrollTimelineAxis?: StyleValue<
    KeywordValue<ScrollTimelineAxisValues, CSSProperties['scrollTimelineAxis']>
  >;
  /**
   * 声明基于当前容器滚动进度的时间线名称。（scroll-timeline-name）
   *
   * 常用值：
   * - `none`：不为该元素声明命名滚动时间线。
   *
   * 初始值 `none`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline-name
   */
  scrollTimelineName?: StyleValue<
    | OpenValue<CSSProperties['scrollTimelineName']>
    | keyof CssWideKeywords
    | keyof ScrollTimelineNameKeywords
  >;
  /**
   * 设置滚动条滑块和轨道的颜色。（scrollbar-color）
   *
   * 常用值：
   * - `auto`：使用平台默认的滚动条颜色。
   *
   * 初始值 `auto`；继承；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-color
   */
  scrollbarColor?: StyleValue<
    | OpenValue<CSSProperties['scrollbarColor']>
    | keyof CssWideKeywords
    | keyof ScrollbarColorKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置是否预留滚动条槽位，以减少滚动条出现时的布局变化。（scrollbar-gutter）
   *
   * 常用值：
   * - `auto`：不预留滚动条槽位，仅在滚动条实际出现时才占用空间；覆盖式滚动条不占位。
   * - `stable`：只要元素可滚动，就始终在滚动条一侧预留槽位，避免滚动条出现或消失时内容宽度跳动。
   * - `stable both-edges`：在 `stable` 的基础上，另一侧也预留同样宽度的槽位，使内容左右对称。
   *
   * 初始值 `auto`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-gutter
   */
  scrollbarGutter?: StyleValue<
    KeywordValue<ScrollbarGutterValues, CSSProperties['scrollbarGutter']>
  >;
  /**
   * 设置滚动条采用正常、较细或隐藏的外观。（scrollbar-width）
   *
   * 常用值：
   * - `auto`：使用平台默认的滚动条宽度。
   * - `none`：隐藏滚动条，但内容仍可通过滚轮、触摸等方式滚动。
   * - `thin`：使用更细的滚动条，具体宽度由平台决定。
   *
   * 初始值 `auto`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-width
   */
  scrollbarWidth?: StyleValue<KeywordValue<ScrollbarWidthValues, CSSProperties['scrollbarWidth']>>;
  /**
   * 设置从图像 alpha 信息提取环绕形状时的阈值。（shape-image-threshold）
   *
   * 数字值不加单位；初始值 `0.0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-image-threshold
   */
  shapeImageThreshold?: StyleValue<
    | OpenValue<CSSProperties['shapeImageThreshold']>
    | keyof CssWideKeywords
    | keyof QualifiedOpacitiesTokens
  >;
  /**
   * 设置文字环绕形状之外的额外间距。（shape-margin）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-margin
   */
  shapeMargin?: StyleValue<
    | OpenValue<CSSProperties['shapeMargin']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置浮动元素周围行内内容所环绕的形状。（shape-outside）
   *
   * 常用值：
   * - `none`：不使用自定义形状，行内内容按浮动元素的外边距盒环绕。
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-outside
   */
  shapeOutside?: StyleValue<
    | OpenValue<CSSProperties['shapeOutside']>
    | keyof CssWideKeywords
    | keyof ShapeOutsideKeywords
    | keyof CssShapeBox
    | keyof CssVisualBox
  >;
  /**
   * 向 SVG 渲染器提供图形绘制精度与速度的偏好。（shape-rendering）
   *
   * 常用值：
   * - `auto`：由浏览器权衡速度与精度，通常开启抗锯齿。
   * - `crispEdges`：优先边缘清晰，通常关闭抗锯齿，适合横平竖直的线条和像素风图形。
   * - `geometricPrecision`：优先几何精度，缩放时形状保持准确，不为速度牺牲平滑度。
   * - `optimizeSpeed`：优先渲染速度，可能关闭抗锯齿，换取更快的绘制。
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-rendering
   */
  shapeRendering?: StyleValue<KeywordValue<ShapeRenderingValues, CSSProperties['shapeRendering']>>;
  /**
   * 语音合成是否朗读元素内容（speak），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `auto`：旧版 CSS Speech 值：由元素是否被渲染（`display`、`visibility`）推导是否朗读。已废弃，浏览器基本不支持。
   * - `none`：语音合成不朗读该元素内容。已废弃，浏览器基本不支持。
   * - `normal`：语音合成以正常方式朗读该元素内容。已废弃，浏览器基本不支持。
   *
   * Baseline：尚未在所有主流浏览器可用。
   */
  speak?: StyleValue<KeywordValue<SpeakValues, CSSProperties['speak']>>;
  /**
   * 设置语音呈现时文字、数字和标点的朗读方式；使用前核对语音媒体支持。（speak-as）
   *
   * 常用值：
   * - `normal`：按所在语言的常规规则朗读文字、数字和标点。
   * - `spell-out`：逐字母拼读，适合缩写词、代码等。
   * - `digits`：数字逐位朗读，如 “123” 读成“一二三”而非“一百二十三”。
   * - `literal-punctuation`：把标点符号的名称读出来，如读出“逗号”。
   * - `no-punctuation`：不朗读标点，也不因标点产生停顿。
   *
   * 初始值 `auto`；继承；实验性；Baseline：尚未在所有主流浏览器可用。
   */
  speakAs?: StyleValue<
    OpenValue<CSSProperties['speakAs']> | keyof CssWideKeywords | keyof SpeakAsKeywords
  >;
  /**
   * @font-face 中字体文件的来源描述符（src），不是元素样式属性，写在 create 里无效。
   */
  src?: StyleValue<OpenValue<CSSProperties['src']> | keyof CssWideKeywords>;
  /**
   * 非标准键，不对应 CSS 属性；定位请用 insetInlineStart。（start）
   *
   * 数字值自动加 `px`。
   */
  start?: StyleValue<OpenValue<CSSProperties['start']> | keyof CssWideKeywords>;
  /**
   * 设置 SVG 图形轮廓的描边绘制方式。（stroke）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke
   */
  stroke?: StyleValue<
    | OpenValue<CSSProperties['stroke']>
    | keyof CssWideKeywords
    | keyof CssPaint
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置 SVG 描边虚线中线段与空隙的长度序列。（stroke-dasharray）
   *
   * 常用值：
   * - `none`：描边是连续的实线，不使用虚线。
   *
   * 初始值 `none`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-dasharray
   */
  strokeDasharray?: StyleValue<
    | OpenValue<CSSProperties['strokeDasharray']>
    | keyof CssWideKeywords
    | keyof StrokeDasharrayKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置 SVG 虚线描边相对于路径起点的偏移。（stroke-dashoffset）
   *
   * 数字值不加单位；初始值 `0`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-dashoffset
   */
  strokeDashoffset?: StyleValue<
    | OpenValue<CSSProperties['strokeDashoffset']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置开放 SVG 子路径端点的描边形状。（stroke-linecap）
   *
   * 常用值：
   * - `butt`：在端点处平直截断描边，不向外延伸。
   * - `round`：使用半圆端帽，向端点外延伸半个描边宽度。
   * - `square`：使用方形端帽，向端点外延伸半个描边宽度。
   *
   * 初始值 `butt`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-linecap
   */
  strokeLinecap?: StyleValue<KeywordValue<StrokeLinecapValues, CSSProperties['strokeLinecap']>>;
  /**
   * 设置 SVG 路径转角处描边的连接形状。（stroke-linejoin）
   *
   * 常用值：
   * - `bevel`：转角处削平成斜切面，形成平直的连接。
   * - `miter`：延长两条边的外缘形成尖角；尖角过长（超过 `stroke-miterlimit`）时回退为斜切。
   * - `round`：转角处用圆弧连接，圆弧半径为描边宽度的一半。
   *
   * 初始值 `miter`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-linejoin
   */
  strokeLinejoin?: StyleValue<KeywordValue<StrokeLinejoinValues, CSSProperties['strokeLinejoin']>>;
  /**
   * 限制尖角连接的延伸比例，超过阈值时改变连接形状。（stroke-miterlimit）
   *
   * 数字值不加单位；初始值 `4`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-miterlimit
   */
  strokeMiterlimit?: StyleValue<
    OpenValue<CSSProperties['strokeMiterlimit']> | keyof CssWideKeywords
  >;
  /**
   * 设置 SVG 描边的不透明度，不影响填充。（stroke-opacity）
   *
   * 数字值不加单位；初始值 `1`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-opacity
   */
  strokeOpacity?: StyleValue<
    | OpenValue<CSSProperties['strokeOpacity']>
    | keyof CssWideKeywords
    | keyof QualifiedOpacitiesTokens
  >;
  /**
   * 设置 SVG 描边宽度。（stroke-width）
   *
   * 数字值不加单位；初始值 `1px`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-width
   */
  strokeWidth?: StyleValue<
    | OpenValue<CSSProperties['strokeWidth']>
    | keyof CssWideKeywords
    | keyof StrokeWidthsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
  >;
  /**
   * 设置保留制表符时每个制表位的宽度。（tab-size）
   *
   * 数字值不加单位；初始值 `8`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/tab-size
   */
  tabSize?: StyleValue<
    | OpenValue<CSSProperties['tabSize']>
    | keyof CssWideKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置表格列宽采用自动还是固定布局算法。（table-layout）
   *
   * 常用值：
   * - `auto`：按所有单元格的内容计算列宽，需要读完整个表格才能布局，较慢但更贴合内容。
   * - `fixed`：列宽由表格宽度和第一行（或 `col`）决定，不看后续行内容；布局更快、更可预测，要求表格宽度不是 `auto`。
   *
   * 初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/table-layout
   */
  tableLayout?: StyleValue<KeywordValue<TableLayoutValues, CSSProperties['tableLayout']>>;
  /**
   * 设置块容器中行内内容的水平或逻辑方向对齐。（text-align）
   *
   * 控制块容器中的行内内容，不是块盒自身的位置，也不是 Flex/Grid 项目的对齐。
   *
   * 常用值：
   * - `start`：按当前书写方向的行内起始侧对齐。
   * - `end`：按当前书写方向的行内结束侧对齐。
   * - `center`：将行内内容在行盒中居中，不会让块盒自身居中。
   * - `justify`：调整行内间距使文字两端对齐；最后一行通常由 text-align-last 控制。
   *
   * 适用场景：正文、标题和表格单元格中的文本对齐。
   *
   * 初始值 `startOrNamelessValueIfLTRRightIfRTL`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-align
   */
  textAlign?: StyleValue<KeywordValue<TextAlignValues, CSSProperties['textAlign']>>;
  /**
   * 设置段落最后一行或强制换行前一行的对齐方式。（text-align-last）
   *
   * 常用值：
   * - `auto`：最后一行跟随 `text-align`；`text-align` 为 `justify` 时，最后一行按 `start` 对齐。
   * - `center`：最后一行在行盒中居中。
   * - `end`：最后一行按书写方向的行内结束侧对齐。
   * - `justify`：最后一行也两端对齐，拉伸到占满整行。
   * - `left`：最后一行靠物理左侧对齐。
   * - `right`：最后一行靠物理右侧对齐。
   * - `start`：最后一行按书写方向的行内起始侧对齐。
   *
   * 初始值 `auto`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-align-last
   */
  textAlignLast?: StyleValue<KeywordValue<TextAlignLastValues, CSSProperties['textAlignLast']>>;
  /**
   * 设置 SVG 文本片段相对于定位点的锚定方式。（text-anchor）
   *
   * 常用值：
   * - `end`：文本片段的终点位于锚点处，文字向锚点之前延伸。
   * - `middle`：文本片段的中点位于锚点处，文字向两侧均分延伸。
   * - `start`：文本片段的起点位于锚点处，文字沿书写方向向后延伸。
   *
   * 初始值 `start`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-anchor
   */
  textAnchor?: StyleValue<KeywordValue<TextAnchorValues, CSSProperties['textAnchor']>>;
  /**
   * 设置竖排文字中多个字符是否合成为一个横排字形单元。（text-combine-upright）
   *
   * 常用值：
   * - `none`：不组合，竖排中的字符按常规方向排布。
   * - `all`：把元素内的全部字符压缩成一个字符宽度的横排单元，常用于竖排中的短数字或缩写。
   * - `digits`：把连续数字（默认最多 2 位，可写 `digits 4`）组合成横排单元。
   *
   * 初始值 `none`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-combine-upright
   */
  textCombineUpright?: StyleValue<
    | OpenValue<CSSProperties['textCombineUpright']>
    | keyof CssWideKeywords
    | keyof TextCombineUprightKeywords
  >;
  /**
   * 集中设置文本装饰线的位置、线型、颜色及粗细。（text-decoration）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration
   */
  textDecoration?: StyleValue<
    | OpenValue<CSSProperties['textDecoration']>
    | keyof CssWideKeywords
    | keyof TextDecorationLineKeywords
    | keyof TextDecorationStyleKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof TextDecorationThicknessKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置文本装饰线颜色。（text-decoration-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-color
   */
  textDecorationColor?: StyleValue<
    | OpenValue<CSSProperties['textDecorationColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置下划线、上划线或删除线等装饰线位置。（text-decoration-line）
   *
   * 常用值：
   * - `none`：不绘制任何装饰线，常用于去掉链接默认的下划线。
   * - `underline`：在文字下方绘制下划线。
   * - `overline`：在文字上方绘制上划线。
   * - `line-through`：在文字中部绘制删除线。
   * - `blink`：让文字闪烁。规范允许不实现，现代浏览器基本不支持，不要使用。
   * - `spelling-error`：以浏览器对拼写错误的标记样式（通常是红色波浪线）绘制装饰线，不能与其他线型组合；较新，支持有限。
   * - `grammar-error`：以浏览器对语法错误的标记样式（通常是绿色波浪线）绘制装饰线，不能与其他线型组合；较新，支持有限。
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-line
   */
  textDecorationLine?: StyleValue<
    | OpenValue<CSSProperties['textDecorationLine']>
    | keyof CssWideKeywords
    | keyof TextDecorationLineKeywords
  >;
  /**
   * 设置文本装饰线跳过哪些内容；具体语法需核对支持情况。（text-decoration-skip）
   *
   * 常用值：
   * - `none`：装饰线不跳过任何内容，从头到尾连续绘制。
   * - `objects`：跳过图片、行内块等原子行内元素。
   * - `spaces`：跳过空白（单词间距、字间距）。
   * - `leading-spaces`：只跳过行首的空白。
   * - `trailing-spaces`：只跳过行尾的空白。
   * - `edges`：装饰线两端略向内缩，避免相邻元素的装饰线连成一条。
   * - `box-decoration`：跳过行内盒的内边距、边框和外边距所在的位置。
   *
   * 初始值 `objects`；继承；实验性。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-skip
   */
  textDecorationSkip?: StyleValue<
    | OpenValue<CSSProperties['textDecorationSkip']>
    | keyof CssWideKeywords
    | keyof TextDecorationSkipKeywords
  >;
  /**
   * 设置装饰线是否避让字形的笔画。（text-decoration-skip-ink）
   *
   * 常用值：
   * - `all`：装饰线遇到字形笔画（如 g、p 的下伸部分）时总是断开，不论文字语言。
   * - `auto`：由浏览器决定：通常在笔画穿过装饰线处断开，对中日韩等文字可能不断开。
   * - `none`：装饰线连续绘制，直接穿过字形。
   *
   * 初始值 `auto`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-skip-ink
   */
  textDecorationSkipInk?: StyleValue<
    KeywordValue<TextDecorationSkipInkValues, CSSProperties['textDecorationSkipInk']>
  >;
  /**
   * 设置文本装饰线的实线、波浪线等线型。（text-decoration-style）
   *
   * 常用值：
   * - `solid`：实线。
   * - `double`：双线，两条平行的线。
   * - `dotted`：点线。
   * - `dashed`：虚线。
   * - `wavy`：波浪线，常用来表示拼写错误。
   *
   * 初始值 `solid`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-style
   */
  textDecorationStyle?: StyleValue<
    KeywordValue<TextDecorationStyleValues, CSSProperties['textDecorationStyle']>
  >;
  /**
   * 设置文本装饰线粗细。（text-decoration-thickness）
   *
   * 常用值：
   * - `auto`：由浏览器决定装饰线粗细，通常取字体建议值或按字号推算。
   * - `from-font`：使用字体文件中指定的装饰线粗细；字体没有提供时回退为 `auto`。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-thickness
   */
  textDecorationThickness?: StyleValue<
    | OpenValue<CSSProperties['textDecorationThickness']>
    | keyof CssWideKeywords
    | keyof TextDecorationThicknessKeywords
    | keyof BorderWidthsTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 同时设置文字着重号的样式和颜色。（text-emphasis）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis
   */
  textEmphasis?: StyleValue<
    | OpenValue<CSSProperties['textEmphasis']>
    | keyof CssWideKeywords
    | keyof TextEmphasisStyleKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置文字着重号颜色。（text-emphasis-color）
   *
   * 初始值 `currentcolor`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-color
   */
  textEmphasisColor?: StyleValue<
    | OpenValue<CSSProperties['textEmphasisColor']>
    | keyof CssWideKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof ColorsTokens
    | keyof QualifiedColorsTokens
  >;
  /**
   * 设置文字着重号位于文字的哪一侧。（text-emphasis-position）
   *
   * 常用值：
   * - `auto`：由浏览器按书写模式和语言选择着重号位置。
   * - `over`：横排时着重号在文字上方；竖排时与 `right`、`left` 组合确定侧边。
   * - `under`：横排时着重号在文字下方；竖排时与 `right`、`left` 组合确定侧边。
   * - `right`：竖排时着重号在文字右侧，与 `over`、`under` 组合使用。
   * - `left`：竖排时着重号在文字左侧，与 `over`、`under` 组合使用。
   *
   * 初始值 `auto`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-position
   */
  textEmphasisPosition?: StyleValue<
    | OpenValue<CSSProperties['textEmphasisPosition']>
    | keyof CssWideKeywords
    | keyof TextEmphasisPositionKeywords
  >;
  /**
   * 设置文字着重号的形状和填充方式。（text-emphasis-style）
   *
   * 常用值：
   * - `none`：不显示着重号。
   * - `filled`：实心着重号；只写 `filled` 不写形状时，横排默认 `dot`，竖排默认 `sesame`。
   * - `open`：空心着重号；只写 `open` 不写形状时，横排默认 `dot`，竖排默认 `sesame`。
   * - `dot`：小圆点形状的着重号，实心为 •，空心为 ◦。
   * - `circle`：大圆形状的着重号，实心为 ●，空心为 ○。
   * - `double-circle`：双圈形状的着重号，实心为 ◉，空心为 ◎。
   * - `triangle`：三角形形状的着重号，实心为 ▲，空心为 △。
   * - `sesame`：芝麻点形状的着重号，形似逗号，常用于日文竖排。
   *
   * 初始值 `none`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-style
   */
  textEmphasisStyle?: StyleValue<
    | OpenValue<CSSProperties['textEmphasisStyle']>
    | keyof CssWideKeywords
    | keyof TextEmphasisStyleKeywords
  >;
  /**
   * 设置文本行的缩进距离。（text-indent）
   *
   * 常用值：
   * - `hanging`：反转缩进：首行不缩进，其余各行缩进，形成悬挂缩进。
   * - `each-line`：缩进不仅作用于块的首行，也作用于每个强制换行之后的行。
   *
   * 数字值自动加 `px`；初始值 `0`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-indent
   */
  textIndent?: StyleValue<
    | OpenValue<CSSProperties['textIndent']>
    | keyof CssWideKeywords
    | keyof TextIndentKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置两端对齐时增加间距的算法。（text-justify）
   *
   * 常用值：
   * - `auto`：由浏览器选择两端对齐算法，在速度与效果之间取舍。
   * - `distribute`：已废弃，等同 `inter-character`，改用 `inter-character`。
   * - `inter-character`：把多余空间分配到字符之间，适合不靠空格分词的中日文。
   * - `inter-word`：只在单词（空格）之间分配多余空间，适合英文等以空格分词的文字。
   * - `none`：禁用两端对齐，即使 `text-align: justify` 也不拉伸间距。
   *
   * 初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-justify
   */
  textJustify?: StyleValue<KeywordValue<TextJustifyValues, CSSProperties['textJustify']>>;
  /**
   * 设置竖排模式下字符的方向。（text-orientation）
   *
   * 常用值：
   * - `mixed`：竖排中拉丁字母等横排文字顺时针旋转 90° 躺倒，全角字符保持直立。
   * - `sideways`：所有字符都顺时针旋转 90° 躺倒，如同把横排文字整体旋转。
   * - `upright`：所有字符都保持直立，包括拉丁字母，逐字自上而下排列。
   *
   * 初始值 `mixed`；继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-orientation
   */
  textOrientation?: StyleValue<
    KeywordValue<TextOrientationValues, CSSProperties['textOrientation']>
  >;
  /**
   * 设置被裁剪的行内溢出文本如何提示，例如显示省略号。（text-overflow）
   *
   * 本属性不自行制造溢出。单行省略通常还需要受限宽度、overflow:hidden 和 white-space:nowrap。
   *
   * 常用值：
   * - `ellipsis`：用省略号提示被裁剪的行内溢出；还需要限制尺寸并配置溢出规则。不会自动限制宽度、禁用换行或实现多行省略。Flex/Grid 子项还可能需要 min-width:0。
   * - `clip`：直接裁剪溢出文本，不添加省略标记。
   *
   * 适用场景：受限宽度中的单行标题或标签。多行截断需要单独的布局和截行方案。
   *
   * 初始值 `clip`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-overflow
   */
  textOverflow?: StyleValue<
    OpenValue<CSSProperties['textOverflow']> | keyof CssWideKeywords | keyof TextOverflowKeywords
  >;
  /**
   * 向渲染器提供文本速度、可读性或几何精度的偏好。（text-rendering）
   *
   * 常用值：
   * - `auto`：由浏览器自行权衡速度、可读性和精度，各引擎的策略不同。
   * - `geometricPrecision`：优先几何精度，缩放时字形与间距更准确，可能增加渲染开销。
   * - `optimizeLegibility`：优先可读性，启用字距调整、连字等排版特性，可能牺牲速度。
   * - `optimizeSpeed`：优先渲染速度，可能关闭字距调整和连字。
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-rendering
   */
  textRendering?: StyleValue<KeywordValue<TextRenderingValues, CSSProperties['textRendering']>>;
  /**
   * 设置文字及其装饰的阴影，可叠加多层。（text-shadow）
   *
   * 常用值：
   * - `none`：不添加文字阴影。
   *
   * 初始值 `none`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-shadow
   */
  textShadow?: StyleValue<
    | OpenValue<CSSProperties['textShadow']>
    | keyof CssWideKeywords
    | keyof TextShadowKeywords
    | keyof CssColor
    | keyof CssColorBase
    | keyof CssNamedColor
    | keyof CssSystemColor
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
    | keyof QualifiedColorsTokens
    | keyof QualifiedShadowsTokens
  >;
  /**
   * 控制移动浏览器为提升可读性而进行的文字自动放大。（text-size-adjust）
   *
   * 常用值：
   * - `none`：禁止浏览器自动调整文字大小。
   * - `auto`：允许浏览器按其算法自动放大文字，常见于移动端未适配视口的页面。
   *
   * 初始值 `autoForSmartphoneBrowsersSupportingInflation`；继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-size-adjust
   */
  textSizeAdjust?: StyleValue<
    | OpenValue<CSSProperties['textSizeAdjust']>
    | keyof CssWideKeywords
    | keyof TextSizeAdjustKeywords
  >;
  /**
   * 设置文字显示时的大小写、全角或其他字形转换。（text-transform）
   *
   * 常用值：
   * - `capitalize`：把每个单词的首字母转为大写，其余字母不变；具体规则随语言而定。
   * - `full-width`：把字符转为全角形式，使半角字符与东亚字符等宽排列。
   * - `lowercase`：把所有字母转为小写。
   * - `none`：不转换大小写，按原文显示。
   * - `uppercase`：把所有字母转为大写。
   *
   * 初始值 `none`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-transform
   */
  textTransform?: StyleValue<KeywordValue<TextTransformValues, CSSProperties['textTransform']>>;
  /**
   * 设置下划线相对于默认位置的偏移。（text-underline-offset）
   *
   * 常用值：
   * - `auto`：由浏览器决定下划线与默认位置的偏移，通常依字体指标确定。
   *
   * 数字值自动加 `px`；初始值 `auto`；继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-underline-offset
   */
  textUnderlineOffset?: StyleValue<
    | OpenValue<CSSProperties['textUnderlineOffset']>
    | keyof CssWideKeywords
    | keyof TextUnderlineOffsetKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置下划线相对于文字基线或竖排文字的放置方式。（text-underline-position）
   *
   * 常用值：
   * - `auto`：由浏览器选择下划线位置，通常靠近基线。
   * - `from-font`：使用字体提供的下划线位置；字体没有提供时回退为 `auto`。
   * - `under`：下划线放在文字下缘之下，避免穿过下伸部分。
   * - `left`：竖排时下划线位于文字左侧，横排时无效。
   * - `right`：竖排时下划线位于文字右侧，横排时无效。
   *
   * 初始值 `auto`；继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-underline-position
   */
  textUnderlinePosition?: StyleValue<
    | OpenValue<CSSProperties['textUnderlinePosition']>
    | keyof CssWideKeywords
    | keyof TextUnderlinePositionKeywords
  >;
  /**
   * 同时设置文本是否换行及换行策略。（text-wrap）
   *
   * 常用值：
   * - `wrap`：允许软换行。
   * - `nowrap`：禁止软换行，但不取消显式强制换行。
   * - `balance`：尝试让各行长度更均衡，常用于标题；可处理行数由浏览器决定。
   * - `pretty`：使用偏向排版质量的换行策略，例如减少末行孤立短词。
   * - `stable`：编辑时尽量不改变较早行的换行位置。
   *
   * 初始值 `wrap`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-wrap
   */
  textWrap?: StyleValue<KeywordValue<TextWrapValues, CSSProperties['textWrap']>>;
  /**
   * 扩大命名动画时间线的可引用作用域。（timeline-scope）
   *
   * 常用值：
   * - `none`：不扩大任何时间线名称的作用域，名称只在声明它的元素子树内可引用。
   *
   * 初始值 `none`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-scope
   */
  timelineScope?: StyleValue<
    OpenValue<CSSProperties['timelineScope']> | keyof CssWideKeywords | keyof TimelineScopeKeywords
  >;
  /**
   * 设置定位元素相对于其定位参照的上侧偏移。（top）
   *
   * 常用值：
   * - `auto`：不指定该侧偏移：绝对定位时位置由对侧偏移、元素尺寸或静态位置决定，相对定位时按 0 处理。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/top
   */
  top?: StyleValue<
    | OpenValue<CSSProperties['top']>
    | keyof CssWideKeywords
    | keyof TopKeywords
    | keyof SpaceTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 声明浏览器可以处理的触摸平移与缩放手势。（touch-action）
   *
   * 描述浏览器可接管的触摸手势，手势开始后再修改通常不会改变当前手势的处理。
   *
   * 常用值：
   * - `manipulation`：允许平移和连续缩放，通常禁用双击缩放等额外手势。
   * - `pan-x`：允许浏览器处理水平单指平移。
   * - `pan-y`：允许浏览器处理垂直单指平移。
   * - `none`：禁用浏览器在该区域处理的平移和缩放手势，可能影响用户缩放可访问性。
   *
   * 适用场景：拖拽控件与页面滚动之间分配触摸方向；保留用户所需的缩放能力。
   *
   * 初始值 `auto`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/touch-action
   */
  touchAction?: StyleValue<
    OpenValue<CSSProperties['touchAction']> | keyof CssWideKeywords | keyof TouchActionKeywords
  >;
  /**
   * 按顺序组合平移、旋转、缩放等二维或三维变换。（transform）
   *
   * 多个变换的顺序会影响结果。变换通常不改变元素在普通文档流中预留的尺寸。
   *
   * 常用值：
   * - `none`：不应用任何变换。
   *
   * 适用场景：平移、旋转和缩放的视觉效果；需要改变普通流占位时应调整布局属性。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform
   */
  transform?: StyleValue<
    OpenValue<CSSProperties['transform']> | keyof CssWideKeywords | keyof TransformKeywords
  >;
  /**
   * 设置变换及其原点所依据的参照盒。（transform-box）
   *
   * 常用值：
   * - `border-box`：以边框盒为参照盒；没有 CSS 盒的 SVG 元素按 `stroke-box` 处理。
   * - `fill-box`：以 SVG 元素对象的包围盒为参照盒，不含描边。
   * - `view-box`：以最近的 SVG 视口的 `viewBox` 为参照盒。
   *
   * 初始值 `view-box`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-box
   */
  transformBox?: StyleValue<KeywordValue<TransformBoxValues, CSSProperties['transformBox']>>;
  /**
   * 设置元素变换的原点。（transform-origin）
   *
   * 常用值：
   * - `left`：水平方向取左边缘，相当于 0%。
   * - `center`：取中心位置，相当于 50%；也是水平和垂直方向的默认值。
   * - `right`：水平方向取右边缘，相当于 100%。
   * - `top`：垂直方向取上边缘，相当于 0%。
   * - `bottom`：垂直方向取下边缘，相当于 100%。
   *
   * 数字值自动加 `px`；初始值 `50% 50% 0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-origin
   */
  transformOrigin?: StyleValue<
    | OpenValue<CSSProperties['transformOrigin']>
    | keyof CssWideKeywords
    | keyof TransformOriginKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 控制子元素的三维位置保留在三维空间还是展平。（transform-style）
   *
   * 常用值：
   * - `flat`：子元素被压平到该元素所在的平面，不保留各自的三维位置，是初始值。
   * - `preserve-3d`：子元素保留自身的三维位置，与该元素共处同一个三维空间，可以前后穿插和遮挡。
   *
   * 初始值 `flat`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-style
   */
  transformStyle?: StyleValue<KeywordValue<TransformStyleValues, CSSProperties['transformStyle']>>;
  /**
   * 独立设置元素旋转，不必重写 transform 中的其他变换。（rotate）
   *
   * 常用值：
   * - `none`：不做独立旋转，初始值，不影响 `transform` 里的旋转。
   * - `x`：绕 X 轴做三维旋转，须配合角度，如 `x 45deg`。
   * - `y`：绕 Y 轴做三维旋转，须配合角度，如 `y 45deg`。
   * - `z`：绕 Z 轴（垂直于屏幕）旋转，效果等同二维旋转，`z 45deg` 与 `45deg` 相同。
   *
   * 数字值不加单位；初始值 `none`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/rotate
   */
  rotate?: StyleValue<
    OpenValue<CSSProperties['rotate']> | keyof CssWideKeywords | keyof RotateKeywords
  >;
  /**
   * 独立设置元素的缩放比例。（scale）
   *
   * 常用值：
   * - `none`：不做独立缩放，等同缩放比例 1，不影响 `transform` 里的缩放。
   *
   * 数字值不加单位；初始值 `none`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scale
   */
  scale?: StyleValue<
    OpenValue<CSSProperties['scale']> | keyof CssWideKeywords | keyof ScaleKeywords
  >;
  /**
   * 独立设置元素在二维或三维空间中的平移。（translate）
   *
   * 常用值：
   * - `none`：不应用平移，元素停留在原位。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/translate
   */
  translate?: StyleValue<
    | OpenValue<CSSProperties['translate']>
    | keyof CssWideKeywords
    | keyof TranslateKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 集中设置属性变化过渡的目标、时长、缓动、延迟和行为。（transition）
   *
   * 只对属性变化创建过渡；不会自动触发变化。建议明确列出目标属性，避免 all 意外过渡布局变化。
   *
   * 适用场景：悬停、选中和展开状态之间的平滑变化。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition
   */
  transition?: StyleValue<
    | OpenValue<CSSProperties['transition']>
    | keyof CssWideKeywords
    | keyof CssSingleTransition
    | keyof CssSingleTransitionProperty
    | keyof CssLinearEasingFunction
    | keyof CssCubicBezierEasingFunction
    | keyof CssStepEasingFunction
    | keyof CssTransitionBehaviorValue
    | keyof QualifiedDurationsTokens
    | keyof QualifiedEasingsTokens
  >;
  /**
   * 设置属性变化后开始过渡的延迟。（transition-delay）
   *
   * 初始值 `0s`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-delay
   */
  transitionDelay?: StyleValue<
    | OpenValue<CSSProperties['transitionDelay']>
    | keyof CssWideKeywords
    | keyof DurationsTokens
    | keyof QualifiedDurationsTokens
  >;
  /**
   * 设置过渡从开始到完成的时长。（transition-duration）
   *
   * 初始值 `0s`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-duration
   */
  transitionDuration?: StyleValue<
    | OpenValue<CSSProperties['transitionDuration']>
    | keyof CssWideKeywords
    | keyof DurationsTokens
    | keyof QualifiedDurationsTokens
  >;
  /**
   * 指定发生变化时需要过渡的 CSS 属性。（transition-property）
   *
   * 常用值：
   * - `none`：不对任何属性做过渡，属性变化立即生效。
   *
   * 初始值 `all`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-property
   */
  transitionProperty?: StyleValue<
    | OpenValue<CSSProperties['transitionProperty']>
    | keyof CssWideKeywords
    | keyof TransitionPropertyKeywords
    | keyof CssSingleTransitionProperty
  >;
  /**
   * 设置过渡进度变化的缓动函数。（transition-timing-function）
   *
   * 初始值 `ease`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-timing-function
   */
  transitionTimingFunction?: StyleValue<
    | OpenValue<CSSProperties['transitionTimingFunction']>
    | keyof CssWideKeywords
    | keyof CssLinearEasingFunction
    | keyof CssCubicBezierEasingFunction
    | keyof CssStepEasingFunction
    | keyof EasingsTokens
    | keyof QualifiedEasingsTokens
  >;
  /**
   * 设置元素如何参与 Unicode 双向文本算法，通常与 direction 配合。（unicode-bidi）
   *
   * 常用值：
   * - `bidi-override`：覆盖双向算法，行内内容严格按 `direction` 的方向逐字排列，不再按字符本身的方向重排。
   * - `embed`：开启一层新的嵌入，嵌入方向由 `direction` 决定，内部文本仍与外部文本一起参与重排。
   * - `isolate`：将元素作为隔离单元，内部的双向重排与外部互不影响，常用于包裹用户生成的内容。
   * - `isolate-override`：同时具备 `isolate` 的隔离与 `bidi-override` 的强制方向效果。
   * - `normal`：不引入额外的嵌入层级，按双向算法的默认隐式规则处理。
   * - `plaintext`：忽略 `direction`，按元素内第一个具有强方向的字符自动判定方向，并作隔离处理。
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/unicode-bidi
   */
  unicodeBidi?: StyleValue<KeywordValue<UnicodeBidiValues, CSSProperties['unicodeBidi']>>;
  /**
   * @font-face 中字体适用的字符范围描述符（unicode-range），不是元素样式属性。
   */
  unicodeRange?: StyleValue<OpenValue<CSSProperties['unicodeRange']> | keyof CssWideKeywords>;
  /**
   * 设置用户是否可以选取元素中的文本。（user-select）
   *
   * 常用值：
   * - `auto`：由父级与元素上下文决定使用的选取行为。
   * - `text`：允许文本选取。
   * - `none`：阻止常规文本选取，不是内容保护或访问控制。
   * - `all`：将元素内容作为整体选取单元。
   *
   * 适用场景：调整拖拽控件中的文本选取，或让代码片段整段选中。
   *
   * 初始值 `auto`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/user-select
   */
  userSelect?: StyleValue<KeywordValue<UserSelectValues, CSSProperties['userSelect']>>;
  /**
   * 设置行内级盒子或表格单元格的垂直对齐，不用于普通块盒居中。（vertical-align）
   *
   * 常用值：
   * - `baseline`：元素基线与父级基线对齐，是默认行为；没有基线的盒子用下边缘对齐。
   * - `sub`：按下标位置对齐，元素基线相对父级基线下降。
   * - `super`：按上标位置对齐，元素基线相对父级基线上升。
   * - `text-top`：元素顶部与父元素字体的顶部对齐。
   * - `text-bottom`：元素底部与父元素字体的底部对齐。
   * - `middle`：元素的垂直中点与父级基线上方半个 x 高度处对齐，近似文字中线。
   * - `top`：元素顶部与所在行盒的顶部对齐；在表格单元格里则让内容贴紧单元格顶部。
   * - `bottom`：元素底部与所在行盒的底部对齐；在表格单元格里则让内容贴紧单元格底部。
   *
   * 数字值自动加 `px`；初始值 `baseline`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/vertical-align
   */
  verticalAlign?: StyleValue<
    | OpenValue<CSSProperties['verticalAlign']>
    | keyof CssWideKeywords
    | keyof VerticalAlignKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 同时声明基于元素可见进度的时间线名称与轴。（view-timeline）
   *
   * 简写属性，初始值见各分项；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline
   */
  viewTimeline?: StyleValue<
    | OpenValue<CSSProperties['viewTimeline']>
    | keyof CssWideKeywords
    | keyof ViewTimelineNameKeywords
    | keyof ViewTimelineAxisKeywords
    | keyof ViewTimelineInsetKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置可见进度时间线所观察的滚动轴。（view-timeline-axis）
   *
   * 常用值：
   * - `block`：沿块轴方向滚动，即书写模式中块堆叠的方向，横排文字下是纵向。
   * - `inline`：沿行内轴方向滚动，即文字流动的方向，横排文字下是横向。
   * - `x`：沿水平方向的滚动轴，与书写模式无关。
   * - `y`：沿垂直方向的滚动轴，与书写模式无关。
   *
   * 初始值 `block`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-axis
   */
  viewTimelineAxis?: StyleValue<
    KeywordValue<ViewTimelineAxisValues, CSSProperties['viewTimelineAxis']>
  >;
  /**
   * 声明基于元素进入和离开滚动视口的时间线名称。（view-timeline-name）
   *
   * 常用值：
   * - `none`：不创建具名的可见进度时间线，其他元素也无法通过名字引用它。
   *
   * 初始值 `none`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-name
   */
  viewTimelineName?: StyleValue<
    | OpenValue<CSSProperties['viewTimelineName']>
    | keyof CssWideKeywords
    | keyof ViewTimelineNameKeywords
  >;
  /**
   * 设置可见进度时间线使用的滚动视口内缩范围。（view-timeline-inset）
   *
   * 常用值：
   * - `auto`：不额外内缩，使用滚动容器对应方向的 `scroll-padding` 作为可见范围的边界。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-inset
   */
  viewTimelineInset?: StyleValue<
    | OpenValue<CSSProperties['viewTimelineInset']>
    | keyof CssWideKeywords
    | keyof ViewTimelineInsetKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 为视图过渡中的元素命名，以匹配前后状态的快照。（view-transition-name）
   *
   * 常用值：
   * - `none`：元素不单独参与视图过渡，随所在内容一起被截取到根快照里。
   * - `match-element`：由浏览器按元素自身标识自动生成唯一名称，无需手写名称即可让该元素单独参与视图过渡。
   *
   * 初始值 `none`；不继承；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-transition-name
   */
  viewTransitionName?: StyleValue<
    | OpenValue<CSSProperties['viewTransitionName']>
    | keyof CssWideKeywords
    | keyof ViewTransitionNameKeywords
  >;
  /**
   * 设置元素是否可见；隐藏通常保留布局空间。（visibility）
   *
   * 常用值：
   * - `visible`：正常显示元素。
   * - `hidden`：隐藏绘制但通常保留布局空间；后代可显式恢复 visible。display:none 不保留布局盒；opacity:0 不会以相同方式移除交互和可访问性。
   * - `collapse`：对表格行列等特定布局有折叠语义，其他场景通常类似 hidden；应核对具体布局行为。
   *
   * 适用场景：需要隐藏内容但通常保留其布局占位的场景。
   *
   * 初始值 `visible`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/visibility
   */
  visibility?: StyleValue<KeywordValue<VisibilityValues, CSSProperties['visibility']>>;
  /**
   * 语音合成的左右声道平衡（voice-balance），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `center`：声音在左右声道间居中，是默认值。
   * - `left`：声音完全放在左声道。
   * - `leftwards`：在继承值的基础上把声音向左移动一段，具体幅度由实现决定。
   * - `right`：声音完全放在右声道。
   * - `rightwards`：在继承值的基础上把声音向右移动一段，具体幅度由实现决定。
   *
   * 数字值自动加 `px`。
   */
  voiceBalance?: StyleValue<KeywordValue<VoiceBalanceValues, CSSProperties['voiceBalance']>>;
  /**
   * 语音合成朗读元素内容的时长（voice-duration），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceDuration?: StyleValue<OpenValue<CSSProperties['voiceDuration']> | keyof CssWideKeywords>;
  /**
   * 语音合成使用的声音（voice-family），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceFamily?: StyleValue<OpenValue<CSSProperties['voiceFamily']> | keyof CssWideKeywords>;
  /**
   * 语音合成的音高（voice-pitch），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  voicePitch?: StyleValue<OpenValue<CSSProperties['voicePitch']> | keyof CssWideKeywords>;
  /**
   * 语音合成的音高变化范围（voice-range），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  voiceRange?: StyleValue<OpenValue<CSSProperties['voiceRange']> | keyof CssWideKeywords>;
  /**
   * 语音合成的语速（voice-rate），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceRate?: StyleValue<OpenValue<CSSProperties['voiceRate']> | keyof CssWideKeywords>;
  /**
   * 语音合成的重音强度（voice-stress），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 常用值：
   * - `moderate`：使用比默认更强、但弱于 `strong` 的重音强调。
   * - `none`：不做任何重音强调，语音合成器按平铺方式朗读。
   * - `normal`：使用默认的重音强度。
   * - `reduced`：重音强度比默认更弱，朗读起伏更平缓。
   * - `strong`：加强重音强调，朗读时更突出重读的词。
   */
  voiceStress?: StyleValue<KeywordValue<VoiceStressValues, CSSProperties['voiceStress']>>;
  /**
   * 语音合成的音量（voice-volume），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceVolume?: StyleValue<OpenValue<CSSProperties['voiceVolume']> | keyof CssWideKeywords>;
  /**
   * 设置空白折叠和换行处理方式。（white-space）
   *
   * 同时影响空白折叠和软换行。它不负责给溢出内容添加省略号。
   *
   * 常用值：
   * - `normal`：折叠连续空白和源换行，允许软换行。
   * - `nowrap`：折叠空白并禁止软换行；不会自行生成省略号。pre 也不进行普通软换行，但会保留连续空白。
   * - `pre`：保留空白和源换行，不进行普通软换行。
   * - `pre-wrap`：保留空白和源换行，同时允许软换行。pre 不进行普通软换行；pre-line 会折叠连续空格。
   * - `pre-line`：折叠空格等空白但保留源换行，同时允许软换行。
   *
   * 适用场景：单行标签、保留换行的用户文本和代码片段。
   *
   * 初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/white-space
   */
  whiteSpace?: StyleValue<KeywordValue<WhiteSpaceValues, CSSProperties['whiteSpace']>>;
  /**
   * 设置分页或分栏断点后需保留的最少行数。（widows）
   *
   * 数字值不加单位；初始值 `2`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/widows
   */
  widows?: StyleValue<OpenValue<CSSProperties['widows']> | keyof CssWideKeywords>;
  /**
   * 设置元素的物理宽度，盒子范围受 box-sizing 影响。（width）
   *
   * 百分比依据包含块解析；auto、内部尺寸和最小/最大约束共同决定最终使用尺寸。
   *
   * 常用值：
   * - `auto`：让布局算法决定尺寸，不保证等于父元素尺寸。
   * - `min-content`：采用内容的最小内部尺寸，文字会考虑可用的软换行机会。
   * - `max-content`：采用内容的最大内部尺寸，通常不进行软换行。
   * - `fit-content`：在最小和最大内部尺寸之间按可用空间夹取尺寸。
   *
   * 适用场景：控制物理宽度；支持书写模式的布局可优先考虑 inline-size。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/width
   */
  width?: StyleValue<
    | OpenValue<CSSProperties['width']>
    | keyof CssWideKeywords
    | keyof WidthKeywords
    | keyof SizesTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedSpaceTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 提前告知浏览器可能发生变化的属性，便于准备优化资源。（will-change）
   *
   * 仅对即将发生的变化短期使用；长期或大量声明可能占用额外资源，并提前改变层叠上下文。
   *
   * 常用值：
   * - `auto`：不提前告知任何即将变化的属性，由浏览器按常规方式处理，是默认值。
   *
   * 初始值 `auto`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/will-change
   */
  willChange?: StyleValue<
    | OpenValue<CSSProperties['willChange']>
    | keyof CssWideKeywords
    | keyof WillChangeKeywords
    | keyof CssAnimateableFeature
  >;
  /**
   * 设置单词内部或文字之间的断行规则。（word-break）
   *
   * 按字符和语言控制断行。仅需避免超长单词溢出时，通常先考虑 overflow-wrap。
   *
   * 常用值：
   * - `normal`：按语言的默认断行规则处理。
   * - `break-all`：允许在更多字符间断行以防溢出，可能拆开普通单词。
   * - `keep-all`：限制中日韩文字内部断行，其他文字仍按正常规则处理。
   *
   * 初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/word-break
   */
  wordBreak?: StyleValue<KeywordValue<WordBreakValues, CSSProperties['wordBreak']>>;
  /**
   * 设置单词或词间分隔符的额外间距。（word-spacing）
   *
   * 常用值：
   * - `normal`：不额外增加词间距，使用字体自身的间距，计算值为 0。
   *
   * 数字值自动加 `px`；初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/word-spacing
   */
  wordSpacing?: StyleValue<
    | OpenValue<CSSProperties['wordSpacing']>
    | keyof CssWideKeywords
    | keyof WordSpacingKeywords
    | keyof QualifiedSpaceTokens
    | keyof QualifiedSizesTokens
    | keyof QualifiedBorderWidthsTokens
    | keyof QualifiedRadiiTokens
    | keyof QualifiedFontSizesTokens
    | keyof QualifiedLetterSpacingsTokens
    | keyof QualifiedStrokeWidthsTokens
  >;
  /**
   * 设置长文本的额外换行行为；是 overflow-wrap 的兼容名称。（word-wrap）
   *
   * 常用值：
   * - `break-word`：没有其他断行机会时，允许在单词内部任意位置折断，防止长单词溢出容器。
   * - `normal`：只在正常断点处换行，过长的单词会溢出容器。
   *
   * 初始值 `normal`；继承。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-wrap
   */
  wordWrap?: StyleValue<KeywordValue<WordWrapValues, CSSProperties['wordWrap']>>;
  /**
   * 设置水平或竖直书写模式，以及行和块的推进方向。（writing-mode）
   *
   * 常用值：
   * - `horizontal-tb`：文字水平排列，行从上到下堆叠，是大多数语言的默认模式。
   * - `lr`：SVG 1.1 旧值，按 `horizontal-tb` 处理；已废弃，改用 `horizontal-tb`。
   * - `lr-tb`：SVG 1.1 旧值，水平从左到右、行从上到下，按 `horizontal-tb` 处理；已废弃，改用 `horizontal-tb`。
   * - `rl`：SVG 1.1 旧值，按 `horizontal-tb` 处理；已废弃，改用 `horizontal-tb` 搭配 `direction`。
   * - `rl-tb`：SVG 1.1 旧值，水平从右到左、行从上到下，按 `horizontal-tb` 处理；已废弃，改用 `horizontal-tb` 搭配 `direction`。
   * - `sideways-lr`：文字整体逆时针旋转 90° 竖排，行从左到右堆叠，适合侧向标签。
   * - `sideways-rl`：文字整体顺时针旋转 90° 竖排，行从右到左堆叠。
   * - `tb`：SVG 1.1 旧值，按 `vertical-rl` 处理；已废弃，改用 `vertical-rl`。
   * - `tb-rl`：SVG 1.1 旧值，垂直排列、行从右到左，按 `vertical-rl` 处理；已废弃，改用 `vertical-rl`。
   * - `vertical-lr`：文字竖排，行从左到右堆叠，蒙古文用这种排法；字形朝向由 `text-orientation` 决定。
   * - `vertical-rl`：文字垂直排列，行从右到左堆叠，常用于中日韩文字竖排。
   *
   * 初始值 `horizontal-tb`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/writing-mode
   */
  writingMode?: StyleValue<KeywordValue<WritingModeValues, CSSProperties['writingMode']>>;
  /**
   * 设置元素在所属层叠上下文中的层叠级别。（z-index）
   *
   * 数值只在所属层叠上下文内比较；更大的数值不保证盖过其他层叠上下文。Flex/Grid 项目也可以使用 z-index。
   *
   * 常用值：
   * - `auto`：层叠级别与父级相同（视为 0），且不会因此创建新的层叠上下文。
   *
   * 适用场景：控制同一层叠上下文中的浮层顺序，排查遮挡时先确认祖先层叠上下文。
   *
   * 数字值不加单位；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/z-index
   */
  zIndex?: StyleValue<KeywordValue<ZIndexValues, CSSProperties['zIndex']>>;
  /**
   * 设置元素及其布局的缩放比例，与 transform:scale 的布局行为不同。（zoom）
   *
   * 常用值：
   * - `normal`：不额外缩放（等同 `1`），沿用祖先已有的缩放，是默认值。
   * - `reset`：把该元素的有效缩放重置为 1，忽略祖先 `zoom` 带来的缩放；浏览器支持有限。
   *
   * 数字值不加单位；初始值 `1`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/zoom
   */
  zoom?: StyleValue<OpenValue<CSSProperties['zoom']> | keyof CssWideKeywords | keyof ZoomKeywords>;
  /**
   * 伪元素 `::after`：在元素内容之后插入的生成内容，需要设置 content 才会显示。
   */
  '::after'?: DocumentedStyles;
  /**
   * 伪元素 `::backdrop`：全屏元素、模态 <dialog> 与 popover 背后的遮罩层。
   */
  '::backdrop'?: DocumentedStyles;
  /**
   * 伪元素 `::before`：在元素内容之前插入的生成内容，需要设置 content 才会显示。
   */
  '::before'?: DocumentedStyles;
  /**
   * 伪元素 `::cue`：WebVTT 字幕文本。
   */
  '::cue'?: DocumentedStyles;
  /**
   * 伪元素 `::cue-region`：WebVTT 字幕区域。
   */
  '::cue-region'?: DocumentedStyles;
  /**
   * 伪元素 `::first-letter`：块级元素第一行的首字母，用于首字下沉等排版。
   */
  '::first-letter'?: DocumentedStyles;
  /**
   * 伪元素 `::first-line`：块级元素的第一行文字。
   */
  '::first-line'?: DocumentedStyles;
  /**
   * 伪元素 `::file-selector-button`：<input type="file"> 中的选择文件按钮。
   */
  '::file-selector-button'?: DocumentedStyles;
  /**
   * 伪元素 `::grammar-error`：浏览器标记为语法错误的文字。
   */
  '::grammar-error'?: DocumentedStyles;
  /**
   * 伪元素 `::marker`：列表项的项目符号或编号。
   */
  '::marker'?: DocumentedStyles;
  /**
   * 伪元素 `::placeholder`：输入框中的占位文字。
   */
  '::placeholder'?: DocumentedStyles;
  /**
   * 伪元素 `::selection`：用户选中的文字。
   */
  '::selection'?: DocumentedStyles;
  /**
   * 伪元素 `::spelling-error`：浏览器标记为拼写错误的文字。
   */
  '::spelling-error'?: DocumentedStyles;
  /**
   * 伪元素 `::target-text`：通过文本片段链接（#:~:text=）滚动定位到的文字。
   */
  '::target-text'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-scrollbar`：WebKit 滚动条的整体，非标准；标准写法是 scrollbarWidth 与 scrollbarColor。
   */
  '::-webkit-scrollbar'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-scrollbar-button`：WebKit 滚动条的两端按钮，非标准；标准写法是 scrollbarWidth 与 scrollbarColor。
   */
  '::-webkit-scrollbar-button'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-scrollbar-thumb`：WebKit 滚动条的滑块，非标准；标准写法是 scrollbarWidth 与 scrollbarColor。
   */
  '::-webkit-scrollbar-thumb'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-scrollbar-track`：WebKit 滚动条的轨道，非标准；标准写法是 scrollbarWidth 与 scrollbarColor。
   */
  '::-webkit-scrollbar-track'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-scrollbar-track-piece`：WebKit 滚动条的轨道中未被滑块覆盖的部分，非标准；标准写法是 scrollbarWidth 与 scrollbarColor。
   */
  '::-webkit-scrollbar-track-piece'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-scrollbar-corner`：WebKit 滚动条的横竖滚动条交汇的角落，非标准；标准写法是 scrollbarWidth 与 scrollbarColor。
   */
  '::-webkit-scrollbar-corner'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-resizer`：可调整大小元素右下角的拖拽手柄（WebKit），非标准。
   */
  '::-webkit-resizer'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-search-decoration`：type="search" 输入框左侧的装饰（WebKit），非标准。
   */
  '::-webkit-search-decoration'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-search-cancel-button`：type="search" 输入框中的清除按钮（WebKit），非标准。
   */
  '::-webkit-search-cancel-button'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-search-results-button`：type="search" 输入框中的搜索结果按钮（WebKit），非标准。
   */
  '::-webkit-search-results-button'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-search-results-decoration`：type="search" 输入框中搜索结果的装饰（WebKit），非标准。
   */
  '::-webkit-search-results-decoration'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-slider-thumb`：type="range" 滑块的拖动手柄（WebKit），非标准；Firefox 对应 ::-moz-range-thumb。
   */
  '::-webkit-slider-thumb'?: DocumentedStyles;
  /**
   * 伪元素 `::-webkit-slider-runnable-track`：type="range" 滑块的轨道（WebKit），非标准；Firefox 对应 ::-moz-range-track。
   */
  '::-webkit-slider-runnable-track'?: DocumentedStyles;
  /**
   * 伪元素 `::-moz-range-thumb`：type="range" 滑块的拖动手柄（Firefox），非标准。
   */
  '::-moz-range-thumb'?: DocumentedStyles;
  /**
   * 伪元素 `::-moz-range-track`：type="range" 滑块的轨道（Firefox），非标准。
   */
  '::-moz-range-track'?: DocumentedStyles;
  /**
   * 伪元素 `::-moz-range-progress`：type="range" 滑块轨道中已滑过的部分（Firefox），非标准。
   */
  '::-moz-range-progress'?: DocumentedStyles;
  /**
   * 自定义属性（CSS 变量）：`'--vis-axis-grid-color': colors.borderMuted`，把第三方库的主题变量指到 tokens 上。
   */
  [customProperty: `--${string}`]: StyleValue<string | number> | undefined;
}

// 关键字说明：每段值语法一个接口（Css 开头），属性自己的关键字以 Keywords 结尾，只接受固定几个值的属性以 Values 结尾；
// 键上的注释在悬停取值时显示
interface AccentColorKeywords {
  /**
   * `auto`：使用浏览器或系统默认的强调色，通常跟随系统主题。
   */
  auto: unknown;
}

interface AlignContentKeywords {
  /**
   * `normal`：按布局模式取默认行为：Flex 和 Grid 容器中表现为 `stretch`，块布局中表现为 `start`。
   */
  normal: unknown;
}

interface AlignContentValues {
  /**
   * `baseline`：按首行文字的基线与同组其他项对齐；单独使用等同 `first baseline`。
   */
  baseline: unknown;
  /**
   * `center`：各项作为一个整体，在对齐方向上居中。
   */
  center: unknown;
  /**
   * `end`：各项贴向容器在该方向上的终止边，终止边由书写模式和方向决定。
   */
  end: unknown;
  /**
   * `first baseline`：按首条基线对齐：让容器第一行（或第一条轨道）的首基线与同一基线共享组中的其他元素对齐；无法对齐时回退为 `start`。
   */
  'first baseline': unknown;
  /**
   * `flex-end`：贴向 flex 轴的终点；在非 flex 容器中等同 `end`。
   */
  'flex-end': unknown;
  /**
   * `flex-start`：贴向 flex 轴的起点；在非 flex 容器中等同 `start`。
   */
  'flex-start': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `last baseline`：按末条基线对齐：让容器最后一行（或最后一条轨道）的末基线与同一基线共享组中的其他元素对齐；无法对齐时回退为 `end`。
   */
  'last baseline': unknown;
  /**
   * `normal`：按布局模式取默认行为：Flex 和 Grid 容器中表现为 `stretch`，块布局中表现为 `start`。
   */
  normal: unknown;
  /**
   * `safe center`：内容整体居中；若居中会使内容溢出容器，就改为 `start` 对齐，避免内容超出起始侧而无法滚动到。
   */
  'safe center': unknown;
  /**
   * `space-around`：每项两侧分得相等的空白，因此项之间的间距是两端与容器边缘间距的两倍。
   */
  'space-around': unknown;
  /**
   * `space-between`：首尾两项贴紧容器两端，剩余空间平均分配到各项之间。
   */
  'space-between': unknown;
  /**
   * `space-evenly`：所有间距完全相等，包括首尾两项与容器边缘之间的间距。
   */
  'space-evenly': unknown;
  /**
   * `start`：各项贴向容器在该方向上的起始边，起始边由书写模式和方向决定。
   */
  start: unknown;
  /**
   * `stretch`：把剩余空间平均分给尺寸为 `auto` 的项，使它们被拉伸以占满容器。
   */
  stretch: unknown;
  /**
   * `unsafe center`：无论是否溢出都严格居中；内容比容器大时会向两端溢出，起始侧的部分可能无法滚动到。
   */
  'unsafe center': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface AlignItemsKeywords {
  /**
   * `normal`：由布局模式决定行为，许多场景类似 stretch，但存在内部尺寸等例外。
   */
  normal: unknown;
  /**
   * `stretch`：在自动尺寸及最小/最大约束允许时拉伸项目，不强制覆盖显式尺寸。项目在对齐轴有显式尺寸或受最小/最大尺寸约束时，不一定填满可用区域。center 保持项目尺寸并居中；stretch 尝试扩大自动尺寸。
   */
  stretch: unknown;
  /**
   * `anchor-center`：把项目在对齐轴上与其默认锚点元素的中心对齐；仅用于锚点定位的绝对定位元素。
   */
  'anchor-center': unknown;
}

interface AlignItemsValues {
  /**
   * `baseline`：按项目的对齐基线对齐，不等同于底边对齐。
   */
  baseline: unknown;
  /**
   * `center`：将各项目在交叉轴或块轴的对齐区域中居中。justify-content 控制 Flex 主轴上的内容分布；align-items 控制交叉轴。
   */
  center: unknown;
  /**
   * `end`：按对齐轴的逻辑结束侧对齐。
   */
  end: unknown;
  /**
   * `first baseline`：按首条基线对齐，与 `baseline` 等效；无法对齐时回退为 `start`。
   */
  'first baseline': unknown;
  /**
   * `flex-end`：在 Flex 中按交叉轴结束侧对齐。
   */
  'flex-end': unknown;
  /**
   * `flex-start`：在 Flex 中按交叉轴起始侧对齐；交叉轴方向受换行方式影响。
   */
  'flex-start': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `last baseline`：按末条基线对齐，同组项目的末基线对齐；无法对齐时回退为 `end`。
   */
  'last baseline': unknown;
  /**
   * `normal`：由布局模式决定行为，许多场景类似 stretch，但存在内部尺寸等例外。
   */
  normal: unknown;
  /**
   * `safe center`：项目居中；若居中会使项目溢出容器，就改为 `start` 对齐，避免内容超出起始侧而无法滚动到。
   */
  'safe center': unknown;
  /**
   * `self-end`：对齐到项目自身书写模式的结束侧；项目与容器书写方向不同时，结果与 `end` 不同。
   */
  'self-end': unknown;
  /**
   * `self-start`：对齐到项目自身书写模式的起始侧；项目与容器书写方向不同时，结果与 `start` 不同。
   */
  'self-start': unknown;
  /**
   * `start`：按对齐轴的逻辑起始侧对齐。
   */
  start: unknown;
  /**
   * `stretch`：在自动尺寸及最小/最大约束允许时拉伸项目，不强制覆盖显式尺寸。项目在对齐轴有显式尺寸或受最小/最大尺寸约束时，不一定填满可用区域。center 保持项目尺寸并居中；stretch 尝试扩大自动尺寸。
   */
  stretch: unknown;
  /**
   * `unsafe center`：无论是否溢出都严格居中；项目比容器大时会向两端溢出，起始侧的部分可能无法滚动到。
   */
  'unsafe center': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface AlignmentBaselineValues {
  /**
   * `after-edge`：SVG 1.1 遗留值：按下缘（书写模式中的“后”边）对齐，效果接近 `text-after-edge`。
   */
  'after-edge': unknown;
  /**
   * `alphabetic`：把盒子的字母基线（拉丁文字所坐落的基线）对齐到父元素的字母基线。
   */
  alphabetic: unknown;
  /**
   * `auto`：SVG 1.1 遗留值，效果等同 `baseline`。
   */
  auto: unknown;
  /**
   * `baseline`：使用父元素主基线所对应的那条基线对齐，是初始值。
   */
  baseline: unknown;
  /**
   * `before-edge`：SVG 1.1 遗留值：按上缘（书写模式中的“前”边）对齐，效果接近 `text-before-edge`。
   */
  'before-edge': unknown;
  /**
   * `central`：对齐中心基线，位于表意字符上下边缘的正中间。
   */
  central: unknown;
  /**
   * `hanging`：对齐悬挂基线，即天城文等文字字形顶部悬挂的那条线；SVG 1.1 遗留值，浏览器支持不一致。
   */
  hanging: unknown;
  /**
   * `ideographic`：对齐表意基线，即中日韩等表意文字字形的底部。
   */
  ideographic: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `mathematical`：对齐数学基线，即数学公式里运算符所居的垂直中间位置。
   */
  mathematical: unknown;
  /**
   * `middle`：对齐中间基线，约在 x 字高的一半处，常用来让行内元素与小写字母垂直居中。
   */
  middle: unknown;
  /**
   * `text-after-edge`：把盒子的下缘对齐到父元素文本区域的下缘，相当于 `text-bottom`。
   */
  'text-after-edge': unknown;
  /**
   * `text-before-edge`：把盒子的上缘对齐到父元素文本区域的上缘，相当于 `text-top`。
   */
  'text-before-edge': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface AlignSelfKeywords {
  /**
   * `auto`：使用父容器的 align-items 对齐方式。
   */
  auto: unknown;
  /**
   * `normal`：采用当前布局模式的默认对齐行为，在 Flex 和 Grid 中通常等同于 `stretch`。
   */
  normal: unknown;
  /**
   * `stretch`：在自动尺寸和最小/最大约束允许时拉伸当前项目。
   */
  stretch: unknown;
  /**
   * `anchor-center`：让锚点定位的元素在该轴上与其锚点元素居中对齐，需配合 `positionAnchor` 等锚点定位属性使用。
   */
  'anchor-center': unknown;
}

interface AlignSelfValues {
  /**
   * `auto`：使用父容器的 align-items 对齐方式。
   */
  auto: unknown;
  /**
   * `baseline`：让当前项目参与基线对齐，不等同于底边对齐。
   */
  baseline: unknown;
  /**
   * `center`：将项目在对齐容器内居中。
   */
  center: unknown;
  /**
   * `end`：对齐到对齐容器的结束侧，方向取自容器的书写模式。
   */
  end: unknown;
  /**
   * `first baseline`：按首条基线与同一对齐上下文中的其他项目对齐；无法参与基线对齐时退回起始侧对齐。
   */
  'first baseline': unknown;
  /**
   * `flex-end`：在 Flex 布局中对齐到对应轴的结束侧，随 Flex 方向变化；在其他布局中等同于 `end`。
   */
  'flex-end': unknown;
  /**
   * `flex-start`：在 Flex 布局中对齐到对应轴的起始侧，随 Flex 方向变化；在其他布局中等同于 `start`。
   */
  'flex-start': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `last baseline`：按末条基线与同一对齐上下文中的其他项目对齐；无法参与基线对齐时退回结束侧对齐。
   */
  'last baseline': unknown;
  /**
   * `normal`：采用当前布局模式的默认对齐行为，在 Flex 和 Grid 中通常等同于 `stretch`。
   */
  normal: unknown;
  /**
   * `safe center`：居中对齐；若项目比容器大会溢出，则改为起始侧对齐，避免内容被推到无法滚动到的位置。
   */
  'safe center': unknown;
  /**
   * `self-end`：对齐到项目自身书写模式的结束侧；项目与容器书写方向不同时，结果与 `end` 不同。
   */
  'self-end': unknown;
  /**
   * `self-start`：对齐到项目自身书写模式的起始侧；项目与容器书写方向不同时，结果与 `start` 不同。
   */
  'self-start': unknown;
  /**
   * `start`：对齐到对齐容器的起始侧，方向取自容器的书写模式。
   */
  start: unknown;
  /**
   * `stretch`：在自动尺寸和最小/最大约束允许时拉伸当前项目。
   */
  stretch: unknown;
  /**
   * `unsafe center`：无论是否溢出都严格居中；项目较大时两侧都会超出，超出起始侧的部分可能无法滚动到。
   */
  'unsafe center': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface AlignTracksKeywords {
  /**
   * `normal`：采用该布局模式的默认轨道对齐行为，不额外指定对齐方式；该属性来自旧版瀑布流提案，仅实验性支持。
   */
  normal: unknown;
}

interface AnchorNameKeywords {
  /**
   * `none`：不声明锚点名称，元素不能被其他元素按名称引用为锚点。
   */
  none: unknown;
}

interface AnimationDirectionValues {
  /**
   * `alternate`：奇数次循环正向播放，偶数次反向播放，来回往复。
   */
  alternate: unknown;
  /**
   * `alternate-reverse`：奇数次循环反向播放，偶数次正向播放，与 `alternate` 起点相反。
   */
  'alternate-reverse': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：每次循环都从 0% 播放到 100%。
   */
  normal: unknown;
  /**
   * `reverse`：每次循环都从 100% 倒放到 0%。
   */
  reverse: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface AnimationDurationKeywords {
  /**
   * `auto`：不指定固定时长：基于时间的动画视为 `0s`，滚动驱动动画则按时间线范围自动决定。
   */
  auto: unknown;
}

interface AnimationFillModeValues {
  /**
   * `backwards`：延迟阶段应用最先生效关键帧的效果，具体帧取决于播放方向。
   */
  backwards: unknown;
  /**
   * `both`：同时应用 backwards 和 forwards 的区间外效果。
   */
  both: unknown;
  /**
   * `forwards`：播放结束后保留最后生效关键帧的效果；最后帧取决于方向和循环次数。
   */
  forwards: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：动画有效区间之外不应用动画关键帧值。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface AnimationIterationCountValues {
  /**
   * `infinite`：无限次重复播放，直到动画被移除。
   */
  infinite: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface AnimationNameKeywords {
  /**
   * `none`：不应用任何关键帧动画，可用来取消其他规则设置的动画。
   */
  none: unknown;
}

interface AnimationPlayStateValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `paused`：暂停在当前进度；改回 `running` 后从暂停处继续，不会重头开始。
   */
  paused: unknown;
  /**
   * `running`：动画正常播放。
   */
  running: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface AnimationRangeEndKeywords {
  /**
   * `normal`：不收窄附着范围：起点取时间线起点，终点取时间线终点，动画覆盖整条时间线。
   */
  normal: unknown;
}

interface AppearanceKeywords {
  /**
   * `none`：关闭平台原生控件外观，只使用 CSS 指定的样式，便于自绘表单控件。
   */
  none: unknown;
  /**
   * `auto`：采用元素类型默认的平台原生外观；元素没有原生外观时表现得像 `none`。
   */
  auto: unknown;
}

interface AspectRatioKeywords {
  /**
   * `auto`：使用元素自身的固有宽高比（如图片、视频），没有固有比例时不施加比例约束；可与比例组合，如 `auto 16 / 9`，无固有比例时才用给定比例。
   */
  auto: unknown;
}

interface BackdropFilterKeywords {
  /**
   * `none`：不对元素背后的内容应用任何滤镜。
   */
  none: unknown;
}

interface BackfaceVisibilityValues {
  /**
   * `hidden`：元素背面朝向观察者时不渲染，常用于翻转卡片时隐藏背面。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `visible`：背面朝向观察者时照常渲染，内容呈镜像，是默认值。
   */
  visible: unknown;
}

interface BackgroundAttachmentValues {
  /**
   * `fixed`：背景相对视口固定，页面滚动时背景保持不动，只有元素范围内的部分可见。
   */
  fixed: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `local`：背景相对元素的内容固定，会随元素内部内容一起滚动。
   */
  local: unknown;
  /**
   * `scroll`：背景相对元素自身固定，随页面滚动，但不随元素内部内容的滚动而移动。
   */
  scroll: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BackgroundBlendModeValues {
  /**
   * `color`：取上层的色相和饱和度，保留下层的明度；常用于给黑白图像着色。
   */
  color: unknown;
  /**
   * `color-burn`：加深：让下层变暗以反映上层颜色，上层越深，下层变暗越明显。
   */
  'color-burn': unknown;
  /**
   * `color-dodge`：减淡：让下层变亮以反映上层颜色，上层越亮，下层越接近白色。
   */
  'color-dodge': unknown;
  /**
   * `darken`：逐通道取上下两层中较暗的值，结果不会比任何一层更亮。
   */
  darken: unknown;
  /**
   * `difference`：取上下两层颜色差的绝对值；与白色混合会反相，与黑色混合则不变。
   */
  difference: unknown;
  /**
   * `exclusion`：类似 `difference`，但对比度更低；与白色混合会反相，与黑色混合不变。
   */
  exclusion: unknown;
  /**
   * `hard-light`：按上层颜色决定做 `multiply` 还是 `screen`，效果像强光直射，上层亮则提亮、暗则压暗。
   */
  'hard-light': unknown;
  /**
   * `hue`：取上层的色相，保留下层的饱和度和明度。
   */
  hue: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `lighten`：逐通道取上下两层中较亮的值，结果不会比任何一层更暗。
   */
  lighten: unknown;
  /**
   * `luminosity`：取上层的明度，保留下层的色相和饱和度，与 `color` 相反。
   */
  luminosity: unknown;
  /**
   * `multiply`：正片叠底：上下两层颜色相乘，结果更暗；与白色混合不变，与黑色混合变黑。
   */
  multiply: unknown;
  /**
   * `normal`：不做混合，上层直接覆盖下层；上层半透明时按透明度叠加。
   */
  normal: unknown;
  /**
   * `overlay`：按下层颜色决定做 `multiply` 还是 `screen`，暗部更暗、亮部更亮，同时保留下层的明暗层次。
   */
  overlay: unknown;
  /**
   * `saturation`：取上层的饱和度，保留下层的色相和明度。
   */
  saturation: unknown;
  /**
   * `screen`：滤色：反相后相乘再反相，结果更亮；与黑色混合不变，与白色混合变白。
   */
  screen: unknown;
  /**
   * `soft-light`：`hard-light` 的柔和版本，像漫射光照射，对下层的提亮或压暗幅度较小。
   */
  'soft-light': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BackgroundClipValues {
  /**
   * `border-box`：以边框外缘为参考框，含内边距和边框。
   */
  'border-box': unknown;
  /**
   * `content-box`：以内容区边缘为参考框，不含内边距和边框。
   */
  'content-box': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `padding-box`：以内边距边缘为参考框，含内边距，不含边框。
   */
  'padding-box': unknown;
  /**
   * `text`：把背景裁剪到文字字形；显示背景文字效果通常还需要透明的文字颜色。
   */
  text: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BackgroundImageKeywords {
  /**
   * `none`：不绘制这一层背景图像；背景颜色仍然可以显示。
   */
  none: unknown;
}

interface BackgroundOriginValues {
  /**
   * `border-box`：以边框外缘为参考框，含内边距和边框。
   */
  'border-box': unknown;
  /**
   * `content-box`：以内容区边缘为参考框，不含内边距和边框。
   */
  'content-box': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `padding-box`：以内边距边缘为参考框，含内边距，不含边框。
   */
  'padding-box': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BackgroundPositionXKeywords {
  /**
   * `center`：背景图像在水平方向居中，等同于 `50%`。
   */
  center: unknown;
  /**
   * `left`：对齐到容器左边缘，等同于 `0%`；可后接偏移量，如 `left 10px`，表示从左边缘向内偏移。
   */
  left: unknown;
  /**
   * `right`：对齐到容器右边缘，等同于 `100%`；后接偏移量时表示距右边缘向内的距离。
   */
  right: unknown;
  /**
   * `x-start`：对齐到水平方向的起始侧，由书写模式和方向决定（普通从左到右的横排中为左边）；较新的逻辑写法，浏览器支持有限。
   */
  'x-start': unknown;
  /**
   * `x-end`：对齐到水平方向的结束侧，由书写模式和方向决定（普通从左到右的横排中为右边）；较新的逻辑写法，浏览器支持有限。
   */
  'x-end': unknown;
}

interface BackgroundPositionYKeywords {
  /**
   * `center`：背景图像在垂直方向居中，等同于 `50%`。
   */
  center: unknown;
  /**
   * `top`：对齐到容器上边缘，等同于 `0%`；可后接偏移量，如 `top 10px`，表示从上边缘向内偏移。
   */
  top: unknown;
  /**
   * `bottom`：对齐到容器下边缘，等同于 `100%`；后接偏移量时表示距下边缘向内的距离。
   */
  bottom: unknown;
  /**
   * `y-start`：对齐到垂直方向的起始侧，由书写模式决定（普通横排中为上边）；较新的逻辑写法，浏览器支持有限。
   */
  'y-start': unknown;
  /**
   * `y-end`：对齐到垂直方向的结束侧，由书写模式决定（普通横排中为下边）；较新的逻辑写法，浏览器支持有限。
   */
  'y-end': unknown;
}

interface BaselineShiftKeywords {
  /**
   * `sub`：把文本基线降到父元素的下标位置，用于下标效果。
   */
  sub: unknown;
  /**
   * `super`：把文本基线抬到父元素的上标位置，用于上标效果。
   */
  super: unknown;
  /**
   * `baseline`：不偏移，沿用父元素的基线，是默认值。
   */
  baseline: unknown;
}

interface BorderBlockEndStyleValues {
  /**
   * `dashed`：绘制一串短线段组成的虚线。
   */
  dashed: unknown;
  /**
   * `dotted`：绘制一串圆点组成的点线。
   */
  dotted: unknown;
  /**
   * `double`：绘制两条平行的实线，两线加中间的间隙合起来等于线宽。
   */
  double: unknown;
  /**
   * `groove`：绘制凹槽效果，看起来像刻进页面；明暗两色由线条颜色自动推算。
   */
  groove: unknown;
  /**
   * `hidden`：与 `none` 一样不绘制线条，但在边框折叠冲突时优先级最高，可压过相邻单元格的边框。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inset`：使整条线看起来向内凹陷，仿佛元素嵌入页面；明暗两色由线条颜色自动推算。
   */
  inset: unknown;
  /**
   * `none`：不绘制线条，并使对应线宽的计算值为 0。
   */
  none: unknown;
  /**
   * `outset`：使整条线看起来向外凸起，仿佛元素浮出页面，与 `inset` 相反；明暗两色由线条颜色自动推算。
   */
  outset: unknown;
  /**
   * `ridge`：绘制凸脊效果，看起来像从页面凸起，与 `groove` 相反；明暗两色由线条颜色自动推算。
   */
  ridge: unknown;
  /**
   * `solid`：绘制一条连续的实线。
   */
  solid: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BorderBlockStyleValues {
  /**
   * `dashed`：绘制一串短线段组成的虚线。
   */
  dashed: unknown;
  /**
   * `dotted`：绘制一串圆点组成的点线。
   */
  dotted: unknown;
  /**
   * `double`：绘制两条平行的实线，两线加中间的间隙合起来等于线宽。
   */
  double: unknown;
  /**
   * `groove`：绘制凹槽效果，看起来像刻进页面；明暗两色由线条颜色自动推算。
   */
  groove: unknown;
  /**
   * `hidden`：与 `none` 一样不绘制线条，但在边框折叠冲突时优先级最高，可压过相邻单元格的边框。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inset`：使整条线看起来向内凹陷，仿佛元素嵌入页面；明暗两色由线条颜色自动推算。
   */
  inset: unknown;
  /**
   * `none`：不绘制线条，并使对应线宽的计算值为 0。
   */
  none: unknown;
  /**
   * `outset`：使整条线看起来向外凸起，仿佛元素浮出页面，与 `inset` 相反；明暗两色由线条颜色自动推算。
   */
  outset: unknown;
  /**
   * `ridge`：绘制凸脊效果，看起来像从页面凸起，与 `groove` 相反；明暗两色由线条颜色自动推算。
   */
  ridge: unknown;
  /**
   * `solid`：绘制一条连续的实线。
   */
  solid: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BorderCollapseValues {
  /**
   * `collapse`：相邻单元格共用一条边框，冲突时按优先级规则取舍；`borderSpacing` 不再生效。
   */
  collapse: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `separate`：每个单元格保留各自独立的边框，相邻边框之间留出 `borderSpacing` 指定的间距，是默认值。
   */
  separate: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BorderImageRepeatKeywords {
  /**
   * `stretch`：拉伸边框图像的边与中间切片，填满对应的边框区域。
   */
  stretch: unknown;
  /**
   * `repeat`：平铺切片以填满边框区域，两端可能被截断。
   */
  repeat: unknown;
  /**
   * `round`：平铺切片，并微调切片大小使整数个刚好铺满，不会被截断。
   */
  round: unknown;
  /**
   * `space`：平铺切片并保持原尺寸，把多余空间平均分成切片之间的间隙，不会被截断。
   */
  space: unknown;
}

interface BorderImageSliceKeywords {
  /**
   * `fill`：保留切片后中间的区域，并把它作为背景绘制在元素内；省略时中间部分会被丢弃。
   */
  fill: unknown;
}

interface BorderImageSourceKeywords {
  /**
   * `none`：不使用边框图像，边框回到 `borderStyle` 指定的普通样式。
   */
  none: unknown;
}

interface BorderImageWidthKeywords {
  /**
   * `auto`：边框图像宽度取对应切片自身的固有尺寸。
   */
  auto: unknown;
}

interface BorderStyleValues {
  /**
   * `dashed`：绘制一串短线段组成的虚线。
   */
  dashed: unknown;
  /**
   * `dotted`：绘制一串圆点组成的点线。
   */
  dotted: unknown;
  /**
   * `double`：绘制两条平行的实线，两线加中间的间隙合起来等于线宽。
   */
  double: unknown;
  /**
   * `groove`：绘制凹槽效果，看起来像刻进页面；明暗两色由线条颜色自动推算。
   */
  groove: unknown;
  /**
   * `hidden`：通常与 none 类似；在表格边框合并冲突中优先隐藏边框。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inset`：使整条线看起来向内凹陷，仿佛元素嵌入页面；明暗两色由线条颜色自动推算。
   */
  inset: unknown;
  /**
   * `none`：不绘制边框，并使对应边框计算宽度为零。
   */
  none: unknown;
  /**
   * `outset`：使整条线看起来向外凸起，仿佛元素浮出页面，与 `inset` 相反；明暗两色由线条颜色自动推算。
   */
  outset: unknown;
  /**
   * `ridge`：绘制凸脊效果，看起来像从页面凸起，与 `groove` 相反；明暗两色由线条颜色自动推算。
   */
  ridge: unknown;
  /**
   * `solid`：绘制连续实线边框。
   */
  solid: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BorderTopStyleValues {
  /**
   * `dashed`：绘制一串短线段组成的虚线。
   */
  dashed: unknown;
  /**
   * `dotted`：绘制一串圆点组成的点线。
   */
  dotted: unknown;
  /**
   * `double`：绘制两条平行的实线，两线加中间的间隙合起来等于线宽。
   */
  double: unknown;
  /**
   * `groove`：绘制凹槽效果，看起来像刻进页面；明暗两色由线条颜色自动推算。
   */
  groove: unknown;
  /**
   * `hidden`：与 `none` 一样不绘制线条，但在边框折叠冲突时优先级最高，可压过相邻单元格的边框。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inset`：使整条线看起来向内凹陷，仿佛元素嵌入页面；明暗两色由线条颜色自动推算。
   */
  inset: unknown;
  /**
   * `none`：不绘制线条，并使对应线宽的计算值为 0。
   */
  none: unknown;
  /**
   * `outset`：使整条线看起来向外凸起，仿佛元素浮出页面，与 `inset` 相反；明暗两色由线条颜色自动推算。
   */
  outset: unknown;
  /**
   * `ridge`：绘制凸脊效果，看起来像从页面凸起，与 `groove` 相反；明暗两色由线条颜色自动推算。
   */
  ridge: unknown;
  /**
   * `solid`：绘制一条连续的实线。
   */
  solid: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BoxAlignValues {
  /**
   * `baseline`：子元素按文字基线对齐，对应 `alignItems: 'baseline'`；旧版弹性盒写法，已废弃。
   */
  baseline: unknown;
  /**
   * `center`：子元素在交叉轴上居中，对应 `alignItems: 'center'`；旧版弹性盒写法，已废弃。
   */
  center: unknown;
  /**
   * `end`：子元素靠交叉轴结束侧对齐，对应 `alignItems: 'flex-end'`；旧版弹性盒写法，已废弃。
   */
  end: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `start`：子元素靠交叉轴起始侧对齐，对应 `alignItems: 'flex-start'`；旧版弹性盒写法，已废弃。
   */
  start: unknown;
  /**
   * `stretch`：子元素拉伸以填满交叉轴方向，是默认值，对应 `alignItems: 'stretch'`；旧版弹性盒写法，已废弃。
   */
  stretch: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BoxDecorationBreakValues {
  /**
   * `clone`：每个片段都独立绘制完整的边框、内边距、背景和圆角，如同各自是单独的盒子。
   */
  clone: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `slice`：先按未断开的整体绘制，再在断口处切开：断口处不绘制边框和内边距，背景在片段间连续，是默认值。
   */
  slice: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BoxDirectionValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：子元素沿排列轴按正常顺序排列，对应 `flexDirection` 的 `row` 或 `column`；旧版弹性盒写法，已废弃。
   */
  normal: unknown;
  /**
   * `reverse`：子元素沿排列轴反向排列，对应 `flexDirection` 的 `row-reverse` 或 `column-reverse`；旧版弹性盒写法，已废弃。
   */
  reverse: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BoxLinesValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `multiple`：子元素放不下时可换到新的一行（列），对应 `flexWrap: 'wrap'`；旧版弹性盒写法，已废弃。
   */
  multiple: unknown;
  /**
   * `single`：所有子元素排在同一行（列）内，不换行，对应 `flexWrap: 'nowrap'`；旧版弹性盒写法，已废弃。
   */
  single: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BoxOrientValues {
  /**
   * `block-axis`：子元素沿块轴排列，横排文字下等同于 `vertical`；旧版弹性盒写法，已废弃。
   */
  'block-axis': unknown;
  /**
   * `horizontal`：子元素沿水平方向排列，对应 `flexDirection: 'row'`；旧版弹性盒写法，已废弃。
   */
  horizontal: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline-axis`：子元素沿行内轴排列，横排文字下等同于 `horizontal`；旧版弹性盒写法，已废弃。
   */
  'inline-axis': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `vertical`：子元素沿垂直方向排列，对应 `flexDirection: 'column'`；多行文本截断需配合 `WebkitBoxOrient: 'vertical'`。旧版弹性盒写法，已废弃。
   */
  vertical: unknown;
}

interface BoxShadowKeywords {
  /**
   * `none`：不绘制盒子阴影，可用来清除其他规则设置的阴影。
   */
  none: unknown;
}

interface BoxSizingValues {
  /**
   * `border-box`：指定尺寸包含内容、内边距和边框，但不包含外边距。仍不包含 margin；最小/最大尺寸和布局约束仍参与计算。content-box 在声明宽高之外再加内边距和边框。
   */
  'border-box': unknown;
  /**
   * `content-box`：指定尺寸仅计算内容盒，内边距和边框额外增加外部尺寸。
   */
  'content-box': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BoxSuppressValues {
  /**
   * `discard`：元素及其后代不生成盒子，效果近似 `display: none`。早期草案属性，浏览器不支持。
   */
  discard: unknown;
  /**
   * `hide`：用于隐藏元素，与 `discard` 的具体区别以 CSS Display 草案为准。早期草案属性，浏览器不支持。
   */
  hide: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `show`：元素按 `display` 正常生成盒子，即不做任何抑制，是默认值。早期草案属性，浏览器不支持。
   */
  show: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface BreakAfterValues {
  /**
   * `auto`：既不强制也不禁止在该侧断开（`breakBefore` 指元素之前，`breakAfter` 指元素之后），由浏览器按内容自然决定。
   */
  auto: unknown;
  /**
   * `avoid`：尽量避免在该侧断开，不论是分页、分栏还是分区。
   */
  avoid: unknown;
  /**
   * `avoid-column`：尽量避免在该侧分栏断开。
   */
  'avoid-column': unknown;
  /**
   * `avoid-page`：尽量避免在该侧分页断开。
   */
  'avoid-page': unknown;
  /**
   * `avoid-region`：尽量避免在该侧分区断开；属于 CSS Regions，浏览器基本不支持。
   */
  'avoid-region': unknown;
  /**
   * `column`：在该侧强制分栏，后续内容从下一栏开始。
   */
  column: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `left`：在该侧强制分页，并使新起的一页是左页，必要时插入空白页；主要用于分页媒体（如打印）。
   */
  left: unknown;
  /**
   * `page`：在该侧强制分页，后续内容从新的一页开始；主要用于分页媒体（如打印）。
   */
  page: unknown;
  /**
   * `recto`：在该侧强制分页，并使新起的一页是正面页（从左到右书写时为右页，从右到左时为左页）；主要用于分页媒体（如打印）。
   */
  recto: unknown;
  /**
   * `region`：在该侧强制切到下一个区域；属于 CSS Regions，浏览器基本不支持。
   */
  region: unknown;
  /**
   * `right`：在该侧强制分页，并使新起的一页是右页，必要时插入空白页；主要用于分页媒体（如打印）。
   */
  right: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `verso`：在该侧强制分页，并使新起的一页是反面页（从左到右书写时为左页，从右到左时为右页）；主要用于分页媒体（如打印）。
   */
  verso: unknown;
}

interface BreakInsideValues {
  /**
   * `auto`：不限制元素内部断开，需要时可在内部分页、分栏或分区。
   */
  auto: unknown;
  /**
   * `avoid`：尽量避免在元素内部断开，不论是分页、分栏还是分区。
   */
  avoid: unknown;
  /**
   * `avoid-column`：尽量避免在元素内部分栏断开，常用于防止卡片被拆到两栏。
   */
  'avoid-column': unknown;
  /**
   * `avoid-page`：尽量避免在元素内部分页断开，常用于打印时保持表格行、图片完整。
   */
  'avoid-page': unknown;
  /**
   * `avoid-region`：尽量避免在元素内部分区断开；属于 CSS Regions，浏览器基本不支持。
   */
  'avoid-region': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface CaptionSideValues {
  /**
   * `block-end`：标题放在表格块轴的结束侧，横排文字中即下方；较新的逻辑写法，浏览器支持有限。
   */
  'block-end': unknown;
  /**
   * `block-start`：标题放在表格块轴的起始侧，横排文字中即上方；较新的逻辑写法，浏览器支持有限。
   */
  'block-start': unknown;
  /**
   * `bottom`：标题放在表格下方。
   */
  bottom: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline-end`：标题放在表格行内轴的结束侧，从左到右的横排中即右侧；较新的逻辑写法，浏览器支持有限。
   */
  'inline-end': unknown;
  /**
   * `inline-start`：标题放在表格行内轴的起始侧，从左到右的横排中即左侧；较新的逻辑写法，浏览器支持有限。
   */
  'inline-start': unknown;
  /**
   * `top`：标题放在表格上方，是默认值。
   */
  top: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface CaretAnimationKeywords {
  /**
   * `auto`：由浏览器控制光标的闪烁动画，是默认值。
   */
  auto: unknown;
  /**
   * `manual`：浏览器不再自动闪烁光标，页面可用 CSS 动画自行控制；较新属性，浏览器支持有限。
   */
  manual: unknown;
}

interface CaretColorKeywords {
  /**
   * `auto`：由浏览器选择光标颜色，通常跟随文本的 `color`。
   */
  auto: unknown;
}

interface CaretShapeKeywords {
  /**
   * `auto`：由浏览器选择光标形状，通常是竖条。
   */
  auto: unknown;
  /**
   * `bar`：竖条光标，画在字符之间。
   */
  bar: unknown;
  /**
   * `block`：方块光标，覆盖光标所在的字符。
   */
  block: unknown;
  /**
   * `underscore`：下划线光标，画在光标所在字符的下方。
   */
  underscore: unknown;
}

interface ClearValues {
  /**
   * `both`：避让左右两侧的前置浮动元素：元素下移到两侧浮动都结束之后。
   */
  both: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline-end`：避让行内结束侧的前置浮动，从左到右的文本中即右浮动，从右到左的文本中即左浮动。
   */
  'inline-end': unknown;
  /**
   * `inline-start`：避让行内起始侧的前置浮动，从左到右的文本中即左浮动，从右到左的文本中即右浮动。
   */
  'inline-start': unknown;
  /**
   * `left`：避让左浮动元素：元素下移到左侧浮动结束之后。
   */
  left: unknown;
  /**
   * `none`：不避让浮动，允许元素与前置浮动元素并排，是默认值。
   */
  none: unknown;
  /**
   * `right`：避让右浮动元素：元素下移到右侧浮动结束之后。
   */
  right: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ClipKeywords {
  /**
   * `auto`：不裁剪，裁剪区域与元素的边框盒相同；`clip` 是旧属性，新代码用 `clipPath`。
   */
  auto: unknown;
}

interface ClipPathKeywords {
  /**
   * `none`：不裁剪，元素完整可见。
   */
  none: unknown;
}

interface ColorSchemeValues {
  /**
   * `dark`：声明元素使用深色方案，原生控件、滚动条和默认背景等按深色绘制。
   */
  dark: unknown;
  /**
   * `light`：声明元素使用浅色方案，原生控件、滚动条和默认背景等按浅色绘制。
   */
  light: unknown;
  /**
   * `light dark`：同时支持浅色和深色，浏览器按用户的系统或浏览器偏好选择，常配合 `light-dark()` 使用。
   */
  'light dark': unknown;
  /**
   * `normal`：不声明配色方案，按浏览器默认的浅色外观绘制，原生控件也不会自动适配深色。
   */
  normal: unknown;
  /**
   * `only dark`：只使用深色方案，并禁止浏览器用强制深色等自动变暗功能再改动该元素。
   */
  'only dark': unknown;
  /**
   * `only light`：只使用浅色方案，并禁止浏览器用强制深色等自动变暗功能改动该元素。
   */
  'only light': unknown;
}

interface ColumnCountKeywords {
  /**
   * `auto`：栏数由其他属性（如 `columnWidth`）决定，两者都是 `auto` 时不分栏。
   */
  auto: unknown;
}

interface ColumnFillValues {
  /**
   * `auto`：按顺序填充：先填满一栏再填下一栏，栏高由容器高度决定，最后一栏可能留白。
   */
  auto: unknown;
  /**
   * `balance`：尽量让各栏内容高度均衡，是默认值。
   */
  balance: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ColumnGapKeywords {
  /**
   * `normal`：使用默认间距：多栏布局中为 `1em`，Flex、Grid 等其他布局中为 `0`。
   */
  normal: unknown;
}

interface ColumnRuleStyleValues {
  /**
   * `dashed`：绘制一串短线段组成的虚线。
   */
  dashed: unknown;
  /**
   * `dotted`：绘制一串圆点组成的点线。
   */
  dotted: unknown;
  /**
   * `double`：绘制两条平行的实线，两线加中间的间隙合起来等于线宽。
   */
  double: unknown;
  /**
   * `groove`：绘制凹槽效果，看起来像刻进页面；明暗两色由线条颜色自动推算。
   */
  groove: unknown;
  /**
   * `hidden`：与 `none` 一样不绘制线条，但在边框折叠冲突时优先级最高，可压过相邻单元格的边框。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inset`：使整条线看起来向内凹陷，仿佛元素嵌入页面；明暗两色由线条颜色自动推算。
   */
  inset: unknown;
  /**
   * `none`：不绘制线条，并使对应线宽的计算值为 0。
   */
  none: unknown;
  /**
   * `outset`：使整条线看起来向外凸起，仿佛元素浮出页面，与 `inset` 相反；明暗两色由线条颜色自动推算。
   */
  outset: unknown;
  /**
   * `ridge`：绘制凸脊效果，看起来像从页面凸起，与 `groove` 相反；明暗两色由线条颜色自动推算。
   */
  ridge: unknown;
  /**
   * `solid`：绘制一条连续的实线。
   */
  solid: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ColumnSpanValues {
  /**
   * `all`：元素横跨多栏容器的所有栏，其前后的内容各自重新分栏。
   */
  all: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：元素只在当前栏内，不跨栏，是默认值。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ColumnWidthKeywords {
  /**
   * `auto`：栏宽由其他属性（如 `columnCount`）决定，两者都是 `auto` 时不分栏。
   */
  auto: unknown;
}

interface ContainerNameKeywords {
  /**
   * `none`：不为容器命名，`@container` 无法按名称引用它，只能由不带名称的查询匹配。
   */
  none: unknown;
}

interface ContainerTypeKeywords {
  /**
   * `normal`：不建立尺寸查询容器；仍可用于支持的样式查询。
   */
  normal: unknown;
  /**
   * `size`：建立两个轴的尺寸查询容器，内容不再直接决定其隔离尺寸。
   */
  size: unknown;
  /**
   * `inline-size`：建立行内轴尺寸查询容器，不同时隔离块轴尺寸。
   */
  'inline-size': unknown;
  /**
   * `scroll-state`：建立滚动状态查询容器，可用 `@container scroll-state(...)` 查询粘性、吸附、可滚动等状态；可与 `size` 或 `inline-size` 组合。
   */
  'scroll-state': unknown;
}

interface ContainerTypeValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline-size`：建立行内轴尺寸查询容器，不同时隔离块轴尺寸。
   */
  'inline-size': unknown;
  /**
   * `normal`：不建立尺寸查询容器；仍可用于支持的样式查询。
   */
  normal: unknown;
  /**
   * `size`：建立两个轴的尺寸查询容器，内容不再直接决定其隔离尺寸。
   */
  size: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ContainIntrinsicSizeKeywords {
  /**
   * `auto`：放在长度之前，如 `auto 300px`：元素渲染过则记住最近一次的实际尺寸，没有记录时才用后面的长度。
   */
  auto: unknown;
  /**
   * `none`：不提供替代内部尺寸，尺寸隔离时该方向的内部尺寸按 `0` 计算。
   */
  none: unknown;
}

interface ContainIntrinsicWidthKeywords {
  /**
   * `auto`：放在长度之前，如 `auto 300px`：元素渲染过则记住该方向最近一次的实际尺寸，没有记录时才用后面的长度。
   */
  auto: unknown;
  /**
   * `none`：不提供该方向的替代内部尺寸，尺寸隔离时按 `0` 计算。
   */
  none: unknown;
}

interface ContainKeywords {
  /**
   * `none`：不启用任何隔离，元素与外部按普通方式互相影响。
   */
  none: unknown;
  /**
   * `strict`：组合 size、layout、style 和 paint 隔离；尺寸隔离可能影响自动尺寸。
   */
  strict: unknown;
  /**
   * `content`：组合 layout、style 和 paint 隔离，不包含 size 隔离。
   */
  content: unknown;
  /**
   * `size`：计算盒子尺寸时不依赖后代内容，通常需要显式或替代内部尺寸。
   */
  size: unknown;
  /**
   * `inline-size`：行内轴尺寸隔离：计算行内轴尺寸时不依赖后代内容，块轴尺寸不受影响。
   */
  'inline-size': unknown;
  /**
   * `layout`：布局隔离：内部布局与外部互不影响，元素还会成为独立的格式化上下文、绝对和固定定位后代的包含块，并创建层叠上下文。
   */
  layout: unknown;
  /**
   * `style`：隔离计数器等特定样式副作用，不会阻止普通 CSS 继承或选择器匹配。
   */
  style: unknown;
  /**
   * `paint`：将后代绘制限制在隔离边界内。
   */
  paint: unknown;
}

interface ContentKeywords {
  /**
   * `normal`：元素本身按正常内容显示；在 `::before`、`::after` 上等同于 `none`，不生成伪元素。
   */
  normal: unknown;
  /**
   * `none`：不生成内容，伪元素不会被创建，也不会显示。
   */
  none: unknown;
}

interface ContentVisibilityValues {
  /**
   * `auto`：允许浏览器跳过与用户暂不相关的内容渲染，仍需维护布局和可访问性语义。
   */
  auto: unknown;
  /**
   * `hidden`：跳过内容渲染，行为不同于只隐藏绘制的 visibility:hidden。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `visible`：正常渲染内容，不由此属性跳过子树。
   */
  visible: unknown;
}

interface CounterIncrementKeywords {
  /**
   * `none`：不改变任何计数器。
   */
  none: unknown;
}

interface CounterResetKeywords {
  /**
   * `none`：不创建也不重置任何计数器。
   */
  none: unknown;
}

interface CounterSetKeywords {
  /**
   * `none`：不设置任何计数器的值。
   */
  none: unknown;
}

interface CssAbsoluteSize {
  /**
   * `xx-small`：最小的绝对字号档位，默认设置下约 9px；以浏览器默认字号为基准，不随父元素字号变化。
   */
  'xx-small': unknown;
  /**
   * `x-small`：绝对字号档位，默认设置下约 10px，比 `xx-small` 大一档。
   */
  'x-small': unknown;
  /**
   * `small`：绝对字号档位，默认设置下约 13px。
   */
  small: unknown;
  /**
   * `medium`：绝对字号的基准档位，等于浏览器默认字号（通常 16px），也是字号的初始值。
   */
  medium: unknown;
  /**
   * `large`：绝对字号档位，默认设置下约 18px。
   */
  large: unknown;
  /**
   * `x-large`：绝对字号档位，默认设置下约 24px。
   */
  'x-large': unknown;
  /**
   * `xx-large`：绝对字号档位，默认设置下约 32px。
   */
  'xx-large': unknown;
  /**
   * `xxx-large`：最大的绝对字号档位，默认设置下约 48px。
   */
  'xxx-large': unknown;
}

interface CssAnimateableFeature {
  /**
   * `scroll-position`：提示浏览器该元素的滚动位置即将变化，让它提前做好滚动优化。
   */
  'scroll-position': unknown;
  /**
   * `contents`：提示浏览器元素的内容即将变化，不要缓存其渲染结果，因为缓存很快会失效。
   */
  contents: unknown;
}

interface CssAttachment {
  /**
   * `scroll`：背景相对元素自身固定，随页面滚动，但不随元素内部内容的滚动而移动。
   */
  scroll: unknown;
  /**
   * `fixed`：背景相对视口固定，页面滚动时背景保持不动，只有元素范围内的部分可见。
   */
  fixed: unknown;
  /**
   * `local`：背景相对元素的内容固定，会随元素内部内容一起滚动。
   */
  local: unknown;
}

interface CssAutoRepeat {
  /**
   * `auto-fill`：在 `repeat()` 中按容器可用空间尽可能多地重复轨道；放不下内容的空轨道仍保留占位。
   */
  'auto-fill': unknown;
  /**
   * `auto-fit`：在 `repeat()` 中同样尽可能多地重复轨道，但没有内容的空轨道会折叠为 0，剩余空间让给有内容的轨道。
   */
  'auto-fit': unknown;
}

interface CssBaselinePosition {
  /**
   * `first`：与 `baseline` 搭配（`first baseline`）：以第一行文字的基线对齐，单写 `baseline` 与其等效。
   */
  first: unknown;
  /**
   * `last`：与 `baseline` 搭配（`last baseline`）：以最后一行文字的基线对齐；无法基线对齐时回退为末端对齐。
   */
  last: unknown;
  /**
   * `baseline`：按首行文字的基线与同组其他项对齐；单独使用等同 `first baseline`。
   */
  baseline: unknown;
}

interface CssBgImage {
  /**
   * `none`：不使用图片，该层没有背景图；背景色不受影响。
   */
  none: unknown;
}

interface CssBgPosition {
  /**
   * `left`：水平方向贴靠左边缘，等同 `0%`；后面可跟长度作为距左边缘的偏移，如 `left 10px`。
   */
  left: unknown;
  /**
   * `center`：在对应方向上居中，等同 `50%`。
   */
  center: unknown;
  /**
   * `right`：水平方向贴靠右边缘，等同 `100%`；后面可跟长度作为距右边缘的偏移，如 `right 10px`。
   */
  right: unknown;
  /**
   * `top`：垂直方向贴靠上边缘，等同 `0%`；后面可跟长度作为距上边缘的偏移。
   */
  top: unknown;
  /**
   * `bottom`：垂直方向贴靠下边缘，等同 `100%`；后面可跟长度作为距下边缘的偏移。
   */
  bottom: unknown;
}

interface CssBgSize {
  /**
   * `auto`：该方向的尺寸按图像固有尺寸计算；只有一个方向为 `auto` 时，按图像固有宽高比由另一方向推算。
   */
  auto: unknown;
  /**
   * `cover`：等比缩放图像，直到完全覆盖整个区域，图像超出的部分会被裁掉。
   */
  cover: unknown;
  /**
   * `contain`：等比缩放图像，使整张图恰好放进区域内，区域可能因此留出空白。
   */
  contain: unknown;
}

interface CssColor {
  /**
   * `currentColor`：取当前元素 `color` 的计算值，使该颜色跟着文字颜色走；`color` 变了，它也随之变化。
   */
  currentColor: unknown;
}

interface CssColorBase {
  /**
   * `transparent`：完全透明的颜色，等同于 `rgb(0 0 0 / 0)`。
   */
  transparent: unknown;
}

interface CssCommonLigValues {
  /**
   * `common-ligatures`：启用常见连字（如 `fi`、`fl`），多数字体默认已开启。
   */
  'common-ligatures': unknown;
  /**
   * `no-common-ligatures`：禁用常见连字，让相邻字母各自独立显示。
   */
  'no-common-ligatures': unknown;
}

interface CssCompatAuto {
  /**
   * `searchfield`：兼容取值：历史上表示按搜索框外观渲染，现在行为等同 `auto`。
   */
  searchfield: unknown;
  /**
   * `textarea`：兼容取值：历史上表示按多行文本框外观渲染，现在行为等同 `auto`。
   */
  textarea: unknown;
  /**
   * `checkbox`：兼容取值：历史上表示按复选框外观渲染，现在行为等同 `auto`。
   */
  checkbox: unknown;
  /**
   * `radio`：兼容取值：历史上表示按单选框外观渲染，现在行为等同 `auto`。
   */
  radio: unknown;
  /**
   * `menulist`：兼容取值：历史上表示按下拉菜单外观渲染，现在行为等同 `auto`。
   */
  menulist: unknown;
  /**
   * `listbox`：兼容取值：历史上表示按列表框外观渲染，现在行为等同 `auto`。
   */
  listbox: unknown;
  /**
   * `meter`：兼容取值：历史上表示按度量条外观渲染，现在行为等同 `auto`。
   */
  meter: unknown;
  /**
   * `progress-bar`：兼容取值：历史上表示按进度条外观渲染，现在行为等同 `auto`。
   */
  'progress-bar': unknown;
  /**
   * `button`：兼容取值：历史上表示按按钮外观渲染，现在行为等同 `auto`。
   */
  button: unknown;
}

interface CssCompatSpecial {
  /**
   * `textfield`：按文本输入框外观渲染；常用于去掉 `input[type=number]` 默认的微调按钮。
   */
  textfield: unknown;
  /**
   * `menulist-button`：兼容取值：按下拉菜单的按钮部分渲染，各浏览器表现不一，一般不需要使用。
   */
  'menulist-button': unknown;
}

interface CssCompositingOperator {
  /**
   * `add`：把当前遮罩层叠加到其下方的遮罩层上，取两者的并集。
   */
  add: unknown;
  /**
   * `subtract`：从当前遮罩层中减去与下方遮罩层重叠的部分，只保留未重叠的区域。
   */
  subtract: unknown;
  /**
   * `intersect`：只保留当前遮罩层与下方遮罩层重叠的部分。
   */
  intersect: unknown;
  /**
   * `exclude`：保留两层互不重叠的区域，重叠的部分被排除（异或）。
   */
  exclude: unknown;
}

interface CssContentDistribution {
  /**
   * `space-between`：首尾两项贴紧容器两端，剩余空间平均分配到各项之间。
   */
  'space-between': unknown;
  /**
   * `space-around`：每项两侧分得相等的空白，因此项之间的间距是两端与容器边缘间距的两倍。
   */
  'space-around': unknown;
  /**
   * `space-evenly`：所有间距完全相等，包括首尾两项与容器边缘之间的间距。
   */
  'space-evenly': unknown;
  /**
   * `stretch`：把剩余空间平均分给尺寸为 `auto` 的项，使它们被拉伸以占满容器。
   */
  stretch: unknown;
}

interface CssContentPosition {
  /**
   * `center`：各项作为一个整体，在对齐方向上居中。
   */
  center: unknown;
  /**
   * `start`：各项贴向容器在该方向上的起始边，起始边由书写模式和方向决定。
   */
  start: unknown;
  /**
   * `end`：各项贴向容器在该方向上的终止边，终止边由书写模式和方向决定。
   */
  end: unknown;
  /**
   * `flex-start`：贴向 flex 轴的起点；在非 flex 容器中等同 `start`。
   */
  'flex-start': unknown;
  /**
   * `flex-end`：贴向 flex 轴的终点；在非 flex 容器中等同 `end`。
   */
  'flex-end': unknown;
}

interface CssContextualAltValues {
  /**
   * `contextual`：启用上下文替代字形（OpenType `calt`），字形会随前后字符变化，多数字体默认已开启。
   */
  contextual: unknown;
  /**
   * `no-contextual`：禁用上下文替代字形，每个字符都使用其默认字形。
   */
  'no-contextual': unknown;
}

interface CssCoordBox {
  /**
   * `view-box`：以最近的 SVG 视口（`viewBox`）为参照盒；对没有 SVG 视口的普通元素，按 `border-box` 处理。
   */
  'view-box': unknown;
}

interface CssCornerShapeValue {
  /**
   * `round`：默认的圆角，向外凸出的圆弧，与普通 `border-radius` 的效果一致。
   */
  round: unknown;
  /**
   * `scoop`：向内凹进的圆弧，像在角上挖掉一块圆。
   */
  scoop: unknown;
  /**
   * `bevel`：用一条直线斜切掉角，形成倒角。
   */
  bevel: unknown;
  /**
   * `notch`：向内凹进的直角缺口，像切掉一个方形的角。
   */
  notch: unknown;
  /**
   * `square`：保持直角，不呈现圆弧，即使设置了 `border-radius`。
   */
  square: unknown;
  /**
   * `squircle`：介于圆角与直角之间的超椭圆角，过渡更平滑，类似 iOS 图标的轮廓。
   */
  squircle: unknown;
}

interface CssCubicBezierEasingFunction {
  /**
   * `ease`：等同 `cubic-bezier(0.25, 0.1, 0.25, 1)`：开始较快、逐渐变慢，是动画和过渡的默认曲线。
   */
  ease: unknown;
  /**
   * `ease-in`：等同 `cubic-bezier(0.42, 0, 1, 1)`：起步缓慢，之后逐渐加速。
   */
  'ease-in': unknown;
  /**
   * `ease-out`：等同 `cubic-bezier(0, 0, 0.58, 1)`：起步较快，临近结束时减速。
   */
  'ease-out': unknown;
  /**
   * `ease-in-out`：等同 `cubic-bezier(0.42, 0, 0.58, 1)`：起止都缓慢，中间较快。
   */
  'ease-in-out': unknown;
}

interface CssDiscretionaryLigValues {
  /**
   * `discretionary-ligatures`：启用字体设计者提供的可选连字（OpenType `dlig`），多用于装饰，默认不开启。
   */
  'discretionary-ligatures': unknown;
  /**
   * `no-discretionary-ligatures`：禁用可选连字，这是多数字体的默认状态。
   */
  'no-discretionary-ligatures': unknown;
}

interface CssEastAsianVariantValues {
  /**
   * `jis78`：使用 JIS X 0208:1978 标准的字形；需要字体提供对应字形。
   */
  jis78: unknown;
  /**
   * `jis83`：使用 JIS X 0208:1983 标准的字形；需要字体提供对应字形。
   */
  jis83: unknown;
  /**
   * `jis90`：使用 JIS X 0208:1990 标准的字形；需要字体提供对应字形。
   */
  jis90: unknown;
  /**
   * `jis04`：使用 JIS X 0213:2004 标准的字形；需要字体提供对应字形。
   */
  jis04: unknown;
  /**
   * `simplified`：使用简体中文字形；需要字体提供对应字形。
   */
  simplified: unknown;
  /**
   * `traditional`：使用繁体中文字形；需要字体提供对应字形。
   */
  traditional: unknown;
}

interface CssEastAsianWidthValues {
  /**
   * `full-width`：使用全角字形（OpenType `fwid`），让字符占满一个全角宽度。
   */
  'full-width': unknown;
  /**
   * `proportional-width`：使用比例宽度字形（OpenType `pwid`），字符按各自字形的宽度排布，而不是统一占满等宽。
   */
  'proportional-width': unknown;
}

interface CssFeatureTagValue {
  /**
   * `on`：写在特性标签之后，启用该 OpenType 特性，等同于 `1`。
   */
  on: unknown;
  /**
   * `off`：写在特性标签之后，禁用该 OpenType 特性，等同于 `0`。
   */
  off: unknown;
}

interface CssFontStretchAbsolute {
  /**
   * `normal`：正常宽度，等同 `100%`。
   */
  normal: unknown;
  /**
   * `ultra-condensed`：最窄的宽度档位，等同 `50%`；字体需提供对应宽度，否则无效果。
   */
  'ultra-condensed': unknown;
  /**
   * `extra-condensed`：很窄的宽度档位，等同 `62.5%`；字体需提供对应宽度，否则无效果。
   */
  'extra-condensed': unknown;
  /**
   * `condensed`：较窄的宽度档位，等同 `75%`；字体需提供对应宽度，否则无效果。
   */
  condensed: unknown;
  /**
   * `semi-condensed`：略窄的宽度档位，等同 `87.5%`；字体需提供对应宽度，否则无效果。
   */
  'semi-condensed': unknown;
  /**
   * `semi-expanded`：略宽的宽度档位，等同 `112.5%`；字体需提供对应宽度，否则无效果。
   */
  'semi-expanded': unknown;
  /**
   * `expanded`：较宽的宽度档位，等同 `125%`；字体需提供对应宽度，否则无效果。
   */
  expanded: unknown;
  /**
   * `extra-expanded`：很宽的宽度档位，等同 `150%`；字体需提供对应宽度，否则无效果。
   */
  'extra-expanded': unknown;
  /**
   * `ultra-expanded`：最宽的宽度档位，等同 `200%`；字体需提供对应宽度，否则无效果。
   */
  'ultra-expanded': unknown;
}

interface CssFontVariantCss2 {
  /**
   * `normal`：使用字体的常规字形，不启用小型大写字母。
   */
  normal: unknown;
  /**
   * `small-caps`：小写字母改用小型大写字母字形；字体没有这类字形时由浏览器按比例缩小大写字母合成。
   */
  'small-caps': unknown;
}

interface CssFontWeightAbsolute {
  /**
   * `normal`：常规字重，等同 `400`，是字重的初始值。
   */
  normal: unknown;
  /**
   * `bold`：粗体字重，等同 `700`。
   */
  bold: unknown;
}

interface CssFontWidthCss3 {
  /**
   * `normal`：正常宽度，等同 `100%`。
   */
  normal: unknown;
  /**
   * `ultra-condensed`：最窄的宽度档位，等同 `50%`；字体需提供对应宽度，否则无效果。
   */
  'ultra-condensed': unknown;
  /**
   * `extra-condensed`：很窄的宽度档位，等同 `62.5%`；字体需提供对应宽度，否则无效果。
   */
  'extra-condensed': unknown;
  /**
   * `condensed`：较窄的宽度档位，等同 `75%`；字体需提供对应宽度，否则无效果。
   */
  condensed: unknown;
  /**
   * `semi-condensed`：略窄的宽度档位，等同 `87.5%`；字体需提供对应宽度，否则无效果。
   */
  'semi-condensed': unknown;
  /**
   * `semi-expanded`：略宽的宽度档位，等同 `112.5%`；字体需提供对应宽度，否则无效果。
   */
  'semi-expanded': unknown;
  /**
   * `expanded`：较宽的宽度档位，等同 `125%`；字体需提供对应宽度，否则无效果。
   */
  expanded: unknown;
  /**
   * `extra-expanded`：很宽的宽度档位，等同 `150%`；字体需提供对应宽度，否则无效果。
   */
  'extra-expanded': unknown;
  /**
   * `ultra-expanded`：最宽的宽度档位，等同 `200%`；字体需提供对应宽度，否则无效果。
   */
  'ultra-expanded': unknown;
}

interface CssGenericComplete {
  /**
   * `serif`：衬线字体族，笔画末端带有装饰性的衬线，如宋体、Times 一类的风格。
   */
  serif: unknown;
  /**
   * `sans-serif`：无衬线字体族，笔画末端没有衬线，如黑体、Arial 一类的风格。
   */
  'sans-serif': unknown;
  /**
   * `system-ui`：操作系统界面所用的默认字体，在不同系统上外观不同。
   */
  'system-ui': unknown;
  /**
   * `cursive`：手写体或草书风格的字体族，具体字体由系统决定。
   */
  cursive: unknown;
  /**
   * `fantasy`：装饰性、艺术化的字体族，具体字体由系统决定，不保证存在。
   */
  fantasy: unknown;
  /**
   * `math`：适合排印数学公式的字体族。
   */
  math: unknown;
  /**
   * `monospace`：等宽字体族，每个字符宽度相同，常用于代码。
   */
  monospace: unknown;
}

interface CssGenericFamily {
  /**
   * `emoji`：适合渲染表情符号（emoji）的字体族。
   */
  emoji: unknown;
  /**
   * `fangsong`：仿宋风格的中文字体族，字形介于宋体与楷体之间。
   */
  fangsong: unknown;
}

interface CssGenericIncomplete {
  /**
   * `ui-serif`：系统界面所用的默认衬线字体；浏览器支持有限，建议后面写上回退字体。
   */
  'ui-serif': unknown;
  /**
   * `ui-sans-serif`：系统界面所用的默认无衬线字体；浏览器支持有限，建议后面写上回退字体。
   */
  'ui-sans-serif': unknown;
  /**
   * `ui-monospace`：系统界面所用的默认等宽字体；浏览器支持有限，建议后面写上回退字体。
   */
  'ui-monospace': unknown;
  /**
   * `ui-rounded`：系统界面所用的圆角无衬线字体；浏览器支持有限，建议后面写上回退字体。
   */
  'ui-rounded': unknown;
}

interface CssGeometryBox {
  /**
   * `fill-box`：以对象的边界框（只含填充区域，不含描边）为参照盒；对普通 HTML 元素按 `content-box` 处理。
   */
  'fill-box': unknown;
  /**
   * `stroke-box`：以包含描边的边界框为参照盒；对普通 HTML 元素按 `border-box` 处理。
   */
  'stroke-box': unknown;
  /**
   * `view-box`：以最近的 SVG 视口（`viewBox`）为参照盒；对没有 SVG 视口的普通元素，按 `border-box` 处理。
   */
  'view-box': unknown;
}

interface CssGridLine {
  /**
   * `auto`：不指定这条网格线，交给自动放置算法决定；用在结束线上时默认跨 1 个轨道。
   */
  auto: unknown;
  /**
   * `span`：与数字或线名搭配（如 `span 2`）：不指定具体线，而是从另一端起跨越指定数量的轨道。
   */
  span: unknown;
}

interface CssHistoricalLigValues {
  /**
   * `historical-ligatures`：启用历史连字（OpenType `hlig`），用于还原旧式排印中的连字，默认不开启。
   */
  'historical-ligatures': unknown;
  /**
   * `no-historical-ligatures`：禁用历史连字，这是多数情况下的默认状态。
   */
  'no-historical-ligatures': unknown;
}

interface CssInflexibleBreadth {
  /**
   * `min-content`：轨道取内容的最小内容尺寸，即内容在不溢出的前提下能收缩到的最小值。
   */
  'min-content': unknown;
  /**
   * `max-content`：轨道取内容的最大内容尺寸，即内容不换行或不折叠时所需的尺寸。
   */
  'max-content': unknown;
  /**
   * `auto`：由内容和可用空间自动决定轨道尺寸：不小于内容的最小需求，有剩余空间时可被拉伸占满。
   */
  auto: unknown;
}

interface CssLinearEasingFunction {
  /**
   * `linear`：匀速：进度与时间成正比，全程没有加速或减速。
   */
  linear: unknown;
}

interface CssLineStyle {
  /**
   * `none`：不绘制线条，并使对应线宽的计算值为 0。
   */
  none: unknown;
  /**
   * `hidden`：与 `none` 一样不绘制线条，但在边框折叠冲突时优先级最高，可压过相邻单元格的边框。
   */
  hidden: unknown;
  /**
   * `dotted`：绘制一串圆点组成的点线。
   */
  dotted: unknown;
  /**
   * `dashed`：绘制一串短线段组成的虚线。
   */
  dashed: unknown;
  /**
   * `solid`：绘制一条连续的实线。
   */
  solid: unknown;
  /**
   * `double`：绘制两条平行的实线，两线加中间的间隙合起来等于线宽。
   */
  double: unknown;
  /**
   * `groove`：绘制凹槽效果，看起来像刻进页面；明暗两色由线条颜色自动推算。
   */
  groove: unknown;
  /**
   * `ridge`：绘制凸脊效果，看起来像从页面凸起，与 `groove` 相反；明暗两色由线条颜色自动推算。
   */
  ridge: unknown;
  /**
   * `inset`：使整条线看起来向内凹陷，仿佛元素嵌入页面；明暗两色由线条颜色自动推算。
   */
  inset: unknown;
  /**
   * `outset`：使整条线看起来向外凸起，仿佛元素浮出页面，与 `inset` 相反；明暗两色由线条颜色自动推算。
   */
  outset: unknown;
}

interface CssLineWidth {
  /**
   * `thin`：细线，具体宽度由浏览器决定，通常为 1px。
   */
  thin: unknown;
  /**
   * `medium`：中等宽度，具体宽度由浏览器决定，通常为 3px，是线宽的初始值。
   */
  medium: unknown;
  /**
   * `thick`：粗线，具体宽度由浏览器决定，通常为 5px。
   */
  thick: unknown;
}

interface CssMaskingMode {
  /**
   * `alpha`：取遮罩图像的透明度（alpha 通道）作为遮罩值：不透明处显示，透明处隐藏。
   */
  alpha: unknown;
  /**
   * `luminance`：取遮罩图像的亮度（结合透明度）作为遮罩值：越亮显示得越多，黑色处隐藏。
   */
  luminance: unknown;
  /**
   * `match-source`：按遮罩来源自动选择：普通图像用 `alpha`，引用 SVG `<mask>` 元素时用 `luminance`；这是初始值。
   */
  'match-source': unknown;
}

interface CssMaskLayer {
  /**
   * `no-clip`：不限制遮罩的绘制区域，遮罩图像按自身位置和尺寸完整作用，不被裁剪到任何框内；对应 `mask-clip: no-clip`。
   */
  'no-clip': unknown;
}

interface CssMaskReference {
  /**
   * `none`：不使用遮罩图像，该层不产生遮罩效果，元素按原样显示。
   */
  none: unknown;
}

interface CssNamedColor {
  /**
   * `aliceblue`：命名颜色：爱丽丝蓝，`#f0f8ff`。
   */
  aliceblue: unknown;
  /**
   * `antiquewhite`：命名颜色：古董白，`#faebd7`。
   */
  antiquewhite: unknown;
  /**
   * `aqua`：命名颜色：青色，`#00ffff`。
   */
  aqua: unknown;
  /**
   * `aquamarine`：命名颜色：海蓝宝石，`#7fffd4`。
   */
  aquamarine: unknown;
  /**
   * `azure`：命名颜色：蔚蓝色，`#f0ffff`。
   */
  azure: unknown;
  /**
   * `beige`：命名颜色：米色，`#f5f5dc`。
   */
  beige: unknown;
  /**
   * `bisque`：命名颜色：陶坯黄，`#ffe4c4`。
   */
  bisque: unknown;
  /**
   * `black`：命名颜色：黑色，`#000000`。
   */
  black: unknown;
  /**
   * `blanchedalmond`：命名颜色：杏仁白，`#ffebcd`。
   */
  blanchedalmond: unknown;
  /**
   * `blue`：命名颜色：蓝色，`#0000ff`。
   */
  blue: unknown;
  /**
   * `blueviolet`：命名颜色：蓝紫色，`#8a2be2`。
   */
  blueviolet: unknown;
  /**
   * `brown`：命名颜色：棕色，`#a52a2a`。
   */
  brown: unknown;
  /**
   * `burlywood`：命名颜色：实木色，`#deb887`。
   */
  burlywood: unknown;
  /**
   * `cadetblue`：命名颜色：军服蓝，`#5f9ea0`。
   */
  cadetblue: unknown;
  /**
   * `chartreuse`：命名颜色：查特酒绿，`#7fff00`。
   */
  chartreuse: unknown;
  /**
   * `chocolate`：命名颜色：巧克力色，`#d2691e`。
   */
  chocolate: unknown;
  /**
   * `coral`：命名颜色：珊瑚色，`#ff7f50`。
   */
  coral: unknown;
  /**
   * `cornflowerblue`：命名颜色：矢车菊蓝，`#6495ed`。
   */
  cornflowerblue: unknown;
  /**
   * `cornsilk`：命名颜色：玉米丝色，`#fff8dc`。
   */
  cornsilk: unknown;
  /**
   * `crimson`：命名颜色：绯红，`#dc143c`。
   */
  crimson: unknown;
  /**
   * `cyan`：命名颜色：青色，`#00ffff`。
   */
  cyan: unknown;
  /**
   * `darkblue`：命名颜色：深蓝色，`#00008b`。
   */
  darkblue: unknown;
  /**
   * `darkcyan`：命名颜色：深青色，`#008b8b`。
   */
  darkcyan: unknown;
  /**
   * `darkgoldenrod`：命名颜色：深金菊黄，`#b8860b`。
   */
  darkgoldenrod: unknown;
  /**
   * `darkgray`：命名颜色：深灰色，`#a9a9a9`。
   */
  darkgray: unknown;
  /**
   * `darkgreen`：命名颜色：深绿色，`#006400`。
   */
  darkgreen: unknown;
  /**
   * `darkgrey`：命名颜色：深灰色，`#a9a9a9`。
   */
  darkgrey: unknown;
  /**
   * `darkkhaki`：命名颜色：深卡其色，`#bdb76b`。
   */
  darkkhaki: unknown;
  /**
   * `darkmagenta`：命名颜色：深洋红色，`#8b008b`。
   */
  darkmagenta: unknown;
  /**
   * `darkolivegreen`：命名颜色：深橄榄绿，`#556b2f`。
   */
  darkolivegreen: unknown;
  /**
   * `darkorange`：命名颜色：深橙色，`#ff8c00`。
   */
  darkorange: unknown;
  /**
   * `darkorchid`：命名颜色：深兰花紫，`#9932cc`。
   */
  darkorchid: unknown;
  /**
   * `darkred`：命名颜色：深红色，`#8b0000`。
   */
  darkred: unknown;
  /**
   * `darksalmon`：命名颜色：深鲑红，`#e9967a`。
   */
  darksalmon: unknown;
  /**
   * `darkseagreen`：命名颜色：深海绿，`#8fbc8f`。
   */
  darkseagreen: unknown;
  /**
   * `darkslateblue`：命名颜色：深石板蓝，`#483d8b`。
   */
  darkslateblue: unknown;
  /**
   * `darkslategray`：命名颜色：深石板灰，`#2f4f4f`。
   */
  darkslategray: unknown;
  /**
   * `darkslategrey`：命名颜色：深石板灰，`#2f4f4f`。
   */
  darkslategrey: unknown;
  /**
   * `darkturquoise`：命名颜色：深绿松石，`#00ced1`。
   */
  darkturquoise: unknown;
  /**
   * `darkviolet`：命名颜色：深紫罗兰，`#9400d3`。
   */
  darkviolet: unknown;
  /**
   * `deeppink`：命名颜色：深粉红，`#ff1493`。
   */
  deeppink: unknown;
  /**
   * `deepskyblue`：命名颜色：深天蓝，`#00bfff`。
   */
  deepskyblue: unknown;
  /**
   * `dimgray`：命名颜色：暗灰色，`#696969`。
   */
  dimgray: unknown;
  /**
   * `dimgrey`：命名颜色：暗灰色，`#696969`。
   */
  dimgrey: unknown;
  /**
   * `dodgerblue`：命名颜色：道奇蓝，`#1e90ff`。
   */
  dodgerblue: unknown;
  /**
   * `firebrick`：命名颜色：火砖红，`#b22222`。
   */
  firebrick: unknown;
  /**
   * `floralwhite`：命名颜色：花白色，`#fffaf0`。
   */
  floralwhite: unknown;
  /**
   * `forestgreen`：命名颜色：森林绿，`#228b22`。
   */
  forestgreen: unknown;
  /**
   * `fuchsia`：命名颜色：洋红色，`#ff00ff`。
   */
  fuchsia: unknown;
  /**
   * `gainsboro`：命名颜色：庚斯博罗灰，`#dcdcdc`。
   */
  gainsboro: unknown;
  /**
   * `ghostwhite`：命名颜色：幽灵白，`#f8f8ff`。
   */
  ghostwhite: unknown;
  /**
   * `gold`：命名颜色：金色，`#ffd700`。
   */
  gold: unknown;
  /**
   * `goldenrod`：命名颜色：金菊黄，`#daa520`。
   */
  goldenrod: unknown;
  /**
   * `gray`：命名颜色：灰色，`#808080`。
   */
  gray: unknown;
  /**
   * `green`：命名颜色：绿色，`#008000`。
   */
  green: unknown;
  /**
   * `greenyellow`：命名颜色：荧光黄绿，`#adff2f`。
   */
  greenyellow: unknown;
  /**
   * `grey`：命名颜色：灰色，`#808080`。
   */
  grey: unknown;
  /**
   * `honeydew`：命名颜色：蜜瓜绿，`#f0fff0`。
   */
  honeydew: unknown;
  /**
   * `hotpink`：命名颜色：艳粉红，`#ff69b4`。
   */
  hotpink: unknown;
  /**
   * `indianred`：命名颜色：印度红，`#cd5c5c`。
   */
  indianred: unknown;
  /**
   * `indigo`：命名颜色：靛青，`#4b0082`。
   */
  indigo: unknown;
  /**
   * `ivory`：命名颜色：象牙白，`#fffff0`。
   */
  ivory: unknown;
  /**
   * `khaki`：命名颜色：卡其色，`#f0e68c`。
   */
  khaki: unknown;
  /**
   * `lavender`：命名颜色：薰衣草紫，`#e6e6fa`。
   */
  lavender: unknown;
  /**
   * `lavenderblush`：命名颜色：薰衣草粉，`#fff0f5`。
   */
  lavenderblush: unknown;
  /**
   * `lawngreen`：命名颜色：草坪绿，`#7cfc00`。
   */
  lawngreen: unknown;
  /**
   * `lemonchiffon`：命名颜色：柠檬绸，`#fffacd`。
   */
  lemonchiffon: unknown;
  /**
   * `lightblue`：命名颜色：浅蓝色，`#add8e6`。
   */
  lightblue: unknown;
  /**
   * `lightcoral`：命名颜色：浅珊瑚红，`#f08080`。
   */
  lightcoral: unknown;
  /**
   * `lightcyan`：命名颜色：浅青色，`#e0ffff`。
   */
  lightcyan: unknown;
  /**
   * `lightgoldenrodyellow`：命名颜色：浅金菊黄，`#fafad2`。
   */
  lightgoldenrodyellow: unknown;
  /**
   * `lightgray`：命名颜色：浅灰色，`#d3d3d3`。
   */
  lightgray: unknown;
  /**
   * `lightgreen`：命名颜色：浅绿色，`#90ee90`。
   */
  lightgreen: unknown;
  /**
   * `lightgrey`：命名颜色：浅灰色，`#d3d3d3`。
   */
  lightgrey: unknown;
  /**
   * `lightpink`：命名颜色：浅粉红，`#ffb6c1`。
   */
  lightpink: unknown;
  /**
   * `lightsalmon`：命名颜色：浅鲑红，`#ffa07a`。
   */
  lightsalmon: unknown;
  /**
   * `lightseagreen`：命名颜色：浅海绿，`#20b2aa`。
   */
  lightseagreen: unknown;
  /**
   * `lightskyblue`：命名颜色：浅天蓝，`#87cefa`。
   */
  lightskyblue: unknown;
  /**
   * `lightslategray`：命名颜色：浅石板灰，`#778899`。
   */
  lightslategray: unknown;
  /**
   * `lightslategrey`：命名颜色：浅石板灰，`#778899`。
   */
  lightslategrey: unknown;
  /**
   * `lightsteelblue`：命名颜色：浅钢蓝，`#b0c4de`。
   */
  lightsteelblue: unknown;
  /**
   * `lightyellow`：命名颜色：浅黄色，`#ffffe0`。
   */
  lightyellow: unknown;
  /**
   * `lime`：命名颜色：酸橙色，`#00ff00`。
   */
  lime: unknown;
  /**
   * `limegreen`：命名颜色：酸橙绿，`#32cd32`。
   */
  limegreen: unknown;
  /**
   * `linen`：命名颜色：亚麻色，`#faf0e6`。
   */
  linen: unknown;
  /**
   * `magenta`：命名颜色：洋红色，`#ff00ff`。
   */
  magenta: unknown;
  /**
   * `maroon`：命名颜色：栗色，`#800000`。
   */
  maroon: unknown;
  /**
   * `mediumaquamarine`：命名颜色：中海蓝宝石，`#66cdaa`。
   */
  mediumaquamarine: unknown;
  /**
   * `mediumblue`：命名颜色：中蓝色，`#0000cd`。
   */
  mediumblue: unknown;
  /**
   * `mediumorchid`：命名颜色：中兰花紫，`#ba55d3`。
   */
  mediumorchid: unknown;
  /**
   * `mediumpurple`：命名颜色：中紫色，`#9370db`。
   */
  mediumpurple: unknown;
  /**
   * `mediumseagreen`：命名颜色：中海绿，`#3cb371`。
   */
  mediumseagreen: unknown;
  /**
   * `mediumslateblue`：命名颜色：中石板蓝，`#7b68ee`。
   */
  mediumslateblue: unknown;
  /**
   * `mediumspringgreen`：命名颜色：中春绿，`#00fa9a`。
   */
  mediumspringgreen: unknown;
  /**
   * `mediumturquoise`：命名颜色：中绿松石，`#48d1cc`。
   */
  mediumturquoise: unknown;
  /**
   * `mediumvioletred`：命名颜色：中紫罗兰红，`#c71585`。
   */
  mediumvioletred: unknown;
  /**
   * `midnightblue`：命名颜色：午夜蓝，`#191970`。
   */
  midnightblue: unknown;
  /**
   * `mintcream`：命名颜色：薄荷奶油，`#f5fffa`。
   */
  mintcream: unknown;
  /**
   * `mistyrose`：命名颜色：薄雾玫瑰，`#ffe4e1`。
   */
  mistyrose: unknown;
  /**
   * `moccasin`：命名颜色：鹿皮色，`#ffe4b5`。
   */
  moccasin: unknown;
  /**
   * `navajowhite`：命名颜色：纳瓦霍白，`#ffdead`。
   */
  navajowhite: unknown;
  /**
   * `navy`：命名颜色：海军蓝，`#000080`。
   */
  navy: unknown;
  /**
   * `oldlace`：命名颜色：旧蕾丝，`#fdf5e6`。
   */
  oldlace: unknown;
  /**
   * `olive`：命名颜色：橄榄色，`#808000`。
   */
  olive: unknown;
  /**
   * `olivedrab`：命名颜色：橄榄褐，`#6b8e23`。
   */
  olivedrab: unknown;
  /**
   * `orange`：命名颜色：橙色，`#ffa500`。
   */
  orange: unknown;
  /**
   * `orangered`：命名颜色：橙红色，`#ff4500`。
   */
  orangered: unknown;
  /**
   * `orchid`：命名颜色：兰花紫，`#da70d6`。
   */
  orchid: unknown;
  /**
   * `palegoldenrod`：命名颜色：淡金菊黄，`#eee8aa`。
   */
  palegoldenrod: unknown;
  /**
   * `palegreen`：命名颜色：淡绿色，`#98fb98`。
   */
  palegreen: unknown;
  /**
   * `paleturquoise`：命名颜色：淡绿松石，`#afeeee`。
   */
  paleturquoise: unknown;
  /**
   * `palevioletred`：命名颜色：淡紫罗兰红，`#db7093`。
   */
  palevioletred: unknown;
  /**
   * `papayawhip`：命名颜色：木瓜奶油，`#ffefd5`。
   */
  papayawhip: unknown;
  /**
   * `peachpuff`：命名颜色：蜜桃色，`#ffdab9`。
   */
  peachpuff: unknown;
  /**
   * `peru`：命名颜色：秘鲁色，`#cd853f`。
   */
  peru: unknown;
  /**
   * `pink`：命名颜色：粉红色，`#ffc0cb`。
   */
  pink: unknown;
  /**
   * `plum`：命名颜色：李子紫，`#dda0dd`。
   */
  plum: unknown;
  /**
   * `powderblue`：命名颜色：粉蓝色，`#b0e0e6`。
   */
  powderblue: unknown;
  /**
   * `purple`：命名颜色：紫色，`#800080`。
   */
  purple: unknown;
  /**
   * `rebeccapurple`：命名颜色：丽贝卡紫，`#663399`。
   */
  rebeccapurple: unknown;
  /**
   * `red`：命名颜色：红色，`#ff0000`。
   */
  red: unknown;
  /**
   * `rosybrown`：命名颜色：玫瑰棕，`#bc8f8f`。
   */
  rosybrown: unknown;
  /**
   * `royalblue`：命名颜色：皇家蓝，`#4169e1`。
   */
  royalblue: unknown;
  /**
   * `saddlebrown`：命名颜色：马鞍棕，`#8b4513`。
   */
  saddlebrown: unknown;
  /**
   * `salmon`：命名颜色：鲑红，`#fa8072`。
   */
  salmon: unknown;
  /**
   * `sandybrown`：命名颜色：沙棕色，`#f4a460`。
   */
  sandybrown: unknown;
  /**
   * `seagreen`：命名颜色：海绿色，`#2e8b57`。
   */
  seagreen: unknown;
  /**
   * `seashell`：命名颜色：贝壳白，`#fff5ee`。
   */
  seashell: unknown;
  /**
   * `sienna`：命名颜色：赭石色，`#a0522d`。
   */
  sienna: unknown;
  /**
   * `silver`：命名颜色：银色，`#c0c0c0`。
   */
  silver: unknown;
  /**
   * `skyblue`：命名颜色：天蓝色，`#87ceeb`。
   */
  skyblue: unknown;
  /**
   * `slateblue`：命名颜色：石板蓝，`#6a5acd`。
   */
  slateblue: unknown;
  /**
   * `slategray`：命名颜色：石板灰，`#708090`。
   */
  slategray: unknown;
  /**
   * `slategrey`：命名颜色：石板灰，`#708090`。
   */
  slategrey: unknown;
  /**
   * `snow`：命名颜色：雪白色，`#fffafa`。
   */
  snow: unknown;
  /**
   * `springgreen`：命名颜色：春绿色，`#00ff7f`。
   */
  springgreen: unknown;
  /**
   * `steelblue`：命名颜色：钢蓝色，`#4682b4`。
   */
  steelblue: unknown;
  /**
   * `tan`：命名颜色：黄褐色，`#d2b48c`。
   */
  tan: unknown;
  /**
   * `teal`：命名颜色：水鸭色，`#008080`。
   */
  teal: unknown;
  /**
   * `thistle`：命名颜色：蓟紫，`#d8bfd8`。
   */
  thistle: unknown;
  /**
   * `tomato`：命名颜色：番茄红，`#ff6347`。
   */
  tomato: unknown;
  /**
   * `turquoise`：命名颜色：绿松石色，`#40e0d0`。
   */
  turquoise: unknown;
  /**
   * `violet`：命名颜色：紫罗兰色，`#ee82ee`。
   */
  violet: unknown;
  /**
   * `wheat`：命名颜色：小麦色，`#f5deb3`。
   */
  wheat: unknown;
  /**
   * `white`：命名颜色：白色，`#ffffff`。
   */
  white: unknown;
  /**
   * `whitesmoke`：命名颜色：烟白色，`#f5f5f5`。
   */
  whitesmoke: unknown;
  /**
   * `yellow`：命名颜色：黄色，`#ffff00`。
   */
  yellow: unknown;
  /**
   * `yellowgreen`：命名颜色：黄绿色，`#9acd32`。
   */
  yellowgreen: unknown;
}

interface CssNameRepeat {
  /**
   * `auto-fill`：与 `subgrid` 配合：自动重复这组网格线名，直到填满子网格所跨越的轨道数。
   */
  'auto-fill': unknown;
}

interface CssNumericFigureValues {
  /**
   * `lining-nums`：使用等高数字（齐线数字），数字高度统一，与大写字母齐平；需要字体提供该特性。
   */
  'lining-nums': unknown;
  /**
   * `oldstyle-nums`：使用旧式数字（非等高数字），各数字高度不一并带有上下伸出部分，适合正文里与小写字母混排；需要字体提供该特性。
   */
  'oldstyle-nums': unknown;
}

interface CssNumericFractionValues {
  /**
   * `diagonal-fractions`：把 `1/2` 这类写法渲染成斜分数：分子分母缩小并以斜线分隔；需要字体提供该特性。
   */
  'diagonal-fractions': unknown;
  /**
   * `stacked-fractions`：把 `1/2` 这类写法渲染成竖分数：分子在上、分母在下，中间一条横线；需要字体提供该特性。
   */
  'stacked-fractions': unknown;
}

interface CssNumericSpacingValues {
  /**
   * `proportional-nums`：使用比例宽度数字，各数字按自身字形占宽，排版更紧凑，适合正文。
   */
  'proportional-nums': unknown;
  /**
   * `tabular-nums`：使用等宽数字，所有数字占用相同宽度，适合表格、计时器等需要纵向对齐的数字。
   */
  'tabular-nums': unknown;
}

interface CssOutlineLineStyle {
  /**
   * `none`：不绘制轮廓，轮廓宽度计算值为零。
   */
  none: unknown;
  /**
   * `dotted`：用圆点绘制轮廓。
   */
  dotted: unknown;
  /**
   * `dashed`：用短划线绘制轮廓。
   */
  dashed: unknown;
  /**
   * `solid`：绘制一条连续的实线轮廓。
   */
  solid: unknown;
  /**
   * `double`：绘制两条平行的实线，中间留空隙，整体宽度等于轮廓宽度。
   */
  double: unknown;
  /**
   * `groove`：绘制凹槽效果的立体线条，看起来像刻在页面里，明暗由轮廓颜色推算；与 `ridge` 相反。
   */
  groove: unknown;
  /**
   * `ridge`：绘制凸脊效果的立体线条，看起来像从页面凸起，明暗由轮廓颜色推算；与 `groove` 相反。
   */
  ridge: unknown;
  /**
   * `inset`：使整个轮廓呈现为凹陷，元素看起来嵌入页面；与 `outset` 相反。
   */
  inset: unknown;
  /**
   * `outset`：使整个轮廓呈现为凸起，元素看起来浮出页面；与 `inset` 相反。
   */
  outset: unknown;
}

interface CssOverflowPosition {
  /**
   * `unsafe`：无论是否溢出，都严格按指定方式对齐；内容溢出时可能超出容器起始侧，导致无法滚动到。
   */
  unsafe: unknown;
  /**
   * `safe`：若按指定方式对齐会使内容溢出对齐容器，就改用 `start` 对齐，避免内容跑到不可达的区域；需写在对齐关键字前面。
   */
  safe: unknown;
}

interface CssPaint {
  /**
   * `none`：不绘制，既不填充也不描边。
   */
  none: unknown;
  /**
   * `context-fill`：沿用上下文元素的填充画法，常见于 `<marker>`、`<use>` 引用的内容，使其颜色跟随被标记的图形。
   */
  'context-fill': unknown;
  /**
   * `context-stroke`：沿用上下文元素的描边画法，常见于 `<marker>`、`<use>` 引用的内容，使其颜色跟随被标记图形的描边。
   */
  'context-stroke': unknown;
}

interface CssPaintBox {
  /**
   * `fill-box`：以对象边界框（填充区域）为参考框；对 CSS 盒模型元素等同于 `content-box`。
   */
  'fill-box': unknown;
  /**
   * `stroke-box`：以描边边界框（含描边宽度）为参考框；对 CSS 盒模型元素等同于 `border-box`。
   */
  'stroke-box': unknown;
}

interface CssPosition {
  /**
   * `left`：水平方向取左边缘（相当于 0%）；可后接偏移量表示距左边缘的距离。
   */
  left: unknown;
  /**
   * `center`：取中间位置（相当于 50%）；单独出现时水平和垂直都居中。
   */
  center: unknown;
  /**
   * `right`：水平方向取右边缘（相当于 100%）；可后接偏移量表示距右边缘的距离。
   */
  right: unknown;
  /**
   * `top`：垂直方向取上边缘（相当于 0%）；可后接偏移量表示距上边缘的距离。
   */
  top: unknown;
  /**
   * `bottom`：垂直方向取下边缘（相当于 100%）；可后接偏移量表示距下边缘的距离。
   */
  bottom: unknown;
}

interface CssPositionArea {
  /**
   * `left`：取网格最左一列，即锚点左侧的区域。
   */
  left: unknown;
  /**
   * `center`：取中间一行或一列，与锚点在该方向上的范围对齐；单独使用时水平和垂直都取中间格。
   */
  center: unknown;
  /**
   * `right`：取网格最右一列，即锚点右侧的区域。
   */
  right: unknown;
  /**
   * `span-left`：跨越左列和中间列两格，从包含块左边缘延伸到锚点右边缘。
   */
  'span-left': unknown;
  /**
   * `span-right`：跨越中间列和右列两格，从锚点左边缘延伸到包含块右边缘。
   */
  'span-right': unknown;
  /**
   * `x-start`：取水平方向的起始列，按包含块的书写模式；从左到右时是左列，从右到左时是右列。
   */
  'x-start': unknown;
  /**
   * `x-end`：取水平方向的结束列，按包含块的书写模式；从左到右时是右列，从右到左时是左列。
   */
  'x-end': unknown;
  /**
   * `span-x-start`：跨越中间列和水平起始列两格，按包含块的书写模式。
   */
  'span-x-start': unknown;
  /**
   * `span-x-end`：跨越中间列和水平结束列两格，按包含块的书写模式。
   */
  'span-x-end': unknown;
  /**
   * `x-self-start`：取水平方向的起始列，按元素自身的书写模式，而不是包含块的。
   */
  'x-self-start': unknown;
  /**
   * `x-self-end`：取水平方向的结束列，按元素自身的书写模式，而不是包含块的。
   */
  'x-self-end': unknown;
  /**
   * `span-x-self-start`：跨越中间列和水平起始列两格，按元素自身的书写模式。
   */
  'span-x-self-start': unknown;
  /**
   * `span-x-self-end`：跨越中间列和水平结束列两格，按元素自身的书写模式。
   */
  'span-x-self-end': unknown;
  /**
   * `span-all`：跨越该方向上的全部三格，即包含块在该方向的整个范围；单独使用时两个方向都铺满。
   */
  'span-all': unknown;
  /**
   * `top`：取网格最上面一行，即锚点上方的区域。
   */
  top: unknown;
  /**
   * `bottom`：取网格最下面一行，即锚点下方的区域。
   */
  bottom: unknown;
  /**
   * `span-top`：跨越上行和中间行两格，从包含块上边缘延伸到锚点下边缘。
   */
  'span-top': unknown;
  /**
   * `span-bottom`：跨越中间行和下行两格，从锚点上边缘延伸到包含块下边缘。
   */
  'span-bottom': unknown;
  /**
   * `y-start`：取垂直方向的起始行，按包含块的书写模式；横排文字下是上方一行。
   */
  'y-start': unknown;
  /**
   * `y-end`：取垂直方向的结束行，按包含块的书写模式；横排文字下是下方一行。
   */
  'y-end': unknown;
  /**
   * `span-y-start`：跨越中间行和垂直起始行两格，按包含块的书写模式。
   */
  'span-y-start': unknown;
  /**
   * `span-y-end`：跨越中间行和垂直结束行两格，按包含块的书写模式。
   */
  'span-y-end': unknown;
  /**
   * `y-self-start`：取垂直方向的起始行，按元素自身的书写模式，而不是包含块的。
   */
  'y-self-start': unknown;
  /**
   * `y-self-end`：取垂直方向的结束行，按元素自身的书写模式，而不是包含块的。
   */
  'y-self-end': unknown;
  /**
   * `span-y-self-start`：跨越中间行和垂直起始行两格，按元素自身的书写模式。
   */
  'span-y-self-start': unknown;
  /**
   * `span-y-self-end`：跨越中间行和垂直结束行两格，按元素自身的书写模式。
   */
  'span-y-self-end': unknown;
  /**
   * `block-start`：取块方向的起始侧（行或列），按包含块的书写模式；横排文字下是上方一行。
   */
  'block-start': unknown;
  /**
   * `block-end`：取块方向的结束侧（行或列），按包含块的书写模式；横排文字下是下方一行。
   */
  'block-end': unknown;
  /**
   * `span-block-start`：跨越中间和块方向起始侧两格，按包含块的书写模式。
   */
  'span-block-start': unknown;
  /**
   * `span-block-end`：跨越中间和块方向结束侧两格，按包含块的书写模式。
   */
  'span-block-end': unknown;
  /**
   * `inline-start`：取行内方向的起始侧（行或列），按包含块的书写模式；从左到右时是左侧一列。
   */
  'inline-start': unknown;
  /**
   * `inline-end`：取行内方向的结束侧（行或列），按包含块的书写模式；从左到右时是右侧一列。
   */
  'inline-end': unknown;
  /**
   * `span-inline-start`：跨越中间和行内方向起始侧两格，按包含块的书写模式。
   */
  'span-inline-start': unknown;
  /**
   * `span-inline-end`：跨越中间和行内方向结束侧两格，按包含块的书写模式。
   */
  'span-inline-end': unknown;
  /**
   * `self-block-start`：取块方向的起始侧，按元素自身的书写模式，而不是包含块的。
   */
  'self-block-start': unknown;
  /**
   * `self-block-end`：取块方向的结束侧，按元素自身的书写模式，而不是包含块的。
   */
  'self-block-end': unknown;
  /**
   * `span-self-block-start`：跨越中间和块方向起始侧两格，按元素自身的书写模式。
   */
  'span-self-block-start': unknown;
  /**
   * `span-self-block-end`：跨越中间和块方向结束侧两格，按元素自身的书写模式。
   */
  'span-self-block-end': unknown;
  /**
   * `self-inline-start`：取行内方向的起始侧，按元素自身的书写模式，而不是包含块的。
   */
  'self-inline-start': unknown;
  /**
   * `self-inline-end`：取行内方向的结束侧，按元素自身的书写模式，而不是包含块的。
   */
  'self-inline-end': unknown;
  /**
   * `span-self-inline-start`：跨越中间和行内方向起始侧两格，按元素自身的书写模式。
   */
  'span-self-inline-start': unknown;
  /**
   * `span-self-inline-end`：跨越中间和行内方向结束侧两格，按元素自身的书写模式。
   */
  'span-self-inline-end': unknown;
  /**
   * `start`：取起始侧的格子，按包含块的书写模式；所属方向由搭配的另一个关键字决定，单独使用时两个方向都取起始侧。
   */
  start: unknown;
  /**
   * `end`：取结束侧的格子，按包含块的书写模式；所属方向由搭配的另一个关键字决定，单独使用时两个方向都取结束侧。
   */
  end: unknown;
  /**
   * `span-start`：跨越中间和起始侧两格，按包含块的书写模式；所属方向由搭配的另一个关键字决定。
   */
  'span-start': unknown;
  /**
   * `span-end`：跨越中间和结束侧两格，按包含块的书写模式；所属方向由搭配的另一个关键字决定。
   */
  'span-end': unknown;
  /**
   * `self-start`：取起始侧的格子，按元素自身的书写模式；所属方向由搭配的另一个关键字决定，单独使用时两个方向都取起始侧。
   */
  'self-start': unknown;
  /**
   * `self-end`：取结束侧的格子，按元素自身的书写模式；所属方向由搭配的另一个关键字决定，单独使用时两个方向都取结束侧。
   */
  'self-end': unknown;
  /**
   * `span-self-start`：跨越中间和起始侧两格，按元素自身的书写模式；所属方向由搭配的另一个关键字决定。
   */
  'span-self-start': unknown;
  /**
   * `span-self-end`：跨越中间和结束侧两格，按元素自身的书写模式；所属方向由搭配的另一个关键字决定。
   */
  'span-self-end': unknown;
}

interface CssQuote {
  /**
   * `open-quote`：插入开引号，具体符号由 `quotes` 按当前嵌套层级决定，并使嵌套层级加一。
   */
  'open-quote': unknown;
  /**
   * `close-quote`：插入闭引号，具体符号由 `quotes` 按当前嵌套层级决定，并使嵌套层级减一。
   */
  'close-quote': unknown;
  /**
   * `no-open-quote`：不插入任何符号，但嵌套层级照样加一，用于跨元素保持引号层级一致。
   */
  'no-open-quote': unknown;
  /**
   * `no-close-quote`：不插入任何符号，但嵌套层级照样减一，用于跨元素保持引号层级一致。
   */
  'no-close-quote': unknown;
}

interface CssRelativeSize {
  /**
   * `larger`：比父元素的字号大一档，具体倍数由浏览器决定。
   */
  larger: unknown;
  /**
   * `smaller`：比父元素的字号小一档，具体倍数由浏览器决定。
   */
  smaller: unknown;
}

interface CssRepeatStyle {
  /**
   * `repeat-x`：只在水平方向平铺，垂直方向不重复，等同于 `repeat no-repeat`。
   */
  'repeat-x': unknown;
  /**
   * `repeat-y`：只在垂直方向平铺，水平方向不重复，等同于 `no-repeat repeat`。
   */
  'repeat-y': unknown;
  /**
   * `repeat`：沿对应方向不断平铺，末尾的图片可能被裁掉一部分；这是背景图的初始值。
   */
  repeat: unknown;
  /**
   * `space`：尽量多放整张图而不裁剪，把剩余空间均匀分到图片之间。
   */
  space: unknown;
  /**
   * `round`：按需缩放图片，使整数张图正好铺满该方向，不裁剪也不留空隙。
   */
  round: unknown;
  /**
   * `no-repeat`：不平铺，该方向只绘制一张图。
   */
  'no-repeat': unknown;
}

interface CssSelfPosition {
  /**
   * `center`：将项目在对齐容器内居中。
   */
  center: unknown;
  /**
   * `start`：对齐到对齐容器的起始侧，方向取自容器的书写模式。
   */
  start: unknown;
  /**
   * `end`：对齐到对齐容器的结束侧，方向取自容器的书写模式。
   */
  end: unknown;
  /**
   * `self-start`：对齐到项目自身书写模式的起始侧；项目与容器书写方向不同时，结果与 `start` 不同。
   */
  'self-start': unknown;
  /**
   * `self-end`：对齐到项目自身书写模式的结束侧；项目与容器书写方向不同时，结果与 `end` 不同。
   */
  'self-end': unknown;
  /**
   * `flex-start`：在 Flex 布局中对齐到对应轴的起始侧，随 Flex 方向变化；在其他布局中等同于 `start`。
   */
  'flex-start': unknown;
  /**
   * `flex-end`：在 Flex 布局中对齐到对应轴的结束侧，随 Flex 方向变化；在其他布局中等同于 `end`。
   */
  'flex-end': unknown;
}

interface CssShadow {
  /**
   * `inset`：把阴影画在边框内侧（背景之上、内容之下），使元素看起来向内凹陷，而不是向外投影。
   */
  inset: unknown;
}

interface CssShapeBox {
  /**
   * `margin-box`：以外边距边缘围成的框为参考框，范围包含外边距、边框和内边距。
   */
  'margin-box': unknown;
}

interface CssSingleAnimation {
  /**
   * `none`：不引用任何 `@keyframes`，该动画不产生效果；在简写里相当于动画名为 `none`。
   */
  none: unknown;
}

interface CssSingleAnimationComposition {
  /**
   * `replace`：动画值直接覆盖底层值，不做叠加；这是初始值。
   */
  replace: unknown;
  /**
   * `add`：动画值与底层值相加；列表型的值（如 `transform`）是把动画值追加到底层值之后。
   */
  add: unknown;
  /**
   * `accumulate`：动画值累积到底层值上；数值相加，列表型的值（如 `transform`）则按对应项逐项累积，与 `add` 的追加方式不同。
   */
  accumulate: unknown;
}

interface CssSingleAnimationDirection {
  /**
   * `normal`：每次循环都从 0% 播放到 100%。
   */
  normal: unknown;
  /**
   * `reverse`：每次循环都从 100% 倒放到 0%。
   */
  reverse: unknown;
  /**
   * `alternate`：奇数次循环正向播放，偶数次反向播放，来回往复。
   */
  alternate: unknown;
  /**
   * `alternate-reverse`：奇数次循环反向播放，偶数次正向播放，与 `alternate` 起点相反。
   */
  'alternate-reverse': unknown;
}

interface CssSingleAnimationFillMode {
  /**
   * `none`：动画只在运行期间影响元素：延迟期间保持原样式，结束后恢复原样式。
   */
  none: unknown;
  /**
   * `forwards`：动画结束后保持最后一个关键帧的值，不回退到原样式。
   */
  forwards: unknown;
  /**
   * `backwards`：延迟期间就先应用第一个关键帧的值，而不是等动画开始。
   */
  backwards: unknown;
  /**
   * `both`：同时具备 `forwards` 与 `backwards`：延迟期间应用起始值，结束后保持末尾值。
   */
  both: unknown;
}

interface CssSingleAnimationIterationCount {
  /**
   * `infinite`：无限次重复播放，直到动画被移除。
   */
  infinite: unknown;
}

interface CssSingleAnimationPlayState {
  /**
   * `running`：动画正常播放。
   */
  running: unknown;
  /**
   * `paused`：暂停在当前进度；改回 `running` 后从暂停处继续，不会重头开始。
   */
  paused: unknown;
}

interface CssSingleAnimationTimeline {
  /**
   * `auto`：使用默认的文档时间轴，动画随时间推进；这是初始值。
   */
  auto: unknown;
  /**
   * `none`：不关联任何时间轴，动画不会推进。
   */
  none: unknown;
}

interface CssSingleTransition {
  /**
   * `none`：不对任何属性做过渡，相当于 `transition-property: none`。
   */
  none: unknown;
}

interface CssSingleTransitionProperty {
  /**
   * `all`：对所有可过渡的属性生效，任何一个变化都会产生过渡；这是初始值。
   */
  all: unknown;
}

interface CssStepEasingFunction {
  /**
   * `step-start`：等同于 `steps(1, jump-start)`：一开始就立刻跳到结束状态，之后保持不变。
   */
  'step-start': unknown;
  /**
   * `step-end`：等同于 `steps(1, jump-end)`：保持起始状态直到结束时刻，再一次性跳到结束状态。
   */
  'step-end': unknown;
}

interface CssSystemColor {
  /**
   * `AccentColor`：系统强调色，用于选中、激活状态的控件背景（如已勾选的复选框）。
   */
  AccentColor: unknown;
  /**
   * `AccentColorText`：放在 `AccentColor` 背景上的文字颜色。
   */
  AccentColorText: unknown;
  /**
   * `ActiveText`：活动状态（正被点击）链接的文字颜色。
   */
  ActiveText: unknown;
  /**
   * `ButtonBorder`：按钮等控件的边框颜色。
   */
  ButtonBorder: unknown;
  /**
   * `ButtonFace`：按钮等控件的背景颜色。
   */
  ButtonFace: unknown;
  /**
   * `ButtonText`：按钮等控件上的文字颜色。
   */
  ButtonText: unknown;
  /**
   * `Canvas`：页面（文档画布）的背景颜色，随浅色或深色主题变化。
   */
  Canvas: unknown;
  /**
   * `CanvasText`：页面上的默认文字颜色，与 `Canvas` 搭配使用。
   */
  CanvasText: unknown;
  /**
   * `Field`：输入框等表单字段的背景颜色。
   */
  Field: unknown;
  /**
   * `FieldText`：输入框等表单字段中的文字颜色。
   */
  FieldText: unknown;
  /**
   * `GrayText`：禁用或次要文字使用的灰色。
   */
  GrayText: unknown;
  /**
   * `Highlight`：被选中内容（如选中的文本）的背景颜色。
   */
  Highlight: unknown;
  /**
   * `HighlightText`：被选中内容中的文字颜色，与 `Highlight` 搭配使用。
   */
  HighlightText: unknown;
  /**
   * `LinkText`：未访问链接的文字颜色。
   */
  LinkText: unknown;
  /**
   * `Mark`：高亮标记文本（如 `<mark>`）的背景颜色。
   */
  Mark: unknown;
  /**
   * `MarkText`：高亮标记文本中的文字颜色，与 `Mark` 搭配使用。
   */
  MarkText: unknown;
  /**
   * `SelectedItem`：列表、菜单等控件中选中项的背景颜色。
   */
  SelectedItem: unknown;
  /**
   * `SelectedItemText`：列表、菜单等控件中选中项的文字颜色，与 `SelectedItem` 搭配使用。
   */
  SelectedItemText: unknown;
  /**
   * `VisitedText`：已访问链接的文字颜色。
   */
  VisitedText: unknown;
}

interface CssSystemFamilyName {
  /**
   * `caption`：取按钮等控件所用的系统字体；`font` 简写会整体采用其字号、字重等设置，而不只是字体族。
   */
  caption: unknown;
  /**
   * `icon`：取图标标签所用的系统字体；`font` 简写会整体采用其字号、字重等设置，而不只是字体族。
   */
  icon: unknown;
  /**
   * `menu`：取菜单所用的系统字体；`font` 简写会整体采用其字号、字重等设置，而不只是字体族。
   */
  menu: unknown;
  /**
   * `message-box`：取对话框所用的系统字体；`font` 简写会整体采用其字号、字重等设置，而不只是字体族。
   */
  'message-box': unknown;
  /**
   * `small-caption`：取小控件标签所用的系统字体；`font` 简写会整体采用其字号、字重等设置，而不只是字体族。
   */
  'small-caption': unknown;
  /**
   * `status-bar`：取窗口状态栏所用的系统字体；`font` 简写会整体采用其字号、字重等设置，而不只是字体族。
   */
  'status-bar': unknown;
}

interface CssTimelineRangeName {
  /**
   * `cover`：覆盖整个可见过程：从主体刚开始进入滚动容器可视区域，到完全离开为止。
   */
  cover: unknown;
  /**
   * `contain`：主体完整位于可视区域内的区间；主体比可视区域大时，则为它完全盖住可视区域的区间。
   */
  contain: unknown;
  /**
   * `entry`：主体进入可视区域的区间：从刚开始露头，到完全进入（或完全盖住可视区域）为止。
   */
  entry: unknown;
  /**
   * `exit`：主体离开可视区域的区间：从开始离开，到完全离开为止。
   */
  exit: unknown;
  /**
   * `entry-crossing`：主体越过滚动容器结束侧边缘的区间：从前沿到达该边缘，到后沿越过该边缘；按主体自身尺寸计算，与 `entry` 在主体较大时不同。
   */
  'entry-crossing': unknown;
  /**
   * `exit-crossing`：主体越过滚动容器起始侧边缘的区间：从前沿到达该边缘，到后沿越过该边缘；按主体自身尺寸计算，与 `exit` 在主体较大时不同。
   */
  'exit-crossing': unknown;
}

interface CssTrackBreadth {
  /**
   * `min-content`：轨道取其中项目的最小内容尺寸，即内容不溢出时能缩到的最小尺寸。
   */
  'min-content': unknown;
  /**
   * `max-content`：轨道取其中项目的最大内容尺寸，即内容不换行、不折叠时的自然尺寸。
   */
  'max-content': unknown;
  /**
   * `auto`：由内容决定：作为最大值时等同 `max-content`，作为最小值时取项目的最小贡献；有剩余空间时还会被拉伸分担。
   */
  auto: unknown;
}

interface CssTransitionBehaviorValue {
  /**
   * `normal`：只对可连续插值的属性做过渡，`display` 这类离散值属性的变化直接生效，不产生过渡；这是初始值。
   */
  normal: unknown;
  /**
   * `allow-discrete`：也允许对离散值属性（如 `display`、`visibility`）启动过渡，值会在过渡过程中的某个时刻翻转。
   */
  'allow-discrete': unknown;
}

interface CssTrySize {
  /**
   * `most-width`：在候选回退位置中选能给元素提供最大宽度的那个；用于 `position-try-order`。
   */
  'most-width': unknown;
  /**
   * `most-height`：在候选回退位置中选能给元素提供最大高度的那个；用于 `position-try-order`。
   */
  'most-height': unknown;
  /**
   * `most-block-size`：在候选回退位置中选块方向可用尺寸最大的那个，横排文字下即高度；用于 `position-try-order`。
   */
  'most-block-size': unknown;
  /**
   * `most-inline-size`：在候选回退位置中选行内方向可用尺寸最大的那个，横排文字下即宽度；用于 `position-try-order`。
   */
  'most-inline-size': unknown;
}

interface CssTryTactic {
  /**
   * `flip-block`：沿块方向翻转位置，例如把元素从锚点上方换到下方。
   */
  'flip-block': unknown;
  /**
   * `flip-inline`：沿行内方向翻转位置，例如把元素从锚点左侧换到右侧。
   */
  'flip-inline': unknown;
  /**
   * `flip-start`：沿对角线翻转：交换块方向和行内方向的起始侧，例如 `top` 与 `left` 对调。
   */
  'flip-start': unknown;
}

interface CssVisualBox {
  /**
   * `content-box`：以内容区边缘为参考框，不含内边距和边框。
   */
  'content-box': unknown;
  /**
   * `padding-box`：以内边距边缘为参考框，含内边距，不含边框。
   */
  'padding-box': unknown;
  /**
   * `border-box`：以边框外缘为参考框，含内边距和边框。
   */
  'border-box': unknown;
}

interface CssWideKeywords {
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `revert`：撤销作者样式，回退到用户样式或浏览器默认样式中的值。
   */
  revert: unknown;
  /**
   * `revert-layer`：撤销当前级联层中设置的值，回退到更低优先级的级联层（`@layer`）中的值。
   */
  'revert-layer': unknown;
}

interface CursorValues {
  /**
   * `-webkit-grab`：张开的抓手光标，早期 WebKit 的前缀写法，已被标准的 `grab` 取代。
   */
  '-webkit-grab': unknown;
  /**
   * `-webkit-grabbing`：握紧的抓手光标，表示正在拖拽，早期 WebKit 的前缀写法，已被标准的 `grabbing` 取代。
   */
  '-webkit-grabbing': unknown;
  /**
   * `alias`：表示将为被拖动的对象创建别名或快捷方式。
   */
  alias: unknown;
  /**
   * `all-scroll`：表示可向任意方向滚动或平移，通常显示为四向箭头。
   */
  'all-scroll': unknown;
  /**
   * `auto`：由浏览器根据上下文自动选择光标，例如在文本上显示 I 形光标。
   */
  auto: unknown;
  /**
   * `cell`：表示可选中表格单元格，通常显示为粗十字。
   */
  cell: unknown;
  /**
   * `col-resize`：表示可左右拖动以调整列宽，通常显示为中间带竖线的左右双向箭头。
   */
  'col-resize': unknown;
  /**
   * `context-menu`：表示点击后将弹出上下文菜单。
   */
  'context-menu': unknown;
  /**
   * `copy`：表示将复制被拖动的对象。
   */
  copy: unknown;
  /**
   * `crosshair`：十字准星，用于需要精确定位的场景，如绘图或截图选区。
   */
  crosshair: unknown;
  /**
   * `default`：默认的箭头光标。
   */
  default: unknown;
  /**
   * `e-resize`：表示可向东（右）调整边缘位置，显示为指向右的箭头。
   */
  'e-resize': unknown;
  /**
   * `ew-resize`：表示可水平调整，显示为左右双向箭头。
   */
  'ew-resize': unknown;
  /**
   * `grab`：张开的手，表示对象可以被抓取并拖动。
   */
  grab: unknown;
  /**
   * `grabbing`：握紧的手，表示对象正在被拖动。
   */
  grabbing: unknown;
  /**
   * `help`：通常显示为带问号的光标，表示此处有帮助信息。
   */
  help: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `move`：表示对象可以被移动，通常显示为四向箭头。
   */
  move: unknown;
  /**
   * `n-resize`：表示可向北（上）调整边缘位置，显示为指向上的箭头。
   */
  'n-resize': unknown;
  /**
   * `ne-resize`：表示可向东北（右上）调整边缘位置，显示为指向右上的箭头。
   */
  'ne-resize': unknown;
  /**
   * `nesw-resize`：表示可沿东北—西南方向的对角线双向调整。
   */
  'nesw-resize': unknown;
  /**
   * `no-drop`：表示当前位置不能放下被拖动的对象。
   */
  'no-drop': unknown;
  /**
   * `none`：不显示光标。
   */
  none: unknown;
  /**
   * `not-allowed`：表示该操作不被允许，通常显示为禁止符号。
   */
  'not-allowed': unknown;
  /**
   * `ns-resize`：表示可垂直调整，显示为上下双向箭头。
   */
  'ns-resize': unknown;
  /**
   * `nw-resize`：表示可向西北（左上）调整边缘位置，显示为指向左上的箭头。
   */
  'nw-resize': unknown;
  /**
   * `nwse-resize`：表示可沿西北—东南方向的对角线双向调整。
   */
  'nwse-resize': unknown;
  /**
   * `pointer`：手形光标，表示链接或其他可点击的元素。
   */
  pointer: unknown;
  /**
   * `progress`：表示程序正在后台处理，但用户仍可继续操作，通常是箭头加转圈。
   */
  progress: unknown;
  /**
   * `row-resize`：表示可上下拖动以调整行高，通常显示为中间带横线的上下双向箭头。
   */
  'row-resize': unknown;
  /**
   * `s-resize`：表示可向南（下）调整边缘位置，显示为指向下的箭头。
   */
  's-resize': unknown;
  /**
   * `se-resize`：表示可向东南（右下）调整边缘位置，显示为指向右下的箭头。
   */
  'se-resize': unknown;
  /**
   * `sw-resize`：表示可向西南（左下）调整边缘位置，显示为指向左下的箭头。
   */
  'sw-resize': unknown;
  /**
   * `text`：I 形光标，表示此处文本可以选择或编辑。
   */
  text: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `vertical-text`：横置的 I 形光标，表示此处是竖排文本。
   */
  'vertical-text': unknown;
  /**
   * `w-resize`：表示可向西（左）调整边缘位置，显示为指向左的箭头。
   */
  'w-resize': unknown;
  /**
   * `wait`：表示程序正忙、暂时无法交互，通常显示为沙漏或转圈。
   */
  wait: unknown;
  /**
   * `zoom-in`：表示点击后将放大内容。
   */
  'zoom-in': unknown;
  /**
   * `zoom-out`：表示点击后将缩小内容。
   */
  'zoom-out': unknown;
}

interface DirectionValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `ltr`：文本和行内内容的基本方向为从左到右，是默认值。
   */
  ltr: unknown;
  /**
   * `rtl`：基本方向为从右到左，用于阿拉伯语、希伯来语等；Flex、Grid、表格的行内方向会随之翻转。
   */
  rtl: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface DisplayInsideValues {
  /**
   * `auto`：由浏览器按元素类型决定内部布局方式。早期草案属性，浏览器不支持。
   */
  auto: unknown;
  /**
   * `block`：元素内部使用块布局（普通流）。早期草案属性，浏览器不支持。
   */
  block: unknown;
  /**
   * `flex`：元素内部使用弹性盒布局。早期草案属性，浏览器不支持。
   */
  flex: unknown;
  /**
   * `grid`：元素内部使用网格布局。早期草案属性，浏览器不支持。
   */
  grid: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `ruby`：元素内部使用 ruby 注音布局。早期草案属性，浏览器不支持。
   */
  ruby: unknown;
  /**
   * `table`：元素内部使用表格布局。早期草案属性，浏览器不支持。
   */
  table: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface DisplayListValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `list-item`：元素生成列表项标记（如圆点、序号），相当于 `display: list-item`。早期草案属性，浏览器不支持。
   */
  'list-item': unknown;
  /**
   * `none`：元素不生成列表项标记，按普通盒子显示。早期草案属性，浏览器不支持。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface DisplayOutsideValues {
  /**
   * `block-level`：元素对外表现为块级盒子，独占一行并沿块方向堆叠。早期草案属性，浏览器不支持。
   */
  'block-level': unknown;
  /**
   * `contents`：元素自身不生成盒子，子元素和文本直接参与外层布局，相当于 `display: contents`。早期草案属性，浏览器不支持。
   */
  contents: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline-level`：元素对外表现为行内级盒子，与相邻行内内容排在同一行。早期草案属性，浏览器不支持。
   */
  'inline-level': unknown;
  /**
   * `none`：元素及其后代都不生成盒子，相当于 `display: none`。早期草案属性，浏览器不支持。
   */
  none: unknown;
  /**
   * `ruby-base`：元素对外作为注音的基文字盒，对应 `display: ruby-base`。早期草案属性，浏览器不支持。
   */
  'ruby-base': unknown;
  /**
   * `ruby-base-container`：元素对外作为注音基文字的容器，对应 `display: ruby-base-container`。早期草案属性，浏览器不支持。
   */
  'ruby-base-container': unknown;
  /**
   * `ruby-text`：元素对外作为注音的注释文字盒，对应 `display: ruby-text`。早期草案属性，浏览器不支持。
   */
  'ruby-text': unknown;
  /**
   * `ruby-text-container`：元素对外作为注音注释文字的容器，对应 `display: ruby-text-container`。早期草案属性，浏览器不支持。
   */
  'ruby-text-container': unknown;
  /**
   * `run-in`：元素对外表现为插入型盒子：随后是块盒时，并入该块的开头作为行内内容；该值已从规范中移除。早期草案属性，浏览器不支持。
   */
  'run-in': unknown;
  /**
   * `table-caption`：元素对外作为表格标题，对应 `display: table-caption`。早期草案属性，浏览器不支持。
   */
  'table-caption': unknown;
  /**
   * `table-cell`：元素对外作为表格单元格，对应 `display: table-cell`。早期草案属性，浏览器不支持。
   */
  'table-cell': unknown;
  /**
   * `table-column`：元素对外作为表格列，对应 `display: table-column`。早期草案属性，浏览器不支持。
   */
  'table-column': unknown;
  /**
   * `table-column-group`：元素对外作为表格列组，对应 `display: table-column-group`。早期草案属性，浏览器不支持。
   */
  'table-column-group': unknown;
  /**
   * `table-footer-group`：元素对外作为表格页脚行组，对应 `display: table-footer-group`。早期草案属性，浏览器不支持。
   */
  'table-footer-group': unknown;
  /**
   * `table-header-group`：元素对外作为表格表头行组，对应 `display: table-header-group`。早期草案属性，浏览器不支持。
   */
  'table-header-group': unknown;
  /**
   * `table-row`：元素对外作为表格行，对应 `display: table-row`。早期草案属性，浏览器不支持。
   */
  'table-row': unknown;
  /**
   * `table-row-group`：元素对外作为表格行组，对应 `display: table-row-group`。早期草案属性，浏览器不支持。
   */
  'table-row-group': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface DisplayValues {
  /**
   * `-webkit-box`：旧版弹性盒容器，非标准的前缀写法；常配合 `WebkitLineClamp` 与 `WebkitBoxOrient: 'vertical'` 做多行文本截断，新布局请用 `flex`。
   */
  '-webkit-box': unknown;
  /**
   * `block`：生成块级盒子，内部默认采用普通流布局。
   */
  block: unknown;
  /**
   * `contents`：通常不生成元素自身的主盒子，让子盒子参与外层布局；背景、边框等失去承载盒，应核对可访问性行为。替换元素等存在特殊规则；应检查语义和可访问性，不要把它当作无条件删除包装盒的替代。
   */
  contents: unknown;
  /**
   * `flex`：生成块级弹性容器，直接子元素参与 Flex 布局。默认主轴为 row，默认不换行；主轴方向还受书写方向影响。inline-flex 使用相同的内部布局，但容器对外按行内级盒子排列。
   */
  flex: unknown;
  /**
   * `flow-root`：建立独立块格式化上下文，可包住内部浮动并隔离部分外边距折叠。与普通 block 相比，显式建立独立块格式化上下文；无需借助 overflow:hidden，也不会因此裁剪溢出。
   */
  'flow-root': unknown;
  /**
   * `grid`：生成块级网格容器，直接子元素参与 Grid 布局。Flex 更侧重单个主轴；Grid 可以同时控制行和列。inline-grid 则改变容器对外的显示类型。
   */
  grid: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline`：生成行内盒子，参与行内排版；普通非替换行内盒子的宽高不按块盒规则应用。
   */
  inline: unknown;
  /**
   * `inline-block`：外部参与行内排版，内部建立独立格式化上下文，可设置宽高。相邻行内级盒子之间的文本空白仍可能形成间距，vertical-align 会影响它在行内的位置。与 inline 相比可设置宽高，内部建立独立格式化上下文；与 inline-flex 相比，内部使用普通流而非 Flex。
   */
  'inline-block': unknown;
  /**
   * `inline-flex`：创建行内级的 Flex 容器。子项换行由 flex-wrap 控制。当容器自身是 Flex/Grid 项目时，其外部排版还受父布局控制。与 flex 的区别是容器自身的外部排版方式，内部弹性布局机制相同；inline-flex 对应双关键字写法 inline flex。
   */
  'inline-flex': unknown;
  /**
   * `inline-grid`：生成行内级网格容器，内部仍使用 Grid 布局。与 grid 的内部网格布局相同，但容器在普通流中按行内级盒子排列。
   */
  'inline-grid': unknown;
  /**
   * `inline-list-item`：等同 `inline list-item`：行内级的列表项，会生成列表标记；浏览器支持有限。
   */
  'inline-list-item': unknown;
  /**
   * `inline-table`：等同 `inline table`：像行内元素一样参与行排版，内部使用表格布局。
   */
  'inline-table': unknown;
  /**
   * `list-item`：生成带列表标记的主盒子，标记由 list-style 等属性控制。
   */
  'list-item': unknown;
  /**
   * `none`：不生成元素及其后代的布局盒子，通常也从可访问性树中移除。不能靠它保留可聚焦交互；重新显示时需按组件需求管理焦点。visibility:hidden 通常保留布局空间；opacity:0 只改变透明度，通常仍能交互。
   */
  none: unknown;
  /**
   * `ruby`：生成一个 ruby 容器，用于排版注音（如拼音、假名），其子元素需配合 `ruby-base`、`ruby-text` 等内部值。
   */
  ruby: unknown;
  /**
   * `ruby-base`：表现为 `<rb>`，是 ruby 注音结构中的被注文字部分；只在 ruby 容器内有意义。
   */
  'ruby-base': unknown;
  /**
   * `ruby-base-container`：表现为 `<rbc>`，包裹 ruby 注音结构中的各个被注文字；只在 ruby 容器内有意义。
   */
  'ruby-base-container': unknown;
  /**
   * `ruby-text`：表现为 `<rt>`，是 ruby 注音结构中的注音文字；只在 ruby 容器内有意义。
   */
  'ruby-text': unknown;
  /**
   * `ruby-text-container`：表现为 `<rtc>`，包裹 ruby 注音结构中的各段注音文字；只在 ruby 容器内有意义。
   */
  'ruby-text-container': unknown;
  /**
   * `run-in`：让元素并入其后块级兄弟的第一行，成为行内内容（嵌入式标题）；现代浏览器基本不支持。
   */
  'run-in': unknown;
  /**
   * `table`：让元素表现为块级表格，等同 `<table>`；子元素可用 `table-row`、`table-cell` 等组成表格布局。
   */
  table: unknown;
  /**
   * `table-cell`：表现为表格单元格，等同 `<td>`。
   */
  'table-cell': unknown;
  /**
   * `table-column`：表现为表格的一列，等同 `<col>`；本身不渲染内容，只用来为整列设置样式。
   */
  'table-column': unknown;
  /**
   * `table-column-group`：表现为一组表格列，等同 `<colgroup>`。
   */
  'table-column-group': unknown;
  /**
   * `table-footer-group`：表现为表格的页脚行组，等同 `<tfoot>`，总是显示在表格行的最后。
   */
  'table-footer-group': unknown;
  /**
   * `table-header-group`：表现为表格的表头行组，等同 `<thead>`，总是显示在表格行的最前。
   */
  'table-header-group': unknown;
  /**
   * `table-row`：表现为表格的一行，等同 `<tr>`。
   */
  'table-row': unknown;
  /**
   * `table-row-group`：表现为表格的主体行组，等同 `<tbody>`。
   */
  'table-row-group': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface DominantBaselineValues {
  /**
   * `alphabetic`：以字母基线（拉丁字母底部）为主导基线，西文横排的常用对齐方式。
   */
  alphabetic: unknown;
  /**
   * `auto`：由浏览器按书写模式选择：横排用字母基线，竖排且字形直立时用 `central`。
   */
  auto: unknown;
  /**
   * `central`：以字符 em 盒垂直方向的中心为主导基线，竖排文字常用。
   */
  central: unknown;
  /**
   * `hanging`：以悬挂基线为主导基线，梵文、藏文等字形悬挂在这条线之下的文字使用。
   */
  hanging: unknown;
  /**
   * `ideographic`：以表意基线为主导基线，位于 CJK 等表意文字字形的底部。
   */
  ideographic: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `mathematical`：以数学基线为主导基线，用于数学公式排版。
   */
  mathematical: unknown;
  /**
   * `middle`：以字母基线上方约半个 x 高度处为主导基线，常用来让文字在垂直方向居中。
   */
  middle: unknown;
  /**
   * `no-change`：沿用父元素的主导基线，不重新计算；SVG 1.1 旧值，已废弃。
   */
  'no-change': unknown;
  /**
   * `reset-size`：沿用父元素的主导基线，并按当前字号重新计算基线表；SVG 1.1 旧值，已废弃。
   */
  'reset-size': unknown;
  /**
   * `text-after-edge`：以文本区域的下边缘为主导基线；SVG 1.1 旧值，已废弃，改用 `text-bottom`。
   */
  'text-after-edge': unknown;
  /**
   * `text-before-edge`：以文本区域的上边缘为主导基线；SVG 1.1 旧值，已废弃，改用 `text-top`。
   */
  'text-before-edge': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `use-script`：按文字所属书写系统选择默认基线；SVG 1.1 旧值，已废弃。
   */
  'use-script': unknown;
}

interface EmptyCellsValues {
  /**
   * `hide`：分离边框表格中，不绘制空单元格的边框和背景。
   */
  hide: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `show`：分离边框表格中，仍绘制空单元格的边框和背景，是默认值。
   */
  show: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FillRuleValues {
  /**
   * `evenodd`：按射线穿过路径次数的奇偶性判断内部，适合交叠或有孔路径。
   */
  evenodd: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `nonzero`：按有方向的绕数判断路径内部，子路径方向会影响结果。
   */
  nonzero: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FilterKeywords {
  /**
   * `none`：不应用任何滤镜。
   */
  none: unknown;
}

interface FlexBasisKeywords {
  /**
   * `content`：按内容确定基础尺寸，而不直接使用 width 或 height 作为基础尺寸。
   */
  content: unknown;
  /**
   * `auto`：先参考主轴对应的 width 或 height；该值也为 auto 时由内容决定。
   */
  auto: unknown;
}

interface FlexDirectionValues {
  /**
   * `column`：主轴沿块方向排列；水平书写时通常从上到下。
   */
  column: unknown;
  /**
   * `column-reverse`：反转块方向的视觉排列，不改变 DOM 顺序。
   */
  'column-reverse': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `row`：主轴沿行内方向排列；不一定是从左到右，取决于书写方向。
   */
  row: unknown;
  /**
   * `row-reverse`：反转行内方向的视觉排列，不改变 DOM 顺序。
   */
  'row-reverse': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FlexFlowValues {
  /**
   * `column`：主轴沿块方向排列；水平书写时通常从上到下。
   */
  column: unknown;
  /**
   * `column-reverse`：反转块方向的视觉排列，不改变 DOM 顺序。
   */
  'column-reverse': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `nowrap`：保持单行；项目仍可能收缩或溢出。
   */
  nowrap: unknown;
  /**
   * `row`：主轴沿行内方向排列；不一定是从左到右，取决于书写方向。
   */
  row: unknown;
  /**
   * `row-reverse`：反转行内方向的视觉排列，不改变 DOM 顺序。
   */
  'row-reverse': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `wrap`：空间不足时形成多行，沿交叉轴正常方向排列。换行不会自动均分每行项目宽度，尺寸仍由各项目的 flex 配置决定。nowrap 保持单行；wrap-reverse 反转交叉轴上各行的排列方向。
   */
  wrap: unknown;
  /**
   * `wrap-reverse`：允许换行并反转交叉轴上各行的排列方向。
   */
  'wrap-reverse': unknown;
}

interface FlexKeywords {
  /**
   * `none`：等价于 0 0 auto：不增长也不收缩，保留自动基础尺寸。auto 会增长和收缩；none 两者都不参与。
   */
  none: unknown;
  /**
   * `auto`：等价于 1 1 auto：可增长、可收缩，基础尺寸由主尺寸属性或内容决定。最终比例还受最小/最大尺寸约束，不保证所有项目等宽。1 1 0% 以零百分比为基础分配，auto 的基础尺寸通常受内容或主尺寸属性影响。
   */
  auto: unknown;
}

interface FlexWrapValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `nowrap`：保持单行；项目仍可能收缩或溢出。
   */
  nowrap: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `wrap`：空间不足时形成多行，沿交叉轴正常方向排列。换行不会自动均分每行项目宽度，尺寸仍由各项目的 flex 配置决定。nowrap 保持单行；wrap-reverse 反转交叉轴上各行的排列方向。
   */
  wrap: unknown;
  /**
   * `wrap-reverse`：允许换行并反转交叉轴上各行的排列方向。
   */
  'wrap-reverse': unknown;
}

interface FloatValues {
  /**
   * `end`：StyleX 类型里保留的写法，浏览器不认；按书写方向靠结束边浮动请用 `inline-end`。
   */
  end: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline-end`：元素浮动到行内结束侧，从左到右的文本中即右侧，其余内容在另一侧环绕。
   */
  'inline-end': unknown;
  /**
   * `inline-start`：元素浮动到行内起始侧，从左到右的文本中即左侧，其余内容在另一侧环绕。
   */
  'inline-start': unknown;
  /**
   * `left`：元素浮动到容器左侧，后续行内内容在其右侧环绕。
   */
  left: unknown;
  /**
   * `none`：元素不浮动，保持在正常文档流中，是默认值。
   */
  none: unknown;
  /**
   * `right`：元素浮动到容器右侧，后续行内内容在其左侧环绕。
   */
  right: unknown;
  /**
   * `start`：StyleX 类型里保留的写法，浏览器不认；按书写方向靠起始边浮动请用 `inline-start`。
   */
  start: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontFeatureSettingsKeywords {
  /**
   * `normal`：不额外开关 OpenType 特性，按字体和其他 `font-*` 属性的默认排版。
   */
  normal: unknown;
}

interface FontKerningValues {
  /**
   * `auto`：由浏览器决定是否应用字偶间距调整，通常默认启用。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：关闭字偶间距调整，字符按各自的默认字宽排列。
   */
  none: unknown;
  /**
   * `normal`：强制启用字体提供的字偶间距调整。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontLanguageOverrideKeywords {
  /**
   * `normal`：不覆盖，按文本实际语言（`lang`）选用字体的语言相关字形和规则。
   */
  normal: unknown;
}

interface FontOpticalSizingValues {
  /**
   * `auto`：浏览器按当前字号自动设置字体的光学尺寸轴（`opsz`），是默认值。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：不自动调整光学尺寸，字形保持字体的默认光学尺寸。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontPaletteKeywords {
  /**
   * `normal`：使用字体的默认调色板。
   */
  normal: unknown;
  /**
   * `light`：使用字体中标明适合浅色背景的调色板，没有则退回默认调色板。
   */
  light: unknown;
  /**
   * `dark`：使用字体中标明适合深色背景的调色板，没有则退回默认调色板。
   */
  dark: unknown;
}

interface FontSizeAdjustValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：不按字体特征调整字号，使用声明的 `fontSize`。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontSizeKeywords {
  /**
   * `math`：按 `math-depth` 对继承的字号做缩放，主要用于 MathML 上下标、分式等嵌套内容；较新的值，浏览器支持有限。
   */
  math: unknown;
}

interface FontStyleKeywords {
  /**
   * `normal`：使用字体的直立正体。
   */
  normal: unknown;
  /**
   * `italic`：使用字体的斜体字形；字体没有时退回倾斜字形，再没有则由浏览器合成。
   */
  italic: unknown;
  /**
   * `oblique`：使用倾斜字形，可后接角度，如 `oblique 10deg`；不写角度时默认为 `14deg`。
   */
  oblique: unknown;
}

interface FontStyleValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `italic`：使用字体的斜体字形；字体没有时退回倾斜字形，再没有则由浏览器合成。
   */
  italic: unknown;
  /**
   * `normal`：使用字体的直立正体。
   */
  normal: unknown;
  /**
   * `oblique`：使用倾斜字形，可后接角度，如 `oblique 10deg`；不写角度时默认为 `14deg`。
   */
  oblique: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontSynthesisKeywords {
  /**
   * `none`：禁止浏览器合成任何缺失的粗体、斜体、小型大写和上下标字形，缺少时直接用字体已有的字形。
   */
  none: unknown;
  /**
   * `weight`：字体没有粗体字形时，允许浏览器合成粗体；写在哪个值上，就允许合成哪一类。
   */
  weight: unknown;
  /**
   * `style`：字体没有斜体字形时，允许浏览器合成斜体。
   */
  style: unknown;
  /**
   * `small-caps`：字体没有小型大写字形时，允许浏览器合成小型大写字母。
   */
  'small-caps': unknown;
  /**
   * `position`：字体没有上标、下标字形时，允许浏览器缩小并平移普通字形来合成。
   */
  position: unknown;
}

interface FontSynthesisPositionValues {
  /**
   * `auto`：字体没有上标、下标字形时，允许浏览器缩小并平移普通字形来合成。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：禁止合成上标、下标字形，缺少时直接用字体已有的字形。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontSynthesisSmallCapsValues {
  /**
   * `auto`：字体没有原生小型大写字形时，允许浏览器缩小大写字母来合成小型大写。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：禁止合成小型大写；字体没有原生字形时，按普通字形显示。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontSynthesisStyleValues {
  /**
   * `auto`：字体没有斜体或倾斜字形时，允许浏览器把直立字形倾斜，合成伪斜体。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：禁止合成斜体，只使用字体自带的斜体字形；字体没有时保持直立。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontSynthesisWeightValues {
  /**
   * `auto`：字体没有对应粗体字形时，允许浏览器加粗已有字形，合成伪粗体。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：禁止合成粗体，只使用字体自带的字重；字体没有时保持原字重。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontVariantAlternatesKeywords {
  /**
   * `normal`：不启用任何替代字形，使用字体的默认字形。
   */
  normal: unknown;
  /**
   * `historical-forms`：使用字体提供的历史字形（OpenType `hist`），如旧式书写形态。
   */
  'historical-forms': unknown;
}

interface FontVariantCapsValues {
  /**
   * `all-petite-caps`：大写和小写字母都改用 petite 小型大写字形，需要字体提供 `c2pc` 特性。
   */
  'all-petite-caps': unknown;
  /**
   * `all-small-caps`：大写和小写字母都改用小型大写字形，需要字体提供 `c2sc` 特性。
   */
  'all-small-caps': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：不使用小型大写等特殊字形，字母按自身大小写显示。
   */
  normal: unknown;
  /**
   * `petite-caps`：小写字母改用比小型大写更小的 petite 小型大写字形，需要字体提供 `pcap` 特性。
   */
  'petite-caps': unknown;
  /**
   * `small-caps`：小写字母改用小型大写字形，大写字母保持不变；字体缺少该特性时可能由浏览器合成。
   */
  'small-caps': unknown;
  /**
   * `titling-caps`：使用标题专用大写字形，笔画通常更纤细，适合全大写的标题；需要字体提供 `titl` 特性。
   */
  'titling-caps': unknown;
  /**
   * `unicase`：大写字母改用小型大写字形，小写字母保持普通字形，得到大小写混合的统一视觉高度。
   */
  unicase: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontVariantEastAsianKeywords {
  /**
   * `normal`：不启用东亚字形变体，使用字体的默认字形和宽度。
   */
  normal: unknown;
  /**
   * `ruby`：使用适合注音（ruby）小字的东亚字形，主要影响日文假名（OpenType `ruby`）。
   */
  ruby: unknown;
}

interface FontVariantKeywords {
  /**
   * `normal`：所有 `font-variant-*` 子属性都取 `normal`，不启用任何变体字形。
   */
  normal: unknown;
  /**
   * `none`：关闭所有连字（等同 `font-variant-ligatures: none`），其余子属性取 `normal`。
   */
  none: unknown;
  /**
   * `historical-forms`：使用字体提供的历史字形（OpenType `hist`），属于 `font-variant-alternates` 的一部分。
   */
  'historical-forms': unknown;
  /**
   * `small-caps`：小写字母改用小型大写字形，大写字母保持不变。
   */
  'small-caps': unknown;
  /**
   * `all-small-caps`：大写和小写字母都改用小型大写字形。
   */
  'all-small-caps': unknown;
  /**
   * `petite-caps`：小写字母改用比小型大写更小的 petite 小型大写字形，需要字体提供 `pcap` 特性。
   */
  'petite-caps': unknown;
  /**
   * `all-petite-caps`：大写和小写字母都改用 petite 小型大写字形，需要字体提供 `c2pc` 特性。
   */
  'all-petite-caps': unknown;
  /**
   * `unicase`：大写字母改用小型大写字形，小写字母保持普通字形，得到大小写混合的统一视觉高度。
   */
  unicase: unknown;
  /**
   * `titling-caps`：使用标题专用大写字形，笔画通常更纤细，避免全大写标题显得过重；需要字体提供 `titl` 特性。
   */
  'titling-caps': unknown;
  /**
   * `ordinal`：使用序数标记专用字形，如 1st、2nd 中上标的字母（OpenType `ordn`）。
   */
  ordinal: unknown;
  /**
   * `slashed-zero`：数字零带斜线，避免与大写字母 O 混淆（OpenType `zero`）。
   */
  'slashed-zero': unknown;
  /**
   * `ruby`：使用适合注音（ruby）小字的东亚字形，主要影响日文假名（OpenType `ruby`）。
   */
  ruby: unknown;
}

interface FontVariantLigaturesKeywords {
  /**
   * `normal`：按字体默认启用常规连字和上下文替代，不启用可选连字和历史连字。
   */
  normal: unknown;
  /**
   * `none`：关闭所有连字和上下文替代，包括默认启用的常规连字。
   */
  none: unknown;
}

interface FontVariantNumericKeywords {
  /**
   * `normal`：不启用数字变体，使用字体的默认数字字形。
   */
  normal: unknown;
  /**
   * `ordinal`：使用序数标记专用字形，如 1st、2nd 中上标的字母（OpenType `ordn`）。
   */
  ordinal: unknown;
  /**
   * `slashed-zero`：数字零带斜线，避免与大写字母 O 混淆（OpenType `zero`）。
   */
  'slashed-zero': unknown;
}

interface FontVariantPositionValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：不使用上标或下标专用字形。
   */
  normal: unknown;
  /**
   * `sub`：使用字体提供的下标字形（OpenType `subs`），字形的大小和位置由字体设计，不同于 `vertical-align: sub`。
   */
  sub: unknown;
  /**
   * `super`：使用字体提供的上标字形（OpenType `sups`），字形的大小和位置由字体设计，不同于 `vertical-align: super`。
   */
  super: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface FontVariationSettingsKeywords {
  /**
   * `normal`：不额外覆盖可变字体各轴的取值，各轴按 `font-weight`、`font-stretch` 等属性及字体默认值确定。
   */
  normal: unknown;
}

interface FontWeightKeywords {
  /**
   * `bolder`：相对于继承字重选择更粗的字重，不是简单加一个固定数值。
   */
  bolder: unknown;
  /**
   * `lighter`：相对于继承字重选择更细的字重，不是简单减一个固定数值。
   */
  lighter: unknown;
  /**
   * `normal`：正常字重，等价于数值 400。
   */
  normal: unknown;
  /**
   * `bold`：粗体字重，等价于数值 700。
   */
  bold: unknown;
}

interface ForcedColorAdjustValues {
  /**
   * `auto`：在强制颜色模式下，浏览器按系统配色替换该元素的颜色相关属性。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：强制颜色模式下不替换该元素的颜色，沿用作者指定的值；需要自行保证文字对比度。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface GridAutoFlowKeywords {
  /**
   * `row`：优先沿行放置项目，必要时创建新的隐式行。
   */
  row: unknown;
  /**
   * `column`：优先沿列放置项目，必要时创建新的隐式列。
   */
  column: unknown;
  /**
   * `dense`：尝试回填前面留下的空洞，可能让视觉顺序与 DOM 顺序不同。
   */
  dense: unknown;
}

interface GridKeywords {
  /**
   * `auto-flow`：声明该方向的轨道由自动放置生成：写在 `/` 前表示按行填充（`grid-auto-flow: row`），写在 `/` 后表示按列填充（`grid-auto-flow: column`）。
   */
  'auto-flow': unknown;
  /**
   * `dense`：与 `auto-flow` 搭配，启用 dense 紧凑装箱：回头填补前面的空洞，项目可能偏离源码顺序。
   */
  dense: unknown;
}

interface GridTemplateAreasKeywords {
  /**
   * `none`：不定义命名网格区域。
   */
  none: unknown;
}

interface GridTemplateColumnsKeywords {
  /**
   * `none`：不定义显式列轨道，列由隐式轨道（`grid-auto-columns`）自动生成。
   */
  none: unknown;
  /**
   * `subgrid`：该元素在列方向不自建轨道，直接沿用父网格对应的列轨道，使子项目与父网格对齐；后面可追加网格线名称。
   */
  subgrid: unknown;
}

interface GridTemplateKeywords {
  /**
   * `none`：不定义显式轨道和命名区域，网格由隐式轨道（`grid-auto-*`）自动生成。
   */
  none: unknown;
}

interface GridTemplateRowsKeywords {
  /**
   * `none`：不定义显式行轨道，行由隐式轨道（`grid-auto-rows`）自动生成。
   */
  none: unknown;
  /**
   * `subgrid`：该元素在行方向不自建轨道，直接沿用父网格对应的行轨道，使子项目与父网格对齐；后面可追加网格线名称。
   */
  subgrid: unknown;
}

interface HangingPunctuationKeywords {
  /**
   * `none`：标点不悬挂，始终留在行盒内。
   */
  none: unknown;
  /**
   * `first`：首行行首的开括号或引号悬挂到行盒之外，让文字边缘对齐；目前仅 Safari 支持。
   */
  first: unknown;
  /**
   * `force-end`：行尾的句号、逗号总是悬挂到行盒之外，不占用行内空间；目前仅 Safari 支持。
   */
  'force-end': unknown;
  /**
   * `allow-end`：行尾的句号、逗号只在行内放不下时才悬挂到行盒之外；目前仅 Safari 支持。
   */
  'allow-end': unknown;
  /**
   * `last`：末行行尾的闭括号或引号悬挂到行盒之外；目前仅 Safari 支持。
   */
  last: unknown;
}

interface HyphenateCharacterKeywords {
  /**
   * `auto`：由浏览器按文本语言选择断字符号，通常是连字符（U+2010）。
   */
  auto: unknown;
}

interface HyphenateLimitCharsKeywords {
  /**
   * `auto`：该位置使用浏览器的默认限制值，具体数字由浏览器决定。
   */
  auto: unknown;
}

interface HyphensValues {
  /**
   * `auto`：允许浏览器按语言词典自动在合适位置断词并插入连字符；需要在元素或祖先上设置正确的 `lang`。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `manual`：只在文本里手写的软连字符（`&shy;` 或 U+00AD）处断词，不做自动断词。
   */
  manual: unknown;
  /**
   * `none`：不断词，即使文本里有软连字符也不会在该处断开；已有的普通连字符 `-` 处仍可换行。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ImageOrientationKeywords {
  /**
   * `from-image`：按图像文件自带的方向元数据（如 EXIF）旋转或翻转后再显示。
   */
  'from-image': unknown;
  /**
   * `flip`：把图像水平翻转，可与角度值组合（如 `90deg flip`）；浏览器支持有限。
   */
  flip: unknown;
}

interface ImageRenderingKeywords {
  /**
   * `auto`：由浏览器决定缩放算法，通常对放大的图像做平滑插值。
   */
  auto: unknown;
  /**
   * `crisp-edges`：缩放时保留颜色对比和边缘，不做平滑，适合线稿、像素图；具体算法由浏览器决定。
   */
  'crisp-edges': unknown;
  /**
   * `pixelated`：放大时按最近邻取样，让每个像素呈清晰的方块，适合像素画。
   */
  pixelated: unknown;
  /**
   * `smooth`：要求使用平滑缩放，偏重画质而非速度。
   */
  smooth: unknown;
}

interface ImageResolutionKeywords {
  /**
   * `from-image`：采用图像文件自带的分辨率信息；可与具体分辨率值组合，作为文件没有该信息时的回退值。
   */
  'from-image': unknown;
  /**
   * `snap`：把使用的分辨率取整，使图像像素对应整数个设备像素，避免缩放造成的模糊；需与其他分辨率取值搭配，浏览器基本不支持。
   */
  snap: unknown;
}

interface ImeModeValues {
  /**
   * `active`：输入法默认处于开启状态，用户仍可手动关闭；已废弃，浏览器基本不支持。
   */
  active: unknown;
  /**
   * `auto`：不指定输入法状态，由浏览器决定；已废弃，浏览器基本不支持。
   */
  auto: unknown;
  /**
   * `disabled`：禁用输入法，用户无法启用，常用于密码框；已废弃，浏览器基本不支持。
   */
  disabled: unknown;
  /**
   * `inactive`：输入法默认处于关闭状态，用户仍可手动开启；已废弃，浏览器基本不支持。
   */
  inactive: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：按普通方式处理输入法，忽略页面对该字段的设置，多用于用户样式覆盖；已废弃，浏览器基本不支持。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface InitialLetterAlignKeywords {
  /**
   * `auto`：由浏览器根据文字的书写系统选择对齐基线，拉丁文通常取字母基线。
   */
  auto: unknown;
  /**
   * `alphabetic`：以字母基线（alphabetic）对齐首字下沉的字形与正文，适合拉丁文等字母文字。
   */
  alphabetic: unknown;
  /**
   * `hanging`：以悬挂基线（hanging）对齐，适合天城文、藏文等基线悬挂在字形顶端的文字。
   */
  hanging: unknown;
  /**
   * `ideographic`：以表意文字基线（ideographic）对齐，适合中日韩等方块字。
   */
  ideographic: unknown;
}

interface InitialLetterKeywords {
  /**
   * `normal`：不启用首字下沉，首字母与正文按普通文字排版。
   */
  normal: unknown;
}

interface InterpolateSizeValues {
  /**
   * `allow-keywords`：允许受支持的内部尺寸关键字与长度/百分比之间插值，不保证两个关键字之间可以插值。
   */
  'allow-keywords': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `numeric-only`：保持仅数值尺寸之间的插值行为。
   */
  'numeric-only': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface IsolationValues {
  /**
   * `auto`：由其他属性是否需要层叠上下文决定，不强制隔离。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `isolate`：建立独立层叠上下文，使混合效果在该分组内处理。
   */
  isolate: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface JustifyContentKeywords {
  /**
   * `normal`：采用布局模式的默认分布：Flex 中等同于 `flex-start`，Grid 中等同于 `stretch`。
   */
  normal: unknown;
  /**
   * `left`：内容靠容器的物理左侧，不受书写方向影响；轴向不是水平方向时退化为 `start`。
   */
  left: unknown;
  /**
   * `right`：内容靠容器的物理右侧，不受书写方向影响；轴向不是水平方向时退化为 `end`。
   */
  right: unknown;
}

interface JustifyContentValues {
  /**
   * `center`：将整体内容放在主轴或行内轴的中间，不改变项目内部文字对齐。
   */
  center: unknown;
  /**
   * `end`：各项贴向容器在该方向上的终止边，终止边由书写模式和方向决定。
   */
  end: unknown;
  /**
   * `flex-end`：Flex 内容靠主轴终点排列。
   */
  'flex-end': unknown;
  /**
   * `flex-start`：Flex 内容靠主轴起点排列；起点受 flex-direction 影响。
   */
  'flex-start': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `left`：内容靠容器的物理左侧，不受书写方向影响；轴向不是水平方向时退化为 `start`。
   */
  left: unknown;
  /**
   * `normal`：采用布局模式的默认分布：Flex 中等同于 `flex-start`，Grid 中等同于 `stretch`。
   */
  normal: unknown;
  /**
   * `right`：内容靠容器的物理右侧，不受书写方向影响；轴向不是水平方向时退化为 `end`。
   */
  right: unknown;
  /**
   * `safe center`：整体居中；当内容比容器大会溢出时，改为靠起点对齐，保证溢出的内容仍然可以访问。
   */
  'safe center': unknown;
  /**
   * `space-around`：每个项目两侧分配相等空间，容器边缘的空间是相邻项目间的一半。
   */
  'space-around': unknown;
  /**
   * `space-between`：首尾项目贴两端，剩余空间等分到相邻项目之间。只有一个项目时靠起始侧，不会自动居中。space-evenly 在两端也保留等量空间；space-around 的边缘空间只有项目之间的一半。
   */
  'space-between': unknown;
  /**
   * `space-evenly`：容器两端和相邻项目之间分配相等空间。
   */
  'space-evenly': unknown;
  /**
   * `start`：各项贴向容器在该方向上的起始边，起始边由书写模式和方向决定。
   */
  start: unknown;
  /**
   * `stretch`：在支持的布局中拉伸自动尺寸的内容；Flex 主轴增长通常由 flex-grow 控制。
   */
  stretch: unknown;
  /**
   * `unsafe center`：整体严格居中，即使内容溢出也不回退；溢出的一侧可能超出可滚动范围而无法访问。
   */
  'unsafe center': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface JustifyItemsKeywords {
  /**
   * `normal`：采用布局模式的默认对齐：Grid 中通常表现为 `stretch`，有固有尺寸的元素（如图片）表现为 `start`。
   */
  normal: unknown;
  /**
   * `stretch`：项目沿行内轴拉伸以填满所在区域；仅在宽度为 `auto` 时生效，且受最大尺寸约束。
   */
  stretch: unknown;
  /**
   * `left`：项目靠所在区域的物理左侧，不受书写方向影响。
   */
  left: unknown;
  /**
   * `right`：项目靠所在区域的物理右侧，不受书写方向影响。
   */
  right: unknown;
  /**
   * `legacy`：兼容 HTML 旧版 `align` 属性的值：单独使用时表现同 `normal`；与 `left`、`right`、`center` 组合时，该对齐可被后代元素继承。
   */
  legacy: unknown;
  /**
   * `center`：项目在所在区域内沿行内轴居中；项目比区域大时两侧均等溢出。
   */
  center: unknown;
  /**
   * `anchor-center`：让锚点定位的元素沿该轴对齐到锚点元素的中心；只对使用 CSS 锚点定位的绝对定位元素有效。
   */
  'anchor-center': unknown;
}

interface JustifyItemsValues {
  /**
   * `baseline`：按首行文字的基线与同组其他项对齐；单独使用等同 `first baseline`。
   */
  baseline: unknown;
  /**
   * `center`：项目在所在区域内沿行内轴居中；项目比区域大时两侧均等溢出。
   */
  center: unknown;
  /**
   * `end`：对齐到对齐容器的结束侧，方向取自容器的书写模式。
   */
  end: unknown;
  /**
   * `first baseline`：按首行基线对齐：同组项目的第一条文字基线排在一起；无法参与基线对齐时回退为 `start`。
   */
  'first baseline': unknown;
  /**
   * `flex-end`：在 Flex 布局中对齐到对应轴的结束侧，随 Flex 方向变化；在其他布局中等同于 `end`。
   */
  'flex-end': unknown;
  /**
   * `flex-start`：在 Flex 布局中对齐到对应轴的起始侧，随 Flex 方向变化；在其他布局中等同于 `start`。
   */
  'flex-start': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `last baseline`：按末行基线对齐：同组项目的最后一条文字基线排在一起；无法参与基线对齐时回退为 `end`。
   */
  'last baseline': unknown;
  /**
   * `left`：项目靠所在区域的物理左侧，不受书写方向影响。
   */
  left: unknown;
  /**
   * `legacy center`：`legacy` 与 `center` 的组合：项目居中，并让这一对齐可被后代元素继承，对应 HTML 旧版 `align=center`。
   */
  'legacy center': unknown;
  /**
   * `legacy left`：`legacy` 与 `left` 的组合：项目靠物理左侧，并让这一对齐可被后代元素继承，对应 HTML 旧版 `align=left`。
   */
  'legacy left': unknown;
  /**
   * `legacy right`：`legacy` 与 `right` 的组合：项目靠物理右侧，并让这一对齐可被后代元素继承，对应 HTML 旧版 `align=right`。
   */
  'legacy right': unknown;
  /**
   * `normal`：采用布局模式的默认对齐：Grid 中通常表现为 `stretch`，有固有尺寸的元素（如图片）表现为 `start`。
   */
  normal: unknown;
  /**
   * `right`：项目靠所在区域的物理右侧，不受书写方向影响。
   */
  right: unknown;
  /**
   * `safe center`：项目居中；当项目比所在区域大会溢出时，改为靠起点对齐，保证内容不被推到不可见的一侧。
   */
  'safe center': unknown;
  /**
   * `self-end`：对齐到项目自身书写模式的结束侧；项目与容器书写方向不同时，结果与 `end` 不同。
   */
  'self-end': unknown;
  /**
   * `self-start`：对齐到项目自身书写模式的起始侧；项目与容器书写方向不同时，结果与 `start` 不同。
   */
  'self-start': unknown;
  /**
   * `start`：对齐到对齐容器的起始侧，方向取自容器的书写模式。
   */
  start: unknown;
  /**
   * `stretch`：项目沿行内轴拉伸以填满所在区域；仅在宽度为 `auto` 时生效，且受最大尺寸约束。
   */
  stretch: unknown;
  /**
   * `unsafe center`：项目严格居中，即使溢出也不回退；溢出的一侧可能超出可滚动范围而无法访问。
   */
  'unsafe center': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface JustifySelfKeywords {
  /**
   * `auto`：采用父容器 justify-items 等上下文决定的对齐方式；不用于 Flex 项目的主轴分配。
   */
  auto: unknown;
  /**
   * `normal`：采用布局模式的默认对齐：Grid 中通常表现为 `stretch`，有固有尺寸的元素（如图片）表现为 `start`。
   */
  normal: unknown;
  /**
   * `stretch`：在自动尺寸和最小/最大约束允许时沿行内轴拉伸。
   */
  stretch: unknown;
  /**
   * `left`：项目靠所在区域的物理左侧，不受书写方向影响。
   */
  left: unknown;
  /**
   * `right`：项目靠所在区域的物理右侧，不受书写方向影响。
   */
  right: unknown;
  /**
   * `anchor-center`：让锚点定位的元素沿该轴对齐到锚点元素的中心；只对使用 CSS 锚点定位的绝对定位元素有效。
   */
  'anchor-center': unknown;
}

interface JustifySelfValues {
  /**
   * `auto`：采用父容器 justify-items 等上下文决定的对齐方式；不用于 Flex 项目的主轴分配。
   */
  auto: unknown;
  /**
   * `baseline`：按首行文字的基线与同组其他项对齐；单独使用等同 `first baseline`。
   */
  baseline: unknown;
  /**
   * `center`：将项目在对齐容器内居中。
   */
  center: unknown;
  /**
   * `end`：对齐到对齐容器的结束侧，方向取自容器的书写模式。
   */
  end: unknown;
  /**
   * `first baseline`：按首行基线与同组项目对齐；无法参与基线对齐时回退为 `start`。
   */
  'first baseline': unknown;
  /**
   * `flex-end`：在 Flex 布局中对齐到对应轴的结束侧，随 Flex 方向变化；在其他布局中等同于 `end`。
   */
  'flex-end': unknown;
  /**
   * `flex-start`：在 Flex 布局中对齐到对应轴的起始侧，随 Flex 方向变化；在其他布局中等同于 `start`。
   */
  'flex-start': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `last baseline`：按末行基线与同组项目对齐；无法参与基线对齐时回退为 `end`。
   */
  'last baseline': unknown;
  /**
   * `left`：项目靠所在区域的物理左侧，不受书写方向影响。
   */
  left: unknown;
  /**
   * `normal`：采用布局模式的默认对齐：Grid 中通常表现为 `stretch`，有固有尺寸的元素（如图片）表现为 `start`。
   */
  normal: unknown;
  /**
   * `right`：项目靠所在区域的物理右侧，不受书写方向影响。
   */
  right: unknown;
  /**
   * `safe center`：项目居中；当项目比所在区域大会溢出时，改为靠起点对齐，保证内容不被推到不可见的一侧。
   */
  'safe center': unknown;
  /**
   * `self-end`：对齐到项目自身书写模式的结束侧；项目与容器书写方向不同时，结果与 `end` 不同。
   */
  'self-end': unknown;
  /**
   * `self-start`：对齐到项目自身书写模式的起始侧；项目与容器书写方向不同时，结果与 `start` 不同。
   */
  'self-start': unknown;
  /**
   * `start`：对齐到对齐容器的起始侧，方向取自容器的书写模式。
   */
  start: unknown;
  /**
   * `stretch`：在自动尺寸和最小/最大约束允许时沿行内轴拉伸。
   */
  stretch: unknown;
  /**
   * `unsafe center`：项目严格居中，即使溢出也不回退；溢出的一侧可能超出可滚动范围而无法访问。
   */
  'unsafe center': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface JustifyTracksKeywords {
  /**
   * `normal`：采用默认分布方式放置对应轨道；属于旧版瀑布流提案，浏览器暂无稳定支持。
   */
  normal: unknown;
  /**
   * `left`：对应轨道整体靠容器的物理左侧；属于旧版瀑布流提案，浏览器暂无稳定支持。
   */
  left: unknown;
  /**
   * `right`：对应轨道整体靠容器的物理右侧；属于旧版瀑布流提案，浏览器暂无稳定支持。
   */
  right: unknown;
}

interface LetterSpacingKeywords {
  /**
   * `normal`：使用字体默认的字符间距，不额外增减。
   */
  normal: unknown;
}

interface LineBreakValues {
  /**
   * `auto`：由浏览器自行决定换行严格程度，可能随文本长度调整（短文本偏严格，长文本偏宽松）。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `loose`：采用最宽松的换行规则，允许在更多位置换行，适合行很短的场景，如报纸排版。
   */
  loose: unknown;
  /**
   * `normal`：采用常规的换行规则，严格程度介于 `loose` 与 `strict` 之间。
   */
  normal: unknown;
  /**
   * `strict`：采用最严格的换行规则，如不在小写假名、长音符前换行，适合要求规范排版的正文。
   */
  strict: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface LineHeightKeywords {
  /**
   * `normal`：由浏览器和字体度量确定行高，没有固定的跨字体倍数。
   */
  normal: unknown;
}

interface ListStyleImageKeywords {
  /**
   * `none`：不使用图像作列表标记，改由 `list-style-type` 提供标记。
   */
  none: unknown;
}

interface ListStylePositionKeywords {
  /**
   * `inside`：标记放在内容盒内部，作为首行行内内容的一部分，文字折行时会绕到标记下方。
   */
  inside: unknown;
  /**
   * `outside`：标记放在内容盒之外，文字折行后与首行文字左对齐，这是默认行为。
   */
  outside: unknown;
}

interface ListStylePositionValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inside`：标记放在内容盒内部，作为首行行内内容的一部分，文字折行时会绕到标记下方。
   */
  inside: unknown;
  /**
   * `outside`：标记放在内容盒之外，文字折行后与首行文字左对齐，这是默认行为。
   */
  outside: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ListStyleTypeKeywords {
  /**
   * `none`：不显示标记，列表项仍保持 `list-item` 显示类型，计数器照常递增。
   */
  none: unknown;
}

interface MarginKeywords {
  /**
   * `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   */
  auto: unknown;
}

interface MarginTrimValues {
  /**
   * `block`：裁掉子元素在块轴两端紧贴容器边缘的外边距，等同 `block-start block-end`；目前仅 Safari 支持。
   */
  block: unknown;
  /**
   * `block-end`：裁掉最后一个子元素紧贴容器块结束边的外边距，让容器与外部的间距由容器自己控制；目前仅 Safari 支持。
   */
  'block-end': unknown;
  /**
   * `block-start`：裁掉第一个子元素紧贴容器块起始边的外边距，让容器与外部的间距由容器自己控制；目前仅 Safari 支持。
   */
  'block-start': unknown;
  /**
   * `inline`：裁掉子元素在行内轴两端紧贴容器边缘的外边距，等同 `inline-start inline-end`；目前仅 Safari 支持。
   */
  inline: unknown;
  /**
   * `inline-end`：裁掉紧贴容器行内结束边的子元素外边距；目前仅 Safari 支持。
   */
  'inline-end': unknown;
  /**
   * `inline-start`：裁掉紧贴容器行内起始边的子元素外边距；目前仅 Safari 支持。
   */
  'inline-start': unknown;
  /**
   * `none`：不裁减任何子元素外边距，保持各自设置的外边距。
   */
  none: unknown;
}

interface MarkerKeywords {
  /**
   * `none`：不绘制标记图形。
   */
  none: unknown;
}

interface MarkerMidKeywords {
  /**
   * `none`：不在路径中间顶点绘制标记图形。
   */
  none: unknown;
}

interface MaskBorderModeKeywords {
  /**
   * `luminance`：按遮罩图像的亮度决定显示程度：越亮越不透明，越暗越透明。
   */
  luminance: unknown;
  /**
   * `alpha`：按遮罩图像的 alpha 通道决定显示程度：越不透明的区域内容越可见。
   */
  alpha: unknown;
}

interface MaskBorderModeValues {
  /**
   * `alpha`：按遮罩图像的 alpha 通道决定显示程度：越不透明的区域内容越可见。
   */
  alpha: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `luminance`：按遮罩图像的亮度决定显示程度：越亮越不透明，越暗越透明。
   */
  luminance: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MaskBorderRepeatKeywords {
  /**
   * `stretch`：切片拉伸以填满对应的边框区域。
   */
  stretch: unknown;
  /**
   * `repeat`：切片按原尺寸平铺，到边缘时可能被裁掉一部分。
   */
  repeat: unknown;
  /**
   * `round`：切片平铺，并整体缩放到恰好放下整数个，不裁剪。
   */
  round: unknown;
  /**
   * `space`：切片按原尺寸平铺，调整间距使恰好放下整数个，不缩放也不裁剪。
   */
  space: unknown;
}

interface MaskBorderRepeatValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `repeat`：切片按原尺寸平铺，到边缘时可能被裁掉一部分。
   */
  repeat: unknown;
  /**
   * `round`：切片平铺，并整体缩放到恰好放下整数个，不裁剪。
   */
  round: unknown;
  /**
   * `space`：切片按原尺寸平铺，调整间距使恰好放下整数个，不缩放也不裁剪。
   */
  space: unknown;
  /**
   * `stretch`：切片拉伸以填满对应的边框区域。
   */
  stretch: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MaskBorderSliceKeywords {
  /**
   * `fill`：保留切片后的中间区域并铺在元素中间；缺省时该区域会被丢弃。
   */
  fill: unknown;
}

interface MaskBorderSourceKeywords {
  /**
   * `none`：不使用边框遮罩图像，`mask-border` 不产生遮罩效果。
   */
  none: unknown;
}

interface MaskBorderWidthKeywords {
  /**
   * `auto`：取对应的 `mask-border-slice` 切片的固有尺寸作为该边宽度。
   */
  auto: unknown;
}

interface MaskClipKeywords {
  /**
   * `no-clip`：不裁剪遮罩的作用范围，遮罩可作用于整个绘制区域，包括超出盒子的部分。
   */
  'no-clip': unknown;
}

interface MaskCompositeValues {
  /**
   * `add`：把当前遮罩层叠加到其下方的遮罩层上，取两者的并集。
   */
  add: unknown;
  /**
   * `exclude`：保留两层互不重叠的区域，重叠的部分被排除（异或）。
   */
  exclude: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `intersect`：只保留当前遮罩层与下方遮罩层重叠的部分。
   */
  intersect: unknown;
  /**
   * `subtract`：从当前遮罩层中减去与下方遮罩层重叠的部分，只保留未重叠的区域。
   */
  subtract: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MaskModeValues {
  /**
   * `alpha`：取遮罩图像的透明度（alpha 通道）作为遮罩值：不透明处显示，透明处隐藏。
   */
  alpha: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `luminance`：取遮罩图像的亮度（结合透明度）作为遮罩值：越亮显示得越多，黑色处隐藏。
   */
  luminance: unknown;
  /**
   * `match-source`：按遮罩来源自动选择：普通图像用 `alpha`，引用 SVG `<mask>` 元素时用 `luminance`；这是初始值。
   */
  'match-source': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MaskOriginValues {
  /**
   * `border-box`：以边框外缘为参考框，含内边距和边框。
   */
  'border-box': unknown;
  /**
   * `content-box`：以内容区边缘为参考框，不含内边距和边框。
   */
  'content-box': unknown;
  /**
   * `fill-box`：以对象边界框（填充区域）为参考框；对 CSS 盒模型元素等同于 `content-box`。
   */
  'fill-box': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `margin-box`：以外边距盒（margin box）作为遮罩图像的定位区域。
   */
  'margin-box': unknown;
  /**
   * `padding-box`：以内边距边缘为参考框，含内边距，不含边框。
   */
  'padding-box': unknown;
  /**
   * `stroke-box`：以描边边界框（含描边宽度）为参考框；对 CSS 盒模型元素等同于 `border-box`。
   */
  'stroke-box': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `view-box`：以最近的 SVG 视口（`viewBox`）为参照盒；对没有 SVG 视口的普通元素，按 `border-box` 处理。
   */
  'view-box': unknown;
}

interface MaskSizeKeywords {
  /**
   * `auto`：依据图像内部尺寸、比例及另一维的设置确定尺寸。
   */
  auto: unknown;
  /**
   * `contain`：保持图像比例并使整张图像容纳于定位区域，可能留下空白。
   */
  contain: unknown;
  /**
   * `cover`：保持图像比例并覆盖整个定位区域，超出部分可能被裁剪。
   */
  cover: unknown;
}

interface MaskTypeValues {
  /**
   * `alpha`：按遮罩内容的 alpha 值（不透明度）决定显示程度，颜色不参与计算。
   */
  alpha: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `luminance`：按遮罩内容的亮度决定显示程度：白色完全显示，黑色完全隐藏，这是默认行为。
   */
  luminance: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MasonryAutoFlowKeywords {
  /**
   * `pack`：每个项目放入当前最靠前（最短）的轨道，使各轨道尽量紧凑；属于旧版瀑布流提案，浏览器暂无稳定支持。
   */
  pack: unknown;
  /**
   * `next`：项目按顺序依次放入下一个轨道，到末尾后回到第一个，不寻找最短轨道；属于旧版瀑布流提案，浏览器暂无稳定支持。
   */
  next: unknown;
  /**
   * `definite-first`：先放置有明确位置的项目，再放置其余自动放置的项目；属于旧版瀑布流提案，浏览器暂无稳定支持。
   */
  'definite-first': unknown;
  /**
   * `ordered`：所有项目按文档顺序放置，包括有明确位置的项目；属于旧版瀑布流提案，浏览器暂无稳定支持。
   */
  ordered: unknown;
}

interface MathDepthKeywords {
  /**
   * `auto-add`：若继承的 `math-style` 为 `compact`，深度在父元素基础上加 1，否则沿用父元素的深度。
   */
  'auto-add': unknown;
}

interface MathShiftValues {
  /**
   * `compact`：上标使用较小的上移量，用于紧凑样式下节省垂直空间。
   */
  compact: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：上标使用正常的上移量。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MathStyleValues {
  /**
   * `compact`：采用紧凑（行内）样式，公式更靠拢，适合嵌入正文行。
   */
  compact: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：采用展示（display）样式，公式空间更宽松，如大型运算符的上下限分居上下方。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MaxWidthKeywords {
  /**
   * `none`：不设上限，元素尺寸不受该属性限制。
   */
  none: unknown;
  /**
   * `min-content`：上限取内容的 min-content 尺寸，即内容尽可能压缩后所需的尺寸；行内轴方向相当于文字折到最窄。
   */
  'min-content': unknown;
  /**
   * `max-content`：上限取内容的 max-content 尺寸，即内容不折行、不压缩时的自然尺寸。
   */
  'max-content': unknown;
  /**
   * `fit-content`：上限取 fit-content：可用空间夹在 min-content 与 max-content 之间的值。
   */
  'fit-content': unknown;
}

interface MinWidthKeywords {
  /**
   * `auto`：自动最小尺寸由布局模式决定；Flex/Grid 项目可能受内容最小宽度限制。
   */
  auto: unknown;
  /**
   * `min-content`：下限取内容的 min-content 尺寸，即内容尽可能压缩后所需的尺寸；行内轴方向相当于文字折到最窄。
   */
  'min-content': unknown;
  /**
   * `max-content`：下限取内容的 max-content 尺寸，即内容不折行、不压缩时的自然尺寸。
   */
  'max-content': unknown;
  /**
   * `fit-content`：下限取 fit-content：可用空间夹在 min-content 与 max-content 之间的值。
   */
  'fit-content': unknown;
}

interface MixBlendModeValues {
  /**
   * `color`：取上层的色相和饱和度，保留下层的明度；常用于给黑白图像着色。
   */
  color: unknown;
  /**
   * `color-burn`：加深：让下层变暗以反映上层颜色，上层越深，下层变暗越明显。
   */
  'color-burn': unknown;
  /**
   * `color-dodge`：减淡：让下层变亮以反映上层颜色，上层越亮，下层越接近白色。
   */
  'color-dodge': unknown;
  /**
   * `darken`：逐通道取上下两层中较暗的值，结果不会比任何一层更亮。
   */
  darken: unknown;
  /**
   * `difference`：取上下两层颜色差的绝对值；与白色混合会反相，与黑色混合则不变。
   */
  difference: unknown;
  /**
   * `exclusion`：类似 `difference`，但对比度更低；与白色混合会反相，与黑色混合不变。
   */
  exclusion: unknown;
  /**
   * `hard-light`：按上层颜色决定做 `multiply` 还是 `screen`，效果像强光直射，上层亮则提亮、暗则压暗。
   */
  'hard-light': unknown;
  /**
   * `hue`：取上层的色相，保留下层的饱和度和明度。
   */
  hue: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `lighten`：逐通道取上下两层中较亮的值，结果不会比任何一层更暗。
   */
  lighten: unknown;
  /**
   * `luminosity`：取上层的明度，保留下层的色相和饱和度，与 `color` 相反。
   */
  luminosity: unknown;
  /**
   * `multiply`：正片叠底：上下两层颜色相乘，结果更暗；与白色混合不变，与黑色混合变黑。
   */
  multiply: unknown;
  /**
   * `normal`：不做混合，上层直接覆盖下层；上层半透明时按透明度叠加。
   */
  normal: unknown;
  /**
   * `overlay`：按下层颜色决定做 `multiply` 还是 `screen`，暗部更暗、亮部更亮，同时保留下层的明暗层次。
   */
  overlay: unknown;
  /**
   * `saturation`：取上层的饱和度，保留下层的色相和明度。
   */
  saturation: unknown;
  /**
   * `screen`：滤色：反相后相乘再反相，结果更亮；与黑色混合不变，与白色混合变白。
   */
  screen: unknown;
  /**
   * `soft-light`：`hard-light` 的柔和版本，像漫射光照射，对下层的提亮或压暗幅度较小。
   */
  'soft-light': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MozOsxFontSmoothingValues {
  /**
   * `grayscale`：macOS 上改用灰度抗锯齿而非次像素渲染，文字更细，常用于深色背景上的浅色文字。非标准，仅 Firefox（macOS）支持。
   */
  grayscale: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface MsOverflowStyleValues {
  /**
   * `-ms-autohiding-scrollbar`：滚动条平时隐藏，滚动或指针移近时才出现。非标准，仅 IE 与旧版 Edge 支持。
   */
  '-ms-autohiding-scrollbar': unknown;
  /**
   * `auto`：使用默认的滚动条表现。非标准，仅 IE 与旧版 Edge 支持。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：隐藏滚动条，内容仍可滚动。非标准，仅 IE 与旧版 Edge 支持。
   */
  none: unknown;
  /**
   * `scrollbar`：显示传统的常驻滚动条，即使系统默认是自动隐藏样式。非标准，仅 IE 与旧版 Edge 支持。
   */
  scrollbar: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ObjectFitValues {
  /**
   * `contain`：保留宽高比并完整放入内容盒，可能留下空白。cover 优先填满盒子并可能裁剪；contain 优先保留完整内容。
   */
  contain: unknown;
  /**
   * `cover`：保留宽高比并填满内容盒，可能裁掉部分图像。裁剪位置由 object-position 控制，盒子尺寸仍需另外设置。contain 保证完整图像可见但可能留白；fill 可能改变图像比例。
   */
  cover: unknown;
  /**
   * `fill`：把内容拉伸到内容盒，可能改变原有宽高比。
   */
  fill: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：不按内容盒缩放替换内容。
   */
  none: unknown;
  /**
   * `scale-down`：在 none 和 contain 中选择得到较小内容尺寸的方案。
   */
  'scale-down': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface OffsetAnchorKeywords {
  /**
   * `auto`：取 `transform-origin` 的值作为锚点。
   */
  auto: unknown;
}

interface OffsetPathKeywords {
  /**
   * `none`：不定义运动路径，元素不沿路径移动。
   */
  none: unknown;
}

interface OffsetPositionKeywords {
  /**
   * `normal`：不指定路径的起始位置，元素没有 offset 起点。
   */
  normal: unknown;
  /**
   * `auto`：以元素自身盒子所在的位置作为路径的起始位置。
   */
  auto: unknown;
}

interface OffsetRotateKeywords {
  /**
   * `auto`：元素朝向跟随路径的切线方向旋转，可再叠加一个角度。
   */
  auto: unknown;
  /**
   * `reverse`：在 `auto` 基础上再旋转 180 度，使元素朝向与路径前进方向相反。
   */
  reverse: unknown;
}

interface OutlineColorKeywords {
  /**
   * `auto`：由浏览器自行选择轮廓颜色，通常与系统强调色或焦点环配色一致。
   */
  auto: unknown;
}

interface OutlineStyleKeywords {
  /**
   * `auto`：由浏览器绘制默认样式的轮廓，常用于焦点环，形状可能贴合元素圆角。
   */
  auto: unknown;
}

interface OutlineStyleValues {
  /**
   * `auto`：由浏览器绘制默认样式的轮廓，常用于焦点环，形状可能贴合元素圆角。
   */
  auto: unknown;
  /**
   * `dashed`：用短划线绘制轮廓。
   */
  dashed: unknown;
  /**
   * `dotted`：用圆点绘制轮廓。
   */
  dotted: unknown;
  /**
   * `double`：绘制两条平行的实线，中间留空隙，整体宽度等于轮廓宽度。
   */
  double: unknown;
  /**
   * `groove`：绘制凹槽效果的立体线条，看起来像刻在页面里，明暗由轮廓颜色推算；与 `ridge` 相反。
   */
  groove: unknown;
  /**
   * `hidden`：`outline-style` 不接受该值（规范排除了 `hidden`），写了会被当作无效声明；要隐藏轮廓请用 `none`。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inset`：使整个轮廓呈现为凹陷，元素看起来嵌入页面；与 `outset` 相反。
   */
  inset: unknown;
  /**
   * `none`：不绘制轮廓，轮廓宽度计算值为零。
   */
  none: unknown;
  /**
   * `outset`：使整个轮廓呈现为凸起，元素看起来浮出页面；与 `inset` 相反。
   */
  outset: unknown;
  /**
   * `ridge`：绘制凸脊效果的立体线条，看起来像从页面凸起，明暗由轮廓颜色推算；与 `groove` 相反。
   */
  ridge: unknown;
  /**
   * `solid`：绘制一条连续的实线轮廓。
   */
  solid: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface OverflowAnchorValues {
  /**
   * `auto`：允许该元素参与滚动锚定：上方内容尺寸变化时，浏览器自动调整滚动位置，避免可见内容跳动。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：该元素及其后代不会被选作滚动锚点，不参与自动保持滚动位置。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface OverflowBlockXValues {
  /**
   * `auto`：内容溢出时显示滚动条，不溢出则不显示。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   */
  auto: unknown;
  /**
   * `clip`：在盒子边缘裁剪溢出内容，不建立滚动容器，不可滚动。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   */
  clip: unknown;
  /**
   * `hidden`：裁剪溢出内容并建立滚动容器，用户不可滚动但程序仍可滚动。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `scroll`：始终显示滚动条，内容可滚动。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   */
  scroll: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `visible`：溢出内容正常显示在盒子之外，不裁剪。非标准键，不对应 CSS 属性，请改用 `overflowX` 或 `overflowBlock`。
   */
  visible: unknown;
}

interface OverflowValues {
  /**
   * `auto`：按溢出情况提供滚动机制；滚动条外观和是否占空间由环境决定。scroll 通常始终预留或显示滚动机制；auto 根据溢出情况显示滚动条，外观由平台决定。
   */
  auto: unknown;
  /**
   * `clip`：在裁剪边界截断内容，不建立滚动容器，也不支持程序化滚动。两轴设置会影响计算结果；与另一轴 auto/scroll 等组合时，要检查最终溢出行为。与 hidden 不同，不支持程序化滚动，也不单独建立块格式化上下文。
   */
  clip: unknown;
  /**
   * `hidden`：裁剪溢出且不显示滚动条，但仍是可通过脚本等方式滚动的滚动容器。可能成为 sticky 后代的滚动参照，不能把它仅理解成视觉裁剪。clip 不建立滚动容器；hidden 仍可通过脚本或焦点移动滚动。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `scroll`：建立滚动容器，通常即使未溢出也显示滚动条；具体外观由平台决定。
   */
  scroll: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `visible`：允许内容绘制到盒子外；与另一轴的设置组合时计算值可能变化。
   */
  visible: unknown;
}

interface OverflowWrapValues {
  /**
   * `anywhere`：必要时允许在长文本任意位置断行，这些机会参与 min-content 尺寸计算。break-word 的额外断点不按 anywhere 的方式参与最小内容宽度计算；word-break:break-all 更积极地拆分普通单词。
   */
  anywhere: unknown;
  /**
   * `break-word`：必要时允许长文本断行，但新增断点不按 anywhere 的方式参与 min-content 计算。
   */
  'break-word': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：只使用正常换行机会，不为长单词额外断行。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface OverscrollBehaviorValues {
  /**
   * `auto`：采用默认滚动链和边界反馈。
   */
  auto: unknown;
  /**
   * `contain`：阻止滚动链传播到祖先，同时可保留当前容器的边界反馈。
   */
  contain: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：阻止滚动链，并抑制当前容器的默认越界反馈。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface PageBreakAfterValues {
  /**
   * `always`：在此处强制分页：`page-break-before` 作用于元素之前，`page-break-after` 作用于元素之后。旧写法，改用 `break-before` 与 `break-after`。
   */
  always: unknown;
  /**
   * `auto`：既不强制也不禁止在此处分页，由浏览器按需决定。旧写法，改用 `break-before` 与 `break-after`。
   */
  auto: unknown;
  /**
   * `avoid`：尽量避免在此处分页：`page-break-before` 针对元素之前，`page-break-after` 针对元素之后。旧写法，改用 `break-before` 与 `break-after`。
   */
  avoid: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `left`：在此处强制分页，并让下一页成为左页，必要时插入空白页。旧写法，改用 `break-before` 与 `break-after`。
   */
  left: unknown;
  /**
   * `right`：在此处强制分页，并让下一页成为右页，必要时插入空白页。旧写法，改用 `break-before` 与 `break-after`。
   */
  right: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface PageBreakInsideValues {
  /**
   * `auto`：既不强制也不禁止在元素内部分页，由浏览器按需决定。旧写法，改用 `break-inside`。
   */
  auto: unknown;
  /**
   * `avoid`：尽量避免在元素内部分页，内容一页放不下时才会拆开。旧写法，改用 `break-inside`。
   */
  avoid: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface PageKeywords {
  /**
   * `auto`：不指定命名页面，沿用父元素的页面类型（根元素则使用默认页面）。
   */
  auto: unknown;
}

interface PaintOrderValues {
  /**
   * `fill`：先绘制填充，随后按默认顺序绘制描边和标记。
   */
  fill: unknown;
  /**
   * `fill markers`：先绘制填充，再绘制标记，最后绘制描边。
   */
  'fill markers': unknown;
  /**
   * `markers`：先绘制标记，随后按默认顺序绘制填充和描边。
   */
  markers: unknown;
  /**
   * `normal`：使用默认顺序：先填充，再描边，最后标记。
   */
  normal: unknown;
  /**
   * `stroke`：先绘制描边，随后按默认顺序绘制填充和标记。
   */
  stroke: unknown;
  /**
   * `stroke fill`：先描边，再填充，最后标记，与单写 `stroke` 效果相同。
   */
  'stroke fill': unknown;
  /**
   * `stroke fill markers`：显式写出完整顺序：描边、填充、标记。填充压在描边之上，常用于避免文字描边吞掉字形。
   */
  'stroke fill markers': unknown;
  /**
   * `stroke markers`：先绘制描边，再绘制标记，最后绘制填充。
   */
  'stroke markers': unknown;
}

interface PauseValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `medium`：插入中等强度的停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   */
  medium: unknown;
  /**
   * `none`：不插入停顿，等同于时长为 0。属于 CSS Speech，浏览器基本不支持。
   */
  none: unknown;
  /**
   * `strong`：插入较长的停顿，比 `medium` 更久，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   */
  strong: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `weak`：插入较短的停顿，比 `medium` 更短，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   */
  weak: unknown;
  /**
   * `x-strong`：插入最长的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   */
  'x-strong': unknown;
  /**
   * `x-weak`：插入最短的一档停顿，实际时长由语音合成器按语速决定。属于 CSS Speech，浏览器基本不支持。
   */
  'x-weak': unknown;
}

interface PerspectiveValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：不应用透视，子元素的 3D 变换没有近大远小的效果。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface PointerEventsValues {
  /**
   * `all`：填充区和描边区都可成为命中目标，不看 `fill`、`stroke` 是否为 `none`，也不看 `visibility`。仅对 SVG 有意义。
   */
  all: unknown;
  /**
   * `auto`：采用当前元素类型的默认命中规则。
   */
  auto: unknown;
  /**
   * `fill`：填充区可成为命中目标，不看 `fill` 的取值和 `visibility`；描边区不命中。仅对 SVG 有意义。
   */
  fill: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：元素本身不成为指针命中目标；不等于禁用，仍可能通过 Tab 获焦，后代也可恢复命中。后代可以恢复命中；来自后代的事件仍可能经过祖先监听器。
   */
  none: unknown;
  /**
   * `painted`：仅当 `fill` 非 `none` 时填充区命中、`stroke` 非 `none` 时描边区命中，不看 `visibility`。仅对 SVG 有意义。
   */
  painted: unknown;
  /**
   * `stroke`：描边区可成为命中目标，不看 `stroke` 的取值和 `visibility`；填充区不命中。仅对 SVG 有意义。
   */
  stroke: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `visible`：仅当 `visibility` 为 `visible` 时，填充区和描边区都可命中，不看 `fill`、`stroke` 的取值。仅对 SVG 有意义。
   */
  visible: unknown;
  /**
   * `visibleFill`：仅当 `visibility` 为 `visible` 时填充区可命中，不看 `fill` 的取值；描边区不命中。仅对 SVG 有意义。
   */
  visibleFill: unknown;
  /**
   * `visiblePainted`：仅当 `visibility` 为 `visible` 时，`fill` 非 `none` 的填充区、`stroke` 非 `none` 的描边区可命中；等同 SVG 元素的 `auto`。
   */
  visiblePainted: unknown;
  /**
   * `visibleStroke`：仅当 `visibility` 为 `visible` 时描边区可命中，不看 `stroke` 的取值；填充区不命中。仅对 SVG 有意义。
   */
  visibleStroke: unknown;
}

interface PositionAnchorKeywords {
  /**
   * `normal`：初始值，不指定显式锚点；默认锚点由规范的隐式锚点规则决定，不同上下文下行为有差异。
   */
  normal: unknown;
  /**
   * `auto`：使用元素的隐式锚点作为默认锚点，例如 popover 的触发元素。
   */
  auto: unknown;
  /**
   * `none`：元素没有默认锚点，也不使用隐式锚点。
   */
  none: unknown;
  /**
   * `match-parent`：默认锚点沿用父元素 `position-anchor` 的计算结果，较新，使用前核对浏览器支持。
   */
  'match-parent': unknown;
}

interface PositionAreaKeywords {
  /**
   * `none`：不指定相对锚点的定位区域，元素按常规的 `inset` 属性定位。
   */
  none: unknown;
}

interface PositionAreaValues {
  /**
   * `block-end`：取块方向的结束侧（行或列），按包含块的书写模式；横排文字下是下方一行。
   */
  'block-end': unknown;
  /**
   * `block-start`：取块方向的起始侧（行或列），按包含块的书写模式；横排文字下是上方一行。
   */
  'block-start': unknown;
  /**
   * `bottom`：取网格最下面一行，即锚点下方的区域。
   */
  bottom: unknown;
  /**
   * `center`：取中间一行或一列，与锚点在该方向上的范围对齐；单独使用时水平和垂直都取中间格。
   */
  center: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline-end`：取行内方向的结束侧（行或列），按包含块的书写模式；从左到右时是右侧一列。
   */
  'inline-end': unknown;
  /**
   * `inline-start`：取行内方向的起始侧（行或列），按包含块的书写模式；从左到右时是左侧一列。
   */
  'inline-start': unknown;
  /**
   * `left`：取网格最左一列，即锚点左侧的区域。
   */
  left: unknown;
  /**
   * `right`：取网格最右一列，即锚点右侧的区域。
   */
  right: unknown;
  /**
   * `span-block-end`：跨越中间和块方向结束侧两格，按包含块的书写模式。
   */
  'span-block-end': unknown;
  /**
   * `span-block-start`：跨越中间和块方向起始侧两格，按包含块的书写模式。
   */
  'span-block-start': unknown;
  /**
   * `span-inline-end`：跨越中间和行内方向结束侧两格，按包含块的书写模式。
   */
  'span-inline-end': unknown;
  /**
   * `span-inline-start`：跨越中间和行内方向起始侧两格，按包含块的书写模式。
   */
  'span-inline-start': unknown;
  /**
   * `top`：取网格最上面一行，即锚点上方的区域。
   */
  top: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface PositionTryFallbacksKeywords {
  /**
   * `none`：不提供备用位置方案，元素溢出时也不会自动换位。
   */
  none: unknown;
}

interface PositionTryOrderKeywords {
  /**
   * `normal`：不调整尝试顺序，按 `position-try-fallbacks` 列出的顺序依次尝试，采用第一个不溢出的方案。
   */
  normal: unknown;
}

interface PositionValues {
  /**
   * `absolute`：脱离普通文档流，按包含块定位；包含块通常由定位祖先或 transform 等属性建立。通常在预期的容器上设置 position:relative；元素不为自己保留普通流占位。
   */
  absolute: unknown;
  /**
   * `fixed`：脱离普通流，通常相对视口固定；某些祖先属性会建立不同的包含块。祖先的 transform 等属性可能改变固定定位的包含块；z-index 仍受层叠上下文约束。absolute 通常跟随其包含块滚动；fixed 在以视口为包含块时保持视口位置。
   */
  fixed: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `relative`：保留普通流中的原位置，再按偏移移动绘制位置；不会为偏移后的区域重新排版。absolute 会脱离普通流；relative 仍保留原占位。
   */
  relative: unknown;
  /**
   * `static`：参与普通文档流，top/right/bottom/left 等定位偏移不生效。
   */
  static: unknown;
  /**
   * `sticky`：保留流内位置，在滚动范围内按 inset 约束吸附。对应轴至少一个 inset 须非 auto，并受滚动祖先和包含块限制。对应轴至少一个 inset 必须非 auto；祖先 overflow 可能改变滚动参照。与 fixed 不同，它保留流内占位，并受自身所在包含块的范围约束。
   */
  sticky: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface PositionVisibilityValues {
  /**
   * `always`：始终显示元素，不因锚点状态或溢出而隐藏。
   */
  always: unknown;
  /**
   * `anchors-visible`：默认锚点被包含块或滚动容器完全裁掉时隐藏元素，避免锚点看不见了浮层还留在原地。
   */
  'anchors-visible': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `no-overflow`：尝试完 `position-try-fallbacks` 后元素仍溢出其包含块时，隐藏元素。
   */
  'no-overflow': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface PrintColorAdjustValues {
  /**
   * `economy`：允许浏览器为节省墨水或提高可读性调整颜色，例如弱化背景色和背景图。
   */
  economy: unknown;
  /**
   * `exact`：要求按样式原样输出颜色和图像，不做节墨调整；适合颜色本身有含义的图表等内容。
   */
  exact: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface QuotesKeywords {
  /**
   * `none`：`open-quote`、`close-quote` 不生成任何字符。
   */
  none: unknown;
  /**
   * `auto`：按元素语言（`lang`）自动选用该语言的默认引号。
   */
  auto: unknown;
}

interface ResizeValues {
  /**
   * `both`：用户可沿水平和垂直两个方向拖动调整尺寸。
   */
  both: unknown;
  /**
   * `horizontal`：用户只能沿水平方向拖动，调整宽度。
   */
  horizontal: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：不显示拖拽手柄，用户不能调整元素尺寸。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `vertical`：用户只能沿垂直方向拖动，调整高度。
   */
  vertical: unknown;
}

interface RotateKeywords {
  /**
   * `none`：不做独立旋转，初始值，不影响 `transform` 里的旋转。
   */
  none: unknown;
  /**
   * `x`：绕 X 轴做三维旋转，须配合角度，如 `x 45deg`。
   */
  x: unknown;
  /**
   * `y`：绕 Y 轴做三维旋转，须配合角度，如 `y 45deg`。
   */
  y: unknown;
  /**
   * `z`：绕 Z 轴（垂直于屏幕）旋转，效果等同二维旋转，`z 45deg` 与 `45deg` 相同。
   */
  z: unknown;
}

interface RowGapKeywords {
  /**
   * `normal`：取布局模式的默认间距：flex、grid 中为 0，多列布局中列间距默认为 `1em`。
   */
  normal: unknown;
}

interface RubyAlignValues {
  /**
   * `center`：注音与基底中较短的一方在另一方范围内居中，两侧留出剩余空间。
   */
  center: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `space-around`：较短一方的内容均匀分布，首尾各留半份间距，字符之间的间距是首尾的两倍。
   */
  'space-around': unknown;
  /**
   * `space-between`：较短一方的内容均匀分布，首尾贴边，剩余空间平分到字符之间。
   */
  'space-between': unknown;
  /**
   * `start`：较短一方靠起始侧对齐，剩余空间留在末端。
   */
  start: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface RubyMergeValues {
  /**
   * `auto`：是否合并由浏览器决定；目前浏览器基本未实现该属性。
   */
  auto: unknown;
  /**
   * `collapse`：把同一注音段内的多个注音容器合并为一个，跨越对应的全部基底。
   */
  collapse: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `separate`：各注音容器保持独立，分别与对应的基底配对，不合并。
   */
  separate: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface RubyPositionValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inter-character`：注音放在基底字符的旁侧而不是上下，主要用于台湾注音符号（Bopomofo）。
   */
  'inter-character': unknown;
  /**
   * `over`：注音放在基底上方；竖排时在右侧。
   */
  over: unknown;
  /**
   * `under`：注音放在基底下方；竖排时在左侧。
   */
  under: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ScaleKeywords {
  /**
   * `none`：不做独立缩放，等同缩放比例 1，不影响 `transform` 里的缩放。
   */
  none: unknown;
}

interface ScrollbarColorKeywords {
  /**
   * `auto`：使用平台默认的滚动条颜色。
   */
  auto: unknown;
}

interface ScrollbarGutterValues {
  /**
   * `auto`：不预留滚动条槽位，仅在滚动条实际出现时才占用空间；覆盖式滚动条不占位。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `stable`：只要元素可滚动，就始终在滚动条一侧预留槽位，避免滚动条出现或消失时内容宽度跳动。
   */
  stable: unknown;
  /**
   * `stable both-edges`：在 `stable` 的基础上，另一侧也预留同样宽度的槽位，使内容左右对称。
   */
  'stable both-edges': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ScrollbarWidthValues {
  /**
   * `auto`：使用平台默认的滚动条宽度。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：隐藏滚动条，但内容仍可通过滚轮、触摸等方式滚动。
   */
  none: unknown;
  /**
   * `thin`：使用更细的滚动条，具体宽度由平台决定。
   */
  thin: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ScrollBehaviorValues {
  /**
   * `auto`：滚动立即跳到目标位置，没有动画。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `smooth`：锚点跳转、`scrollTo` 等触发的滚动使用平滑动画；用户手动滚动不受影响。
   */
  smooth: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ScrollPaddingBlockKeywords {
  /**
   * `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   */
  auto: unknown;
}

interface ScrollPaddingKeywords {
  /**
   * `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   */
  auto: unknown;
}

interface ScrollPaddingTopKeywords {
  /**
   * `auto`：由浏览器决定该侧内缩量，目前通常等同于 0。
   */
  auto: unknown;
}

interface ScrollSnapAlignValues {
  /**
   * `center`：元素中心与滚动容器吸附区域的中心对齐。
   */
  center: unknown;
  /**
   * `end`：元素末端边缘与吸附区域的末端边缘对齐。
   */
  end: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：该轴上元素不产生吸附位置。
   */
  none: unknown;
  /**
   * `start`：元素起始边缘与吸附区域的起始边缘对齐。
   */
  start: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ScrollSnapStopValues {
  /**
   * `always`：滚动必须在该元素的吸附位置停下，不允许一次快速滚动越过它。
   */
  always: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：快速滚动时可以越过该元素的吸附位置，不强制停下。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ScrollSnapTypeValues {
  /**
   * `block`：沿块轴吸附（横排文字时即垂直方向）；省略强度时按 `proximity` 处理。
   */
  block: unknown;
  /**
   * `block mandatory`：沿块轴吸附，滚动结束时必须停在最近的吸附位置。
   */
  'block mandatory': unknown;
  /**
   * `block proximity`：沿块轴吸附，仅当滚动停止点靠近吸附位置时才吸附，是否吸附由浏览器判断。
   */
  'block proximity': unknown;
  /**
   * `both`：水平和垂直两个轴都吸附；省略强度时按 `proximity` 处理。
   */
  both: unknown;
  /**
   * `both mandatory`：水平和垂直两个轴都吸附，滚动结束时必须停在最近的吸附位置。
   */
  'both mandatory': unknown;
  /**
   * `both proximity`：水平和垂直两个轴都吸附，仅当滚动停止点靠近吸附位置时才吸附。
   */
  'both proximity': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline`：沿行内轴吸附（横排文字时即水平方向）；省略强度时按 `proximity` 处理。
   */
  inline: unknown;
  /**
   * `inline mandatory`：沿行内轴吸附，滚动结束时必须停在最近的吸附位置。
   */
  'inline mandatory': unknown;
  /**
   * `inline proximity`：沿行内轴吸附，仅当滚动停止点靠近吸附位置时才吸附，是否吸附由浏览器判断。
   */
  'inline proximity': unknown;
  /**
   * `none`：不启用滚动吸附，滚动停在哪里就是哪里。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `x`：沿水平轴吸附；省略强度时按 `proximity` 处理。
   */
  x: unknown;
  /**
   * `x mandatory`：沿水平轴吸附，滚动结束时必须停在最近的吸附位置。
   */
  'x mandatory': unknown;
  /**
   * `x proximity`：沿水平轴吸附，仅当滚动停止点靠近吸附位置时才吸附，是否吸附由浏览器判断。
   */
  'x proximity': unknown;
  /**
   * `y`：沿垂直轴吸附；省略强度时按 `proximity` 处理。
   */
  y: unknown;
  /**
   * `y mandatory`：沿垂直轴吸附，滚动结束时必须停在最近的吸附位置。
   */
  'y mandatory': unknown;
  /**
   * `y proximity`：沿垂直轴吸附，仅当滚动停止点靠近吸附位置时才吸附，是否吸附由浏览器判断。
   */
  'y proximity': unknown;
}

interface ScrollTimelineAxisKeywords {
  /**
   * `block`：以块轴方向的滚动位置作为时间线进度（横排文字时即垂直方向）。
   */
  block: unknown;
  /**
   * `inline`：以行内轴方向的滚动位置作为时间线进度（横排文字时即水平方向）。
   */
  inline: unknown;
  /**
   * `x`：以水平方向的滚动位置作为时间线进度，不随书写模式变化。
   */
  x: unknown;
  /**
   * `y`：以垂直方向的滚动位置作为时间线进度，不随书写模式变化。
   */
  y: unknown;
}

interface ScrollTimelineAxisValues {
  /**
   * `block`：以块轴方向的滚动位置作为时间线进度（横排文字时即垂直方向）。
   */
  block: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline`：以行内轴方向的滚动位置作为时间线进度（横排文字时即水平方向）。
   */
  inline: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `x`：以水平方向的滚动位置作为时间线进度，不随书写模式变化。
   */
  x: unknown;
  /**
   * `y`：以垂直方向的滚动位置作为时间线进度，不随书写模式变化。
   */
  y: unknown;
}

interface ScrollTimelineNameKeywords {
  /**
   * `none`：不为该元素声明命名滚动时间线。
   */
  none: unknown;
}

interface ShapeOutsideKeywords {
  /**
   * `none`：不使用自定义形状，行内内容按浮动元素的外边距盒环绕。
   */
  none: unknown;
}

interface ShapeRenderingValues {
  /**
   * `auto`：由浏览器权衡速度与精度，通常开启抗锯齿。
   */
  auto: unknown;
  /**
   * `crispEdges`：优先边缘清晰，通常关闭抗锯齿，适合横平竖直的线条和像素风图形。
   */
  crispEdges: unknown;
  /**
   * `geometricPrecision`：优先几何精度，缩放时形状保持准确，不为速度牺牲平滑度。
   */
  geometricPrecision: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `optimizeSpeed`：优先渲染速度，可能关闭抗锯齿，换取更快的绘制。
   */
  optimizeSpeed: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface SpeakAsKeywords {
  /**
   * `normal`：按所在语言的常规规则朗读文字、数字和标点。
   */
  normal: unknown;
  /**
   * `spell-out`：逐字母拼读，适合缩写词、代码等。
   */
  'spell-out': unknown;
  /**
   * `digits`：数字逐位朗读，如 “123” 读成“一二三”而非“一百二十三”。
   */
  digits: unknown;
  /**
   * `literal-punctuation`：把标点符号的名称读出来，如读出“逗号”。
   */
  'literal-punctuation': unknown;
  /**
   * `no-punctuation`：不朗读标点，也不因标点产生停顿。
   */
  'no-punctuation': unknown;
}

interface SpeakValues {
  /**
   * `auto`：旧版 CSS Speech 值：由元素是否被渲染（`display`、`visibility`）推导是否朗读。已废弃，浏览器基本不支持。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：语音合成不朗读该元素内容。已废弃，浏览器基本不支持。
   */
  none: unknown;
  /**
   * `normal`：语音合成以正常方式朗读该元素内容。已废弃，浏览器基本不支持。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface StrokeDasharrayKeywords {
  /**
   * `none`：描边是连续的实线，不使用虚线。
   */
  none: unknown;
}

interface StrokeLinecapValues {
  /**
   * `butt`：在端点处平直截断描边，不向外延伸。
   */
  butt: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `round`：使用半圆端帽，向端点外延伸半个描边宽度。
   */
  round: unknown;
  /**
   * `square`：使用方形端帽，向端点外延伸半个描边宽度。
   */
  square: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface StrokeLinejoinValues {
  /**
   * `bevel`：转角处削平成斜切面，形成平直的连接。
   */
  bevel: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `miter`：延长两条边的外缘形成尖角；尖角过长（超过 `stroke-miterlimit`）时回退为斜切。
   */
  miter: unknown;
  /**
   * `round`：转角处用圆弧连接，圆弧半径为描边宽度的一半。
   */
  round: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface TableLayoutValues {
  /**
   * `auto`：按所有单元格的内容计算列宽，需要读完整个表格才能布局，较慢但更贴合内容。
   */
  auto: unknown;
  /**
   * `fixed`：列宽由表格宽度和第一行（或 `col`）决定，不看后续行内容；布局更快、更可预测，要求表格宽度不是 `auto`。
   */
  fixed: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface TextAlignLastValues {
  /**
   * `auto`：最后一行跟随 `text-align`；`text-align` 为 `justify` 时，最后一行按 `start` 对齐。
   */
  auto: unknown;
  /**
   * `center`：最后一行在行盒中居中。
   */
  center: unknown;
  /**
   * `end`：最后一行按书写方向的行内结束侧对齐。
   */
  end: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `justify`：最后一行也两端对齐，拉伸到占满整行。
   */
  justify: unknown;
  /**
   * `left`：最后一行靠物理左侧对齐。
   */
  left: unknown;
  /**
   * `right`：最后一行靠物理右侧对齐。
   */
  right: unknown;
  /**
   * `start`：最后一行按书写方向的行内起始侧对齐。
   */
  start: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface TextAlignValues {
  /**
   * `center`：将行内内容在行盒中居中，不会让块盒自身居中。
   */
  center: unknown;
  /**
   * `end`：按当前书写方向的行内结束侧对齐。
   */
  end: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `justify`：调整行内间距使文字两端对齐；最后一行通常由 text-align-last 控制。
   */
  justify: unknown;
  /**
   * `left`：行内内容靠物理左侧对齐，不随书写方向改变。
   */
  left: unknown;
  /**
   * `match-parent`：类似继承父元素的对齐，但把父元素的 `start`、`end` 按本元素的书写方向换算成 `left`、`right`。
   */
  'match-parent': unknown;
  /**
   * `right`：行内内容靠物理右侧对齐，不随书写方向改变。
   */
  right: unknown;
  /**
   * `start`：按当前书写方向的行内起始侧对齐。
   */
  start: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface TextAnchorValues {
  /**
   * `end`：文本片段的终点位于锚点处，文字向锚点之前延伸。
   */
  end: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `middle`：文本片段的中点位于锚点处，文字向两侧均分延伸。
   */
  middle: unknown;
  /**
   * `start`：文本片段的起点位于锚点处，文字沿书写方向向后延伸。
   */
  start: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface TextCombineUprightKeywords {
  /**
   * `none`：不组合，竖排中的字符按常规方向排布。
   */
  none: unknown;
  /**
   * `all`：把元素内的全部字符压缩成一个字符宽度的横排单元，常用于竖排中的短数字或缩写。
   */
  all: unknown;
  /**
   * `digits`：把连续数字（默认最多 2 位，可写 `digits 4`）组合成横排单元。
   */
  digits: unknown;
}

interface TextDecorationLineKeywords {
  /**
   * `none`：不绘制任何装饰线，常用于去掉链接默认的下划线。
   */
  none: unknown;
  /**
   * `underline`：在文字下方绘制下划线。
   */
  underline: unknown;
  /**
   * `overline`：在文字上方绘制上划线。
   */
  overline: unknown;
  /**
   * `line-through`：在文字中部绘制删除线。
   */
  'line-through': unknown;
  /**
   * `blink`：让文字闪烁。规范允许不实现，现代浏览器基本不支持，不要使用。
   */
  blink: unknown;
  /**
   * `spelling-error`：以浏览器对拼写错误的标记样式（通常是红色波浪线）绘制装饰线，不能与其他线型组合；较新，支持有限。
   */
  'spelling-error': unknown;
  /**
   * `grammar-error`：以浏览器对语法错误的标记样式（通常是绿色波浪线）绘制装饰线，不能与其他线型组合；较新，支持有限。
   */
  'grammar-error': unknown;
}

interface TextDecorationSkipInkValues {
  /**
   * `all`：装饰线遇到字形笔画（如 g、p 的下伸部分）时总是断开，不论文字语言。
   */
  all: unknown;
  /**
   * `auto`：由浏览器决定：通常在笔画穿过装饰线处断开，对中日韩等文字可能不断开。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：装饰线连续绘制，直接穿过字形。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface TextDecorationSkipKeywords {
  /**
   * `none`：装饰线不跳过任何内容，从头到尾连续绘制。
   */
  none: unknown;
  /**
   * `objects`：跳过图片、行内块等原子行内元素。
   */
  objects: unknown;
  /**
   * `spaces`：跳过空白（单词间距、字间距）。
   */
  spaces: unknown;
  /**
   * `leading-spaces`：只跳过行首的空白。
   */
  'leading-spaces': unknown;
  /**
   * `trailing-spaces`：只跳过行尾的空白。
   */
  'trailing-spaces': unknown;
  /**
   * `edges`：装饰线两端略向内缩，避免相邻元素的装饰线连成一条。
   */
  edges: unknown;
  /**
   * `box-decoration`：跳过行内盒的内边距、边框和外边距所在的位置。
   */
  'box-decoration': unknown;
}

interface TextDecorationStyleKeywords {
  /**
   * `solid`：实线。
   */
  solid: unknown;
  /**
   * `double`：双线，两条平行的线。
   */
  double: unknown;
  /**
   * `dotted`：点线。
   */
  dotted: unknown;
  /**
   * `dashed`：虚线。
   */
  dashed: unknown;
  /**
   * `wavy`：波浪线，常用来表示拼写错误。
   */
  wavy: unknown;
}

interface TextDecorationStyleValues {
  /**
   * `dashed`：虚线。
   */
  dashed: unknown;
  /**
   * `dotted`：点线。
   */
  dotted: unknown;
  /**
   * `double`：双线，两条平行的线。
   */
  double: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `solid`：实线。
   */
  solid: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `wavy`：波浪线，常用来表示拼写错误。
   */
  wavy: unknown;
}

interface TextDecorationThicknessKeywords {
  /**
   * `auto`：由浏览器决定装饰线粗细，通常取字体建议值或按字号推算。
   */
  auto: unknown;
  /**
   * `from-font`：使用字体文件中指定的装饰线粗细；字体没有提供时回退为 `auto`。
   */
  'from-font': unknown;
}

interface TextEmphasisPositionKeywords {
  /**
   * `auto`：由浏览器按书写模式和语言选择着重号位置。
   */
  auto: unknown;
  /**
   * `over`：横排时着重号在文字上方；竖排时与 `right`、`left` 组合确定侧边。
   */
  over: unknown;
  /**
   * `under`：横排时着重号在文字下方；竖排时与 `right`、`left` 组合确定侧边。
   */
  under: unknown;
  /**
   * `right`：竖排时着重号在文字右侧，与 `over`、`under` 组合使用。
   */
  right: unknown;
  /**
   * `left`：竖排时着重号在文字左侧，与 `over`、`under` 组合使用。
   */
  left: unknown;
}

interface TextEmphasisStyleKeywords {
  /**
   * `none`：不显示着重号。
   */
  none: unknown;
  /**
   * `filled`：实心着重号；只写 `filled` 不写形状时，横排默认 `dot`，竖排默认 `sesame`。
   */
  filled: unknown;
  /**
   * `open`：空心着重号；只写 `open` 不写形状时，横排默认 `dot`，竖排默认 `sesame`。
   */
  open: unknown;
  /**
   * `dot`：小圆点形状的着重号，实心为 •，空心为 ◦。
   */
  dot: unknown;
  /**
   * `circle`：大圆形状的着重号，实心为 ●，空心为 ○。
   */
  circle: unknown;
  /**
   * `double-circle`：双圈形状的着重号，实心为 ◉，空心为 ◎。
   */
  'double-circle': unknown;
  /**
   * `triangle`：三角形形状的着重号，实心为 ▲，空心为 △。
   */
  triangle: unknown;
  /**
   * `sesame`：芝麻点形状的着重号，形似逗号，常用于日文竖排。
   */
  sesame: unknown;
}

interface TextIndentKeywords {
  /**
   * `hanging`：反转缩进：首行不缩进，其余各行缩进，形成悬挂缩进。
   */
  hanging: unknown;
  /**
   * `each-line`：缩进不仅作用于块的首行，也作用于每个强制换行之后的行。
   */
  'each-line': unknown;
}

interface TextJustifyValues {
  /**
   * `auto`：由浏览器选择两端对齐算法，在速度与效果之间取舍。
   */
  auto: unknown;
  /**
   * `distribute`：已废弃，等同 `inter-character`，改用 `inter-character`。
   */
  distribute: unknown;
  /**
   * `inter-character`：把多余空间分配到字符之间，适合不靠空格分词的中日文。
   */
  'inter-character': unknown;
  /**
   * `inter-word`：只在单词（空格）之间分配多余空间，适合英文等以空格分词的文字。
   */
  'inter-word': unknown;
  /**
   * `none`：禁用两端对齐，即使 `text-align: justify` 也不拉伸间距。
   */
  none: unknown;
}

interface TextOrientationValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `mixed`：竖排中拉丁字母等横排文字顺时针旋转 90° 躺倒，全角字符保持直立。
   */
  mixed: unknown;
  /**
   * `sideways`：所有字符都顺时针旋转 90° 躺倒，如同把横排文字整体旋转。
   */
  sideways: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `upright`：所有字符都保持直立，包括拉丁字母，逐字自上而下排列。
   */
  upright: unknown;
}

interface TextOverflowKeywords {
  /**
   * `clip`：直接裁剪溢出文本，不添加省略标记。
   */
  clip: unknown;
  /**
   * `ellipsis`：用省略号提示被裁剪的行内溢出；还需要限制尺寸并配置溢出规则。不会自动限制宽度、禁用换行或实现多行省略。Flex/Grid 子项还可能需要 min-width:0。
   */
  ellipsis: unknown;
}

interface TextRenderingValues {
  /**
   * `auto`：由浏览器自行权衡速度、可读性和精度，各引擎的策略不同。
   */
  auto: unknown;
  /**
   * `geometricPrecision`：优先几何精度，缩放时字形与间距更准确，可能增加渲染开销。
   */
  geometricPrecision: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `optimizeLegibility`：优先可读性，启用字距调整、连字等排版特性，可能牺牲速度。
   */
  optimizeLegibility: unknown;
  /**
   * `optimizeSpeed`：优先渲染速度，可能关闭字距调整和连字。
   */
  optimizeSpeed: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface TextShadowKeywords {
  /**
   * `none`：不添加文字阴影。
   */
  none: unknown;
}

interface TextSizeAdjustKeywords {
  /**
   * `none`：禁止浏览器自动调整文字大小。
   */
  none: unknown;
  /**
   * `auto`：允许浏览器按其算法自动放大文字，常见于移动端未适配视口的页面。
   */
  auto: unknown;
}

interface TextTransformValues {
  /**
   * `capitalize`：把每个单词的首字母转为大写，其余字母不变；具体规则随语言而定。
   */
  capitalize: unknown;
  /**
   * `full-width`：把字符转为全角形式，使半角字符与东亚字符等宽排列。
   */
  'full-width': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `lowercase`：把所有字母转为小写。
   */
  lowercase: unknown;
  /**
   * `none`：不转换大小写，按原文显示。
   */
  none: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `uppercase`：把所有字母转为大写。
   */
  uppercase: unknown;
}

interface TextUnderlineOffsetKeywords {
  /**
   * `auto`：由浏览器决定下划线与默认位置的偏移，通常依字体指标确定。
   */
  auto: unknown;
}

interface TextUnderlinePositionKeywords {
  /**
   * `auto`：由浏览器选择下划线位置，通常靠近基线。
   */
  auto: unknown;
  /**
   * `from-font`：使用字体提供的下划线位置；字体没有提供时回退为 `auto`。
   */
  'from-font': unknown;
  /**
   * `under`：下划线放在文字下缘之下，避免穿过下伸部分。
   */
  under: unknown;
  /**
   * `left`：竖排时下划线位于文字左侧，横排时无效。
   */
  left: unknown;
  /**
   * `right`：竖排时下划线位于文字右侧，横排时无效。
   */
  right: unknown;
}

interface TextWrapValues {
  /**
   * `balance`：尝试让各行长度更均衡，常用于标题；可处理行数由浏览器决定。
   */
  balance: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `nowrap`：禁止软换行，但不取消显式强制换行。
   */
  nowrap: unknown;
  /**
   * `pretty`：使用偏向排版质量的换行策略，例如减少末行孤立短词。
   */
  pretty: unknown;
  /**
   * `stable`：编辑时尽量不改变较早行的换行位置。
   */
  stable: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `wrap`：允许软换行。
   */
  wrap: unknown;
}

interface TimelineScopeKeywords {
  /**
   * `none`：不扩大任何时间线名称的作用域，名称只在声明它的元素子树内可引用。
   */
  none: unknown;
}

interface TopKeywords {
  /**
   * `auto`：不指定该侧偏移：绝对定位时位置由对侧偏移、元素尺寸或静态位置决定，相对定位时按 0 处理。
   */
  auto: unknown;
}

interface TouchActionKeywords {
  /**
   * `auto`：浏览器自行处理所有触摸手势。
   */
  auto: unknown;
  /**
   * `none`：禁用浏览器在该区域处理的平移和缩放手势，可能影响用户缩放可访问性。
   */
  none: unknown;
  /**
   * `pan-x`：允许浏览器处理水平单指平移。
   */
  'pan-x': unknown;
  /**
   * `pan-left`：允许浏览器处理单指向左的水平平移。
   */
  'pan-left': unknown;
  /**
   * `pan-right`：允许浏览器处理单指向右的水平平移。
   */
  'pan-right': unknown;
  /**
   * `pan-y`：允许浏览器处理垂直单指平移。
   */
  'pan-y': unknown;
  /**
   * `pan-up`：允许浏览器处理单指向上的垂直平移。
   */
  'pan-up': unknown;
  /**
   * `pan-down`：允许浏览器处理单指向下的垂直平移。
   */
  'pan-down': unknown;
  /**
   * `pinch-zoom`：允许浏览器处理双指捏合缩放。
   */
  'pinch-zoom': unknown;
  /**
   * `manipulation`：允许平移和连续缩放，通常禁用双击缩放等额外手势。
   */
  manipulation: unknown;
}

interface TransformBoxValues {
  /**
   * `border-box`：以边框盒为参照盒；没有 CSS 盒的 SVG 元素按 `stroke-box` 处理。
   */
  'border-box': unknown;
  /**
   * `fill-box`：以 SVG 元素对象的包围盒为参照盒，不含描边。
   */
  'fill-box': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `view-box`：以最近的 SVG 视口的 `viewBox` 为参照盒。
   */
  'view-box': unknown;
}

interface TransformKeywords {
  /**
   * `none`：不应用任何变换。
   */
  none: unknown;
}

interface TransformOriginKeywords {
  /**
   * `left`：水平方向取左边缘，相当于 0%。
   */
  left: unknown;
  /**
   * `center`：取中心位置，相当于 50%；也是水平和垂直方向的默认值。
   */
  center: unknown;
  /**
   * `right`：水平方向取右边缘，相当于 100%。
   */
  right: unknown;
  /**
   * `top`：垂直方向取上边缘，相当于 0%。
   */
  top: unknown;
  /**
   * `bottom`：垂直方向取下边缘，相当于 100%。
   */
  bottom: unknown;
}

interface TransformStyleValues {
  /**
   * `flat`：子元素被压平到该元素所在的平面，不保留各自的三维位置，是初始值。
   */
  flat: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `preserve-3d`：子元素保留自身的三维位置，与该元素共处同一个三维空间，可以前后穿插和遮挡。
   */
  'preserve-3d': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface TransitionPropertyKeywords {
  /**
   * `none`：不对任何属性做过渡，属性变化立即生效。
   */
  none: unknown;
}

interface TranslateKeywords {
  /**
   * `none`：不应用平移，元素停留在原位。
   */
  none: unknown;
}

interface UnicodeBidiValues {
  /**
   * `bidi-override`：覆盖双向算法，行内内容严格按 `direction` 的方向逐字排列，不再按字符本身的方向重排。
   */
  'bidi-override': unknown;
  /**
   * `embed`：开启一层新的嵌入，嵌入方向由 `direction` 决定，内部文本仍与外部文本一起参与重排。
   */
  embed: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `isolate`：将元素作为隔离单元，内部的双向重排与外部互不影响，常用于包裹用户生成的内容。
   */
  isolate: unknown;
  /**
   * `isolate-override`：同时具备 `isolate` 的隔离与 `bidi-override` 的强制方向效果。
   */
  'isolate-override': unknown;
  /**
   * `normal`：不引入额外的嵌入层级，按双向算法的默认隐式规则处理。
   */
  normal: unknown;
  /**
   * `plaintext`：忽略 `direction`，按元素内第一个具有强方向的字符自动判定方向，并作隔离处理。
   */
  plaintext: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface UserSelectValues {
  /**
   * `all`：将元素内容作为整体选取单元。
   */
  all: unknown;
  /**
   * `auto`：由父级与元素上下文决定使用的选取行为。
   */
  auto: unknown;
  /**
   * `contain`：选取只能在该元素内部开始和延伸，不会选到元素外的内容；非标准，浏览器基本不支持。
   */
  contain: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `none`：阻止常规文本选取，不是内容保护或访问控制。
   */
  none: unknown;
  /**
   * `text`：允许文本选取。
   */
  text: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface VerticalAlignKeywords {
  /**
   * `baseline`：元素基线与父级基线对齐，是默认行为；没有基线的盒子用下边缘对齐。
   */
  baseline: unknown;
  /**
   * `sub`：按下标位置对齐，元素基线相对父级基线下降。
   */
  sub: unknown;
  /**
   * `super`：按上标位置对齐，元素基线相对父级基线上升。
   */
  super: unknown;
  /**
   * `text-top`：元素顶部与父元素字体的顶部对齐。
   */
  'text-top': unknown;
  /**
   * `text-bottom`：元素底部与父元素字体的底部对齐。
   */
  'text-bottom': unknown;
  /**
   * `middle`：元素的垂直中点与父级基线上方半个 x 高度处对齐，近似文字中线。
   */
  middle: unknown;
  /**
   * `top`：元素顶部与所在行盒的顶部对齐；在表格单元格里则让内容贴紧单元格顶部。
   */
  top: unknown;
  /**
   * `bottom`：元素底部与所在行盒的底部对齐；在表格单元格里则让内容贴紧单元格底部。
   */
  bottom: unknown;
}

interface ViewTimelineAxisKeywords {
  /**
   * `block`：沿块轴方向滚动，即书写模式中块堆叠的方向，横排文字下是纵向。
   */
  block: unknown;
  /**
   * `inline`：沿行内轴方向滚动，即文字流动的方向，横排文字下是横向。
   */
  inline: unknown;
  /**
   * `x`：沿水平方向的滚动轴，与书写模式无关。
   */
  x: unknown;
  /**
   * `y`：沿垂直方向的滚动轴，与书写模式无关。
   */
  y: unknown;
}

interface ViewTimelineAxisValues {
  /**
   * `block`：沿块轴方向滚动，即书写模式中块堆叠的方向，横排文字下是纵向。
   */
  block: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `inline`：沿行内轴方向滚动，即文字流动的方向，横排文字下是横向。
   */
  inline: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `x`：沿水平方向的滚动轴，与书写模式无关。
   */
  x: unknown;
  /**
   * `y`：沿垂直方向的滚动轴，与书写模式无关。
   */
  y: unknown;
}

interface ViewTimelineInsetKeywords {
  /**
   * `auto`：不额外内缩，使用滚动容器对应方向的 `scroll-padding` 作为可见范围的边界。
   */
  auto: unknown;
}

interface ViewTimelineNameKeywords {
  /**
   * `none`：不创建具名的可见进度时间线，其他元素也无法通过名字引用它。
   */
  none: unknown;
}

interface ViewTransitionNameKeywords {
  /**
   * `none`：元素不单独参与视图过渡，随所在内容一起被截取到根快照里。
   */
  none: unknown;
  /**
   * `match-element`：由浏览器按元素自身标识自动生成唯一名称，无需手写名称即可让该元素单独参与视图过渡。
   */
  'match-element': unknown;
}

interface VisibilityValues {
  /**
   * `collapse`：对表格行列等特定布局有折叠语义，其他场景通常类似 hidden；应核对具体布局行为。
   */
  collapse: unknown;
  /**
   * `hidden`：隐藏绘制但通常保留布局空间；后代可显式恢复 visible。display:none 不保留布局盒；opacity:0 不会以相同方式移除交互和可访问性。
   */
  hidden: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `visible`：正常显示元素。
   */
  visible: unknown;
}

interface VoiceBalanceValues {
  /**
   * `center`：声音在左右声道间居中，是默认值。
   */
  center: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `left`：声音完全放在左声道。
   */
  left: unknown;
  /**
   * `leftwards`：在继承值的基础上把声音向左移动一段，具体幅度由实现决定。
   */
  leftwards: unknown;
  /**
   * `right`：声音完全放在右声道。
   */
  right: unknown;
  /**
   * `rightwards`：在继承值的基础上把声音向右移动一段，具体幅度由实现决定。
   */
  rightwards: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface VoiceStressValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `moderate`：使用比默认更强、但弱于 `strong` 的重音强调。
   */
  moderate: unknown;
  /**
   * `none`：不做任何重音强调，语音合成器按平铺方式朗读。
   */
  none: unknown;
  /**
   * `normal`：使用默认的重音强度。
   */
  normal: unknown;
  /**
   * `reduced`：重音强度比默认更弱，朗读起伏更平缓。
   */
  reduced: unknown;
  /**
   * `strong`：加强重音强调，朗读时更突出重读的词。
   */
  strong: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface WebkitAppearanceKeywords {
  /**
   * `none`：去掉系统原生外观，控件按普通元素处理，可用 CSS 完全自绘，常用于重置 `button`、`input`、`select`。
   */
  none: unknown;
  /**
   * `button`：渲染成原生按钮外观，与 `push-button` 效果相近。
   */
  button: unknown;
  /**
   * `button-bevel`：带斜面凸起效果的旧式按钮外观；非标准旧值，各浏览器行为不一。
   */
  'button-bevel': unknown;
  /**
   * `caret`：文本插入光标的外观；非标准旧值，各浏览器行为不一。
   */
  caret: unknown;
  /**
   * `checkbox`：渲染成原生复选框外观。
   */
  checkbox: unknown;
  /**
   * `default-button`：表单默认按钮（带强调）的外观；非标准旧值，各浏览器行为不一。
   */
  'default-button': unknown;
  /**
   * `inner-spin-button`：数字输入框内部的上下微调按钮外观；非标准，仅 WebKit/Blink 支持。
   */
  'inner-spin-button': unknown;
  /**
   * `listbox`：渲染成原生列表框外观，如多行显示的 `select`。
   */
  listbox: unknown;
  /**
   * `listitem`：列表项的外观；非标准旧值，各浏览器行为不一。
   */
  listitem: unknown;
  /**
   * `media-controls-background`：媒体控件栏的背景；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-controls-background': unknown;
  /**
   * `media-controls-fullscreen-background`：全屏模式下媒体控件栏的背景；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-controls-fullscreen-background': unknown;
  /**
   * `media-current-time-display`：媒体控件中的当前播放时间显示；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-current-time-display': unknown;
  /**
   * `media-enter-fullscreen-button`：媒体控件中的进入全屏按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-enter-fullscreen-button': unknown;
  /**
   * `media-exit-fullscreen-button`：媒体控件中的退出全屏按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-exit-fullscreen-button': unknown;
  /**
   * `media-fullscreen-button`：媒体控件中的全屏切换按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-fullscreen-button': unknown;
  /**
   * `media-mute-button`：媒体控件中的静音按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-mute-button': unknown;
  /**
   * `media-overlay-play-button`：覆盖在视频画面上的大播放按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-overlay-play-button': unknown;
  /**
   * `media-play-button`：媒体控件中的播放/暂停按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-play-button': unknown;
  /**
   * `media-seek-back-button`：媒体控件中的快退按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-seek-back-button': unknown;
  /**
   * `media-seek-forward-button`：媒体控件中的快进按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-seek-forward-button': unknown;
  /**
   * `media-slider`：媒体控件中的播放进度条；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-slider': unknown;
  /**
   * `media-sliderthumb`：媒体播放进度条上的滑块；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-sliderthumb': unknown;
  /**
   * `media-time-remaining-display`：媒体控件中的剩余时间显示；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-time-remaining-display': unknown;
  /**
   * `media-toggle-closed-captions-button`：媒体控件中的字幕开关按钮；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-toggle-closed-captions-button': unknown;
  /**
   * `media-volume-slider`：媒体控件中的音量滑条；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-volume-slider': unknown;
  /**
   * `media-volume-slider-container`：媒体控件中音量滑条的容器；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-volume-slider-container': unknown;
  /**
   * `media-volume-sliderthumb`：媒体音量滑条上的滑块；非标准，仅用于 WebKit/Blink 的媒体控件内部。
   */
  'media-volume-sliderthumb': unknown;
  /**
   * `menulist`：渲染成原生下拉选择框外观，如单选的 `select`。
   */
  menulist: unknown;
  /**
   * `menulist-button`：渲染成下拉选择框中的按钮部分外观。
   */
  'menulist-button': unknown;
  /**
   * `menulist-text`：下拉选择框中显示已选文字的区域；非标准旧值，各浏览器行为不一。
   */
  'menulist-text': unknown;
  /**
   * `menulist-textfield`：带文本输入区域的下拉框外观；非标准旧值，各浏览器行为不一。
   */
  'menulist-textfield': unknown;
  /**
   * `meter`：渲染成原生计量条外观，对应 `meter` 元素。
   */
  meter: unknown;
  /**
   * `progress-bar`：渲染成原生进度条外观，对应 `progress` 元素。
   */
  'progress-bar': unknown;
  /**
   * `progress-bar-value`：进度条中已完成的部分；非标准旧值，各浏览器行为不一。
   */
  'progress-bar-value': unknown;
  /**
   * `push-button`：渲染成普通的原生按钮外观，与 `button` 效果相近。
   */
  'push-button': unknown;
  /**
   * `radio`：渲染成原生单选框外观。
   */
  radio: unknown;
  /**
   * `searchfield`：渲染成原生搜索输入框外观，如 `type=search` 的输入框。
   */
  searchfield: unknown;
  /**
   * `searchfield-cancel-button`：搜索框内的清除（取消）按钮；非标准，仅 WebKit/Blink 支持。
   */
  'searchfield-cancel-button': unknown;
  /**
   * `searchfield-decoration`：搜索框内的装饰部分；非标准旧值，各浏览器行为不一。
   */
  'searchfield-decoration': unknown;
  /**
   * `searchfield-results-button`：搜索框内带放大镜、可展开历史结果的按钮；非标准旧值，各浏览器行为不一。
   */
  'searchfield-results-button': unknown;
  /**
   * `searchfield-results-decoration`：搜索框内的结果装饰图标（放大镜）；非标准旧值，各浏览器行为不一。
   */
  'searchfield-results-decoration': unknown;
  /**
   * `slider-horizontal`：渲染成原生水平滑条的轨道外观。
   */
  'slider-horizontal': unknown;
  /**
   * `slider-vertical`：渲染成原生垂直滑条的轨道外观；非标准旧值，各浏览器行为不一。
   */
  'slider-vertical': unknown;
  /**
   * `sliderthumb-horizontal`：水平滑条上的滑块外观；非标准旧值，各浏览器行为不一。
   */
  'sliderthumb-horizontal': unknown;
  /**
   * `sliderthumb-vertical`：垂直滑条上的滑块外观；非标准旧值，各浏览器行为不一。
   */
  'sliderthumb-vertical': unknown;
  /**
   * `square-button`：渲染成方形的原生按钮外观。
   */
  'square-button': unknown;
  /**
   * `textarea`：渲染成原生多行文本框外观。
   */
  textarea: unknown;
  /**
   * `textfield`：渲染成原生单行文本框外观。
   */
  textfield: unknown;
  /**
   * `apple-pay-button`：渲染成 Apple Pay 按钮；非标准，仅 Safari/WebKit 支持。
   */
  'apple-pay-button': unknown;
}

interface WebkitBackgroundClipValues {
  /**
   * `border-box`：背景延伸到边框外沿，会画在边框下方，是默认行为。
   */
  'border-box': unknown;
  /**
   * `content-box`：背景只绘制在内容区内，内边距和边框区域不显示背景。
   */
  'content-box': unknown;
  /**
   * `padding-box`：背景只绘制到内边距外沿，边框区域不显示背景。
   */
  'padding-box': unknown;
  /**
   * `text`：把背景裁剪成文字形状，只在字形内可见，配合透明文字颜色可做渐变文字。
   */
  text: unknown;
}

interface WebkitBoxOrientValues {
  /**
   * `block-axis`：旧版弹性盒的子元素沿块轴排列，横排文字下等同 `vertical`。
   */
  'block-axis': unknown;
  /**
   * `horizontal`：旧版弹性盒的子元素水平排列。
   */
  horizontal: unknown;
  /**
   * `inline-axis`：旧版弹性盒的子元素沿行内轴排列，横排文字下等同 `horizontal`。
   */
  'inline-axis': unknown;
  /**
   * `vertical`：旧版弹性盒的子元素垂直排列，与 `WebkitLineClamp` 配合实现多行截断。
   */
  vertical: unknown;
}

interface WebkitFontSmoothingValues {
  /**
   * `antialiased`：在 macOS 上改用灰度抗锯齿，文字比默认的子像素渲染更细；非标准，仅 macOS 的 WebKit/Blink 生效。
   */
  antialiased: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface WebkitLineClampKeywords {
  /**
   * `none`：不限制显示行数，文本完整显示，是默认值。
   */
  none: unknown;
}

interface WhiteSpaceValues {
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：折叠连续空白和源换行，允许软换行。
   */
  normal: unknown;
  /**
   * `nowrap`：折叠空白并禁止软换行；不会自行生成省略号。pre 也不进行普通软换行，但会保留连续空白。
   */
  nowrap: unknown;
  /**
   * `pre`：保留空白和源换行，不进行普通软换行。
   */
  pre: unknown;
  /**
   * `pre-line`：折叠空格等空白但保留源换行，同时允许软换行。
   */
  'pre-line': unknown;
  /**
   * `pre-wrap`：保留空白和源换行，同时允许软换行。pre 不进行普通软换行；pre-line 会折叠连续空格。
   */
  'pre-wrap': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface WidthKeywords {
  /**
   * `auto`：让布局算法决定尺寸，不保证等于父元素尺寸。
   */
  auto: unknown;
  /**
   * `min-content`：采用内容的最小内部尺寸，文字会考虑可用的软换行机会。
   */
  'min-content': unknown;
  /**
   * `max-content`：采用内容的最大内部尺寸，通常不进行软换行。
   */
  'max-content': unknown;
  /**
   * `fit-content`：在最小和最大内部尺寸之间按可用空间夹取尺寸。
   */
  'fit-content': unknown;
}

interface WillChangeKeywords {
  /**
   * `auto`：不提前告知任何即将变化的属性，由浏览器按常规方式处理，是默认值。
   */
  auto: unknown;
}

interface WordBreakValues {
  /**
   * `break-all`：允许在更多字符间断行以防溢出，可能拆开普通单词。
   */
  'break-all': unknown;
  /**
   * `break-word`：已废弃，效果等同 `overflowWrap: 'anywhere'`，长单词溢出时可在任意字符处断行；改用 `overflowWrap`。
   */
  'break-word': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `keep-all`：限制中日韩文字内部断行，其他文字仍按正常规则处理。
   */
  'keep-all': unknown;
  /**
   * `normal`：按语言的默认断行规则处理。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface WordSpacingKeywords {
  /**
   * `normal`：不额外增加词间距，使用字体自身的间距，计算值为 0。
   */
  normal: unknown;
}

interface WordWrapValues {
  /**
   * `break-word`：没有其他断行机会时，允许在单词内部任意位置折断，防止长单词溢出容器。
   */
  'break-word': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `normal`：只在正常断点处换行，过长的单词会溢出容器。
   */
  normal: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface WritingModeValues {
  /**
   * `horizontal-tb`：文字水平排列，行从上到下堆叠，是大多数语言的默认模式。
   */
  'horizontal-tb': unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `lr`：SVG 1.1 旧值，按 `horizontal-tb` 处理；已废弃，改用 `horizontal-tb`。
   */
  lr: unknown;
  /**
   * `lr-tb`：SVG 1.1 旧值，水平从左到右、行从上到下，按 `horizontal-tb` 处理；已废弃，改用 `horizontal-tb`。
   */
  'lr-tb': unknown;
  /**
   * `rl`：SVG 1.1 旧值，按 `horizontal-tb` 处理；已废弃，改用 `horizontal-tb` 搭配 `direction`。
   */
  rl: unknown;
  /**
   * `rl-tb`：SVG 1.1 旧值，水平从右到左、行从上到下，按 `horizontal-tb` 处理；已废弃，改用 `horizontal-tb` 搭配 `direction`。
   */
  'rl-tb': unknown;
  /**
   * `sideways-lr`：文字整体逆时针旋转 90° 竖排，行从左到右堆叠，适合侧向标签。
   */
  'sideways-lr': unknown;
  /**
   * `sideways-rl`：文字整体顺时针旋转 90° 竖排，行从右到左堆叠。
   */
  'sideways-rl': unknown;
  /**
   * `tb`：SVG 1.1 旧值，按 `vertical-rl` 处理；已废弃，改用 `vertical-rl`。
   */
  tb: unknown;
  /**
   * `tb-rl`：SVG 1.1 旧值，垂直排列、行从右到左，按 `vertical-rl` 处理；已废弃，改用 `vertical-rl`。
   */
  'tb-rl': unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
  /**
   * `vertical-lr`：文字竖排，行从左到右堆叠，蒙古文用这种排法；字形朝向由 `text-orientation` 决定。
   */
  'vertical-lr': unknown;
  /**
   * `vertical-rl`：文字垂直排列，行从右到左堆叠，常用于中日韩文字竖排。
   */
  'vertical-rl': unknown;
}

interface ZIndexValues {
  /**
   * `auto`：层叠级别与父级相同（视为 0），且不会因此创建新的层叠上下文。
   */
  auto: unknown;
  /**
   * `inherit`：继承父元素该属性的计算值。
   */
  inherit: unknown;
  /**
   * `initial`：使用该属性的初始值，无论它本身是否可继承。
   */
  initial: unknown;
  /**
   * `unset`：可继承的属性按 `inherit` 处理，不可继承的属性按 `initial` 处理。
   */
  unset: unknown;
}

interface ZoomKeywords {
  /**
   * `normal`：不额外缩放（等同 `1`），沿用祖先已有的缩放，是默认值。
   */
  normal: unknown;
  /**
   * `reset`：把该元素的有效缩放重置为 1，忽略祖先 `zoom` 带来的缩放；浏览器支持有限。
   */
  reset: unknown;
}
