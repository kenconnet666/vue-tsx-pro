// 由 scripts/css-docs/generate.mjs 生成，请勿手改；数据来源见 scripts/css-docs/NOTICE.md。
// 主题库填入 token 接口之前，`keyof FontSizesTokens` 这类短写是 never
// oxlint-disable no-redundant-type-constituents
import type { CSSProperties } from '@stylexjs/stylex';
import type { KeywordValue, StyleValue } from './value';

/** StyleX 样式对象：每个属性带中文说明，值类型直接引用 StyleX 自己的定义 */
export interface DocumentedStyles {
  /**
   * 非标准键：StyleX 类型中保留的名称，不对应任何 CSS 属性，不要使用。（theme）
   */
  theme?: StyleValue<CSSProperties['theme']>;
  /**
   * Firefox 在 macOS 上的字体平滑方式（-moz-osx-font-smoothing），非标准；grayscale 可让深色背景上的浅色文字更细。
   */
  MozOsxFontSmoothing?: StyleValue<CSSProperties['MozOsxFontSmoothing']>;
  /**
   * 控制表单控件是否使用系统原生外观（-webkit-appearance）；标准写法是 appearance，常用 none 去掉原生样式后自绘。
   *
   * 初始值 `noneButOverriddenInUserAgentCSS`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/appearance
   */
  WebkitAppearance?: StyleValue<CSSProperties['WebkitAppearance']>;
  /**
   * WebKit 在 macOS 上的字体抗锯齿方式（-webkit-font-smoothing），非标准；antialiased 让文字显得更细。
   */
  WebkitFontSmoothing?: StyleValue<CSSProperties['WebkitFontSmoothing']>;
  /**
   * 移动端点击元素时出现的高亮颜色（-webkit-tap-highlight-color），非标准；设为 transparent 可去掉高亮。
   *
   * 初始值 `black`；继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-tap-highlight-color
   */
  WebkitTapHighlightColor?: StyleValue<CSSProperties['WebkitTapHighlightColor']>;
  /**
   * 带 WebKit 前缀的遮罩图像（-webkit-mask-image）；标准写法是 maskImage，只在兼容旧版 Safari 时使用。
   *
   * 初始值 `none`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-image
   */
  WebkitMaskImage?: StyleValue<CSSProperties['WebkitMaskImage']>;
  /**
   * 文字的填充颜色（-webkit-text-fill-color），优先于 color；常与 backgroundClip: text 配合做渐变文字。
   *
   * 初始值 `currentcolor`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-text-fill-color
   */
  WebkitTextFillColor?: StyleValue<
    KeywordValue<ColorsTokens, CSSProperties['WebkitTextFillColor']>
  >;
  /**
   * 无前缀的文字填充颜色，浏览器尚未支持；请使用 WebkitTextFillColor。（text-fill-color）
   */
  textFillColor?: StyleValue<CSSProperties['textFillColor']>;
  /**
   * 文字描边的宽度（-webkit-text-stroke-width）。
   *
   * 数字值自动加 `px`；初始值 `0`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-text-stroke-width
   */
  WebkitTextStrokeWidth?: StyleValue<CSSProperties['WebkitTextStrokeWidth']>;
  /**
   * 文字描边的颜色（-webkit-text-stroke-color）。
   *
   * 初始值 `currentcolor`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-text-stroke-color
   */
  WebkitTextStrokeColor?: StyleValue<
    KeywordValue<ColorsTokens, CSSProperties['WebkitTextStrokeColor']>
  >;
  /**
   * 带 WebKit 前缀的背景裁剪区域（-webkit-background-clip）；取值 text 时背景只画在文字里，用于渐变文字。
   */
  WebkitBackgroundClip?: StyleValue<CSSProperties['WebkitBackgroundClip']>;
  /**
   * 指定旧版弹性盒的排列方向；仅为多行截断兼容保留，常规布局请使用 Flex/Grid。（-webkit-box-orient）
   */
  WebkitBoxOrient?: StyleValue<CSSProperties['WebkitBoxOrient']>;
  /**
   * 限制多行文本显示的行数；需要同时写 display: '-webkit-box'、WebkitBoxOrient: 'vertical' 和 overflow: 'hidden'，不删除文本内容。（-webkit-line-clamp）
   *
   * 数字值不加单位；初始值 `none`；不继承。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/-webkit-line-clamp
   */
  WebkitLineClamp?: StyleValue<CSSProperties['WebkitLineClamp']>;
  /**
   * 设置复选框、单选框等原生控件的强调色；具体使用部位由浏览器决定。（accent-color）
   *
   * 初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/accent-color
   */
  accentColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['accentColor']>>;
  /**
   * 设置盒子的首选宽高比，参与自动尺寸计算。（aspect-ratio）
   *
   * 通常需要至少一个轴为自动尺寸才参与尺寸计算；两个轴都被明确尺寸约束时，不会强行保持比例。
   *
   * 适用场景：图片占位、视频和卡片封面区域。
   *
   * 数字值不加单位；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/aspect-ratio
   */
  aspectRatio?: StyleValue<CSSProperties['aspectRatio']>;
  /**
   * 同时设置 align-content 与 justify-content。（place-content）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-content
   */
  placeContent?: StyleValue<CSSProperties['placeContent']>;
  /**
   * 分配布局容器交叉轴或块轴上的剩余空间，控制内容整体的对齐。（align-content）
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/align-content
   */
  alignContent?: StyleValue<CSSProperties['alignContent']>;
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
  justifyContent?: StyleValue<
    KeywordValue<JustifyContentKeywords, CSSProperties['justifyContent']>
  >;
  /**
   * 同时设置 align-items 与 justify-items。（place-items）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-items
   */
  placeItems?: StyleValue<CSSProperties['placeItems']>;
  /**
   * 同时设置 align-self 与 justify-self。（place-self）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-self
   */
  placeSelf?: StyleValue<CSSProperties['placeSelf']>;
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
  alignItems?: StyleValue<KeywordValue<AlignItemsKeywords, CSSProperties['alignItems']>>;
  /**
   * 设置容器内项目在行内轴上的默认对齐方式；不控制 Flex 项目的主轴对齐。（justify-items）
   *
   * 初始值 `legacy`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/justify-items
   */
  justifyItems?: StyleValue<CSSProperties['justifyItems']>;
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
  alignSelf?: StyleValue<KeywordValue<AlignSelfKeywords, CSSProperties['alignSelf']>>;
  /**
   * 单独设置项目在其布局区域内的行内轴对齐方式。（justify-self）
   *
   * 常用值：
   * - `auto`：采用父容器 justify-items 等上下文决定的对齐方式；不用于 Flex 项目的主轴分配。
   * - `stretch`：在自动尺寸和最小/最大约束允许时沿行内轴拉伸。
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/justify-self
   */
  justifySelf?: StyleValue<KeywordValue<JustifySelfKeywords, CSSProperties['justifySelf']>>;
  /**
   * 选择行内或 SVG 文本参与对齐时使用的基线。（alignment-baseline）
   *
   * 初始值 `baseline`；不继承；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/alignment-baseline
   */
  alignmentBaseline?: StyleValue<CSSProperties['alignmentBaseline']>;
  /**
   * 旧版瀑布流布局提案中沿块轴对齐轨道的属性；使用前核对实现与规范版本。（align-tracks）
   *
   * 初始值 `normal`；不继承；非标准。
   */
  alignTracks?: StyleValue<CSSProperties['alignTracks']>;
  /**
   * 旧版瀑布流布局提案中沿行内轴对齐轨道的属性；使用前核对实现与规范版本。（justify-tracks）
   *
   * 初始值 `normal`；不继承；非标准。
   */
  justifyTracks?: StyleValue<CSSProperties['justifyTracks']>;
  /**
   * 旧版瀑布流布局提案中的自动放置策略；使用前核对实现与规范版本。（masonry-auto-flow）
   *
   * 初始值 `pack`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-flow
   */
  masonryAutoFlow?: StyleValue<CSSProperties['masonryAutoFlow']>;
  /**
   * 为元素声明锚点名称，供锚点定位的元素引用。（anchor-name）
   *
   * 初始值 `none`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/anchor-name
   */
  anchorName?: StyleValue<CSSProperties['anchorName']>;
  /**
   * 集中设置关键帧动画的名称、时长、缓动、延迟、次数及播放行为。（animation）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation
   */
  animation?: StyleValue<CSSProperties['animation']>;
  /**
   * 设置动画效果与底层属性值的替换、叠加或累积方式。（animation-composition）
   *
   * 初始值 `replace`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-composition
   */
  animationComposition?: StyleValue<CSSProperties['animationComposition']>;
  /**
   * 设置动画开始前的延迟；负值表示从动画中途开始播放。（animation-delay）
   *
   * 初始值 `0s`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-delay
   */
  animationDelay?: StyleValue<KeywordValue<DurationsTokens, CSSProperties['animationDelay']>>;
  /**
   * 设置动画按正向、反向或交替方向播放。（animation-direction）
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-direction
   */
  animationDirection?: StyleValue<CSSProperties['animationDirection']>;
  /**
   * 设置动画完成一次循环的时长。（animation-duration）
   *
   * 初始值 `0s`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-duration
   */
  animationDuration?: StyleValue<KeywordValue<DurationsTokens, CSSProperties['animationDuration']>>;
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
    KeywordValue<AnimationFillModeKeywords, CSSProperties['animationFillMode']>
  >;
  /**
   * 设置动画循环次数，或无限循环。（animation-iteration-count）
   *
   * 数字值不加单位；初始值 `1`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-iteration-count
   */
  animationIterationCount?: StyleValue<CSSProperties['animationIterationCount']>;
  /**
   * 选择要播放的 @keyframes 动画名称。（animation-name）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-name
   */
  animationName?: StyleValue<CSSProperties['animationName']>;
  /**
   * 控制动画运行或暂停，暂停后可从原位置继续。（animation-play-state）
   *
   * 初始值 `running`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-play-state
   */
  animationPlayState?: StyleValue<CSSProperties['animationPlayState']>;
  /**
   * 设置动画每个关键帧区间内进度变化的缓动函数。（animation-timing-function）
   *
   * 初始值 `ease`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-timing-function
   */
  animationTimingFunction?: StyleValue<
    KeywordValue<EasingsTokens, CSSProperties['animationTimingFunction']>
  >;
  /**
   * 选择驱动动画的时间线，例如文档时间或滚动进度。（animation-timeline）
   *
   * 初始值 `auto`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-timeline
   */
  animationTimeline?: StyleValue<CSSProperties['animationTimeline']>;
  /**
   * 设置动画附着到时间线的起止范围。（animation-range）
   *
   * 简写属性，初始值见各分项；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range
   */
  animationRange?: StyleValue<CSSProperties['animationRange']>;
  /**
   * 设置动画在时间线上的附着范围起点。（animation-range-start）
   *
   * 初始值 `normal`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range-start
   */
  animationRangeStart?: StyleValue<CSSProperties['animationRangeStart']>;
  /**
   * 设置动画在时间线上的附着范围终点。（animation-range-end）
   *
   * 初始值 `normal`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range-end
   */
  animationRangeEnd?: StyleValue<CSSProperties['animationRangeEnd']>;
  /**
   * 控制元素是否采用平台原生控件外观。（appearance）
   *
   * 初始值 `none`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/appearance
   */
  appearance?: StyleValue<CSSProperties['appearance']>;
  /**
   * 语音合成中声音的水平方位（azimuth），来自已废弃的 CSS2 听觉样式，浏览器不支持。
   */
  azimuth?: StyleValue<CSSProperties['azimuth']>;
  /**
   * 对元素背后的图像区域应用模糊等滤镜，通常需要透明或半透明背景。（backdrop-filter）
   *
   * 初始值 `none`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/backdrop-filter
   */
  backdropFilter?: StyleValue<CSSProperties['backdropFilter']>;
  /**
   * 控制经过三维变换后背向观察者的元素背面是否可见。（backface-visibility）
   *
   * 初始值 `visible`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/backface-visibility
   */
  backfaceVisibility?: StyleValue<CSSProperties['backfaceVisibility']>;
  /**
   * 集中设置背景颜色、图像、位置、尺寸、重复及绘制区域。（background）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background
   */
  background?: StyleValue<CSSProperties['background']>;
  /**
   * 设置背景图像相对于视口、元素或局部滚动内容的固定方式。（background-attachment）
   *
   * 初始值 `scroll`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-attachment
   */
  backgroundAttachment?: StyleValue<CSSProperties['backgroundAttachment']>;
  /**
   * 设置背景图层彼此之间以及与背景色之间的混合模式。（background-blend-mode）
   *
   * 初始值 `normal`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-blend-mode
   */
  backgroundBlendMode?: StyleValue<CSSProperties['backgroundBlendMode']>;
  /**
   * 设置背景允许绘制到的边界区域。（background-clip）
   *
   * 常用值：
   * - `text`：把背景裁剪到文字字形；显示背景文字效果通常还需要透明的文字颜色。
   *
   * 初始值 `border-box`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-clip
   */
  backgroundClip?: StyleValue<
    KeywordValue<BackgroundClipKeywords, CSSProperties['backgroundClip']>
  >;
  /**
   * 设置元素背景颜色，位于背景图像下方。（background-color）
   *
   * 初始值 `transparent`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-color
   */
  backgroundColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['backgroundColor']>>;
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
    KeywordValue<BackgroundImageKeywords, CSSProperties['backgroundImage']>
  >;
  /**
   * 设置背景图像定位所依据的盒子区域。（background-origin）
   *
   * 初始值 `padding-box`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-origin
   */
  backgroundOrigin?: StyleValue<CSSProperties['backgroundOrigin']>;
  /**
   * 设置背景图像在定位区域内的位置。（background-position）
   *
   * 初始值 `0% 0%`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position
   */
  backgroundPosition?: StyleValue<CSSProperties['backgroundPosition']>;
  /**
   * 设置背景图像的水平位置。（background-position-x）
   *
   * 初始值 `0%`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position-x
   */
  backgroundPositionX?: StyleValue<CSSProperties['backgroundPositionX']>;
  /**
   * 设置背景图像的垂直位置。（background-position-y）
   *
   * 初始值 `0%`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position-y
   */
  backgroundPositionY?: StyleValue<CSSProperties['backgroundPositionY']>;
  /**
   * 设置背景图像在水平和垂直方向上的重复方式。（background-repeat）
   *
   * 初始值 `repeat`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-repeat
   */
  backgroundRepeat?: StyleValue<CSSProperties['backgroundRepeat']>;
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
  backgroundSize?: StyleValue<KeywordValue<MaskSizeKeywords, CSSProperties['backgroundSize']>>;
  /**
   * 使 SVG 文本基线相对于其基准位置偏移。（baseline-shift）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2026 年起新近可用。
   */
  baselineShift?: StyleValue<CSSProperties['baselineShift']>;
  /**
   * IE 专有的 HTC 行为绑定（behavior），已废弃，现代浏览器不支持。
   */
  behavior?: StyleValue<CSSProperties['behavior']>;
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
  blockSize?: StyleValue<KeywordValue<WidthKeywords, CSSProperties['blockSize']>>;
  /**
   * 同时设置四边边框的宽度、线型和颜色。（border）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border
   */
  border?: StyleValue<CSSProperties['border']>;
  /**
   * 设置逻辑块轴起始侧和结束侧的边框。（border-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block
   */
  borderBlock?: StyleValue<CSSProperties['borderBlock']>;
  /**
   * 设置逻辑块轴两侧边框颜色。（border-block-color）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-color
   */
  borderBlockColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['borderBlockColor']>>;
  /**
   * 设置逻辑块轴两侧的边框线型。（border-block-style）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-style
   */
  borderBlockStyle?: StyleValue<CSSProperties['borderBlockStyle']>;
  /**
   * 设置逻辑块轴两侧的边框宽度。（border-block-width）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-width
   */
  borderBlockWidth?: StyleValue<CSSProperties['borderBlockWidth']>;
  /**
   * 设置逻辑块轴结束侧边框的宽度、线型和颜色。（border-block-end）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end
   */
  borderBlockEnd?: StyleValue<CSSProperties['borderBlockEnd']>;
  /**
   * 设置逻辑块轴结束侧的边框颜色。（border-block-end-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-color
   */
  borderBlockEndColor?: StyleValue<
    KeywordValue<ColorsTokens, CSSProperties['borderBlockEndColor']>
  >;
  /**
   * 设置逻辑块轴结束侧的边框线型。（border-block-end-style）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-style
   */
  borderBlockEndStyle?: StyleValue<CSSProperties['borderBlockEndStyle']>;
  /**
   * 设置逻辑块轴结束侧的边框宽度。（border-block-end-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-width
   */
  borderBlockEndWidth?: StyleValue<CSSProperties['borderBlockEndWidth']>;
  /**
   * 设置逻辑块轴起始侧边框的宽度、线型和颜色。（border-block-start）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start
   */
  borderBlockStart?: StyleValue<CSSProperties['borderBlockStart']>;
  /**
   * 设置逻辑块轴起始侧的边框颜色。（border-block-start-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-color
   */
  borderBlockStartColor?: StyleValue<
    KeywordValue<ColorsTokens, CSSProperties['borderBlockStartColor']>
  >;
  /**
   * 设置逻辑块轴起始侧的边框线型。（border-block-start-style）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-style
   */
  borderBlockStartStyle?: StyleValue<CSSProperties['borderBlockStartStyle']>;
  /**
   * 设置逻辑块轴起始侧的边框宽度。（border-block-start-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-width
   */
  borderBlockStartWidth?: StyleValue<CSSProperties['borderBlockStartWidth']>;
  /**
   * 设置下边框的宽度、线型和颜色。（border-bottom）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom
   */
  borderBottom?: StyleValue<CSSProperties['borderBottom']>;
  /**
   * 设置下边框颜色。（border-bottom-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-color
   */
  borderBottomColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['borderBottomColor']>>;
  /**
   * 设置下边框线型。（border-bottom-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-style
   */
  borderBottomStyle?: StyleValue<CSSProperties['borderBottomStyle']>;
  /**
   * 设置下边框宽度。（border-bottom-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-width
   */
  borderBottomWidth?: StyleValue<CSSProperties['borderBottomWidth']>;
  /**
   * 设置表格相邻单元格边框合并还是分离。（border-collapse）
   *
   * 初始值 `separate`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-collapse
   */
  borderCollapse?: StyleValue<CSSProperties['borderCollapse']>;
  /**
   * 设置四边边框颜色，支持按上、右、下、左顺序简写。（border-color）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-color
   */
  borderColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['borderColor']>>;
  /**
   * 设置用作边框的图像及其切片、宽度、外扩和重复方式。（border-image）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image
   */
  borderImage?: StyleValue<CSSProperties['borderImage']>;
  /**
   * 设置边框图像超出边框盒的距离。（border-image-outset）
   *
   * 初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-outset
   */
  borderImageOutset?: StyleValue<CSSProperties['borderImageOutset']>;
  /**
   * 设置边框图像切片沿边框的重复或拉伸方式。（border-image-repeat）
   *
   * 初始值 `stretch`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-repeat
   */
  borderImageRepeat?: StyleValue<CSSProperties['borderImageRepeat']>;
  /**
   * 设置边框图像的切片位置及是否填充中间区域。（border-image-slice）
   *
   * 数字值不加单位；初始值 `100%`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-slice
   */
  borderImageSlice?: StyleValue<CSSProperties['borderImageSlice']>;
  /**
   * 指定边框使用的图像或渐变。（border-image-source）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-source
   */
  borderImageSource?: StyleValue<CSSProperties['borderImageSource']>;
  /**
   * 设置边框图像各边的绘制宽度。（border-image-width）
   *
   * 初始值 `1`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-width
   */
  borderImageWidth?: StyleValue<CSSProperties['borderImageWidth']>;
  /**
   * 设置逻辑行内轴起始侧和结束侧的边框。（border-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline
   */
  borderInline?: StyleValue<CSSProperties['borderInline']>;
  /**
   * 设置逻辑行内轴两侧边框颜色。（border-inline-color）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-color
   */
  borderInlineColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['borderInlineColor']>>;
  /**
   * 设置逻辑行内轴两侧边框线型。（border-inline-style）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-style
   */
  borderInlineStyle?: StyleValue<CSSProperties['borderInlineStyle']>;
  /**
   * 设置逻辑行内轴两侧边框宽度。（border-inline-width）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-width
   */
  borderInlineWidth?: StyleValue<CSSProperties['borderInlineWidth']>;
  /**
   * 设置逻辑行内轴结束侧边框的宽度、线型和颜色。（border-inline-end）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end
   */
  borderInlineEnd?: StyleValue<CSSProperties['borderInlineEnd']>;
  /**
   * 设置逻辑行内轴结束侧边框颜色。（border-inline-end-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-color
   */
  borderInlineEndColor?: StyleValue<
    KeywordValue<ColorsTokens, CSSProperties['borderInlineEndColor']>
  >;
  /**
   * 设置逻辑行内轴结束侧边框线型。（border-inline-end-style）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-style
   */
  borderInlineEndStyle?: StyleValue<CSSProperties['borderInlineEndStyle']>;
  /**
   * 设置逻辑行内轴结束侧边框宽度。（border-inline-end-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-width
   */
  borderInlineEndWidth?: StyleValue<CSSProperties['borderInlineEndWidth']>;
  /**
   * 设置逻辑行内轴起始侧边框的宽度、线型和颜色。（border-inline-start）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start
   */
  borderInlineStart?: StyleValue<CSSProperties['borderInlineStart']>;
  /**
   * 设置逻辑行内轴起始侧边框颜色。（border-inline-start-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-color
   */
  borderInlineStartColor?: StyleValue<
    KeywordValue<ColorsTokens, CSSProperties['borderInlineStartColor']>
  >;
  /**
   * 设置逻辑行内轴起始侧边框线型。（border-inline-start-style）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-style
   */
  borderInlineStartStyle?: StyleValue<CSSProperties['borderInlineStartStyle']>;
  /**
   * 设置逻辑行内轴起始侧边框宽度。（border-inline-start-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-width
   */
  borderInlineStartWidth?: StyleValue<CSSProperties['borderInlineStartWidth']>;
  /**
   * 设置左边框的宽度、线型和颜色。（border-left）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left
   */
  borderLeft?: StyleValue<CSSProperties['borderLeft']>;
  /**
   * 设置左边框颜色。（border-left-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-color
   */
  borderLeftColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['borderLeftColor']>>;
  /**
   * 设置左边框线型。（border-left-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-style
   */
  borderLeftStyle?: StyleValue<CSSProperties['borderLeftStyle']>;
  /**
   * 设置左边框宽度。（border-left-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-width
   */
  borderLeftWidth?: StyleValue<CSSProperties['borderLeftWidth']>;
  /**
   * 设置右边框的宽度、线型和颜色。（border-right）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right
   */
  borderRight?: StyleValue<CSSProperties['borderRight']>;
  /**
   * 设置右边框颜色。（border-right-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-color
   */
  borderRightColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['borderRightColor']>>;
  /**
   * 设置右边框线型。（border-right-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-style
   */
  borderRightStyle?: StyleValue<CSSProperties['borderRightStyle']>;
  /**
   * 设置右边框宽度。（border-right-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-width
   */
  borderRightWidth?: StyleValue<CSSProperties['borderRightWidth']>;
  /**
   * 设置分离边框模型下表格单元格之间的水平和垂直间距。（border-spacing）
   *
   * 数字值自动加 `px`；初始值 `0`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-spacing
   */
  borderSpacing?: StyleValue<CSSProperties['borderSpacing']>;
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
  borderStyle?: StyleValue<KeywordValue<BorderStyleKeywords, CSSProperties['borderStyle']>>;
  /**
   * 设置上边框的宽度、线型和颜色。（border-top）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top
   */
  borderTop?: StyleValue<CSSProperties['borderTop']>;
  /**
   * 设置上边框颜色。（border-top-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-color
   */
  borderTopColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['borderTopColor']>>;
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
  borderRadius?: StyleValue<KeywordValue<RadiiTokens, CSSProperties['borderRadius']>>;
  /**
   * 设置逻辑块轴结束侧与行内轴起始侧相交角的圆角。（border-end-start-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-end-start-radius
   */
  borderEndStartRadius?: StyleValue<
    KeywordValue<RadiiTokens, CSSProperties['borderEndStartRadius']>
  >;
  /**
   * 设置逻辑块轴起始侧与行内轴起始侧相交角的圆角。（border-start-start-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-start-start-radius
   */
  borderStartStartRadius?: StyleValue<
    KeywordValue<RadiiTokens, CSSProperties['borderStartStartRadius']>
  >;
  /**
   * 设置逻辑块轴起始侧与行内轴结束侧相交角的圆角。（border-start-end-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-start-end-radius
   */
  borderStartEndRadius?: StyleValue<
    KeywordValue<RadiiTokens, CSSProperties['borderStartEndRadius']>
  >;
  /**
   * 设置逻辑块轴结束侧与行内轴结束侧相交角的圆角。（border-end-end-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-end-end-radius
   */
  borderEndEndRadius?: StyleValue<KeywordValue<RadiiTokens, CSSProperties['borderEndEndRadius']>>;
  /**
   * 设置左上角边框的圆角半径。（border-top-left-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-left-radius
   */
  borderTopLeftRadius?: StyleValue<KeywordValue<RadiiTokens, CSSProperties['borderTopLeftRadius']>>;
  /**
   * 设置右上角边框的圆角半径。（border-top-right-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-right-radius
   */
  borderTopRightRadius?: StyleValue<
    KeywordValue<RadiiTokens, CSSProperties['borderTopRightRadius']>
  >;
  /**
   * 设置左下角边框的圆角半径。（border-bottom-left-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-left-radius
   */
  borderBottomLeftRadius?: StyleValue<
    KeywordValue<RadiiTokens, CSSProperties['borderBottomLeftRadius']>
  >;
  /**
   * 设置右下角边框的圆角半径。（border-bottom-right-radius）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-right-radius
   */
  borderBottomRightRadius?: StyleValue<
    KeywordValue<RadiiTokens, CSSProperties['borderBottomRightRadius']>
  >;
  /**
   * 设置四个角的形状，如 round、squircle、bevel、notch（corner-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 简写属性，初始值见各分项；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-shape
   */
  cornerShape?: StyleValue<CSSProperties['cornerShape']>;
  /**
   * 单独设置块起始、行内起始方向那个角的形状（corner-start-start-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-start-start-shape
   */
  cornerStartStartShape?: StyleValue<CSSProperties['cornerStartStartShape']>;
  /**
   * 单独设置块起始、行内结束方向那个角的形状（corner-start-end-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-start-end-shape
   */
  cornerStartEndShape?: StyleValue<CSSProperties['cornerStartEndShape']>;
  /**
   * 单独设置块结束、行内起始方向那个角的形状（corner-end-start-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-end-start-shape
   */
  cornerEndStartShape?: StyleValue<CSSProperties['cornerEndStartShape']>;
  /**
   * 单独设置块结束、行内结束方向那个角的形状（corner-end-end-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-end-end-shape
   */
  cornerEndEndShape?: StyleValue<CSSProperties['cornerEndEndShape']>;
  /**
   * 单独设置左上角的形状（corner-top-left-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-top-left-shape
   */
  cornerTopLeftShape?: StyleValue<CSSProperties['cornerTopLeftShape']>;
  /**
   * 单独设置右上角的形状（corner-top-right-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-top-right-shape
   */
  cornerTopRightShape?: StyleValue<CSSProperties['cornerTopRightShape']>;
  /**
   * 单独设置左下角的形状（corner-bottom-left-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-bottom-left-shape
   */
  cornerBottomLeftShape?: StyleValue<CSSProperties['cornerBottomLeftShape']>;
  /**
   * 单独设置右下角的形状（corner-bottom-right-shape），与 borderRadius 配合；浏览器支持仍有限。
   *
   * 初始值 `round`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/corner-bottom-right-shape
   */
  cornerBottomRightShape?: StyleValue<CSSProperties['cornerBottomRightShape']>;
  /**
   * 设置上边框线型。（border-top-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-style
   */
  borderTopStyle?: StyleValue<CSSProperties['borderTopStyle']>;
  /**
   * 设置上边框宽度。（border-top-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-width
   */
  borderTopWidth?: StyleValue<CSSProperties['borderTopWidth']>;
  /**
   * 设置四边边框宽度；可见边框通常还需要非 none 的线型。（border-width）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-width
   */
  borderWidth?: StyleValue<CSSProperties['borderWidth']>;
  /**
   * 设置定位元素相对于其定位参照的下侧偏移。（bottom）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/bottom
   */
  bottom?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['bottom']>>;
  /**
   * 旧版弹性盒（display: -webkit-box）中子元素在交叉轴上的对齐（box-align），已废弃，请用 alignItems。
   *
   * 初始值 `stretch`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-align
   */
  boxAlign?: StyleValue<CSSProperties['boxAlign']>;
  /**
   * 设置盒子被分成多行、多栏或多页时装饰如何绘制。（box-decoration-break）
   *
   * 初始值 `slice`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-decoration-break
   */
  boxDecorationBreak?: StyleValue<CSSProperties['boxDecorationBreak']>;
  /**
   * 旧版弹性盒中子元素排列方向是否反转（box-direction），已废弃，请用 flexDirection。
   *
   * 初始值 `normal`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-direction
   */
  boxDirection?: StyleValue<CSSProperties['boxDirection']>;
  /**
   * 旧版弹性盒中子元素的伸缩比例（box-flex），已废弃，请用 flexGrow。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-flex
   */
  boxFlex?: StyleValue<CSSProperties['boxFlex']>;
  /**
   * 旧版弹性盒中子元素的伸缩分组（box-flex-group），已废弃，浏览器基本不支持。
   *
   * 数字值自动加 `px`；初始值 `1`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-flex-group
   */
  boxFlexGroup?: StyleValue<CSSProperties['boxFlexGroup']>;
  /**
   * 旧版弹性盒是否允许换行（box-lines），已废弃，请用 flexWrap。
   *
   * 初始值 `single`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-lines
   */
  boxLines?: StyleValue<CSSProperties['boxLines']>;
  /**
   * 旧版弹性盒中子元素的显示顺序（box-ordinal-group），已废弃，请用 order。
   *
   * 数字值自动加 `px`；初始值 `1`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-ordinal-group
   */
  boxOrdinalGroup?: StyleValue<CSSProperties['boxOrdinalGroup']>;
  /**
   * 旧版弹性盒的排列轴向（box-orient），已废弃；多行截断时用 WebkitBoxOrient。
   *
   * 初始值 `inline-axis`；不继承；非标准。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-orient
   */
  boxOrient?: StyleValue<CSSProperties['boxOrient']>;
  /**
   * 设置盒子的外部或内部阴影，可叠加多层。（box-shadow）
   *
   * 阴影不占布局空间，可用逗号叠加；与 border/outline 的用途和绘制位置不同。
   *
   * 适用场景：浮层层次、卡片边缘或内凹效果。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-shadow
   */
  boxShadow?: StyleValue<KeywordValue<ShadowsTokens, CSSProperties['boxShadow']>>;
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
  boxSizing?: StyleValue<KeywordValue<BoxSizingKeywords, CSSProperties['boxSizing']>>;
  /**
   * 旧版弹性盒中是否隐藏元素（box-suppress），草案属性，浏览器不支持。
   */
  boxSuppress?: StyleValue<CSSProperties['boxSuppress']>;
  /**
   * 设置元素之后的分页、分栏或区域分片行为。（break-after）
   *
   * 初始值 `auto`；不继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-after
   */
  breakAfter?: StyleValue<CSSProperties['breakAfter']>;
  /**
   * 设置元素之前的分页、分栏或区域分片行为。（break-before）
   *
   * 初始值 `auto`；不继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-before
   */
  breakBefore?: StyleValue<CSSProperties['breakBefore']>;
  /**
   * 设置元素内部是否允许分页、分栏或区域分片。（break-inside）
   *
   * 初始值 `auto`；不继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-inside
   */
  breakInside?: StyleValue<CSSProperties['breakInside']>;
  /**
   * 设置表格标题相对于表格的放置侧。（caption-side）
   *
   * 初始值 `top`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/caption-side
   */
  captionSide?: StyleValue<CSSProperties['captionSide']>;
  /**
   * 集中设置文本插入光标的颜色和形状。（caret）
   *
   * 简写属性，初始值见各分项；继承。
   */
  caret?: StyleValue<CSSProperties['caret']>;
  /**
   * 设置可编辑内容中的文本插入光标颜色。（caret-color）
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/caret-color
   */
  caretColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['caretColor']>>;
  /**
   * 设置文本插入光标的形状。（caret-shape）
   *
   * 初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   */
  caretShape?: StyleValue<CSSProperties['caretShape']>;
  /**
   * 要求元素避让指定侧的前置浮动元素。（clear）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clear
   */
  clear?: StyleValue<CSSProperties['clear']>;
  /**
   * 使用旧式矩形裁剪绝对定位元素；新代码优先考虑 clip-path。（clip）
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip
   */
  clip?: StyleValue<CSSProperties['clip']>;
  /**
   * 通过基本形状、路径或引用裁剪元素的可见区域。（clip-path）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip-path
   */
  clipPath?: StyleValue<CSSProperties['clipPath']>;
  /**
   * 设置 SVG 裁剪路径判断内部区域所用的填充规则。（clip-rule）
   *
   * 初始值 `nonzero`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip-rule
   */
  clipRule?: StyleValue<CSSProperties['clipRule']>;
  /**
   * 设置文字前景色，同时作为 currentColor 的来源。（color）
   *
   * 改变文字和 currentColor 的来源，不会自动改变背景。
   *
   * 初始值 `canvastext`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/color
   */
  color?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['color']>>;
  /**
   * 声明元素支持的配色方案，影响原生控件、滚动条等浏览器绘制内容。（color-scheme）
   *
   * 声明支持的方案不等于为应用生成主题颜色；文字、背景和业务 token 仍需自行定义。
   *
   * 初始值 `normal`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/color-scheme
   */
  colorScheme?: StyleValue<CSSProperties['colorScheme']>;
  /**
   * 控制元素是否参与系统强制颜色模式的自动替换。（forced-color-adjust）
   *
   * 初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/forced-color-adjust
   */
  forcedColorAdjust?: StyleValue<CSSProperties['forcedColorAdjust']>;
  /**
   * 设置打印时浏览器是否可以为节墨或可读性调整颜色。（print-color-adjust）
   *
   * 初始值 `economy`；继承；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/print-color-adjust
   */
  printColorAdjust?: StyleValue<CSSProperties['printColorAdjust']>;
  /**
   * 同时设置多栏布局的首选栏宽和目标栏数。（columns）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/columns
   */
  columns?: StyleValue<CSSProperties['columns']>;
  /**
   * 设置多栏布局的目标栏数。（column-count）
   *
   * 数字值不加单位；初始值 `auto`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-count
   */
  columnCount?: StyleValue<CSSProperties['columnCount']>;
  /**
   * 设置多栏布局的首选栏宽，实际栏宽由容器空间决定。（column-width）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-width
   */
  columnWidth?: StyleValue<CSSProperties['columnWidth']>;
  /**
   * 设置多栏之间分隔线的宽度、线型和颜色。（column-rule）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule
   */
  columnRule?: StyleValue<CSSProperties['columnRule']>;
  /**
   * 设置多栏分隔线的颜色。（column-rule-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-color
   */
  columnRuleColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['columnRuleColor']>>;
  /**
   * 设置多栏分隔线的线型。（column-rule-style）
   *
   * 初始值 `none`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-style
   */
  columnRuleStyle?: StyleValue<CSSProperties['columnRuleStyle']>;
  /**
   * 设置多栏分隔线的宽度。（column-rule-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-width
   */
  columnRuleWidth?: StyleValue<CSSProperties['columnRuleWidth']>;
  /**
   * 设置多栏内容顺序填充还是尽量均衡栏高。（column-fill）
   *
   * 初始值 `balance`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-fill
   */
  columnFill?: StyleValue<CSSProperties['columnFill']>;
  /**
   * 设置布局中相邻列之间的间距。（column-gap）
   *
   * 数字值自动加 `px`；初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-gap
   */
  columnGap?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['columnGap']>>;
  /**
   * 设置多栏布局中的元素是否跨越所有栏。（column-span）
   *
   * 初始值 `none`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-span
   */
  columnSpan?: StyleValue<CSSProperties['columnSpan']>;
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
  contain?: StyleValue<KeywordValue<ContainKeywords, CSSProperties['contain']>>;
  /**
   * 集中设置尺寸隔离时使用的替代内部宽高。（contain-intrinsic-size）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-size
   */
  containIntrinsicSize?: StyleValue<CSSProperties['containIntrinsicSize']>;
  /**
   * 设置块轴尺寸隔离或跳过内容渲染时使用的替代内部尺寸。（contain-intrinsic-block-size）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-block-size
   */
  containIntrinsicBlockSize?: StyleValue<CSSProperties['containIntrinsicBlockSize']>;
  /**
   * 设置行内轴尺寸隔离或跳过内容渲染时使用的替代内部尺寸。（contain-intrinsic-inline-size）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-inline-size
   */
  containIntrinsicInlineSize?: StyleValue<CSSProperties['containIntrinsicInlineSize']>;
  /**
   * 设置高度隔离或跳过内容渲染时使用的替代内部高度。（contain-intrinsic-height）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-height
   */
  containIntrinsicHeight?: StyleValue<CSSProperties['containIntrinsicHeight']>;
  /**
   * 设置宽度隔离或跳过内容渲染时使用的替代内部宽度。（contain-intrinsic-width）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-width
   */
  containIntrinsicWidth?: StyleValue<CSSProperties['containIntrinsicWidth']>;
  /**
   * 同时声明查询容器的名称和类型。（container）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/container
   */
  container?: StyleValue<CSSProperties['container']>;
  /**
   * 为查询容器命名，供 @container 条件规则选择。（container-name）
   *
   * 初始值 `none`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/container-name
   */
  containerName?: StyleValue<CSSProperties['containerName']>;
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
  containerType?: StyleValue<KeywordValue<ContainerTypeKeywords, CSSProperties['containerType']>>;
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
    KeywordValue<ContentVisibilityKeywords, CSSProperties['contentVisibility']>
  >;
  /**
   * 设置生成内容、替换内容或伪元素的内容。（content）
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/content
   */
  content?: StyleValue<CSSProperties['content']>;
  /**
   * 增加或减少指定 CSS 计数器的值。（counter-increment）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-increment
   */
  counterIncrement?: StyleValue<CSSProperties['counterIncrement']>;
  /**
   * 创建或重置 CSS 计数器。（counter-reset）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-reset
   */
  counterReset?: StyleValue<CSSProperties['counterReset']>;
  /**
   * 设置已有 CSS 计数器的值，必要时创建计数器。（counter-set）
   *
   * 数字值不加单位；初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-set
   */
  counterSet?: StyleValue<CSSProperties['counterSet']>;
  /**
   * 语音合成在元素前后播放的提示音（cue），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  cue?: StyleValue<CSSProperties['cue']>;
  /**
   * 语音合成在元素之后播放的提示音（cue-after），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  cueAfter?: StyleValue<CSSProperties['cueAfter']>;
  /**
   * 语音合成在元素之前播放的提示音（cue-before），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  cueBefore?: StyleValue<CSSProperties['cueBefore']>;
  /**
   * 设置指针位于元素上方时显示的光标。（cursor）
   *
   * 初始值 `auto`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/cursor
   */
  cursor?: StyleValue<CSSProperties['cursor']>;
  /**
   * 设置文本基本方向，参与双向文本及部分布局计算。（direction）
   *
   * 初始值 `ltr`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/direction
   */
  direction?: StyleValue<CSSProperties['direction']>;
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
  display?: StyleValue<KeywordValue<DisplayKeywords, CSSProperties['display']>>;
  /**
   * 单独设置 display 的内部布局方式（display-inside），早期草案，浏览器不支持；请用 display 的双值写法。
   */
  displayInside?: StyleValue<CSSProperties['displayInside']>;
  /**
   * 单独设置元素是否生成列表项标记（display-list），早期草案，浏览器不支持。
   */
  displayList?: StyleValue<CSSProperties['displayList']>;
  /**
   * 单独设置 display 的外部显示类型（display-outside），早期草案，浏览器不支持。
   */
  displayOutside?: StyleValue<CSSProperties['displayOutside']>;
  /**
   * 选择 SVG 文本布局的主导基线及基线表。（dominant-baseline）
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/dominant-baseline
   */
  dominantBaseline?: StyleValue<CSSProperties['dominantBaseline']>;
  /**
   * 控制分离边框表格中空单元格的边框和背景是否绘制。（empty-cells）
   *
   * 初始值 `show`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/empty-cells
   */
  emptyCells?: StyleValue<CSSProperties['emptyCells']>;
  /**
   * 非标准键，不对应 CSS 属性；定位请用 insetInlineEnd。（end）
   *
   * 数字值自动加 `px`。
   */
  end?: StyleValue<CSSProperties['end']>;
  /**
   * 设置 SVG 图形内部的填充绘制方式。（fill）
   *
   * 初始值 `black`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/fill
   */
  fill?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['fill']>>;
  /**
   * 设置 SVG 填充的不透明度，不影响描边。（fill-opacity）
   *
   * 数字值不加单位；初始值 `1`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/fill-opacity
   */
  fillOpacity?: StyleValue<CSSProperties['fillOpacity']>;
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
  fillRule?: StyleValue<KeywordValue<FillRuleKeywords, CSSProperties['fillRule']>>;
  /**
   * 对元素的最终图像应用模糊、亮度等滤镜。（filter）
   *
   * 初始值 `none`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/filter
   */
  filter?: StyleValue<CSSProperties['filter']>;
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
  flex?: StyleValue<KeywordValue<FlexKeywords, CSSProperties['flex']>>;
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
  flexBasis?: StyleValue<KeywordValue<FlexBasisKeywords, CSSProperties['flexBasis']>>;
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
  flexDirection?: StyleValue<KeywordValue<FlexDirectionKeywords, CSSProperties['flexDirection']>>;
  /**
   * 同时设置弹性布局的主轴方向和换行方式。（flex-flow）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-flow
   */
  flexFlow?: StyleValue<CSSProperties['flexFlow']>;
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
  flexGrow?: StyleValue<CSSProperties['flexGrow']>;
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
  flexShrink?: StyleValue<CSSProperties['flexShrink']>;
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
  flexWrap?: StyleValue<KeywordValue<FlexWrapKeywords, CSSProperties['flexWrap']>>;
  /**
   * 将元素浮动到指定侧，使相邻行内内容围绕它排列。（float）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/float
   */
  float?: StyleValue<CSSProperties['float']>;
  /**
   * 集中设置字体样式、粗细、大小、行高和字体族等信息。（font）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font
   */
  font?: StyleValue<CSSProperties['font']>;
  /**
   * 设置按优先级排列的字体族及通用字体回退。（font-family）
   *
   * 初始值 `dependsOnUserAgent`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-family
   */
  fontFamily?: StyleValue<KeywordValue<FontsTokens, CSSProperties['fontFamily']>>;
  /**
   * 通过 OpenType 特性标签控制字体的底层排版功能。（font-feature-settings）
   *
   * 初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-feature-settings
   */
  fontFeatureSettings?: StyleValue<CSSProperties['fontFeatureSettings']>;
  /**
   * 设置是否应用字体提供的字偶间距调整。（font-kerning）
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-kerning
   */
  fontKerning?: StyleValue<CSSProperties['fontKerning']>;
  /**
   * 覆盖字体排版使用的语言系统标签，不改变文本实际语言。（font-language-override）
   *
   * 初始值 `normal`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-language-override
   */
  fontLanguageOverride?: StyleValue<CSSProperties['fontLanguageOverride']>;
  /**
   * 设置字体大小，也影响 em 等相对单位的计算。（font-size）
   *
   * 改变字形大小，并影响 em 等相对长度；行盒高度还由 line-height 决定。
   *
   * 适用场景：建立文字层级，根字号相对尺寸可用 rem 表达。
   *
   * 数字值自动加 `px`；初始值 `medium`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-size
   */
  fontSize?: StyleValue<KeywordValue<FontSizesTokens, CSSProperties['fontSize']>>;
  /**
   * 按字体特征尺寸调整字号，减少字体回退造成的视觉变化。（font-size-adjust）
   *
   * 数字值自动加 `px`；初始值 `none`；继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-size-adjust
   */
  fontSizeAdjust?: StyleValue<CSSProperties['fontSizeAdjust']>;
  /**
   * 选择字体的宽窄字面；font-width 是其较新的名称。（font-stretch）
   *
   * 初始值 `normal`；继承；已废弃；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-stretch
   */
  fontStretch?: StyleValue<CSSProperties['fontStretch']>;
  /**
   * 选择正常、斜体或倾斜字体样式。（font-style）
   *
   * 初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-style
   */
  fontStyle?: StyleValue<CSSProperties['fontStyle']>;
  /**
   * 控制缺少真实字体字形时浏览器可否合成粗体、斜体等样式。（font-synthesis）
   *
   * 初始值 `weight style small-caps position `；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis
   */
  fontSynthesis?: StyleValue<CSSProperties['fontSynthesis']>;
  /**
   * 控制浏览器是否可以合成加粗字体。（font-synthesis-weight）
   *
   * 初始值 `auto`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-weight
   */
  fontSynthesisWeight?: StyleValue<CSSProperties['fontSynthesisWeight']>;
  /**
   * 控制浏览器是否可以合成倾斜字体。（font-synthesis-style）
   *
   * 初始值 `auto`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-style
   */
  fontSynthesisStyle?: StyleValue<CSSProperties['fontSynthesisStyle']>;
  /**
   * 控制浏览器是否可以合成小型大写字形。（font-synthesis-small-caps）
   *
   * 初始值 `auto`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-small-caps
   */
  fontSynthesisSmallCaps?: StyleValue<CSSProperties['fontSynthesisSmallCaps']>;
  /**
   * 控制浏览器是否可以合成上标和下标字形。（font-synthesis-position）
   *
   * 初始值 `none`；继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-position
   */
  fontSynthesisPosition?: StyleValue<CSSProperties['fontSynthesisPosition']>;
  /**
   * 集中设置字体的连字、大小写、数字及其他变体。（font-variant）
   *
   * 初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant
   */
  fontVariant?: StyleValue<CSSProperties['fontVariant']>;
  /**
   * 选择字体提供的替代字形。（font-variant-alternates）
   *
   * 初始值 `normal`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-alternates
   */
  fontVariantAlternates?: StyleValue<CSSProperties['fontVariantAlternates']>;
  /**
   * 设置小型大写等大小写字形变体。（font-variant-caps）
   *
   * 初始值 `normal`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-caps
   */
  fontVariantCaps?: StyleValue<CSSProperties['fontVariantCaps']>;
  /**
   * 设置东亚文字字形及宽度变体。（font-variant-east-asian）
   *
   * 初始值 `normal`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-east-asian
   */
  fontVariantEastAsian?: StyleValue<CSSProperties['fontVariantEastAsian']>;
  /**
   * 设置字体连字的启用方式。（font-variant-ligatures）
   *
   * 初始值 `normal`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-ligatures
   */
  fontVariantLigatures?: StyleValue<CSSProperties['fontVariantLigatures']>;
  /**
   * 设置数字的等宽、比例、分数及其他排版变体。（font-variant-numeric）
   *
   * 初始值 `normal`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-numeric
   */
  fontVariantNumeric?: StyleValue<CSSProperties['fontVariantNumeric']>;
  /**
   * 选择字体提供的上标或下标字形。（font-variant-position）
   *
   * 初始值 `normal`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-position
   */
  fontVariantPosition?: StyleValue<CSSProperties['fontVariantPosition']>;
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
    KeywordValue<FontWeightKeywords, CSSProperties['fontWeight']> | keyof FontWeightsTokens
  >;
  /**
   * 控制支持光学尺寸轴的字体是否按字号优化字形。（font-optical-sizing）
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-optical-sizing
   */
  fontOpticalSizing?: StyleValue<CSSProperties['fontOpticalSizing']>;
  /**
   * 选择或覆盖彩色字体使用的调色板。（font-palette）
   *
   * 初始值 `normal`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-palette
   */
  fontPalette?: StyleValue<CSSProperties['fontPalette']>;
  /**
   * 直接设置可变字体各个轴的数值。（font-variation-settings）
   *
   * 初始值 `normal`；继承；Baseline：2021 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variation-settings
   */
  fontVariationSettings?: StyleValue<CSSProperties['fontVariationSettings']>;
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
  gap?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['gap']>>;
  /**
   * SVG 横排文字中字形的旋转角度（glyph-orientation-horizontal），已废弃。
   *
   * 数字值自动加 `px`。
   */
  glyphOrientationHorizontal?: StyleValue<CSSProperties['glyphOrientationHorizontal']>;
  /**
   * 设置竖排 SVG 字形方向的旧属性；新代码优先考虑 text-orientation。（glyph-orientation-vertical）
   *
   * 数字值自动加 `px`；Baseline：尚未在所有主流浏览器可用。
   */
  glyphOrientationVertical?: StyleValue<CSSProperties['glyphOrientationVertical']>;
  /**
   * 集中设置显式和隐式网格的轨道、区域及自动放置方式。（grid）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid
   */
  grid?: StyleValue<CSSProperties['grid']>;
  /**
   * 设置网格项目的区域名，或行起点、列起点、行终点、列终点。（grid-area）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-area
   */
  gridArea?: StyleValue<CSSProperties['gridArea']>;
  /**
   * 设置隐式生成的网格列尺寸。（grid-auto-columns）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-columns
   */
  gridAutoColumns?: StyleValue<CSSProperties['gridAutoColumns']>;
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
  gridAutoFlow?: StyleValue<KeywordValue<GridAutoFlowKeywords, CSSProperties['gridAutoFlow']>>;
  /**
   * 设置隐式生成的网格行尺寸。（grid-auto-rows）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-rows
   */
  gridAutoRows?: StyleValue<CSSProperties['gridAutoRows']>;
  /**
   * 设置网格项目的列起点和列终点。（grid-column）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column
   */
  gridColumn?: StyleValue<CSSProperties['gridColumn']>;
  /**
   * 设置网格项目的列终止线或跨越范围。（grid-column-end）
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column-end
   */
  gridColumnEnd?: StyleValue<CSSProperties['gridColumnEnd']>;
  /**
   * 网格列间距的旧名（grid-column-gap），请改用 columnGap。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；已废弃。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-gap
   */
  gridColumnGap?: StyleValue<CSSProperties['gridColumnGap']>;
  /**
   * 设置网格项目的列起始线或跨越范围。（grid-column-start）
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column-start
   */
  gridColumnStart?: StyleValue<CSSProperties['gridColumnStart']>;
  /**
   * 网格行列间距的旧名（grid-gap），请改用 gap。
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；已废弃。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/gap
   */
  gridGap?: StyleValue<CSSProperties['gridGap']>;
  /**
   * 设置网格项目的行起点和行终点。（grid-row）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row
   */
  gridRow?: StyleValue<CSSProperties['gridRow']>;
  /**
   * 设置网格项目的行终止线或跨越范围。（grid-row-end）
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row-end
   */
  gridRowEnd?: StyleValue<CSSProperties['gridRowEnd']>;
  /**
   * 网格行间距的旧名（grid-row-gap），请改用 rowGap。
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；已废弃。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/row-gap
   */
  gridRowGap?: StyleValue<CSSProperties['gridRowGap']>;
  /**
   * 设置网格项目的行起始线或跨越范围。（grid-row-start）
   *
   * 初始值 `auto`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row-start
   */
  gridRowStart?: StyleValue<CSSProperties['gridRowStart']>;
  /**
   * 集中设置显式网格的行、列和命名区域。（grid-template）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template
   */
  gridTemplate?: StyleValue<CSSProperties['gridTemplate']>;
  /**
   * 用区域名称矩阵定义网格布局区域。（grid-template-areas）
   *
   * 初始值 `none`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-areas
   */
  gridTemplateAreas?: StyleValue<CSSProperties['gridTemplateAreas']>;
  /**
   * 定义显式网格的列轨道尺寸及网格线名称。（grid-template-columns）
   *
   * 每个轨道值定义一列；fr 分配剩余空间。需要允许长内容所在列缩小时，可使用 minmax(0, 1fr)。
   *
   * 适用场景：响应式卡片、表单标签与输入框的列布局。
   *
   * 初始值 `none`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-columns
   */
  gridTemplateColumns?: StyleValue<CSSProperties['gridTemplateColumns']>;
  /**
   * 定义显式网格的行轨道尺寸及网格线名称。（grid-template-rows）
   *
   * 每个轨道值定义一行，未显式定义的行使用 grid-auto-rows。
   *
   * 适用场景：区分固定工具栏和可伸缩内容区域。
   *
   * 初始值 `none`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-rows
   */
  gridTemplateRows?: StyleValue<CSSProperties['gridTemplateRows']>;
  /**
   * 控制标点是否可以悬挂在行盒边缘之外。（hanging-punctuation）
   *
   * 初始值 `none`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hanging-punctuation
   */
  hangingPunctuation?: StyleValue<CSSProperties['hangingPunctuation']>;
  /**
   * 设置自动断词时插入的断字符号。（hyphenate-character）
   *
   * 初始值 `auto`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphenate-character
   */
  hyphenateCharacter?: StyleValue<CSSProperties['hyphenateCharacter']>;
  /**
   * 限制可断词的最小单词长度以及断点两侧的最少字符数。（hyphenate-limit-chars）
   *
   * 数字值不加单位；初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphenate-limit-chars
   */
  hyphenateLimitChars?: StyleValue<CSSProperties['hyphenateLimitChars']>;
  /**
   * 设置文字断词和连字符插入的方式；自动断词依赖语言和词典。（hyphens）
   *
   * 初始值 `manual`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphens
   */
  hyphens?: StyleValue<CSSProperties['hyphens']>;
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
  height?: StyleValue<KeywordValue<WidthKeywords, CSSProperties['height']>>;
  /**
   * 设置图像是否按元数据等信息调整方向。（image-orientation）
   *
   * 数字值自动加 `px`；初始值 `from-image`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/image-orientation
   */
  imageOrientation?: StyleValue<CSSProperties['imageOrientation']>;
  /**
   * 向浏览器指定图像缩放时的插值与清晰度偏好。（image-rendering）
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/image-rendering
   */
  imageRendering?: StyleValue<CSSProperties['imageRendering']>;
  /**
   * 设置图像的分辨率解释方式；使用前核对目标浏览器支持。（image-resolution）
   *
   * 初始值 `1dppx`；继承；实验性。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/image-resolution
   */
  imageResolution?: StyleValue<CSSProperties['imageResolution']>;
  /**
   * 控制输入框的输入法状态（ime-mode），已废弃，大多数浏览器不支持。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   */
  imeMode?: StyleValue<CSSProperties['imeMode']>;
  /**
   * 设置段落首字下沉或抬升时占用的行数与对齐位置。（initial-letter）
   *
   * 初始值 `normal`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/initial-letter
   */
  initialLetter?: StyleValue<CSSProperties['initialLetter']>;
  /**
   * 设置首字下沉时字形与正文使用的对齐基线。（initial-letter-align）
   *
   * 初始值 `auto`；不继承；实验性。
   */
  initialLetterAlign?: StyleValue<CSSProperties['initialLetterAlign']>;
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
  inlineSize?: StyleValue<KeywordValue<WidthKeywords, CSSProperties['inlineSize']>>;
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
    KeywordValue<InterpolateSizeKeywords, CSSProperties['interpolateSize']>
  >;
  /**
   * 同时设置定位元素的上、右、下、左偏移。（inset）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset
   */
  inset?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['inset']>>;
  /**
   * 设置定位元素沿逻辑块轴的起始和结束偏移。（inset-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block
   */
  insetBlock?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['insetBlock']>>;
  /**
   * 设置定位元素在逻辑块轴结束侧的偏移。（inset-block-end）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block-end
   */
  insetBlockEnd?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['insetBlockEnd']>>;
  /**
   * 设置定位元素在逻辑块轴起始侧的偏移。（inset-block-start）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block-start
   */
  insetBlockStart?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['insetBlockStart']>>;
  /**
   * 设置定位元素沿逻辑行内轴的起始和结束偏移。（inset-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline
   */
  insetInline?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['insetInline']>>;
  /**
   * 设置定位元素在逻辑行内轴结束侧的偏移。（inset-inline-end）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline-end
   */
  insetInlineEnd?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['insetInlineEnd']>>;
  /**
   * 设置定位元素在逻辑行内轴起始侧的偏移。（inset-inline-start）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline-start
   */
  insetInlineStart?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['insetInlineStart']>>;
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
  isolation?: StyleValue<KeywordValue<IsolationKeywords, CSSProperties['isolation']>>;
  /**
   * SVG 文字的字距调整（kerning），已废弃，请用 fontKerning 或 letterSpacing。
   *
   * 数字值自动加 `px`。
   */
  kerning?: StyleValue<CSSProperties['kerning']>;
  /**
   * 设置定位元素相对于其定位参照的左侧偏移。（left）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/left
   */
  left?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['left']>>;
  /**
   * 设置字符之间额外增加或减少的间距。（letter-spacing）
   *
   * 数字值自动加 `px`；初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/letter-spacing
   */
  letterSpacing?: StyleValue<CSSProperties['letterSpacing']>;
  /**
   * 设置东亚文字标点等字符的换行严格程度。（line-break）
   *
   * 初始值 `auto`；继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/line-break
   */
  lineBreak?: StyleValue<CSSProperties['lineBreak']>;
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
    KeywordValue<LineHeightKeywords, CSSProperties['lineHeight']> | keyof LineHeightsTokens
  >;
  /**
   * 设置行盒高度向上取整使用的步长。（line-height-step）
   *
   * 数字值自动加 `px`；初始值 `0`；继承；实验性。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/line-height-step
   */
  lineHeightStep?: StyleValue<CSSProperties['lineHeightStep']>;
  /**
   * 集中设置列表标记的类型、图像和位置。（list-style）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style
   */
  listStyle?: StyleValue<CSSProperties['listStyle']>;
  /**
   * 设置用作列表标记的图像。（list-style-image）
   *
   * 初始值 `none`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-image
   */
  listStyleImage?: StyleValue<CSSProperties['listStyleImage']>;
  /**
   * 设置列表标记位于主块盒内部还是外部。（list-style-position）
   *
   * 初始值 `outside`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-position
   */
  listStylePosition?: StyleValue<CSSProperties['listStylePosition']>;
  /**
   * 设置列表标记或计数器的样式。（list-style-type）
   *
   * 初始值 `disc`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-type
   */
  listStyleType?: StyleValue<CSSProperties['listStyleType']>;
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
  margin?: StyleValue<KeywordValue<MarginKeywords, CSSProperties['margin']> | keyof SpaceTokens>;
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
    KeywordValue<MarginKeywords, CSSProperties['marginBlock']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginBlockEnd']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginBlockStart']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginBottom']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginInline']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginInlineEnd']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginInlineStart']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginLeft']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginRight']> | keyof SpaceTokens
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
    KeywordValue<MarginKeywords, CSSProperties['marginTop']> | keyof SpaceTokens
  >;
  /**
   * 控制容器边缘处子元素外边距的裁减。（margin-trim）
   *
   * 初始值 `none`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-trim
   */
  marginTrim?: StyleValue<CSSProperties['marginTrim']>;
  /**
   * 同时设置 SVG 路径起点、中间顶点和终点的标记图形。（marker）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker
   */
  marker?: StyleValue<CSSProperties['marker']>;
  /**
   * 设置 SVG 路径终点的标记图形。（marker-end）
   *
   * 初始值 `none`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-end
   */
  markerEnd?: StyleValue<CSSProperties['markerEnd']>;
  /**
   * 设置 SVG 路径中间顶点的标记图形。（marker-mid）
   *
   * 初始值 `none`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-mid
   */
  markerMid?: StyleValue<CSSProperties['markerMid']>;
  /**
   * 列表标记与内容之间的距离（marker-offset），已从规范中移除。
   *
   * 数字值自动加 `px`。
   */
  markerOffset?: StyleValue<CSSProperties['markerOffset']>;
  /**
   * 设置 SVG 路径起点的标记图形。（marker-start）
   *
   * 初始值 `none`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-start
   */
  markerStart?: StyleValue<CSSProperties['markerStart']>;
  /**
   * 集中设置遮罩图层的图像、位置、尺寸、重复及合成方式。（mask）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask
   */
  mask?: StyleValue<CSSProperties['mask']>;
  /**
   * 设置遮罩效果允许作用的裁剪区域。（mask-clip）
   *
   * 初始值 `border-box`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-clip
   */
  maskClip?: StyleValue<CSSProperties['maskClip']>;
  /**
   * 设置多个遮罩图层之间的合成运算。（mask-composite）
   *
   * 初始值 `add`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-composite
   */
  maskComposite?: StyleValue<CSSProperties['maskComposite']>;
  /**
   * 设置遮罩使用的图像、渐变或 SVG 遮罩引用。（mask-image）
   *
   * 初始值 `none`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-image
   */
  maskImage?: StyleValue<CSSProperties['maskImage']>;
  /**
   * 设置遮罩按 alpha、亮度或源类型解释。（mask-mode）
   *
   * 初始值 `match-source`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-mode
   */
  maskMode?: StyleValue<CSSProperties['maskMode']>;
  /**
   * 设置遮罩图像定位所依据的盒子。（mask-origin）
   *
   * 初始值 `border-box`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-origin
   */
  maskOrigin?: StyleValue<CSSProperties['maskOrigin']>;
  /**
   * 设置遮罩图像在定位区域中的位置。（mask-position）
   *
   * 初始值 `0% 0%`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-position
   */
  maskPosition?: StyleValue<CSSProperties['maskPosition']>;
  /**
   * 设置遮罩图像的重复方式。（mask-repeat）
   *
   * 初始值 `repeat`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-repeat
   */
  maskRepeat?: StyleValue<CSSProperties['maskRepeat']>;
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
  maskSize?: StyleValue<KeywordValue<MaskSizeKeywords, CSSProperties['maskSize']>>;
  /**
   * 设置 SVG mask 元素使用亮度还是 alpha 作为遮罩。（mask-type）
   *
   * 初始值 `luminance`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-type
   */
  maskType?: StyleValue<CSSProperties['maskType']>;
  /**
   * 设置基于九宫格图像切片的边框遮罩。（mask-border）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border
   */
  maskBorder?: StyleValue<CSSProperties['maskBorder']>;
  /**
   * 设置边框遮罩使用 alpha 还是亮度信息。（mask-border-mode）
   *
   * 初始值 `alpha`；不继承。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-mode
   */
  maskBorderMode?: StyleValue<CSSProperties['maskBorderMode']>;
  /**
   * 设置边框遮罩超出边框盒的距离。（mask-border-outset）
   *
   * 数字值不加单位；初始值 `0`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-outset
   */
  maskBorderOutset?: StyleValue<CSSProperties['maskBorderOutset']>;
  /**
   * 设置边框遮罩切片的重复或拉伸方式。（mask-border-repeat）
   *
   * 初始值 `stretch`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-repeat
   */
  maskBorderRepeat?: StyleValue<CSSProperties['maskBorderRepeat']>;
  /**
   * 设置边框遮罩图像的切片位置。（mask-border-slice）
   *
   * 数字值不加单位；初始值 `0`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-slice
   */
  maskBorderSlice?: StyleValue<CSSProperties['maskBorderSlice']>;
  /**
   * 设置边框遮罩的源图像。（mask-border-source）
   *
   * 初始值 `none`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-source
   */
  maskBorderSource?: StyleValue<CSSProperties['maskBorderSource']>;
  /**
   * 设置边框遮罩各边的宽度。（mask-border-width）
   *
   * 数字值不加单位；初始值 `auto`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-width
   */
  maskBorderWidth?: StyleValue<CSSProperties['maskBorderWidth']>;
  /**
   * 限制元素逻辑块轴的最大尺寸。（max-block-size）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-block-size
   */
  maxBlockSize?: StyleValue<CSSProperties['maxBlockSize']>;
  /**
   * 限制元素的最大物理高度。（max-height）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-height
   */
  maxHeight?: StyleValue<CSSProperties['maxHeight']>;
  /**
   * 限制元素逻辑行内轴的最大尺寸。（max-inline-size）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-inline-size
   */
  maxInlineSize?: StyleValue<CSSProperties['maxInlineSize']>;
  /**
   * 限制元素的最大物理宽度。（max-width）
   *
   * 限制最终宽度，不会单独要求元素达到该宽度。最小尺寸约束可能优先于较小的最大尺寸。
   *
   * 适用场景：限制正文行长、弹窗宽度或响应式内容区。
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-width
   */
  maxWidth?: StyleValue<CSSProperties['maxWidth']>;
  /**
   * 设置元素逻辑块轴的最小尺寸。（min-block-size）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-block-size
   */
  minBlockSize?: StyleValue<CSSProperties['minBlockSize']>;
  /**
   * 设置元素的最小物理高度。（min-height）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-height
   */
  minHeight?: StyleValue<CSSProperties['minHeight']>;
  /**
   * 设置元素逻辑行内轴的最小尺寸。（min-inline-size）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-inline-size
   */
  minInlineSize?: StyleValue<CSSProperties['minInlineSize']>;
  /**
   * 设置元素的最小物理宽度。（min-width）
   *
   * Flex/Grid 项目的 auto 最小尺寸可能由内容决定。需要允许其收缩时，可以按布局目的设置 min-width:0。
   *
   * 常用值：
   * - `auto`：自动最小尺寸由布局模式决定；Flex/Grid 项目可能受内容最小宽度限制。
   *
   * 适用场景：给控件设置最小可用宽度，或用 0 允许 Flex/Grid 子项突破自动内容最小宽度。
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-width
   */
  minWidth?: StyleValue<KeywordValue<MinWidthKeywords, CSSProperties['minWidth']>>;
  /**
   * 设置元素整体与其背后内容的颜色混合方式。（mix-blend-mode）
   *
   * 初始值 `normal`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mix-blend-mode
   */
  mixBlendMode?: StyleValue<CSSProperties['mixBlendMode']>;
  /**
   * 设置运动路径的旧式简写；对应现代 offset 属性族。（motion）
   *
   * 数字值自动加 `px`。
   */
  motion?: StyleValue<CSSProperties['motion']>;
  /**
   * 沿运动路径的位置（motion-offset），是 offsetDistance 的旧名，请改用 offsetDistance。
   *
   * 数字值自动加 `px`。
   */
  motionOffset?: StyleValue<CSSProperties['motionOffset']>;
  /**
   * 设置运动路径的旧属性；对应 offset-path。（motion-path）
   */
  motionPath?: StyleValue<CSSProperties['motionPath']>;
  /**
   * 设置运动路径旋转方式的旧属性；对应 offset-rotate。（motion-rotation）
   *
   * 数字值自动加 `px`。
   */
  motionRotation?: StyleValue<CSSProperties['motionRotation']>;
  /**
   * IE 与旧版 Edge 的滚动条显示方式（-ms-overflow-style）；现代浏览器隐藏滚动条请用 scrollbarWidth。
   *
   * 初始值 `auto`；继承；非标准。
   */
  MsOverflowStyle?: StyleValue<CSSProperties['MsOverflowStyle']>;
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
  objectFit?: StyleValue<KeywordValue<ObjectFitKeywords, CSSProperties['objectFit']>>;
  /**
   * 设置替换元素内容在内容盒内的对齐位置。（object-position）
   *
   * 初始值 `50% 50%`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/object-position
   */
  objectPosition?: StyleValue<CSSProperties['objectPosition']>;
  /**
   * 集中设置运动路径、起始位置、距离、方向和锚点。（offset）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset
   */
  offset?: StyleValue<CSSProperties['offset']>;
  /**
   * 设置元素沿运动路径移动时与路径相接的内部锚点。（offset-anchor）
   *
   * 初始值 `auto`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-anchor
   */
  offsetAnchor?: StyleValue<CSSProperties['offsetAnchor']>;
  /**
   * 设置元素沿运动路径行进的距离。（offset-distance）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-distance
   */
  offsetDistance?: StyleValue<CSSProperties['offsetDistance']>;
  /**
   * 设置元素运动所沿用的路径。（offset-path）
   *
   * 初始值 `none`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-path
   */
  offsetPath?: StyleValue<CSSProperties['offsetPath']>;
  /**
   * 设置运动路径的初始位置。（offset-position）
   *
   * 初始值 `normal`；不继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-position
   */
  offsetPosition?: StyleValue<CSSProperties['offsetPosition']>;
  /**
   * 设置元素沿运动路径移动时的方向和附加旋转。（offset-rotate）
   *
   * 初始值 `auto`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-rotate
   */
  offsetRotate?: StyleValue<CSSProperties['offsetRotate']>;
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
  opacity?: StyleValue<CSSProperties['opacity']>;
  /**
   * 设置 Flex 或 Grid 项目的视觉排列顺序，不改变 DOM 顺序。（order）
   *
   * 不改变源代码、朗读及通常的 Tab 顺序，避免用视觉重排破坏阅读顺序。
   *
   * 数字值不加单位；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/order
   */
  order?: StyleValue<CSSProperties['order']>;
  /**
   * 设置分页或分栏断点前需保留的最少行数。（orphans）
   *
   * 数字值不加单位；初始值 `2`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/orphans
   */
  orphans?: StyleValue<CSSProperties['orphans']>;
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
  outline?: StyleValue<CSSProperties['outline']>;
  /**
   * 设置轮廓线颜色。（outline-color）
   *
   * 初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-color
   */
  outlineColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['outlineColor']>>;
  /**
   * 设置轮廓线与边框边缘之间的距离。（outline-offset）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-offset
   */
  outlineOffset?: StyleValue<CSSProperties['outlineOffset']>;
  /**
   * 设置轮廓线线型。（outline-style）
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-style
   */
  outlineStyle?: StyleValue<CSSProperties['outlineStyle']>;
  /**
   * 设置轮廓线宽度。（outline-width）
   *
   * 数字值自动加 `px`；初始值 `medium`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-width
   */
  outlineWidth?: StyleValue<CSSProperties['outlineWidth']>;
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
  overflow?: StyleValue<KeywordValue<OverflowKeywords, CSSProperties['overflow']>>;
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
  overflowBlock?: StyleValue<KeywordValue<OverflowKeywords, CSSProperties['overflowBlock']>>;
  /**
   * 非标准键，不对应 CSS 属性；请用 overflowX 或 overflowBlock。（overflow-block-x）
   */
  overflowBlockX?: StyleValue<CSSProperties['overflowBlockX']>;
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
  overflowX?: StyleValue<KeywordValue<OverflowKeywords, CSSProperties['overflowX']>>;
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
  overflowY?: StyleValue<KeywordValue<OverflowKeywords, CSSProperties['overflowY']>>;
  /**
   * 控制元素是否参与滚动锚定，以减少内容变化造成的视口跳动。（overflow-anchor）
   *
   * 初始值 `auto`；不继承；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-anchor
   */
  overflowAnchor?: StyleValue<CSSProperties['overflowAnchor']>;
  /**
   * 设置 overflow:clip 的裁剪边界允许向外扩展的距离。（overflow-clip-margin）
   *
   * 初始值 `0px`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-clip-margin
   */
  overflowClipMargin?: StyleValue<CSSProperties['overflowClipMargin']>;
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
  overflowWrap?: StyleValue<KeywordValue<OverflowWrapKeywords, CSSProperties['overflowWrap']>>;
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
    KeywordValue<OverscrollBehaviorKeywords, CSSProperties['overscrollBehavior']>
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
    KeywordValue<OverscrollBehaviorKeywords, CSSProperties['overscrollBehaviorBlock']>
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
    KeywordValue<OverscrollBehaviorKeywords, CSSProperties['overscrollBehaviorY']>
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
    KeywordValue<OverscrollBehaviorKeywords, CSSProperties['overscrollBehaviorInline']>
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
    KeywordValue<OverscrollBehaviorKeywords, CSSProperties['overscrollBehaviorX']>
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
  padding?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['padding']>>;
  /**
   * 设置逻辑块轴起始侧和结束侧的内边距。（padding-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block
   */
  paddingBlock?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingBlock']>>;
  /**
   * 设置逻辑块轴结束侧的内边距。（padding-block-end）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block-end
   */
  paddingBlockEnd?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingBlockEnd']>>;
  /**
   * 设置逻辑块轴起始侧的内边距。（padding-block-start）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block-start
   */
  paddingBlockStart?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingBlockStart']>>;
  /**
   * 设置逻辑行内轴起始侧和结束侧的内边距。（padding-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline
   */
  paddingInline?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingInline']>>;
  /**
   * 设置逻辑行内轴结束侧的内边距。（padding-inline-end）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline-end
   */
  paddingInlineEnd?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingInlineEnd']>>;
  /**
   * 设置逻辑行内轴起始侧的内边距。（padding-inline-start）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline-start
   */
  paddingInlineStart?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingInlineStart']>>;
  /**
   * 设置下内边距。（padding-bottom）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-bottom
   */
  paddingBottom?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingBottom']>>;
  /**
   * 设置左内边距。（padding-left）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-left
   */
  paddingLeft?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingLeft']>>;
  /**
   * 设置右内边距。（padding-right）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-right
   */
  paddingRight?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingRight']>>;
  /**
   * 设置上内边距。（padding-top）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-top
   */
  paddingTop?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['paddingTop']>>;
  /**
   * 选择分页媒体中使用的命名页面类型。（page）
   *
   * 初始值 `auto`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page
   */
  page?: StyleValue<CSSProperties['page']>;
  /**
   * 打印时元素之后是否分页（page-break-after），旧写法，请改用 breakAfter。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-after
   */
  pageBreakAfter?: StyleValue<CSSProperties['pageBreakAfter']>;
  /**
   * 打印时元素之前是否分页（page-break-before），旧写法，请改用 breakBefore。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-before
   */
  pageBreakBefore?: StyleValue<CSSProperties['pageBreakBefore']>;
  /**
   * 打印时是否允许在元素内部分页（page-break-inside），旧写法，请改用 breakInside。
   *
   * 初始值 `auto`；不继承；已废弃；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-inside
   */
  pageBreakInside?: StyleValue<CSSProperties['pageBreakInside']>;
  /**
   * 设置 SVG 填充、描边和标记的绘制先后顺序。（paint-order）
   *
   * 初始值 `normal`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/paint-order
   */
  paintOrder?: StyleValue<CSSProperties['paintOrder']>;
  /**
   * 语音合成在元素前后的停顿（pause），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  pause?: StyleValue<CSSProperties['pause']>;
  /**
   * 语音合成在元素之后的停顿（pause-after），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  pauseAfter?: StyleValue<CSSProperties['pauseAfter']>;
  /**
   * 语音合成在元素之前的停顿（pause-before），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  pauseBefore?: StyleValue<CSSProperties['pauseBefore']>;
  /**
   * 设置观察子元素三维变换时的透视距离。（perspective）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/perspective
   */
  perspective?: StyleValue<CSSProperties['perspective']>;
  /**
   * 设置三维透视的观察原点。（perspective-origin）
   *
   * 初始值 `50% 50%`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/perspective-origin
   */
  perspectiveOrigin?: StyleValue<CSSProperties['perspectiveOrigin']>;
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
  pointerEvents?: StyleValue<KeywordValue<PointerEventsKeywords, CSSProperties['pointerEvents']>>;
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
  position?: StyleValue<KeywordValue<PositionKeywords, CSSProperties['position']>>;
  /**
   * 选择绝对定位元素使用的默认锚点。（position-anchor）
   *
   * 初始值 `normal`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-anchor
   */
  positionAnchor?: StyleValue<CSSProperties['positionAnchor']>;
  /**
   * 选择相对于锚点的定位区域。（position-area）
   *
   * 初始值 `none`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-area
   */
  positionArea?: StyleValue<CSSProperties['positionArea']>;
  /**
   * 同时设置锚点定位的候选回退方式及尝试顺序。（position-try）
   *
   * 简写属性，初始值见各分项；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try
   */
  positionTry?: StyleValue<CSSProperties['positionTry']>;
  /**
   * 设置锚点定位溢出时尝试的替代位置。（position-try-fallbacks）
   *
   * 初始值 `none`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try-fallbacks
   */
  positionTryFallbacks?: StyleValue<CSSProperties['positionTryFallbacks']>;
  /**
   * 锚点定位放不下时依次尝试的备选位置（position-try-options），是 positionTryFallbacks 的旧名，请改用后者。
   */
  positionTryOptions?: StyleValue<CSSProperties['positionTryOptions']>;
  /**
   * 设置锚点定位元素根据锚点可见性和溢出情况是否显示。（position-visibility）
   *
   * 初始值 `anchors-visible`；不继承；实验性；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-visibility
   */
  positionVisibility?: StyleValue<CSSProperties['positionVisibility']>;
  /**
   * 设置生成引号所用的开闭字符对。（quotes）
   *
   * 初始值 `dependsOnUserAgent`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/quotes
   */
  quotes?: StyleValue<CSSProperties['quotes']>;
  /**
   * 设置用户是否能调整元素尺寸以及可调整的方向。（resize）
   *
   * 初始值 `none`；不继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/resize
   */
  resize?: StyleValue<CSSProperties['resize']>;
  /**
   * 语音合成在元素前后的静默时长（rest），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  rest?: StyleValue<CSSProperties['rest']>;
  /**
   * 语音合成在元素之后的静默时长（rest-after），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  restAfter?: StyleValue<CSSProperties['restAfter']>;
  /**
   * 语音合成在元素之前的静默时长（rest-before），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  restBefore?: StyleValue<CSSProperties['restBefore']>;
  /**
   * 设置定位元素相对于其定位参照的右侧偏移。（right）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/right
   */
  right?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['right']>>;
  /**
   * 设置布局中相邻行之间的间距。（row-gap）
   *
   * 数字值自动加 `px`；初始值 `normal`；不继承；Baseline：2020 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/row-gap
   */
  rowGap?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['rowGap']>>;
  /**
   * 设置注音文字与基底文字之间剩余空间的分配方式。（ruby-align）
   *
   * 初始值 `space-around`；继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ruby-align
   */
  rubyAlign?: StyleValue<CSSProperties['rubyAlign']>;
  /**
   * 设置相邻注音容器的合并方式；使用前核对目标浏览器。（ruby-merge）
   *
   * 初始值 `separate`；继承；实验性。
   */
  rubyMerge?: StyleValue<CSSProperties['rubyMerge']>;
  /**
   * 设置注音文字相对于基底文字的位置。（ruby-position）
   *
   * 初始值 `alternate`；继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ruby-position
   */
  rubyPosition?: StyleValue<CSSProperties['rubyPosition']>;
  /**
   * 设置数学公式的嵌套深度，用于数学字号等排版计算。（math-depth）
   *
   * 数字值不加单位；初始值 `0`；继承；Baseline：2026 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-depth
   */
  mathDepth?: StyleValue<CSSProperties['mathDepth']>;
  /**
   * 控制数学上标采用正常还是压缩的垂直偏移。（math-shift）
   *
   * 初始值 `normal`；继承；实验性；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-shift
   */
  mathShift?: StyleValue<CSSProperties['mathShift']>;
  /**
   * 设置数学公式采用正常还是紧凑排版。（math-style）
   *
   * 初始值 `normal`；继承；Baseline：2026 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-style
   */
  mathStyle?: StyleValue<CSSProperties['mathStyle']>;
  /**
   * 设置由导航或滚动 API 触发的滚动采用即时还是平滑方式。（scroll-behavior）
   *
   * 主要影响导航和滚动 API 触发的滚动，不会把所有用户滚动强制变成动画。
   *
   * 适用场景：锚点跳转或程序化滚动；应同时考虑减少动态效果的用户偏好。
   *
   * 初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-behavior
   */
  scrollBehavior?: StyleValue<CSSProperties['scrollBehavior']>;
  /**
   * 设置元素滚动目标区域的四边外扩距离，不改变普通布局外边距。（scroll-margin）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin
   */
  scrollMargin?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollMargin']>>;
  /**
   * 设置滚动目标区域上侧的外扩距离。（scroll-margin-top）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-top
   */
  scrollMarginTop?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollMarginTop']>>;
  /**
   * 设置滚动目标区域右侧的外扩距离。（scroll-margin-right）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-right
   */
  scrollMarginRight?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollMarginRight']>>;
  /**
   * 设置滚动目标区域下侧的外扩距离。（scroll-margin-bottom）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-bottom
   */
  scrollMarginBottom?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollMarginBottom']>>;
  /**
   * 设置滚动目标区域左侧的外扩距离。（scroll-margin-left）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-left
   */
  scrollMarginLeft?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollMarginLeft']>>;
  /**
   * 设置滚动目标区域在逻辑块轴两侧的外扩距离。（scroll-margin-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block
   */
  scrollMarginBlock?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollMarginBlock']>>;
  /**
   * 设置滚动目标区域在逻辑块轴结束侧的外扩距离。（scroll-margin-block-end）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block-end
   */
  scrollMarginBlockEnd?: StyleValue<
    KeywordValue<SpaceTokens, CSSProperties['scrollMarginBlockEnd']>
  >;
  /**
   * 设置滚动目标区域在逻辑块轴起始侧的外扩距离。（scroll-margin-block-start）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block-start
   */
  scrollMarginBlockStart?: StyleValue<
    KeywordValue<SpaceTokens, CSSProperties['scrollMarginBlockStart']>
  >;
  /**
   * 设置滚动目标区域在逻辑行内轴两侧的外扩距离。（scroll-margin-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline
   */
  scrollMarginInline?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollMarginInline']>>;
  /**
   * 设置滚动目标区域在逻辑行内轴结束侧的外扩距离。（scroll-margin-inline-end）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline-end
   */
  scrollMarginInlineEnd?: StyleValue<
    KeywordValue<SpaceTokens, CSSProperties['scrollMarginInlineEnd']>
  >;
  /**
   * 设置滚动目标区域在逻辑行内轴起始侧的外扩距离。（scroll-margin-inline-start）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline-start
   */
  scrollMarginInlineStart?: StyleValue<
    KeywordValue<SpaceTokens, CSSProperties['scrollMarginInlineStart']>
  >;
  /**
   * 设置滚动容器最佳可视区域的四边内缩距离。（scroll-padding）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding
   */
  scrollPadding?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollPadding']>>;
  /**
   * 设置滚动容器最佳可视区域上侧的内缩距离。（scroll-padding-top）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-top
   */
  scrollPaddingTop?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollPaddingTop']>>;
  /**
   * 设置滚动容器最佳可视区域右侧的内缩距离。（scroll-padding-right）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-right
   */
  scrollPaddingRight?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollPaddingRight']>>;
  /**
   * 设置滚动容器最佳可视区域下侧的内缩距离。（scroll-padding-bottom）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-bottom
   */
  scrollPaddingBottom?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollPaddingBottom']>>;
  /**
   * 设置滚动容器最佳可视区域左侧的内缩距离。（scroll-padding-left）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-left
   */
  scrollPaddingLeft?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollPaddingLeft']>>;
  /**
   * 设置滚动容器最佳可视区域在逻辑块轴两侧的内缩距离。（scroll-padding-block）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block
   */
  scrollPaddingBlock?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollPaddingBlock']>>;
  /**
   * 设置滚动容器最佳可视区域在逻辑块轴结束侧的内缩距离。（scroll-padding-block-end）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block-end
   */
  scrollPaddingBlockEnd?: StyleValue<
    KeywordValue<SpaceTokens, CSSProperties['scrollPaddingBlockEnd']>
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑块轴起始侧的内缩距离。（scroll-padding-block-start）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block-start
   */
  scrollPaddingBlockStart?: StyleValue<
    KeywordValue<SpaceTokens, CSSProperties['scrollPaddingBlockStart']>
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑行内轴两侧的内缩距离。（scroll-padding-inline）
   *
   * 数字值自动加 `px`；简写属性，初始值见各分项；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline
   */
  scrollPaddingInline?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['scrollPaddingInline']>>;
  /**
   * 设置滚动容器最佳可视区域在逻辑行内轴结束侧的内缩距离。（scroll-padding-inline-end）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline-end
   */
  scrollPaddingInlineEnd?: StyleValue<
    KeywordValue<SpaceTokens, CSSProperties['scrollPaddingInlineEnd']>
  >;
  /**
   * 设置滚动容器最佳可视区域在逻辑行内轴起始侧的内缩距离。（scroll-padding-inline-start）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline-start
   */
  scrollPaddingInlineStart?: StyleValue<
    KeywordValue<SpaceTokens, CSSProperties['scrollPaddingInlineStart']>
  >;
  /**
   * 设置元素作为滚动吸附目标时在块轴和行内轴上的对齐位置。（scroll-snap-align）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-align
   */
  scrollSnapAlign?: StyleValue<CSSProperties['scrollSnapAlign']>;
  /**
   * 设置滚动时是否允许越过该元素的吸附位置。（scroll-snap-stop）
   *
   * 初始值 `normal`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-stop
   */
  scrollSnapStop?: StyleValue<CSSProperties['scrollSnapStop']>;
  /**
   * 设置滚动容器的吸附轴和吸附强度。（scroll-snap-type）
   *
   * 轴和吸附强度的组合通过 raw 写入，例如 x mandatory；单独声明轴时省略的强度按 CSS 规则处理。
   *
   * 初始值 `none`；不继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-type
   */
  scrollSnapType?: StyleValue<CSSProperties['scrollSnapType']>;
  /**
   * 同时声明滚动进度时间线的名称和轴。（scroll-timeline）
   *
   * 简写属性，初始值见各分项；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline
   */
  scrollTimeline?: StyleValue<CSSProperties['scrollTimeline']>;
  /**
   * 设置滚动进度时间线所观察的滚动轴。（scroll-timeline-axis）
   *
   * 初始值 `block`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline-axis
   */
  scrollTimelineAxis?: StyleValue<CSSProperties['scrollTimelineAxis']>;
  /**
   * 声明基于当前容器滚动进度的时间线名称。（scroll-timeline-name）
   *
   * 初始值 `none`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline-name
   */
  scrollTimelineName?: StyleValue<CSSProperties['scrollTimelineName']>;
  /**
   * 设置滚动条滑块和轨道的颜色。（scrollbar-color）
   *
   * 初始值 `auto`；继承；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-color
   */
  scrollbarColor?: StyleValue<CSSProperties['scrollbarColor']>;
  /**
   * 设置是否预留滚动条槽位，以减少滚动条出现时的布局变化。（scrollbar-gutter）
   *
   * 初始值 `auto`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-gutter
   */
  scrollbarGutter?: StyleValue<CSSProperties['scrollbarGutter']>;
  /**
   * 设置滚动条采用正常、较细或隐藏的外观。（scrollbar-width）
   *
   * 初始值 `auto`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-width
   */
  scrollbarWidth?: StyleValue<CSSProperties['scrollbarWidth']>;
  /**
   * 设置从图像 alpha 信息提取环绕形状时的阈值。（shape-image-threshold）
   *
   * 数字值不加单位；初始值 `0.0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-image-threshold
   */
  shapeImageThreshold?: StyleValue<CSSProperties['shapeImageThreshold']>;
  /**
   * 设置文字环绕形状之外的额外间距。（shape-margin）
   *
   * 数字值自动加 `px`；初始值 `0`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-margin
   */
  shapeMargin?: StyleValue<CSSProperties['shapeMargin']>;
  /**
   * 设置浮动元素周围行内内容所环绕的形状。（shape-outside）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-outside
   */
  shapeOutside?: StyleValue<CSSProperties['shapeOutside']>;
  /**
   * 向 SVG 渲染器提供图形绘制精度与速度的偏好。（shape-rendering）
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-rendering
   */
  shapeRendering?: StyleValue<CSSProperties['shapeRendering']>;
  /**
   * 语音合成是否朗读元素内容（speak），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * Baseline：尚未在所有主流浏览器可用。
   */
  speak?: StyleValue<CSSProperties['speak']>;
  /**
   * 设置语音呈现时文字、数字和标点的朗读方式；使用前核对语音媒体支持。（speak-as）
   *
   * 初始值 `auto`；继承；实验性；Baseline：尚未在所有主流浏览器可用。
   */
  speakAs?: StyleValue<CSSProperties['speakAs']>;
  /**
   * @font-face 中字体文件的来源描述符（src），不是元素样式属性，写在 create 里无效。
   */
  src?: StyleValue<CSSProperties['src']>;
  /**
   * 非标准键，不对应 CSS 属性；定位请用 insetInlineStart。（start）
   *
   * 数字值自动加 `px`。
   */
  start?: StyleValue<CSSProperties['start']>;
  /**
   * 设置 SVG 图形轮廓的描边绘制方式。（stroke）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke
   */
  stroke?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['stroke']>>;
  /**
   * 设置 SVG 描边虚线中线段与空隙的长度序列。（stroke-dasharray）
   *
   * 初始值 `none`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-dasharray
   */
  strokeDasharray?: StyleValue<CSSProperties['strokeDasharray']>;
  /**
   * 设置 SVG 虚线描边相对于路径起点的偏移。（stroke-dashoffset）
   *
   * 数字值不加单位；初始值 `0`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-dashoffset
   */
  strokeDashoffset?: StyleValue<CSSProperties['strokeDashoffset']>;
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
  strokeLinecap?: StyleValue<KeywordValue<StrokeLinecapKeywords, CSSProperties['strokeLinecap']>>;
  /**
   * 设置 SVG 路径转角处描边的连接形状。（stroke-linejoin）
   *
   * 初始值 `miter`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-linejoin
   */
  strokeLinejoin?: StyleValue<CSSProperties['strokeLinejoin']>;
  /**
   * 限制尖角连接的延伸比例，超过阈值时改变连接形状。（stroke-miterlimit）
   *
   * 数字值不加单位；初始值 `4`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-miterlimit
   */
  strokeMiterlimit?: StyleValue<CSSProperties['strokeMiterlimit']>;
  /**
   * 设置 SVG 描边的不透明度，不影响填充。（stroke-opacity）
   *
   * 数字值不加单位；初始值 `1`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-opacity
   */
  strokeOpacity?: StyleValue<CSSProperties['strokeOpacity']>;
  /**
   * 设置 SVG 描边宽度。（stroke-width）
   *
   * 数字值不加单位；初始值 `1px`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-width
   */
  strokeWidth?: StyleValue<CSSProperties['strokeWidth']>;
  /**
   * 设置保留制表符时每个制表位的宽度。（tab-size）
   *
   * 数字值不加单位；初始值 `8`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/tab-size
   */
  tabSize?: StyleValue<CSSProperties['tabSize']>;
  /**
   * 设置表格列宽采用自动还是固定布局算法。（table-layout）
   *
   * 初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/table-layout
   */
  tableLayout?: StyleValue<CSSProperties['tableLayout']>;
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
  textAlign?: StyleValue<KeywordValue<TextAlignKeywords, CSSProperties['textAlign']>>;
  /**
   * 设置段落最后一行或强制换行前一行的对齐方式。（text-align-last）
   *
   * 初始值 `auto`；继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-align-last
   */
  textAlignLast?: StyleValue<CSSProperties['textAlignLast']>;
  /**
   * 设置 SVG 文本片段相对于定位点的锚定方式。（text-anchor）
   *
   * 初始值 `start`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-anchor
   */
  textAnchor?: StyleValue<CSSProperties['textAnchor']>;
  /**
   * 设置竖排文字中多个字符是否合成为一个横排字形单元。（text-combine-upright）
   *
   * 初始值 `none`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-combine-upright
   */
  textCombineUpright?: StyleValue<CSSProperties['textCombineUpright']>;
  /**
   * 集中设置文本装饰线的位置、线型、颜色及粗细。（text-decoration）
   *
   * 简写属性，初始值见各分项；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration
   */
  textDecoration?: StyleValue<CSSProperties['textDecoration']>;
  /**
   * 设置文本装饰线颜色。（text-decoration-color）
   *
   * 初始值 `currentcolor`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-color
   */
  textDecorationColor?: StyleValue<
    KeywordValue<ColorsTokens, CSSProperties['textDecorationColor']>
  >;
  /**
   * 设置下划线、上划线或删除线等装饰线位置。（text-decoration-line）
   *
   * 初始值 `none`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-line
   */
  textDecorationLine?: StyleValue<CSSProperties['textDecorationLine']>;
  /**
   * 设置文本装饰线跳过哪些内容；具体语法需核对支持情况。（text-decoration-skip）
   *
   * 初始值 `objects`；继承；实验性。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-skip
   */
  textDecorationSkip?: StyleValue<CSSProperties['textDecorationSkip']>;
  /**
   * 设置装饰线是否避让字形的笔画。（text-decoration-skip-ink）
   *
   * 初始值 `auto`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-skip-ink
   */
  textDecorationSkipInk?: StyleValue<CSSProperties['textDecorationSkipInk']>;
  /**
   * 设置文本装饰线的实线、波浪线等线型。（text-decoration-style）
   *
   * 初始值 `solid`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-style
   */
  textDecorationStyle?: StyleValue<CSSProperties['textDecorationStyle']>;
  /**
   * 设置文本装饰线粗细。（text-decoration-thickness）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-thickness
   */
  textDecorationThickness?: StyleValue<CSSProperties['textDecorationThickness']>;
  /**
   * 同时设置文字着重号的样式和颜色。（text-emphasis）
   *
   * 简写属性，初始值见各分项；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis
   */
  textEmphasis?: StyleValue<CSSProperties['textEmphasis']>;
  /**
   * 设置文字着重号颜色。（text-emphasis-color）
   *
   * 初始值 `currentcolor`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-color
   */
  textEmphasisColor?: StyleValue<KeywordValue<ColorsTokens, CSSProperties['textEmphasisColor']>>;
  /**
   * 设置文字着重号位于文字的哪一侧。（text-emphasis-position）
   *
   * 初始值 `auto`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-position
   */
  textEmphasisPosition?: StyleValue<CSSProperties['textEmphasisPosition']>;
  /**
   * 设置文字着重号的形状和填充方式。（text-emphasis-style）
   *
   * 初始值 `none`；继承；Baseline：2024 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-style
   */
  textEmphasisStyle?: StyleValue<CSSProperties['textEmphasisStyle']>;
  /**
   * 设置文本行的缩进距离。（text-indent）
   *
   * 数字值自动加 `px`；初始值 `0`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-indent
   */
  textIndent?: StyleValue<CSSProperties['textIndent']>;
  /**
   * 设置两端对齐时增加间距的算法。（text-justify）
   *
   * 初始值 `auto`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-justify
   */
  textJustify?: StyleValue<CSSProperties['textJustify']>;
  /**
   * 设置竖排模式下字符的方向。（text-orientation）
   *
   * 初始值 `mixed`；继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-orientation
   */
  textOrientation?: StyleValue<CSSProperties['textOrientation']>;
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
  textOverflow?: StyleValue<KeywordValue<TextOverflowKeywords, CSSProperties['textOverflow']>>;
  /**
   * 向渲染器提供文本速度、可读性或几何精度的偏好。（text-rendering）
   *
   * 初始值 `auto`；继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-rendering
   */
  textRendering?: StyleValue<CSSProperties['textRendering']>;
  /**
   * 设置文字及其装饰的阴影，可叠加多层。（text-shadow）
   *
   * 初始值 `none`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-shadow
   */
  textShadow?: StyleValue<CSSProperties['textShadow']>;
  /**
   * 控制移动浏览器为提升可读性而进行的文字自动放大。（text-size-adjust）
   *
   * 初始值 `autoForSmartphoneBrowsersSupportingInflation`；继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-size-adjust
   */
  textSizeAdjust?: StyleValue<CSSProperties['textSizeAdjust']>;
  /**
   * 设置文字显示时的大小写、全角或其他字形转换。（text-transform）
   *
   * 初始值 `none`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-transform
   */
  textTransform?: StyleValue<CSSProperties['textTransform']>;
  /**
   * 设置下划线相对于默认位置的偏移。（text-underline-offset）
   *
   * 数字值自动加 `px`；初始值 `auto`；继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-underline-offset
   */
  textUnderlineOffset?: StyleValue<CSSProperties['textUnderlineOffset']>;
  /**
   * 设置下划线相对于文字基线或竖排文字的放置方式。（text-underline-position）
   *
   * 初始值 `auto`；继承；Baseline：2023 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-underline-position
   */
  textUnderlinePosition?: StyleValue<CSSProperties['textUnderlinePosition']>;
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
  textWrap?: StyleValue<KeywordValue<TextWrapKeywords, CSSProperties['textWrap']>>;
  /**
   * 扩大命名动画时间线的可引用作用域。（timeline-scope）
   *
   * 初始值 `none`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-scope
   */
  timelineScope?: StyleValue<CSSProperties['timelineScope']>;
  /**
   * 设置定位元素相对于其定位参照的上侧偏移。（top）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/top
   */
  top?: StyleValue<KeywordValue<SpaceTokens, CSSProperties['top']>>;
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
  touchAction?: StyleValue<KeywordValue<TouchActionKeywords, CSSProperties['touchAction']>>;
  /**
   * 按顺序组合平移、旋转、缩放等二维或三维变换。（transform）
   *
   * 多个变换的顺序会影响结果。变换通常不改变元素在普通文档流中预留的尺寸。
   *
   * 适用场景：平移、旋转和缩放的视觉效果；需要改变普通流占位时应调整布局属性。
   *
   * 初始值 `none`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform
   */
  transform?: StyleValue<CSSProperties['transform']>;
  /**
   * 设置变换及其原点所依据的参照盒。（transform-box）
   *
   * 初始值 `view-box`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-box
   */
  transformBox?: StyleValue<CSSProperties['transformBox']>;
  /**
   * 设置元素变换的原点。（transform-origin）
   *
   * 数字值自动加 `px`；初始值 `50% 50% 0`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-origin
   */
  transformOrigin?: StyleValue<CSSProperties['transformOrigin']>;
  /**
   * 控制子元素的三维位置保留在三维空间还是展平。（transform-style）
   *
   * 初始值 `flat`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-style
   */
  transformStyle?: StyleValue<CSSProperties['transformStyle']>;
  /**
   * 独立设置元素旋转，不必重写 transform 中的其他变换。（rotate）
   *
   * 数字值不加单位；初始值 `none`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/rotate
   */
  rotate?: StyleValue<CSSProperties['rotate']>;
  /**
   * 独立设置元素的缩放比例。（scale）
   *
   * 数字值不加单位；初始值 `none`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scale
   */
  scale?: StyleValue<CSSProperties['scale']>;
  /**
   * 独立设置元素在二维或三维空间中的平移。（translate）
   *
   * 数字值自动加 `px`；初始值 `none`；不继承；Baseline：2025 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/translate
   */
  translate?: StyleValue<CSSProperties['translate']>;
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
  transition?: StyleValue<CSSProperties['transition']>;
  /**
   * 设置属性变化后开始过渡的延迟。（transition-delay）
   *
   * 初始值 `0s`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-delay
   */
  transitionDelay?: StyleValue<KeywordValue<DurationsTokens, CSSProperties['transitionDelay']>>;
  /**
   * 设置过渡从开始到完成的时长。（transition-duration）
   *
   * 初始值 `0s`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-duration
   */
  transitionDuration?: StyleValue<
    KeywordValue<DurationsTokens, CSSProperties['transitionDuration']>
  >;
  /**
   * 指定发生变化时需要过渡的 CSS 属性。（transition-property）
   *
   * 初始值 `all`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-property
   */
  transitionProperty?: StyleValue<CSSProperties['transitionProperty']>;
  /**
   * 设置过渡进度变化的缓动函数。（transition-timing-function）
   *
   * 初始值 `ease`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-timing-function
   */
  transitionTimingFunction?: StyleValue<
    KeywordValue<EasingsTokens, CSSProperties['transitionTimingFunction']>
  >;
  /**
   * 设置元素如何参与 Unicode 双向文本算法，通常与 direction 配合。（unicode-bidi）
   *
   * 初始值 `normal`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/unicode-bidi
   */
  unicodeBidi?: StyleValue<CSSProperties['unicodeBidi']>;
  /**
   * @font-face 中字体适用的字符范围描述符（unicode-range），不是元素样式属性。
   */
  unicodeRange?: StyleValue<CSSProperties['unicodeRange']>;
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
  userSelect?: StyleValue<KeywordValue<UserSelectKeywords, CSSProperties['userSelect']>>;
  /**
   * 设置行内级盒子或表格单元格的垂直对齐，不用于普通块盒居中。（vertical-align）
   *
   * 数字值自动加 `px`；初始值 `baseline`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/vertical-align
   */
  verticalAlign?: StyleValue<CSSProperties['verticalAlign']>;
  /**
   * 同时声明基于元素可见进度的时间线名称与轴。（view-timeline）
   *
   * 简写属性，初始值见各分项；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline
   */
  viewTimeline?: StyleValue<CSSProperties['viewTimeline']>;
  /**
   * 设置可见进度时间线所观察的滚动轴。（view-timeline-axis）
   *
   * 初始值 `block`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-axis
   */
  viewTimelineAxis?: StyleValue<CSSProperties['viewTimelineAxis']>;
  /**
   * 声明基于元素进入和离开滚动视口的时间线名称。（view-timeline-name）
   *
   * 初始值 `none`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-name
   */
  viewTimelineName?: StyleValue<CSSProperties['viewTimelineName']>;
  /**
   * 设置可见进度时间线使用的滚动视口内缩范围。（view-timeline-inset）
   *
   * 数字值自动加 `px`；初始值 `auto`；不继承；实验性；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-inset
   */
  viewTimelineInset?: StyleValue<CSSProperties['viewTimelineInset']>;
  /**
   * 为视图过渡中的元素命名，以匹配前后状态的快照。（view-transition-name）
   *
   * 初始值 `none`；不继承；Baseline：2025 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-transition-name
   */
  viewTransitionName?: StyleValue<CSSProperties['viewTransitionName']>;
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
  visibility?: StyleValue<KeywordValue<VisibilityKeywords, CSSProperties['visibility']>>;
  /**
   * 语音合成的左右声道平衡（voice-balance），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  voiceBalance?: StyleValue<CSSProperties['voiceBalance']>;
  /**
   * 语音合成朗读元素内容的时长（voice-duration），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceDuration?: StyleValue<CSSProperties['voiceDuration']>;
  /**
   * 语音合成使用的声音（voice-family），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceFamily?: StyleValue<CSSProperties['voiceFamily']>;
  /**
   * 语音合成的音高（voice-pitch），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  voicePitch?: StyleValue<CSSProperties['voicePitch']>;
  /**
   * 语音合成的音高变化范围（voice-range），属于 CSS Speech 模块，浏览器基本不支持。
   *
   * 数字值自动加 `px`。
   */
  voiceRange?: StyleValue<CSSProperties['voiceRange']>;
  /**
   * 语音合成的语速（voice-rate），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceRate?: StyleValue<CSSProperties['voiceRate']>;
  /**
   * 语音合成的重音强度（voice-stress），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceStress?: StyleValue<CSSProperties['voiceStress']>;
  /**
   * 语音合成的音量（voice-volume），属于 CSS Speech 模块，浏览器基本不支持。
   */
  voiceVolume?: StyleValue<CSSProperties['voiceVolume']>;
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
  whiteSpace?: StyleValue<KeywordValue<WhiteSpaceKeywords, CSSProperties['whiteSpace']>>;
  /**
   * 设置分页或分栏断点后需保留的最少行数。（widows）
   *
   * 数字值不加单位；初始值 `2`；继承；Baseline：尚未在所有主流浏览器可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/widows
   */
  widows?: StyleValue<CSSProperties['widows']>;
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
  width?: StyleValue<KeywordValue<WidthKeywords, CSSProperties['width']>>;
  /**
   * 提前告知浏览器可能发生变化的属性，便于准备优化资源。（will-change）
   *
   * 仅对即将发生的变化短期使用；长期或大量声明可能占用额外资源，并提前改变层叠上下文。
   *
   * 初始值 `auto`；不继承；Baseline：2022 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/will-change
   */
  willChange?: StyleValue<CSSProperties['willChange']>;
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
  wordBreak?: StyleValue<KeywordValue<WordBreakKeywords, CSSProperties['wordBreak']>>;
  /**
   * 设置单词或词间分隔符的额外间距。（word-spacing）
   *
   * 数字值自动加 `px`；初始值 `normal`；继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/word-spacing
   */
  wordSpacing?: StyleValue<CSSProperties['wordSpacing']>;
  /**
   * 设置长文本的额外换行行为；是 overflow-wrap 的兼容名称。（word-wrap）
   *
   * 初始值 `normal`；继承。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-wrap
   */
  wordWrap?: StyleValue<CSSProperties['wordWrap']>;
  /**
   * 设置水平或竖直书写模式，以及行和块的推进方向。（writing-mode）
   *
   * 初始值 `horizontal-tb`；继承；Baseline：2019 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/writing-mode
   */
  writingMode?: StyleValue<CSSProperties['writingMode']>;
  /**
   * 设置元素在所属层叠上下文中的层叠级别。（z-index）
   *
   * 数值只在所属层叠上下文内比较；更大的数值不保证盖过其他层叠上下文。Flex/Grid 项目也可以使用 z-index。
   *
   * 适用场景：控制同一层叠上下文中的浮层顺序，排查遮挡时先确认祖先层叠上下文。
   *
   * 数字值不加单位；初始值 `auto`；不继承；Baseline：2018 年起广泛可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/z-index
   */
  zIndex?: StyleValue<CSSProperties['zIndex']>;
  /**
   * 设置元素及其布局的缩放比例，与 transform:scale 的布局行为不同。（zoom）
   *
   * 数字值不加单位；初始值 `1`；不继承；Baseline：2024 年起新近可用。
   * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/zoom
   */
  zoom?: StyleValue<CSSProperties['zoom']>;
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
}

