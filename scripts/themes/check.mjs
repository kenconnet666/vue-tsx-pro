/**
 * 主题颜色的对比度检查（WCAG 2.2 AA）：亮色（tokens.stylex.ts 的默认值）、暗色（dark.ts）、纸张（paper.ts）
 * 三套主题逐对检查文字与背景、实色上的文字、提示条、代码高亮、焦点环；并核对防闪烁脚本用的底色（boot.ts）。
 *
 * 用法：node scripts/themes/check.mjs（CI 的静态检查里跑；改颜色前后都跑一遍）
 *
 * 演示页的 axe 检查只覆盖页面上出现过的组合，而且看不到悬停态；这里按 token 的用途把组合列全。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { registerHooks } from 'node:module';

// 组件库源码的相对导入不写扩展名（由打包工具补全）：Node 直接加载时补上 .ts
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.') || /\.\w+$/.test(specifier)) throw error;
      return next(`${specifier}.ts`, context);
    }
  },
});

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const themeDir = join(root, 'packages/ui/src/config/theme');

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

// 要检查的组合与对比度计算都来自组件库：主题编辑器的实时提示用同一套
const { CONTRAST_PAIRS, checkContrast } =
  await import('../../packages/ui/src/config/theme/contrast.ts');

const failures = [];
for (const [name, theme] of Object.entries(themes)) {
  for (const issue of checkContrast((token) => theme[token])) {
    const { foreground: fg, background: bg, ratio, minimum, label } = issue;
    failures.push(
      `${name}：${label} ${fg}（${theme[fg]}）在 ${bg}（${theme[bg]}）上 ${ratio.toFixed(2)}，要求 ${minimum}`,
    );
  }
}

// 防闪烁脚本用的底色、文字色要与主题文件一致（boot.ts 不能依赖 StyleX，只好抄一份）
const { builtinThemeBootColors } = await import('../../packages/ui/src/config/theme/boot.ts');
const bootNames = { light: '亮色', dark: '暗色', paper: '纸张' };
for (const [key, colors] of Object.entries(builtinThemeBootColors)) {
  const theme = themes[bootNames[key]];
  for (const token of ['background', 'text']) {
    if (colors[token] !== theme[token])
      failures.push(
        `boot.ts 的 ${key}.${token}（${colors[token]}）与主题文件（${theme[token]}）不一致`,
      );
  }
}

if (failures.length) {
  console.error(`主题对比度不达标（${failures.length} 处）：\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(
  `主题对比度检查通过：${Object.keys(themes).length} 套主题 × ${CONTRAST_PAIRS.length} 组`,
);
