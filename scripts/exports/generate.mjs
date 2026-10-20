/**
 * 生成组件库的入口 packages/ui/src/index.ts：逐个模块读出导出的声明，按目录分组写成 export 语句。
 * 组件库的工具都对外导出（方便使用方定制），模块里写了 export 的就进入口，不再手写。
 *
 * - 跳过测试（.test/）与子路径入口（shiki、vue-router、tokens.stylex、charts/：它们在 package.json 的 exports 里单独暴露）；
 * - 没有导出、只有 declare module 的模块（token-names.ts）写成副作用导入，产物的类型声明才带上它；
 * - 两个模块导出了同一个名字时报错并列出位置：改成全局唯一的名字（COMPONENTS.md §4）；
 * - 新目录要在 GROUPS 里登记标题。
 *
 * 用法：node scripts/exports/generate.mjs [--check]
 *   --check 只比较不写入，生成结果与仓库里的文件不一致时以非零退出（CI 用）
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = join(root, 'packages/ui/src');
const output = join(src, 'index.ts');

/** 子路径入口：不进主入口 */
const SUBPATH_ENTRIES = new Set([
  'config/shiki.ts',
  'config/vue-router.ts',
  'config/theme/tokens.stylex.ts',
]);

/** 自带 index.ts 的子路径目录（如图表依赖可选的 Unovis）：整个目录不进主入口 */
const SUBPATH_DIRS = new Set(['charts']);

/** 目录 → 分组标题，也是入口里各组的顺序 */
const GROUPS = [
  ['base', '基础：文字、图标、链接、按钮家族、标记、代码、加载'],
  ['layout', '布局'],
  ['display', '展示'],
  ['feedback', '反馈：进度、骨架、提示条、通知、空状态、结果'],
  ['overlay', '浮层：对话框、抽屉、弹出层、提示、菜单、引导'],
  ['navigation', '导航'],
  ['input', '输入'],
  ['form', '表单：字段、校验'],
  ['table', '表格'],
  ['config', '配置：Provider、createUi、组件默认值'],
  [
    'config/theme',
    '主题；tokens 从 @vue-tsx-pro/ui/tokens.stylex 导入（StyleX 只认 .stylex 结尾的导入路径）',
  ],
  ['config/lang', '语言与格式化'],
  ['utils', '工具：部件属性的合并'],
  ['utils/style', '工具：档位、字号、色调、过渡等共用样式'],
  ['utils/dom', '工具：焦点、漫游焦点、弹层、定位、拖动、波纹、路由链接、快捷键、剪贴板'],
  ['utils/data', '工具：比较与匹配、选择、分页、文字、数值'],
  ['utils/virtual', '工具：虚拟滚动'],
  ['utils/motion', '工具：JS 动画与动效'],
];

function modules(dir = src) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const skip =
        entry.name === '.test' || SUBPATH_DIRS.has(relative(src, path).split('\\').join('/'));
      return skip ? [] : modules(path);
    }
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [path] : [];
  });
}

const isExported = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

/** 一个模块导出的名字：values 与 types 分开（类型写成 `type X`） */
function exportsOf(file) {
  const text = readFileSync(file, 'utf8');
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const values = [];
  const types = [];
  let declaresModule = false;
  for (const node of source.statements) {
    if (ts.isModuleDeclaration(node)) declaresModule = true;
    if (ts.isExportAssignment(node))
      throw new Error(`${file}：不要用 export default，入口按名字导出`);
    // `export {}` 只是把文件标成模块
    const empty =
      ts.isExportDeclaration(node) &&
      !node.moduleSpecifier &&
      node.exportClause?.elements.length === 0;
    if (ts.isExportDeclaration(node) && !empty)
      throw new Error(`${file}：模块里不要再转出别处的导出，入口直接从原模块导出`);
    if (!isExported(node)) continue;
    if (ts.isVariableStatement(node)) {
      values.push(...node.declarationList.declarations.map((d) => d.name.getText(source)));
    } else if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      types.push(node.name.text);
    } else if (node.name) {
      values.push(node.name.text);
    }
  }
  return { values, types, declaresModule };
}

const byName = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }) || a.localeCompare(b);

function generate() {
  const groups = new Map(GROUPS.map(([dir]) => [dir, []]));
  const owners = new Map();
  for (const file of modules().sort()) {
    const path = relative(src, file).split('\\').join('/');
    if (path === 'index.ts' || SUBPATH_ENTRIES.has(path)) continue;
    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '.';
    if (!groups.has(dir))
      throw new Error(
        `${path}：目录 ${dir} 没有在 scripts/exports/generate.mjs 的 GROUPS 里登记标题`,
      );
    const { values, types, declaresModule } = exportsOf(file);
    for (const name of [...values, ...types]) {
      owners.set(name, [...(owners.get(name) ?? []), path]);
    }
    const specifier = './' + path.replace(/\.tsx?$/, '');
    if (values.length + types.length === 0) {
      if (declaresModule) groups.get(dir).push(`import '${specifier}';`);
      continue;
    }
    const names = [...values.sort(byName), ...types.sort(byName).map((name) => `type ${name}`)];
    groups.get(dir).push(`export { ${names.join(', ')} } from '${specifier}';`);
  }
  const duplicates = [...owners].filter(([, paths]) => paths.length > 1);
  if (duplicates.length) {
    const lines = duplicates.map(([name, paths]) => `  ${name}：${paths.join('、')}`);
    throw new Error(
      `这些名字被多个模块导出，改成全局唯一的名字（COMPONENTS.md §4）：\n${lines.join('\n')}`,
    );
  }
  const body = GROUPS.filter(([dir]) => groups.get(dir).length)
    .map(([dir, title]) => `// ${title}\n${groups.get(dir).join('\n')}`)
    .join('\n\n');
  return `// 由 pnpm exports（scripts/exports/generate.mjs）生成，不要手改：模块里加了导出后重新生成\n\n${body}\n`;
}

const config = await prettier.resolveConfig(output);
const code = await prettier.format(generate(), { ...config, filepath: output });
const check = process.argv.includes('--check');
if (check) {
  if (readFileSync(output, 'utf8') !== code) {
    console.error('packages/ui/src/index.ts 与生成结果不一致：运行 pnpm exports 重新生成');
    process.exitCode = 1;
  }
} else {
  writeFileSync(output, code);
}
