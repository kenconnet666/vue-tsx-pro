/**
 * 颜色工具（culori）：解析、格式化、半透明颜色的叠加、WCAG 对比度、按对比度挑文字色。
 * 主题编辑器的实时对比度提示与 pnpm themes:check 用的是同一套计算。
 *
 *   contrastRatio('#3e63dd', '#ffffff')            → 4.6
 *   contrastRatio('rgba(0,0,0,0.5)', '#fff')       半透明前景先叠到背景上再算
 *   readableText('#ffc53d')                        → 深色文字（亮黄底上白字达不到 4.5:1）
 */
import {
  converter,
  formatHex,
  formatHex8,
  formatRgb,
  modeLrgb,
  modeRgb,
  parse,
  useMode,
  wcagLuminance,
  type Rgb,
} from 'culori/fn';

// culori/fn 按需注册颜色空间：sRGB（解析 #hex、rgb()、颜色名）与线性 RGB（算相对亮度）
useMode(modeRgb);
useMode(modeLrgb);
const toRgb = converter('rgb');

/** WCAG 2.2 AA 的对比度要求 */
export const CONTRAST_AA = {
  /** 正文文字 */
  text: 4.5,
  /** 大字、图形与界面部件（焦点环、勾选框边框） */
  ui: 3,
} as const;

/** 解析 CSS 颜色（#hex、rgb() / rgba()、颜色名）；解析不了时返回 undefined */
export function parseColor(value: string): Rgb | undefined {
  const color = parse(value.trim());
  return color && toRgb(color);
}

/** 格式化成 #rrggbb；有透明度时是 #rrggbbaa。解析不了时返回 undefined */
export function toHex(value: string): string | undefined {
  const color = parseColor(value);
  if (!color) return undefined;
  return (color.alpha ?? 1) < 1 ? formatHex8(color) : formatHex(color);
}

/** 半透明的前景叠到不透明的背景上，得到人眼看到的颜色 */
function over(foreground: Rgb, background: Rgb): Rgb {
  const alpha = foreground.alpha ?? 1;
  return {
    mode: 'rgb',
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
  };
}

/**
 * 前景与背景的 WCAG 对比度（1–21）。半透明的颜色按实际看到的算：背景先叠到页面底色（page）上，
 * 前景再叠到背景上。颜色解析不了时抛错
 */
export function contrastRatio(foreground: string, background: string, page = '#ffffff'): number {
  const [fg, bg, base] = [foreground, background, page].map((value) => {
    const color = parseColor(value);
    if (!color) throw new Error(`无法解析的颜色：${value}`);
    return color;
  }) as [Rgb, Rgb, Rgb];
  const solidBackground = over(bg, { ...base, alpha: 1 });
  const solidForeground = over(fg, solidBackground);
  const [high, low] = [wcagLuminance(solidForeground), wcagLuminance(solidBackground)].sort(
    (a, b) => b - a,
  ) as [number, number];
  return (high + 0.05) / (low + 0.05);
}

/**
 * 实色背景上的文字色（实色按钮上用白字还是深色字）：按候选的顺序，第一个达到正文对比度（4.5:1）的就用它；
 * 都达不到时取对比度最高的
 */
export function readableText(
  background: string,
  candidates: readonly string[] = ['#ffffff', '#1c2024'],
): string {
  let best = candidates[0]!;
  let bestRatio = 0;
  for (const candidate of candidates) {
    const ratio = contrastRatio(candidate, background);
    if (ratio >= CONTRAST_AA.text) return candidate;
    if (ratio > bestRatio) [best, bestRatio] = [candidate, ratio];
  }
  return best;
}

/** 同一个颜色换成给定的不透明度（0–1），输出 rgba()；解析不了时抛错 */
export function withAlpha(value: string, alpha: number): string {
  const color = parseColor(value);
  if (!color) throw new Error(`无法解析的颜色：${value}`);
  return formatRgb({ ...color, alpha });
}
