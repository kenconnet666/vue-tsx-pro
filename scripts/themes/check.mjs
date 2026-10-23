/**
 * 主题颜色的对比度检查（WCAG 2.2 AA）：每套内置主题（从 builtin.ts 读出，亮色即 tokens.stylex.ts 的默认值）逐对检查文字与背景、实色上的文字、提示条、代码高亮、焦点环；并核对防闪烁脚本用的底色（boot.ts）。
 *
 * 用法：node scripts/themes/check.mjs（CI 的静态检查里跑；改颜色前后都跑一遍）
 *
 * 演示页的 axe 检查只覆盖页面上出现过的组合，而且看不到悬停态；这里按 token 的用途把组合列全。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ts from 'typescript/ast';
import { registerHooks } from 'node:module';
import { parseSource, root } from '../lib/repo.mjs';

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

const themeDir = join(root, 'packages/ui/src/config/theme');

/**
 * 从源码里取出一组 token 的取值（默认是颜色）：tokens.stylex.ts 的 `colors = stylex.defineVars({...})`，
 * 或主题文件里 `stylex.createTheme(colors, {...})` 的第二个参数
 */
function readColors(file, group = 'colors') {
  const text = readFileSync(join(themeDir, file), 'utf8');
  const source = parseSource(file, text);
  let object;
  const visit = (node) => {
    if (object || !ts.isCallExpression(node)) return node.forEachChild(visit);
    const callee = node.expression.getText(source);
    const [first, second] = node.arguments;
    if (callee.endsWith('createTheme') && first?.getText(source) === group) object = second;
    else if (
      callee.endsWith('defineVars') &&
      ts.isVariableDeclaration(node.parent) &&
      node.parent.name.getText(source) === group
    ) {
      object = first;
    } else node.forEachChild(visit);
  };
  visit(source);
  if (!object || !ts.isObjectLiteralExpression(object))
    throw new Error(`${file} 里找不到 ${group} 的定义`);
  const values = {};
  for (const property of object.properties) {
    if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) {
      values[property.name.getText(source)] = property.initializer.text;
    }
  }
  return values;
}

/** 内置主题名 → 主题文件：从 builtin.ts 的导入与 builtinThemes 读出来（亮色即 tokens.stylex.ts 的默认值） */
function builtinThemeFiles() {
  const text = readFileSync(join(themeDir, 'builtin.ts'), 'utf8');
  const files = Object.fromEntries(
    [...text.matchAll(/^import \{ (\w+) \} from '\.\/([\w-]+)';$/gm)].map(([, id, file]) => [
      id,
      `${file}.ts`,
    ]),
  );
  const body = text.match(/export const builtinThemes = \{([\s\S]*?)\} as const/)?.[1];
  if (!body) throw new Error('builtin.ts 里找不到 builtinThemes');
  return Object.fromEntries(
    [...body.matchAll(/^\s*'?([\w-]+)'?: (\w+),$/gm)].map(([, name, id]) => {
      if (!files[id]) throw new Error(`builtin.ts 的 ${name}（${id}）找不到对应的导入`);
      return [name, name === 'light' ? 'tokens.stylex.ts' : files[id]];
    }),
  );
}
const themeFiles = builtinThemeFiles();
const light = readColors('tokens.stylex.ts');
const themes = Object.fromEntries(
  Object.entries(themeFiles).map(([name, file]) => [name, { ...light, ...readColors(file) }]),
);

// 要检查的组合与对比度计算都来自组件库：主题编辑器的实时提示用同一套
const { CONTRAST_PAIRS, checkContrast } =
  await import('../../packages/ui/src/theme-customize/contrast.ts');

const failures = [];
for (const [name, theme] of Object.entries(themes)) {
  for (const issue of checkContrast((token) => theme[token])) {
    const { foreground: fg, background: bg, ratio, minimum, label } = issue;
    failures.push(
      `${name}：${label} ${fg}（${theme[fg]}）在 ${bg}（${theme[bg]}）上 ${ratio.toFixed(2)}，要求 ${minimum}`,
    );
  }
}

// light.ts 把默认值再写了一遍（嵌套的 Provider 才能盖过外层主题），要与 tokens.stylex.ts 一致
for (const group of ['colors', 'shadows', 'fonts', 'radii']) {
  const defaults = readColors('tokens.stylex.ts', group);
  const written = readColors('light.ts', group);
  for (const token of new Set([...Object.keys(defaults), ...Object.keys(written)])) {
    if (defaults[token] !== written[token])
      failures.push(
        `light.ts 的 ${group}.${token}（${written[token]}）与 tokens.stylex.ts 的默认值（${defaults[token]}）不一致`,
      );
  }
}

// 防闪烁脚本用的底色、文字色要与主题文件一致（boot.ts 不能依赖 StyleX，只好抄一份）
const { builtinThemeBootColors } = await import('../../packages/ui/src/config/theme/boot.ts');
const bootKeys = Object.keys(builtinThemeBootColors).sort().join();
if (bootKeys !== Object.keys(themes).sort().join())
  failures.push(
    `boot.ts 的主题（${bootKeys}）与内置主题（${Object.keys(themes).sort().join()}）不一致`,
  );
for (const [key, colors] of Object.entries(builtinThemeBootColors)) {
  const theme = themes[key];
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
