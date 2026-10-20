/**
 * 主题定制：几个旋钮（品牌色、中性色、圆角、缩放、字体、动效）换算成 token 覆盖，叠在任意一套主题上。
 * ThemeCustomizer 是它的界面；也可以不要界面，直接用：
 *
 *   const settings = { accent: 'crimson', radius: 'large' };
 *   app.use(createUi({ theme: () => customizeTheme(preference.theme, settings) }));
 *   themeSettingsCode('lightTheme', settings, 'light')   // 生成可以粘贴的 defineTheme(…) 代码
 *
 * 每个旋钮只改相关的一组 token，层级关系不变：换品牌色按 Radix 的级别整组替换（palette.ts），
 * 圆角、字号按默认值等比缩放（token-catalog.ts），动效按倍数缩放时长。
 */
import { paletteColors, type AccentScale, type NeutralScale } from './palette';
import { defineTheme, type Theme, type ThemeOverrides } from './theme';
import { tokenCatalog } from './token-catalog';

/** 圆角档位：默认圆角的倍数 */
export interface RadiusPresets {
  /** 直角 */
  none: unknown;
  /** 小圆角（默认的 0.5 倍） */
  small: unknown;
  /** 默认 */
  medium: unknown;
  /** 大圆角（默认的 1.75 倍） */
  large: unknown;
}

/** 字体搭配 */
export interface FontPresets {
  /** 正文与标题都是无衬线（默认） */
  sans: unknown;
  /** 标题用衬线，正文无衬线：书卷感，长文仍好读 */
  serifHeadings: unknown;
}

/** 动效速度 */
export interface MotionPresets {
  /** 关掉过渡与动画 */
  none: unknown;
  /** 快（默认时长的 0.6 倍） */
  fast: unknown;
  /** 默认 */
  normal: unknown;
  /** 慢（默认时长的 1.5 倍） */
  slow: unknown;
}

/** 主题定制的设置；不写的旋钮沿用主题本来的取值 */
export interface ThemeSettings {
  /** 品牌色（Radix 色阶） */
  accent?: AccentScale;
  /** 中性色（Radix 灰色色阶） */
  neutral?: NeutralScale;
  /** 圆角 */
  radius?: keyof RadiusPresets;
  /** 缩放：字号的倍数，0.9–1.1；间距、控件高度以 em 计，随字号一起缩放 */
  scaling?: number;
  /** 字体搭配 */
  font?: keyof FontPresets;
  /** 动效速度 */
  motion?: keyof MotionPresets;
}

/** customizeTheme 的选项 */
export interface CustomizeOptions {
  /**
   * 用户开启了“减少动态效果”：不覆盖动效时长。运行时覆盖写在行内样式上，
   * 会盖过主题里“减少动态效果时为 0”的媒体查询
   */
  reducedMotion?: boolean;
}

const RADIUS_FACTORS: Record<keyof RadiusPresets, number> = {
  none: 0,
  small: 0.5,
  medium: 1,
  large: 1.75,
};
const MOTION_FACTORS: Record<keyof MotionPresets, number> = {
  none: 0,
  fast: 0.6,
  normal: 1,
  slow: 1.5,
};

/** 某组 token 的默认值 */
function defaults(group: string): Record<string, string> {
  const entry = tokenCatalog.find((item) => item.name === group);
  return Object.fromEntries(entry?.tokens.map((token) => [token.name, token.value]) ?? []);
}

/** `0.4em` × 1.75 → `0.7em`：数值部分乘倍数，单位不变；保留三位小数 */
function scale(value: string, factor: number): string {
  const match = /^(-?[\d.]+)([a-z%]*)$/.exec(value);
  if (!match) return value;
  const scaled = Math.round(Number(match[1]) * factor * 1000) / 1000;
  return `${scaled}${match[2]}`;
}

/** 按倍数缩放一组 token，跳过指定的键（如圆角的 full、none） */
function scaleGroup(group: string, factor: number, skip: readonly string[] = []) {
  return Object.fromEntries(
    Object.entries(defaults(group))
      .filter(([key]) => !skip.includes(key))
      .map(([key, value]) => [key, scale(value, factor)]),
  );
}

/** 设置换算成 token 覆盖；appearance 决定品牌色、中性色取亮色还是暗色色阶 */
export function themeSettingsOverrides(
  settings: ThemeSettings,
  appearance: 'light' | 'dark',
  { reducedMotion = false }: CustomizeOptions = {},
): ThemeOverrides {
  const overrides: ThemeOverrides = {};
  const colors = paletteColors({ accent: settings.accent, neutral: settings.neutral, appearance });
  if (Object.keys(colors).length) overrides.colors = colors;
  if (settings.radius && settings.radius !== 'medium') {
    overrides.radii = scaleGroup('radii', RADIUS_FACTORS[settings.radius], ['none', 'full']);
  }
  if (settings.scaling && settings.scaling !== 1) {
    overrides.fontSizes = scaleGroup('fontSizes', settings.scaling);
  }
  if (settings.font === 'serifHeadings') {
    overrides.fonts = { heading: defaults('fonts').serif! };
  }
  if (settings.motion && settings.motion !== 'normal' && !reducedMotion) {
    overrides.durations = scaleGroup('durations', MOTION_FACTORS[settings.motion], ['none']);
  }
  return overrides;
}

/** 在一套主题上套用设置（名字后加 -custom，便于调试时认出来） */
export function customizeTheme(
  base: Theme,
  settings: ThemeSettings,
  options: CustomizeOptions = {},
): Theme {
  const overrides = themeSettingsOverrides(settings, base.colorScheme, options);
  if (!Object.keys(overrides).length) return base;
  return defineTheme(base, overrides, { name: `${base.name}-custom` });
}

/**
 * 生成套用这些设置的代码：`defineTheme(lightTheme, { … })`，可以直接粘贴到项目里。
 * baseName 是代码里基础主题的变量名；导出的取值不受“减少动态效果”影响
 */
export function themeSettingsCode(
  baseName: string,
  settings: ThemeSettings,
  appearance: 'light' | 'dark',
): string {
  const body = toCode(themeSettingsOverrides(settings, appearance), '');
  return `import { defineTheme, ${baseName} } from '@vue-tsx-pro/ui';\n\nexport const myTheme = defineTheme(${baseName}, ${body});\n`;
}

/** 对象写成代码：键不加引号（都是合法标识符），字符串用单引号（字体名里的双引号原样保留） */
function toCode(value: unknown, indent: string): string {
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return '{}';
  const inner = `${indent}  `;
  const lines = entries.map(([key, item]) => `${inner}${key}: ${toCode(item, inner)},`);
  return `{\n${lines.join('\n')}\n${indent}}`;
}
