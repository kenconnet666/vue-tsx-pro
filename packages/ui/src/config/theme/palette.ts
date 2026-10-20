/**
 * 主题配色的 Radix 色阶：每个颜色 token 取色阶的哪一级（亮色、暗色各一级），以及按选中的色阶生成颜色覆盖。
 * 内置主题就是按这张表从 indigo（品牌色）与 slate（中性色）取的值（palette.test 核对）；
 * 主题编辑器换品牌色、中性色时也按它整组替换，层级关系（底色、悬停、边框、文字）保持不变。
 *
 *   defineTheme(lightTheme, { colors: paletteColors({ accent: 'crimson', neutral: 'mauve', appearance: 'light' }) })
 */
import {
  amber,
  amberDark,
  blue,
  blueDark,
  bronze,
  bronzeDark,
  brown,
  brownDark,
  crimson,
  crimsonDark,
  cyan,
  cyanDark,
  gold,
  goldDark,
  grass,
  grassDark,
  gray,
  grayDark,
  green,
  greenDark,
  indigo,
  indigoDark,
  iris,
  irisDark,
  jade,
  jadeDark,
  lime,
  limeDark,
  mauve,
  mauveDark,
  mint,
  mintDark,
  olive,
  oliveDark,
  orange,
  orangeDark,
  pink,
  pinkDark,
  plum,
  plumDark,
  purple,
  purpleDark,
  red,
  redDark,
  ruby,
  rubyDark,
  sage,
  sageDark,
  sand,
  sandDark,
  sky,
  skyDark,
  slate,
  slateDark,
  teal,
  tealDark,
  tomato,
  tomatoDark,
  violet,
  violetDark,
  yellow,
  yellowDark,
} from '@radix-ui/colors';
import { readableText, withAlpha } from '../../utils/data/color';

/** 一个 Radix 色阶：12 级，键是 `indigo1`…`indigo12` */
type Scale = Record<string, string>;

/** 可选的品牌色：Radix 的彩色色阶，按色相排列（同 Radix 文档的顺序：红、粉、紫、蓝、青、绿、黄、橙，最后是棕、青铜、金） */
const ACCENT_TABLE = {
  tomato: [tomato, tomatoDark],
  red: [red, redDark],
  ruby: [ruby, rubyDark],
  crimson: [crimson, crimsonDark],
  pink: [pink, pinkDark],
  plum: [plum, plumDark],
  purple: [purple, purpleDark],
  violet: [violet, violetDark],
  iris: [iris, irisDark],
  indigo: [indigo, indigoDark],
  blue: [blue, blueDark],
  sky: [sky, skyDark],
  cyan: [cyan, cyanDark],
  teal: [teal, tealDark],
  jade: [jade, jadeDark],
  mint: [mint, mintDark],
  green: [green, greenDark],
  grass: [grass, grassDark],
  lime: [lime, limeDark],
  yellow: [yellow, yellowDark],
  amber: [amber, amberDark],
  orange: [orange, orangeDark],
  brown: [brown, brownDark],
  bronze: [bronze, bronzeDark],
  gold: [gold, goldDark],
} satisfies Record<string, [Scale, Scale]>;

/** 可选的中性色：Radix 的灰色色阶（各带一点色相，与品牌色搭配：indigo 配 slate、crimson 配 mauve…） */
const NEUTRAL_TABLE = {
  slate: [slate, slateDark],
  gray: [gray, grayDark],
  mauve: [mauve, mauveDark],
  sage: [sage, sageDark],
  olive: [olive, oliveDark],
  sand: [sand, sandDark],
} satisfies Record<string, [Scale, Scale]>;

/** 品牌色色阶的名字 */
export type AccentScale = keyof typeof ACCENT_TABLE;
/** 中性色色阶的名字 */
export type NeutralScale = keyof typeof NEUTRAL_TABLE;

