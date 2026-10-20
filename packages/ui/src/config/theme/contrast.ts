/**
 * 主题颜色要满足的对比度（WCAG 2.2 AA）：哪些文字放在哪些底色上、各要多少。
 * pnpm themes:check 按它检查内置的三套主题；主题编辑器按它实时提示改出来的配色。
 */
import { CONTRAST_AA, contrastRatio } from '../../utils/data/color';

/** 文字 4.5:1；大字、图形与界面部件（焦点环、选中的勾选框）3:1；占位文字按 3:1（同多数组件库） */
const TEXT = CONTRAST_AA.text;
const UI = CONTRAST_AA.ui;

/** 要检查的一对颜色 token：[前景, 背景, 最低对比度, 说明] */
export type ContrastPair = readonly [
  foreground: string,
  background: string,
  minimum: number,
  label: string,
];

/** 要检查的颜色组合 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  ...[
    'background',
    'surface',
    'surfaceMuted',
    'surfaceRaised',
    'fill',
    'fillHover',
    'fillActive',
  ].map((bg): ContrastPair => ['text', bg, TEXT, '正文']),
  ...['background', 'surface', 'surfaceMuted', 'surfaceRaised', 'fill'].map((bg): ContrastPair => [
    'textMuted',
    bg,
    TEXT,
    '次要文字',
  ]),
  ['textPlaceholder', 'surface', UI, '占位文字'],
  ['accentContrast', 'accent', TEXT, '主按钮'],
  ['accentContrast', 'accentHover', TEXT, '主按钮悬停'],
  ...['background', 'surface', 'surfaceRaised', 'accentSoft', 'accentSoftHover'].map(
    (bg): ContrastPair => ['accentText', bg, TEXT, '链接、选中项'],
  ),
  ['dangerContrast', 'danger', TEXT, '危险按钮'],
  ['dangerContrast', 'dangerHover', TEXT, '危险按钮悬停'],
  ...['background', 'surface', 'dangerSoft', 'dangerSoftHover'].map((bg): ContrastPair => [
    'dangerText',
    bg,
    TEXT,
    '错误文字',
  ]),
  ...[
    ['successText', 'successSoft'],
    ['warningText', 'warningSoft'],
    ['infoText', 'infoSoft'],
  ].flatMap(([fg, soft]): ContrastPair[] => [
    [fg, soft, TEXT, '提示条'],
    [fg, 'background', TEXT, '提示文字'],
    [fg, 'surface', TEXT, '提示文字'],
  ]),
  ['inverseText', 'inverseSurface', TEXT, '反色表面'],
  ...[
    'codeKeyword',
    'codeString',
    'codeNumber',
    'codeFunction',
    'codeType',
    'codeComment',
    'codeTag',
    'codeAttribute',
  ].map((fg): ContrastPair => [fg, 'surfaceMuted', TEXT, '代码高亮']),
  ['text', 'codeInserted', TEXT, 'diff 新增行'],
  ['text', 'codeDeleted', TEXT, 'diff 删除行'],
  ['text', 'selection', TEXT, '选中的文字'],
  ['text', 'highlight', TEXT, '高亮标记'],
  ['focusRing', 'background', UI, '焦点环'],
  ['focusRing', 'surface', UI, '焦点环'],
  // 选中的勾选框、开关、滑块与进度条的实底色（tone-styles.ts 的 toneFillStyles、Progress）：在表面与轨道上
  ...['accent', 'inverseSurface', 'infoText', 'successText', 'warningText', 'dangerText'].flatMap(
    (fg): ContrastPair[] => [
      [fg, 'surface', UI, '选中的勾选框、开关'],
      [fg, 'fill', UI, '滑块、进度条'],
    ],
  ),
  ...Array.from({ length: 8 }, (_, index) => `chart${index + 1}`).flatMap((fg): ContrastPair[] => [
    [fg, 'background', UI, '图表系列'],
    [fg, 'surface', UI, '图表系列'],
  ]),
];

/** 一处对比度不够的组合 */
export interface ContrastIssue {
  /** 前景 token */
  foreground: string;
  /** 背景 token */
  background: string;
  /** 实际对比度 */
  ratio: number;
  /** 要求的最低对比度 */
  minimum: number;
  /** 用途说明 */
  label: string;
}

/**
 * 按 CONTRAST_PAIRS 检查一套配色；read 读出 token 的取值（主题文件里的字面量，或页面上算出来的 CSS 变量）。
 * 半透明的背景叠在 background（页面背景）上算
 */
export function checkContrast(read: (token: string) => string): ContrastIssue[] {
  const page = read('background');
  return CONTRAST_PAIRS.flatMap(([foreground, background, minimum, label]) => {
    const ratio = contrastRatio(read(foreground), read(background), page);
    return ratio < minimum ? [{ foreground, background, ratio, minimum, label }] : [];
  });
}
