/**
 * 主题导出为设计令牌：W3C 设计令牌社区组（DTCG 2025.10）格式的 JSON，Figma 的变量面板可以直接导入，一个文件成为一个模式。
 *
 *   const tokens = themeDesignTokens(lightTheme);
 *   downloadFile('light.tokens.json', JSON.stringify(tokens, null, 2), 'application/json');
 *
 * 取值是页面上实际生效的 CSS 变量（含运行时覆盖），按 Figma 能导入的类型换算：
 * - 颜色写 sRGB 分量、透明度与 hex；
 * - 长度一律是 px（Figma 只认 px）：em 按主题的 md 字号（组件的基准字号）、rem 按根元素字号换算，百分比这类没有固定长度的不导出；
 * - 时长是秒（Figma 只认 s）；字重、行高、不透明度、描边宽度是数字；
 * - 字体取字体栈里 Figma 自带的开源字体：Figma 里没有系统字体；
 * - 阴影与缓动按 DTCG 的结构写出，Figma 变量没有这两种类型，导入时跳过。
 * 令牌按 token 组分组：colors/accent、space/md，与代码里的 `_accent`、`_space.md` 一一对应。
 */
import * as css from '@vue-tsx-pro/tsx/styles';
import type { CssVar } from '@vue-tsx-pro/tsx/styles';
import { formatHex } from 'culori/fn';
import { parseColor } from '../utils/data/color';
import { applyStyleAttrs } from '../utils/props';
import { readToken, themeVariables, type Theme } from '../config/theme/theme';
import { t } from '../config/theme/tokens';
import { tokenCatalog } from './token-catalog';

/** 一个设计令牌 */
export interface DesignToken {
  /** DTCG 类型：color、dimension、number、duration、fontFamily、shadow、cubicBezier */
  readonly $type: string;
  /** 取值：结构按类型（颜色是 colorSpace、components、alpha、hex，长度是 value 与 unit） */
  readonly $value: unknown;
  /** 说明，取自 token 目录 */
  readonly $description?: string;
}

/** 设计令牌文件：组名 → token 名 → 令牌 */
export type DesignTokens = Record<string, Record<string, DesignToken>>;

/** 一套主题的取值：组名 → token 名 → CSS 取值 */
export type ThemeValues = Record<string, Record<string, string>>;

/** 长度换算成 px 的基准 */
export interface DesignTokenBases {
  /** 1em 是多少 px：组件的基准字号 */
  em: number;
  /** 1rem 是多少 px：根元素字号 */
  rem: number;
}

/** Figma 自带的开源字体（Google Fonts）：内置主题的每个字体栈里都有其中一个 */
const FIGMA_FONTS = ['Noto Sans SC', 'Noto Serif SC', 'JetBrains Mono'];

const round = (value: number, digits = 3) => Number(value.toFixed(digits));

/** 长度换成 px；没有固定长度（百分比、auto）时返回 undefined */
function toPx(value: string, bases: DesignTokenBases) {
  const match = /^(-?[\d.]+)(px|em|rem)?$/.exec(value.trim());
  if (!match) return undefined;
  const factor = match[2] === 'em' ? bases.em : match[2] === 'rem' ? bases.rem : 1;
  return { value: round(Number(match[1]) * factor), unit: 'px' };
}

function toColor(value: string) {
  const color = parseColor(value);
  if (!color) throw new Error(`无法解析的颜色：${value}`);
  return {
    colorSpace: 'srgb',
    components: [color.r, color.g, color.b].map((channel) => round(channel, 4)),
    alpha: round(color.alpha ?? 1, 4),
    hex: formatHex(color),
  };
}

