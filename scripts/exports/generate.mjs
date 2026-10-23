/**
 * 生成组件库的入口：主入口 packages/ui/src/index.ts 与带目录的子路径的 index.ts（charts/、three/、docs-kit/…）。
 * 逐个模块读出导出的声明写成 export 语句；组件库的工具都对外导出（方便使用方定制），模块里写了 export 的就进入口，不再手写。
 *
 * - 有哪些入口以 packages/ui/package.json 的 exports 为准（唯一的登记处）：
 *   - `<目录>/index.ts` 的子路径收这个目录里的全部模块：文件开头的说明保留，export 语句重新生成；
 *   - 单个文件的子路径（shiki、vue-router、tokens.stylex、vars.stylex）就是模块本身，不进主入口（ALSO_IN_MAIN 除外）；
 *   - 主入口收其余模块，按目录分组，新目录要在 GROUPS 里登记标题；
 * - 跳过测试（.test/）；没有导出、只有 declare module 的模块（token-names.ts）写成副作用导入，产物的类型声明才带上它；
 * - 两个模块导出了同一个名字时报错并列出位置（所有入口一起算）：改成全局唯一的名字（COMPONENTS.md §4）。
 *
 * 用法：node scripts/exports/generate.mjs [--check]
 *   --check 只比较不写入，生成结果与仓库里的文件不一致时以非零退出（CI 用）
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import prettier from 'prettier';
import ts from 'typescript';
import { parseSource, root, uiEntries } from '../lib/repo.mjs';

const src = join(root, 'packages/ui/src');

/** 单个文件的子路径里，导出同时也进主入口的：theme-boot 另设子路径只是为了在 Node 里不经 StyleX 也能导入 */
const ALSO_IN_MAIN = new Set(['config/theme/boot.ts']);

/** 主入口的目录 → 分组标题，也是入口里各组的顺序 */
const GROUPS = [
  ['base', '基础：文字、图标、链接、按钮家族、标记、代码、加载'],
  ['layout', '布局'],
  ['display', '展示'],
  ['feedback', '反馈：进度、骨架、提示条、通知、空状态、结果'],
  ['overlay', '浮层：对话框、抽屉、弹出层、提示、菜单、引导'],
  ['navigation', '导航'],
  ['input', '输入'],
  ['date', '日期：日历、分段输入、日期与时间选择'],
  ['form', '表单：字段、校验'],
  ['table', '表格'],
  ['workflow', '流程：流程定义与校验、运行时的数据（流程的执行在后端引擎）'],
  [
    'effects',
    '效果：倾斜卡片、聚光卡片、流光边框（3D 与 WebGL 效果在子路径 @vue-tsx-pro/ui/three）',
  ],
  ['config', '配置：Provider、createUi、组件默认值'],
  [
    'config/theme',
    '主题；tokens 从 @vue-tsx-pro/ui/tokens.stylex 导入（StyleX 只认 .stylex 结尾的导入路径）',
  ],
  ['config/lang', '语言与格式化'],
  ['utils', '工具：部件属性的合并'],
  ['utils/style', '工具：档位、字号、色调、过渡等共用样式'],
  ['utils/dom', '工具：焦点、漫游焦点、弹层、定位、拖动、波纹、路由链接、快捷键、剪贴板'],
  ['utils/data', '工具：比较与匹配、相等、选择、分页、文字、数值、日期'],
  ['utils/virtual', '工具：虚拟滚动'],
  ['utils/request', '工具：请求（HttpClient、createHttpClient、useRequest）'],
  ['utils/motion', '工具：JS 动画与动效'],
];

const entries = uiEntries().filter((entry) => entry.source !== 'index.ts');
/** 带目录的子路径：charts、three… */
const subpathDirs = entries
  .filter((entry) => entry.source.endsWith('/index.ts'))
  .map((entry) => entry.source.slice(0, -'/index.ts'.length));
/** 单个文件的子路径：不进主入口 */
const subpathFiles = new Set(
  entries
    .map((entry) => entry.source)
    .filter((source) => !source.endsWith('/index.ts') && !ALSO_IN_MAIN.has(source)),
);

const toPath = (file) => relative(src, file).split('\\').join('/');