// 主题 tokens 的短写（`fontSize: '_xs'`）：每组一个接口，由主题库用 declare module 填入以 `_` 开头的 token 名
export interface SpaceTokens {}
export interface ColorsTokens {}
export interface FontsTokens {}
export interface FontSizesTokens {}
export interface FontWeightsTokens {}
export interface LineHeightsTokens {}
export interface RadiiTokens {}
export interface ShadowsTokens {}
export interface DurationsTokens {}
export interface EasingsTokens {}

// 各属性的关键字说明：键上的注释在悬停取值时显示
interface JustifyContentKeywords {
  /**
   * `center`：将整体内容放在主轴或行内轴的中间，不改变项目内部文字对齐。
   */
  center: unknown;
  /**
   * `space-between`：首尾项目贴两端，剩余空间等分到相邻项目之间。只有一个项目时靠起始侧，不会自动居中。space-evenly 在两端也保留等量空间；space-around 的边缘空间只有项目之间的一半。
   */
  'space-between': unknown;
  /**
   * `space-around`：每个项目两侧分配相等空间，容器边缘的空间是相邻项目间的一半。
   */
  'space-around': unknown;
  /**
   * `space-evenly`：容器两端和相邻项目之间分配相等空间。
   */
  'space-evenly': unknown;
  /**
   * `flex-start`：Flex 内容靠主轴起点排列；起点受 flex-direction 影响。
   */
  'flex-start': unknown;
  /**
   * `flex-end`：Flex 内容靠主轴终点排列。
   */
  'flex-end': unknown;
  /**
   * `stretch`：在支持的布局中拉伸自动尺寸的内容；Flex 主轴增长通常由 flex-grow 控制。
   */
  stretch: unknown;
}