/** 可选的品牌色，按色相排列（主题编辑器按这个顺序列出） */
export const ACCENT_SCALES = Object.keys(ACCENT_TABLE) as AccentScale[];
/** 可选的中性色 */
export const NEUTRAL_SCALES = Object.keys(NEUTRAL_TABLE) as NeutralScale[];

/** 品牌色 token → [亮色取第几级, 暗色取第几级]（Radix 的用途约定：9–10 实色，11 文字，3–4 浅底，7 边框） */
export const ACCENT_STEPS = {
  accent: [9, 9],
  accentHover: [10, 10],
  accentText: [11, 11],
  accentSoft: [3, 3],
  accentSoftHover: [4, 4],
  accentBorder: [7, 7],
  focusRing: [9, 9],
  selection: [5, 5],
  codeKeyword: [11, 11],
  // 图表的第一个系列跟随品牌色
  chart1: [9, 9],
} as const satisfies Record<string, [number, number]>;

/** 中性色 token → [亮色取第几级, 暗色取第几级]（1–2 背景，3–5 填充，6–8 边框，11–12 文字） */
export const NEUTRAL_STEPS = {
  background: [1, 1],
  surface: [1, 2],
  surfaceMuted: [2, 2],
  // 暗色不取第 3 级：那是 fill，滑块轨道、进度条底色、标签放进浮层会看不见；浮层靠描边与阴影分层（同 Radix Themes 的 panel）
  surfaceRaised: [1, 2],
  fill: [3, 3],
  fillHover: [4, 4],
  fillActive: [5, 5],
  text: [12, 12],
  textMuted: [11, 11],
  textPlaceholder: [10, 10],
  textDisabled: [8, 8],
  borderMuted: [6, 6],
  border: [7, 7],
  borderStrong: [8, 8],
  inverseSurface: [12, 12],
  inverseText: [1, 1],
  codeComment: [11, 11],
} as const satisfies Record<string, [number, number]>;

/** 色阶的代表色（第 9 级实色）：主题编辑器里选色阶的色块 */
export function scaleSwatch(
  scale: AccentScale | NeutralScale,
  appearance: 'light' | 'dark',
): string {
  const pair =
    (ACCENT_TABLE as Record<string, [Scale, Scale]>)[scale] ??
    (NEUTRAL_TABLE as Record<string, [Scale, Scale]>)[scale]!;
  return pair[appearance === 'dark' ? 1 : 0][`${scale}9`]!;
}

/** 半透明表面（粘性顶栏）：背景色加 80% 不透明度 */
const TRANSLUCENT_ALPHA = 0.8;

/** paletteColors 的选项 */
export interface PaletteOptions {
  /** 品牌色；不写时不改品牌色 */
  accent?: AccentScale;
  /** 中性色；不写时不改中性色 */
  neutral?: NeutralScale;
  /** 取亮色还是暗色色阶 */
  appearance: 'light' | 'dark';
}

/** 按选中的色阶生成颜色 token 的覆盖，交给 defineTheme 的 colors */
export function paletteColors({
  accent,
  neutral,
  appearance,
}: PaletteOptions): Record<string, string> {
  const variant = appearance === 'dark' ? 1 : 0;
  const pick = (scale: Scale, name: string, steps: Record<string, readonly [number, number]>) =>
    Object.fromEntries(
      Object.entries(steps).map(([token, levels]) => [token, scale[`${name}${levels[variant]}`]!]),
    );
  const colors: Record<string, string> = {};
  if (accent) {
    const scale = ACCENT_TABLE[accent][variant];
    Object.assign(colors, pick(scale, accent, ACCENT_STEPS));
    // 实色按钮上的文字：亮黄、青柠这类浅色实色配深色字，其余配白字
    colors.accentContrast = readableText(colors.accent!);
  }
  if (neutral) {
    const scale = NEUTRAL_TABLE[neutral][variant];
    Object.assign(colors, pick(scale, neutral, NEUTRAL_STEPS));
    colors.surfaceTranslucent = withAlpha(colors.background!, TRANSLUCENT_ALPHA);
  }
  return colors;
}