/** dir 下的模块（不含测试、入口文件与 skip 里的目录） */
function modules(dir, skip = new Set()) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name === '.test' || skip.has(toPath(path)) ? [] : modules(path, skip);
    const isModule = /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts');
    return isModule && entry.name !== 'index.ts' ? [path] : [];
  });
}

const isExported = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

/** 一个模块导出的名字：values 与 types 分开（类型写成 `type X`） */
function exportsOf(file) {
  const text = readFileSync(file, 'utf8');
  const source = parseSource(file, text);
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
  // 函数重载是同一个名字的几条声明：只算一次
  return { values: [...new Set(values)], types, declaresModule };
}

const byName = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }) || a.localeCompare(b);

/** 名字 → 导出它的模块：所有入口一起算，查重名 */
const owners = new Map();

/** 一个模块在入口里的那一行（入口在 entryDir 下）；没有导出时为 undefined */
function exportLine(file, entryDir) {
  const { values, types, declaresModule } = exportsOf(file);
  for (const name of [...values, ...types]) {
    owners.set(name, [...(owners.get(name) ?? []), toPath(file)]);
  }
  const specifier =
    './' +
    relative(entryDir, file)
      .split('\\')
      .join('/')
      .replace(/\.tsx?$/, '');
  if (values.length + types.length === 0) {
    return declaresModule ? `import '${specifier}';` : undefined;
  }
  const names = [...values.sort(byName), ...types.sort(byName).map((name) => `type ${name}`)];
  return `export { ${names.join(', ')} } from '${specifier}';`;
}

function mainEntry() {
  const groups = new Map(GROUPS.map(([dir]) => [dir, []]));
  const skip = new Set(subpathDirs);
  for (const file of modules(src, skip).sort()) {
    const path = toPath(file);
    if (subpathFiles.has(path)) continue;
    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '.';
    if (!groups.has(dir))
      throw new Error(
        `${path}：目录 ${dir} 没有在 scripts/exports/generate.mjs 的 GROUPS 里登记标题`,
      );
    const line = exportLine(file, src);
    if (line) groups.get(dir).push(line);
  }
  const body = GROUPS.filter(([dir]) => groups.get(dir).length)
    .map(([dir, title]) => `// ${title}\n${groups.get(dir).join('\n')}`)
    .join('\n\n');
  return `// 由 pnpm exports（scripts/exports/generate.mjs）生成，不要手改：模块里加了导出后重新生成\n\n${body}\n`;
}

/** 子路径目录的入口：保留文件开头的说明（写明子路径名、怎么导入、为什么不在主入口），export 语句重新生成 */
function subpathEntry(dir) {
  const output = join(src, dir, 'index.ts');
  const header = readFileSync(output, 'utf8').match(/^\/\*\*[\s\S]*?\*\/\n/)?.[0];
  if (!header)
    throw new Error(`${dir}/index.ts：子路径的入口要以说明注释开头（子路径名、怎么导入）`);
  const lines = modules(join(src, dir))
    .sort()
    .map((file) => exportLine(file, dirname(output)))
    .filter(Boolean);
  return `${header}${lines.join('\n')}\n`;
}

const outputs = [
  [join(src, 'index.ts'), mainEntry()],
  ...subpathDirs.map((dir) => [join(src, dir, 'index.ts'), subpathEntry(dir)]),
];

const duplicates = [...owners].filter(([, paths]) => paths.length > 1);
if (duplicates.length) {
  const lines = duplicates.map(([name, paths]) => `  ${name}：${paths.join('、')}`);
  throw new Error(
    `这些名字被多个模块导出，改成全局唯一的名字（COMPONENTS.md §4）：\n${lines.join('\n')}`,
  );
}

const check = process.argv.includes('--check');
for (const [output, generated] of outputs) {
  const config = await prettier.resolveConfig(output);
  const code = await prettier.format(generated, { ...config, filepath: output });
  if (!check) {
    writeFileSync(output, code);
  } else if (readFileSync(output, 'utf8') !== code) {
    console.error(`${toPath(output)} 与生成结果不一致：运行 pnpm exports 重新生成`);
    process.exitCode = 1;
  }
}