interface AlignItemsKeywords {
  /**
   * `center`：将各项目在交叉轴或块轴的对齐区域中居中。justify-content 控制 Flex 主轴上的内容分布；align-items 控制交叉轴。
   */
  center: unknown;
  /**
   * `stretch`：在自动尺寸及最小/最大约束允许时拉伸项目，不强制覆盖显式尺寸。项目在对齐轴有显式尺寸或受最小/最大尺寸约束时，不一定填满可用区域。center 保持项目尺寸并居中；stretch 尝试扩大自动尺寸。
   */
  stretch: unknown;
  /**
   * `baseline`：按项目的对齐基线对齐，不等同于底边对齐。
   */
  baseline: unknown;
  /**
   * `normal`：由布局模式决定行为，许多场景类似 stretch，但存在内部尺寸等例外。
   */
  normal: unknown;
  /**
   * `start`：按对齐轴的逻辑起始侧对齐。
   */
  start: unknown;
  /**
   * `end`：按对齐轴的逻辑结束侧对齐。
   */
  end: unknown;
  /**
   * `flex-start`：在 Flex 中按交叉轴起始侧对齐；交叉轴方向受换行方式影响。
   */
  'flex-start': unknown;
  /**
   * `flex-end`：在 Flex 中按交叉轴结束侧对齐。
   */
  'flex-end': unknown;
}