/** CSS 阴影 → DTCG 的阴影层：`0 1px 2px -1px rgba(…)`，多层用逗号隔开（括号里的逗号不算）；none 不导出 */
function toShadow(value: string, bases: DesignTokenBases) {
  if (value.trim() === 'none') return undefined;
  return value.split(/,(?![^(]*\))/).map((layer) => {
    const parts = layer.trim().split(/\s+(?![^(]*\))/);
    const lengths = parts.filter((part) => toPx(part, bases));
    const color = parts.find((part) => part !== 'inset' && !lengths.includes(part));
    const [offsetX, offsetY, blur = '0', spread = '0'] = lengths.map((part) => toPx(part, bases));
    return {
      color: toColor(color ?? 'black'),
      offsetX,
      offsetY,
      blur,
      spread,
      inset: parts.includes('inset'),
    };
  });
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/** 一个 token 的类型与换算；换算不了（没有对应的固定值）时返回 undefined，不导出 */
type Convert = (value: string, bases: DesignTokenBases) => [string, unknown] | undefined;

const dimension: Convert = (value, bases) => {
  const px = toPx(value, bases);
  return px && ['dimension', px];
};
const number: Convert = (value) => {
  const result = toNumber(value);
  return result === undefined ? undefined : ['number', result];
};

/** 每组的类型；新增 token 组时这里必须补上 */
const CONVERTERS: Record<keyof typeof t, Convert> = {
  colors: (value) => ['color', toColor(value)],
  fonts: (value) => {
    const families = value.split(',').map((family) => family.trim().replace(/^["']|["']$/g, ''));
    return ['fontFamily', families.find((family) => FIGMA_FONTS.includes(family)) ?? families[0]];
  },
  fontSizes: dimension,
  fontWeights: number,
  lineHeights: number,
  letterSpacings: dimension,
  space: dimension,
  sizes: dimension,
  radii: dimension,
  borderWidths: dimension,
  shadows: (value, bases) => {
    const layers = toShadow(value, bases);
    return layers && ['shadow', layers];
  },
  opacities: number,
  strokeWidths: number,
  durations: (value) => {
    const match = /^([\d.]+)(ms|s)$/.exec(value.trim());
    if (!match) return undefined;
    const seconds = Number(match[1]) / (match[2] === 'ms' ? 1000 : 1);
    return ['duration', { value: round(seconds), unit: 's' }];
  },
  easings: (value) => {
    const match = /^cubic-bezier\(([^)]+)\)$/.exec(value.trim());
    return match ? ['cubicBezier', match[1]!.split(',').map(Number)] : undefined;
  },
};

/** 主题的取值换算成设计令牌；说明取自 token 目录，只导出目录里有的 token */
export function designTokens(values: ThemeValues, bases: DesignTokenBases): DesignTokens {
  const result: DesignTokens = {};
  for (const group of tokenCatalog) {
    const convert = CONVERTERS[group.name as keyof typeof t];
    const tokens: Record<string, DesignToken> = {};
    for (const token of group.tokens) {
      const value = values[group.name]?.[token.name];
      const converted = value === undefined ? undefined : convert(value, bases);
      if (!converted) continue;
      tokens[token.name] = {
        $type: converted[0],
        $value: converted[1],
        $description: token.description,
      };
    }
    result[group.name] = tokens;
  }
  return result;
}

/** 元素上实际生效的各组 token 取值（CSS 文本，如 radii.md → '0.4em'）；元素要已挂载 */
export function elementThemeValues(element: Element): ThemeValues {
  const read = (group: string, token: string) => {
    const vars = t[group as keyof typeof t] as unknown as Record<string, CssVar>;
    return readToken(element, vars[token]!);
  };
  return Object.fromEntries(
    tokenCatalog.map((group) => [
      group.name,
      Object.fromEntries(group.tokens.map((token) => [token.name, read(group.name, token.name)])),
    ]),
  );
}

/** 元素上实际生效的主题（所在 Provider 或页面根元素的主题）导出为设计令牌；元素要已挂载 */
export function elementDesignTokens(element: Element): DesignTokens {
  const values = elementThemeValues(element);
  const rem = Number.parseFloat(getComputedStyle(element.ownerDocument.documentElement).fontSize);
  const em = toPx(values.fontSizes!.md!, { em: rem, rem })!.value;
  return designTokens(values, { em, rem });
}

/** 在 container 里挂一个套着这套主题、不显示的空元素，读完就移除 */
function probeTheme<T>(theme: Theme, container: Element, read: (probe: Element) => T): T {
  const probe = document.createElement('div');
  applyStyleAttrs(probe, css.attrs(...theme.styles));
  for (const [name, value] of Object.entries(themeVariables(theme))) {
    probe.style.setProperty(name, value);
  }
  probe.hidden = true;
  container.append(probe);
  try {
    return read(probe);
  } finally {
    probe.remove();
  }
}

/** 一套主题的各组 token 取值（CSS 文本）：主题的取值编译成了样式，要放进页面里量 */
export function themeValues(theme: Theme, container: Element = document.body): ThemeValues {
  return probeTheme(theme, container, elementThemeValues);
}

/** 一套主题的设计令牌 */
export function themeDesignTokens(theme: Theme, container: Element = document.body): DesignTokens {
  return probeTheme(theme, container, elementDesignTokens);
}
