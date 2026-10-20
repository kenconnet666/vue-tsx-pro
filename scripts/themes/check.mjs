/**
 * 主题颜色的对比度检查（WCAG 2.2 AA）：亮色（tokens.stylex.ts 的默认值）、暗色（dark.ts）、纸张（paper.ts）
 * 三套主题逐对检查文字与背景、实色上的文字、提示条、代码高亮、焦点环。
 *
 * 用法：node scripts/themes/check.mjs（CI 的静态检查里跑；改颜色前后都跑一遍）
 *
 * 演示页的 axe 检查只覆盖页面上出现过的组合，而且看不到悬停态；这里按 token 的用途把组合列全。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const themeDir = join(root, 'packages/ui/src/config/theme');

/** 文字 4.5:1；大字、图形与界面部件（焦点环、选中的勾选框）3:1；占位文字按 3:1（同多数组件库） */
const TEXT = 4.5;
const UI = 3;

/** [前景, 背景, 最低对比度, 说明] */
const PAIRS = [
  ...[
    'background',
    'surface',
    'surfaceMuted',
    'surfaceRaised',
    'fill',
    'fillHover',
    'fillActive',
  ].map((bg) => ['text', bg, TEXT, '正文']),
  ...['background', 'surface', 'surfaceMuted', 'surfaceRaised', 'fill'].map((bg) => [
    'textMuted',
    bg,
    TEXT,
    '次要文字',
  ]),
  ['textPlaceholder', 'surface', UI, '占位文字'],
  ['accentContrast', 'accent', TEXT, '主按钮'],
  ['accentContrast', 'accentHover', TEXT, '主按钮悬停'],
  ...['background', 'surface', 'surfaceRaised', 'accentSoft', 'accentSoftHover'].map((bg) => [
    'accentText',
    bg,
    TEXT,
    '链接、选中项',
  ]),
  ['dangerContrast', 'danger', TEXT, '危险按钮'],
  ['dangerContrast', 'dangerHover', TEXT, '危险按钮悬停'],
  ...['background', 'surface', 'dangerSoft', 'dangerSoftHover'].map((bg) => [
    'dangerText',
    bg,
    TEXT,
    '错误文字',
  ]),
  ...[
    ['successText', 'successSoft'],
    ['warningText', 'warningSoft'],
    ['infoText', 'infoSoft'],
  ].flatMap(([fg, soft]) => [
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
  ].map((fg) => [fg, 'surfaceMuted', TEXT, '代码高亮']),
  ['text', 'codeInserted', TEXT, 'diff 新增行'],
  ['text', 'codeDeleted', TEXT, 'diff 删除行'],
  ['text', 'selection', TEXT, '选中的文字'],
  ['text', 'highlight', TEXT, '高亮标记'],
  ['focusRing', 'background', UI, '焦点环'],
  ['focusRing', 'surface', UI, '焦点环'],
  ['accent', 'surface', UI, '选中的勾选框、开关'],
];

/**
 * 从源码里取出颜色：tokens.stylex.ts 的 `colors = stylex.defineVars({...})`，
 * 或主题文件里 `stylex.createTheme(colors, {...})` 的第二个参数
 */
function readColors(file) {
  const text = readFileSync(join(themeDir, file), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  let object;
  const visit = (node) => {
    if (object || !ts.isCallExpression(node)) return ts.forEachChild(node, visit);
    const callee = node.expression.getText(source);
    const [first, second] = node.arguments;
    if (callee.endsWith('createTheme') && first?.getText(source) === 'colors') object = second;
    else if (
      callee.endsWith('defineVars') &&
      ts.isVariableDeclaration(node.parent) &&
      node.parent.name.getText(source) === 'colors'
    ) {
      object = first;
    } else ts.forEachChild(node, visit);
  };
  visit(source);
  if (!object || !ts.isObjectLiteralExpression(object)) throw new Error(`${file} 里找不到颜色定义`);
  const values = {};
  for (const property of object.properties) {
    if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) {
      values[property.name.getText(source)] = property.initializer.text;
    }
  }
  return values;
}

const light = readColors('tokens.stylex.ts');
const themes = {
  亮色: light,
  暗色: { ...light, ...readColors('dark.ts') },
  纸张: { ...light, ...readColors('paper.ts') },
};

/** 颜色 → [r, g, b, a]，支持 #rgb、#rrggbb、#rrggbbaa、rgb()、rgba() */
function parse(color) {
  const hex = /^#([\da-f]{3,8})$/i.exec(color)?.[1];
  if (hex) {
    const full =
      hex.length <= 4
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    const [r, g, b, a = 255] = full.match(/../g).map((h) => parseInt(h, 16));
    return [r, g, b, a / 255];
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(color)?.[1];
  if (rgb) {
    const [r, g, b, a = 1] = rgb.split(',').map((part) => Number(part.trim()));
    return [r, g, b, a];
  }
  throw new Error(`无法解析的颜色：${color}`);
}

/** 半透明的前景先与背景合成 */
const over = ([r, g, b, a], [br, bgG, bb]) => [
  r * a + br * (1 - a),
  g * a + bgG * (1 - a),
  b * a + bb * (1 - a),
  1,
];

const luminance = ([r, g, b]) => {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

function contrast(foreground, background, page) {
  const bg = over(parse(background), parse(page));
  const fg = over(parse(foreground), bg);
  const [high, low] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

const failures = [];
for (const [name, theme] of Object.entries(themes)) {
  for (const [fg, bg, min, label] of PAIRS) {
    const ratio = contrast(theme[fg], theme[bg], theme.background);
    if (ratio < min) {
      failures.push(
        `${name}：${label} ${fg}（${theme[fg]}）在 ${bg}（${theme[bg]}）上 ${ratio.toFixed(2)}，要求 ${min}`,
      );
    }
  }
}

if (failures.length) {
  console.error(`主题对比度不达标（${failures.length} 处）：\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`主题对比度检查通过：${Object.keys(themes).length} 套主题 × ${PAIRS.length} 组`);