interface AlignSelfKeywords {
  /**
   * `auto`：使用父容器的 align-items 对齐方式。
   */
  auto: unknown;
  /**
   * `stretch`：在自动尺寸和最小/最大约束允许时拉伸当前项目。
   */
  stretch: unknown;
  /**
   * `baseline`：让当前项目参与基线对齐，不等同于底边对齐。
   */
  baseline: unknown;
}

interface JustifySelfKeywords {
  /**
   * `auto`：采用父容器 justify-items 等上下文决定的对齐方式；不用于 Flex 项目的主轴分配。
   */
  auto: unknown;
  /**
   * `stretch`：在自动尺寸和最小/最大约束允许时沿行内轴拉伸。
   */
  stretch: unknown;
}

interface AnimationFillModeKeywords {
  /**
   * `none`：动画有效区间之外不应用动画关键帧值。
   */
  none: unknown;
  /**
   * `forwards`：播放结束后保留最后生效关键帧的效果；最后帧取决于方向和循环次数。
   */
  forwards: unknown;
  /**
   * `backwards`：延迟阶段应用最先生效关键帧的效果，具体帧取决于播放方向。
   */
  backwards: unknown;
  /**
   * `both`：同时应用 backwards 和 forwards 的区间外效果。
   */
  both: unknown;
}

interface BackgroundClipKeywords {
  /**
   * `text`：把背景裁剪到文字字形；显示背景文字效果通常还需要透明的文字颜色。
   */
  text: unknown;
}

interface BackgroundImageKeywords {
  /**
   * `none`：不绘制这一层背景图像；背景颜色仍然可以显示。
   */
  none: unknown;
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

interface BorderStyleKeywords {
  /**
   * `none`：不绘制边框，并使对应边框计算宽度为零。
   */
  none: unknown;
  /**
   * `hidden`：通常与 none 类似；在表格边框合并冲突中优先隐藏边框。
   */
  hidden: unknown;
  /**
   * `solid`：绘制连续实线边框。
   */
  solid: unknown;
}

interface BoxSizingKeywords {
  /**
   * `content-box`：指定尺寸仅计算内容盒，内边距和边框额外增加外部尺寸。
   */
  'content-box': unknown;
  /**
   * `border-box`：指定尺寸包含内容、内边距和边框，但不包含外边距。仍不包含 margin；最小/最大尺寸和布局约束仍参与计算。content-box 在声明宽高之外再加内边距和边框。
   */
  'border-box': unknown;
}

interface ContainKeywords {
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
   * `paint`：将后代绘制限制在隔离边界内。
   */
  paint: unknown;
  /**
   * `style`：隔离计数器等特定样式副作用，不会阻止普通 CSS 继承或选择器匹配。
   */
  style: unknown;
}

interface ContainerTypeKeywords {
  /**
   * `inline-size`：建立行内轴尺寸查询容器，不同时隔离块轴尺寸。
   */
  'inline-size': unknown;
  /**
   * `size`：建立两个轴的尺寸查询容器，内容不再直接决定其隔离尺寸。
   */
  size: unknown;
  /**
   * `normal`：不建立尺寸查询容器；仍可用于支持的样式查询。
   */
  normal: unknown;
}

interface ContentVisibilityKeywords {
  /**
   * `auto`：允许浏览器跳过与用户暂不相关的内容渲染，仍需维护布局和可访问性语义。
   */
  auto: unknown;
  /**
   * `hidden`：跳过内容渲染，行为不同于只隐藏绘制的 visibility:hidden。
   */
  hidden: unknown;
  /**
   * `visible`：正常渲染内容，不由此属性跳过子树。
   */
  visible: unknown;
}

interface DisplayKeywords {
  /**
   * `block`：生成块级盒子，内部默认采用普通流布局。
   */
  block: unknown;
  /**
   * `inline`：生成行内盒子，参与行内排版；普通非替换行内盒子的宽高不按块盒规则应用。
   */
  inline: unknown;
  /**
   * `inline-block`：外部参与行内排版，内部建立独立格式化上下文，可设置宽高。相邻行内级盒子之间的文本空白仍可能形成间距，vertical-align 会影响它在行内的位置。与 inline 相比可设置宽高，内部建立独立格式化上下文；与 inline-flex 相比，内部使用普通流而非 Flex。
   */
  'inline-block': unknown;
  /**
   * `flex`：生成块级弹性容器，直接子元素参与 Flex 布局。默认主轴为 row，默认不换行；主轴方向还受书写方向影响。inline-flex 使用相同的内部布局，但容器对外按行内级盒子排列。
   */
  flex: unknown;
  /**
   * `inline-flex`：创建行内级的 Flex 容器。子项换行由 flex-wrap 控制。当容器自身是 Flex/Grid 项目时，其外部排版还受父布局控制。与 flex 的区别是容器自身的外部排版方式，内部弹性布局机制相同；inline-flex 对应双关键字写法 inline flex。
   */
  'inline-flex': unknown;
  /**
   * `grid`：生成块级网格容器，直接子元素参与 Grid 布局。Flex 更侧重单个主轴；Grid 可以同时控制行和列。inline-grid 则改变容器对外的显示类型。
   */
  grid: unknown;
  /**
   * `inline-grid`：生成行内级网格容器，内部仍使用 Grid 布局。与 grid 的内部网格布局相同，但容器在普通流中按行内级盒子排列。
   */
  'inline-grid': unknown;
  /**
   * `flow-root`：建立独立块格式化上下文，可包住内部浮动并隔离部分外边距折叠。与普通 block 相比，显式建立独立块格式化上下文；无需借助 overflow:hidden，也不会因此裁剪溢出。
   */
  'flow-root': unknown;
  /**
   * `contents`：通常不生成元素自身的主盒子，让子盒子参与外层布局；背景、边框等失去承载盒，应核对可访问性行为。替换元素等存在特殊规则；应检查语义和可访问性，不要把它当作无条件删除包装盒的替代。
   */
  contents: unknown;
  /**
   * `none`：不生成元素及其后代的布局盒子，通常也从可访问性树中移除。不能靠它保留可聚焦交互；重新显示时需按组件需求管理焦点。visibility:hidden 通常保留布局空间；opacity:0 只改变透明度，通常仍能交互。
   */
  none: unknown;
  /**
   * `list-item`：生成带列表标记的主盒子，标记由 list-style 等属性控制。
   */
  'list-item': unknown;
}

interface FillRuleKeywords {
  /**
   * `evenodd`：按射线穿过路径次数的奇偶性判断内部，适合交叠或有孔路径。
   */
  evenodd: unknown;
  /**
   * `nonzero`：按有方向的绕数判断路径内部，子路径方向会影响结果。
   */
  nonzero: unknown;
}

interface FlexKeywords {
  /**
   * `auto`：等价于 1 1 auto：可增长、可收缩，基础尺寸由主尺寸属性或内容决定。最终比例还受最小/最大尺寸约束，不保证所有项目等宽。1 1 0% 以零百分比为基础分配，auto 的基础尺寸通常受内容或主尺寸属性影响。
   */
  auto: unknown;
  /**
   * `none`：等价于 0 0 auto：不增长也不收缩，保留自动基础尺寸。auto 会增长和收缩；none 两者都不参与。
   */
  none: unknown;
}

interface FlexBasisKeywords {
  /**
   * `auto`：先参考主轴对应的 width 或 height；该值也为 auto 时由内容决定。
   */
  auto: unknown;
  /**
   * `content`：按内容确定基础尺寸，而不直接使用 width 或 height 作为基础尺寸。
   */
  content: unknown;
}

interface FlexDirectionKeywords {
  /**
   * `row`：主轴沿行内方向排列；不一定是从左到右，取决于书写方向。
   */
  row: unknown;
  /**
   * `row-reverse`：反转行内方向的视觉排列，不改变 DOM 顺序。
   */
  'row-reverse': unknown;
  /**
   * `column`：主轴沿块方向排列；水平书写时通常从上到下。
   */
  column: unknown;
  /**
   * `column-reverse`：反转块方向的视觉排列，不改变 DOM 顺序。
   */
  'column-reverse': unknown;
}

interface FlexWrapKeywords {
  /**
   * `nowrap`：保持单行；项目仍可能收缩或溢出。
   */
  nowrap: unknown;
  /**
   * `wrap`：空间不足时形成多行，沿交叉轴正常方向排列。换行不会自动均分每行项目宽度，尺寸仍由各项目的 flex 配置决定。nowrap 保持单行；wrap-reverse 反转交叉轴上各行的排列方向。
   */
  wrap: unknown;
  /**
   * `wrap-reverse`：允许换行并反转交叉轴上各行的排列方向。
   */
  'wrap-reverse': unknown;
}

interface FontWeightKeywords {
  /**
   * `normal`：正常字重，等价于数值 400。
   */
  normal: unknown;
  /**
   * `bold`：粗体字重，等价于数值 700。
   */
  bold: unknown;
  /**
   * `bolder`：相对于继承字重选择更粗的字重，不是简单加一个固定数值。
   */
  bolder: unknown;
  /**
   * `lighter`：相对于继承字重选择更细的字重，不是简单减一个固定数值。
   */
  lighter: unknown;
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

interface InterpolateSizeKeywords {
  /**
   * `allow-keywords`：允许受支持的内部尺寸关键字与长度/百分比之间插值，不保证两个关键字之间可以插值。
   */
  'allow-keywords': unknown;
  /**
   * `numeric-only`：保持仅数值尺寸之间的插值行为。
   */
  'numeric-only': unknown;
}

interface IsolationKeywords {
  /**
   * `isolate`：建立独立层叠上下文，使混合效果在该分组内处理。
   */
  isolate: unknown;
  /**
   * `auto`：由其他属性是否需要层叠上下文决定，不强制隔离。
   */
  auto: unknown;
}

interface LineHeightKeywords {
  /**
   * `normal`：由浏览器和字体度量确定行高，没有固定的跨字体倍数。
   */
  normal: unknown;
}

interface MarginKeywords {
  /**
   * `auto`：由布局模式分配自动外边距；在 Flex/Grid 中可吸收剩余空间，不保证所有方向都自动居中。
   */
  auto: unknown;
}

interface MinWidthKeywords {
  /**
   * `auto`：自动最小尺寸由布局模式决定；Flex/Grid 项目可能受内容最小宽度限制。
   */
  auto: unknown;
}

interface ObjectFitKeywords {
  /**
   * `fill`：把内容拉伸到内容盒，可能改变原有宽高比。
   */
  fill: unknown;
  /**
   * `contain`：保留宽高比并完整放入内容盒，可能留下空白。cover 优先填满盒子并可能裁剪；contain 优先保留完整内容。
   */
  contain: unknown;
  /**
   * `cover`：保留宽高比并填满内容盒，可能裁掉部分图像。裁剪位置由 object-position 控制，盒子尺寸仍需另外设置。contain 保证完整图像可见但可能留白；fill 可能改变图像比例。
   */
  cover: unknown;
  /**
   * `none`：不按内容盒缩放替换内容。
   */
  none: unknown;
  /**
   * `scale-down`：在 none 和 contain 中选择得到较小内容尺寸的方案。
   */
  'scale-down': unknown;
}

interface OverflowKeywords {
  /**
   * `visible`：允许内容绘制到盒子外；与另一轴的设置组合时计算值可能变化。
   */
  visible: unknown;
  /**
   * `hidden`：裁剪溢出且不显示滚动条，但仍是可通过脚本等方式滚动的滚动容器。可能成为 sticky 后代的滚动参照，不能把它仅理解成视觉裁剪。clip 不建立滚动容器；hidden 仍可通过脚本或焦点移动滚动。
   */
  hidden: unknown;
  /**
   * `clip`：在裁剪边界截断内容，不建立滚动容器，也不支持程序化滚动。两轴设置会影响计算结果；与另一轴 auto/scroll 等组合时，要检查最终溢出行为。与 hidden 不同，不支持程序化滚动，也不单独建立块格式化上下文。
   */
  clip: unknown;
  /**
   * `auto`：按溢出情况提供滚动机制；滚动条外观和是否占空间由环境决定。scroll 通常始终预留或显示滚动机制；auto 根据溢出情况显示滚动条，外观由平台决定。
   */
  auto: unknown;
  /**
   * `scroll`：建立滚动容器，通常即使未溢出也显示滚动条；具体外观由平台决定。
   */
  scroll: unknown;
}

interface OverflowWrapKeywords {
  /**
   * `anywhere`：必要时允许在长文本任意位置断行，这些机会参与 min-content 尺寸计算。break-word 的额外断点不按 anywhere 的方式参与最小内容宽度计算；word-break:break-all 更积极地拆分普通单词。
   */
  anywhere: unknown;
  /**
   * `break-word`：必要时允许长文本断行，但新增断点不按 anywhere 的方式参与 min-content 计算。
   */
  'break-word': unknown;
  /**
   * `normal`：只使用正常换行机会，不为长单词额外断行。
   */
  normal: unknown;
}

interface OverscrollBehaviorKeywords {
  /**
   * `auto`：采用默认滚动链和边界反馈。
   */
  auto: unknown;
  /**
   * `contain`：阻止滚动链传播到祖先，同时可保留当前容器的边界反馈。
   */
  contain: unknown;
  /**
   * `none`：阻止滚动链，并抑制当前容器的默认越界反馈。
   */
  none: unknown;
}

interface PointerEventsKeywords {
  /**
   * `none`：元素本身不成为指针命中目标；不等于禁用，仍可能通过 Tab 获焦，后代也可恢复命中。后代可以恢复命中；来自后代的事件仍可能经过祖先监听器。
   */
  none: unknown;
  /**
   * `auto`：采用当前元素类型的默认命中规则。
   */
  auto: unknown;
}

interface PositionKeywords {
  /**
   * `static`：参与普通文档流，top/right/bottom/left 等定位偏移不生效。
   */
  static: unknown;
  /**
   * `relative`：保留普通流中的原位置，再按偏移移动绘制位置；不会为偏移后的区域重新排版。absolute 会脱离普通流；relative 仍保留原占位。
   */
  relative: unknown;
  /**
   * `absolute`：脱离普通文档流，按包含块定位；包含块通常由定位祖先或 transform 等属性建立。通常在预期的容器上设置 position:relative；元素不为自己保留普通流占位。
   */
  absolute: unknown;
  /**
   * `fixed`：脱离普通流，通常相对视口固定；某些祖先属性会建立不同的包含块。祖先的 transform 等属性可能改变固定定位的包含块；z-index 仍受层叠上下文约束。absolute 通常跟随其包含块滚动；fixed 在以视口为包含块时保持视口位置。
   */
  fixed: unknown;
  /**
   * `sticky`：保留流内位置，在滚动范围内按 inset 约束吸附。对应轴至少一个 inset 须非 auto，并受滚动祖先和包含块限制。对应轴至少一个 inset 必须非 auto；祖先 overflow 可能改变滚动参照。与 fixed 不同，它保留流内占位，并受自身所在包含块的范围约束。
   */
  sticky: unknown;
}

interface StrokeLinecapKeywords {
  /**
   * `butt`：在端点处平直截断描边，不向外延伸。
   */
  butt: unknown;
  /**
   * `round`：使用半圆端帽，向端点外延伸半个描边宽度。
   */
  round: unknown;
  /**
   * `square`：使用方形端帽，向端点外延伸半个描边宽度。
   */
  square: unknown;
}

interface TextAlignKeywords {
  /**
   * `start`：按当前书写方向的行内起始侧对齐。
   */
  start: unknown;
  /**
   * `end`：按当前书写方向的行内结束侧对齐。
   */
  end: unknown;
  /**
   * `center`：将行内内容在行盒中居中，不会让块盒自身居中。
   */
  center: unknown;
  /**
   * `justify`：调整行内间距使文字两端对齐；最后一行通常由 text-align-last 控制。
   */
  justify: unknown;
}

interface TextOverflowKeywords {
  /**
   * `ellipsis`：用省略号提示被裁剪的行内溢出；还需要限制尺寸并配置溢出规则。不会自动限制宽度、禁用换行或实现多行省略。Flex/Grid 子项还可能需要 min-width:0。
   */
  ellipsis: unknown;
  /**
   * `clip`：直接裁剪溢出文本，不添加省略标记。
   */
  clip: unknown;
}

interface TextWrapKeywords {
  /**
   * `wrap`：允许软换行。
   */
  wrap: unknown;
  /**
   * `nowrap`：禁止软换行，但不取消显式强制换行。
   */
  nowrap: unknown;
  /**
   * `balance`：尝试让各行长度更均衡，常用于标题；可处理行数由浏览器决定。
   */
  balance: unknown;
  /**
   * `pretty`：使用偏向排版质量的换行策略，例如减少末行孤立短词。
   */
  pretty: unknown;
  /**
   * `stable`：编辑时尽量不改变较早行的换行位置。
   */
  stable: unknown;
}

interface TouchActionKeywords {
  /**
   * `none`：禁用浏览器在该区域处理的平移和缩放手势，可能影响用户缩放可访问性。
   */
  none: unknown;
  /**
   * `manipulation`：允许平移和连续缩放，通常禁用双击缩放等额外手势。
   */
  manipulation: unknown;
  /**
   * `pan-x`：允许浏览器处理水平单指平移。
   */
  'pan-x': unknown;
  /**
   * `pan-y`：允许浏览器处理垂直单指平移。
   */
  'pan-y': unknown;
}

interface UserSelectKeywords {
  /**
   * `none`：阻止常规文本选取，不是内容保护或访问控制。
   */
  none: unknown;
  /**
   * `text`：允许文本选取。
   */
  text: unknown;
  /**
   * `all`：将元素内容作为整体选取单元。
   */
  all: unknown;
  /**
   * `auto`：由父级与元素上下文决定使用的选取行为。
   */
  auto: unknown;
}

interface VisibilityKeywords {
  /**
   * `visible`：正常显示元素。
   */
  visible: unknown;
  /**
   * `hidden`：隐藏绘制但通常保留布局空间；后代可显式恢复 visible。display:none 不保留布局盒；opacity:0 不会以相同方式移除交互和可访问性。
   */
  hidden: unknown;
  /**
   * `collapse`：对表格行列等特定布局有折叠语义，其他场景通常类似 hidden；应核对具体布局行为。
   */
  collapse: unknown;
}

interface WhiteSpaceKeywords {
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
   * `pre-wrap`：保留空白和源换行，同时允许软换行。pre 不进行普通软换行；pre-line 会折叠连续空格。
   */
  'pre-wrap': unknown;
  /**
   * `pre-line`：折叠空格等空白但保留源换行，同时允许软换行。
   */
  'pre-line': unknown;
}

interface WordBreakKeywords {
  /**
   * `break-all`：允许在更多字符间断行以防溢出，可能拆开普通单词。
   */
  'break-all': unknown;
  /**
   * `keep-all`：限制中日韩文字内部断行，其他文字仍按正常规则处理。
   */
  'keep-all': unknown;
  /**
   * `normal`：按语言的默认断行规则处理。
   */
  normal: unknown;
}
