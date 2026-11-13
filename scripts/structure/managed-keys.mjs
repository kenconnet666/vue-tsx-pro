/**
 * 受管属性与类型对不对得上（COMPONENTS.md §2.4）：组件写在合并第三层（受管层）的属性会盖过使用方的值，
 * 所以使用方那一层的类型里应该去掉它（`PartProps<'div', 'role' | 'tabindex'>`）；类型还允许写时，
 * 使用方写了不报错、运行时被悄悄丢掉。
 *
 * 查 mergeAttrs / mergePartProps / mergeProps 的三层调用：第三层是对象字面量、第二层是使用方给的属性（rest、propsXxx）时，
 * 第三层的每个键都不该出现在第二层的类型里。不查的键：事件（与使用方的合并）、ref、sx、class、style、
 * aria-describedby（各层拼接）、嵌套的部件属性 propsXxx（递归合并）、data-*（类型里本来就没有）。
 * 已知的缺项记在 managed-keys-baseline.json：出现基线里没有的就报错；基线里的补上了也报，提示用 --write 收紧。
 *
 * 用法：node scripts/structure/managed-keys.mjs [--write]（pnpm -C packages/ui check:managed）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  isAsExpression,
  isCallExpression,
  isIdentifier,
  isNonNullExpression,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAssignment,
  isSatisfiesExpression,
  isShorthandPropertyAssignment,
  isStringLiteral,
} from 'typescript/ast';
import { API, TypeFlags } from 'typescript/sync';
import { root } from '../lib/repo.mjs';

const BASELINE = join(root, 'scripts/structure/managed-keys-baseline.json');
const MERGES = new Set(['mergeAttrs', 'mergePartProps', 'mergeProps']);
const MERGED_KEYS = new Set(['ref', 'sx', 'class', 'style', 'aria-describedby', 'key']);
const skipped = (key) =>
  MERGED_KEYS.has(key) ||
  /^on[A-Z]/.test(key) ||
  /^props[A-Z]/.test(key) ||
  key.startsWith('data-');

const api = new API();
const config = api.parseConfigFile(join(root, 'packages/ui/tsconfig.json'));
const files = config.fileNames.filter(
  (file) => /[\\/]packages[\\/]ui[\\/]src[\\/]/.test(file) && !/[\\/]\.test[\\/]/.test(file),
);
const program = api.createProgram(files, { ...config.options, noEmit: true });
const { checker } = program.getProject();

/** `rest as Partial<X>`、`(props)!`：看里面那个表达式，它才是使用方给的类型 */
function unwrap(node) {
  while (
    isAsExpression(node) ||
    isSatisfiesExpression(node) ||
    isNonNullExpression(node) ||
    isParenthesizedExpression(node)
  )
    node = node.expression;
  return node;
}

const keyOf = (property) => {
  if (!isPropertyAssignment(property) && !isShorthandPropertyAssignment(property)) return undefined;
  const { name } = property;
  return isIdentifier(name) || isStringLiteral(name) ? name.text : undefined;
};

/** 一个类型接受哪些属性名（联合类型取各成员的并集）；按类型缓存 */
const propertyCache = new Map();
function propertiesOf(type) {
  let names = propertyCache.get(type.id);
  if (!names) {
    const members = type.flags & TypeFlags.Union ? type.getTypes() : [type];
    names = new Set(
      members.flatMap((member) =>
        checker.getPropertiesOfType(checker.getApparentType(member)).map((symbol) => symbol.name),
      ),
    );
    propertyCache.set(type.id, names);
  }
  return names;
}

/** 文件 → 位置 → 缺项的键 */
const found = {};
for (const file of files) {
  const source = program.getSourceFile(file);
  const text = source.text;
  const name = relative(root, file).split('\\').join('/');
  const visit = (node) => {
    node.forEachChild(visit);
    if (!isCallExpression(node) || !isIdentifier(node.expression)) return;
    if (!MERGES.has(node.expression.text) || node.arguments.length < 3) return;
    const user = unwrap(node.arguments[1]);
    const managed = unwrap(node.arguments[2]);
    if (!isObjectLiteralExpression(managed)) return;
    // 第二层是字面量、undefined：组件自己拼的一层，不是使用方的类型
    if (isObjectLiteralExpression(user) || (isIdentifier(user) && user.text === 'undefined'))
      return;
    const keys = managed.properties.map(keyOf).filter((key) => key && !skipped(key));
    if (!keys.length) return;
    const allowed = propertiesOf(checker.getNonNullableType(checker.getTypeAtLocation(user)));
    const loose = keys.filter((key) => allowed.has(key));
    if (!loose.length) return;
    // 按“使用方那一层的写法”归并：同一个文件里对同一层的几处调用算一条，行号变了基线不用跟着改
    const layer = text.slice(user.pos, user.end).trim();
    const entry = ((found[name] ??= {})[layer] ??= []);
    for (const key of loose) if (!entry.includes(key)) entry.push(key);
  };
  source.forEachChild(visit);
}
api.close();

// 基线按文件、层、键排好：按码位比较，不跟运行环境的区域设置走
const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
for (const layers of Object.values(found))
  for (const keys of Object.values(layers)) keys.sort(byCode);
const sorted = Object.fromEntries(
  Object.keys(found)
    .sort(byCode)
    .map((file) => [
      file,
      Object.fromEntries(Object.entries(found[file]).sort(([a], [b]) => byCode(a, b))),
    ]),
);

if (process.argv.includes('--write')) {
  writeFileSync(BASELINE, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`managed-keys: 基线已按现状重写（${Object.keys(sorted).length} 个文件）`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const added = [];
const fixed = [];
const flatten = (table) =>
  Object.entries(table).flatMap(([file, layers]) =>
    Object.entries(layers).flatMap(([layer, keys]) =>
      keys.map((key) => `${file} · ${layer} · ${key}`),
    ),
  );
const now = new Set(flatten(sorted));
const before = new Set(flatten(baseline));
for (const item of now) if (!before.has(item)) added.push(item);
for (const item of before) if (!now.has(item)) fixed.push(item);

if (added.length) {
  console.log(
    '受管层写了这些属性，但使用方那一层的类型还允许写（写了会被悄悄盖掉）：\n' +
      '从类型里去掉它（PartProps 的第二个参数、Omit），或者它本该以使用方为准时挪到默认层。\n' +
      added.map((item) => `  ${item}`).join('\n'),
  );
}
if (fixed.length) {
  console.log(
    `基线里的这些已经补上，运行 node scripts/structure/managed-keys.mjs --write 收紧基线：\n${fixed
      .map((item) => `  ${item}`)
      .join('\n')}`,
  );
}
if (added.length || fixed.length) process.exit(1);
console.log(`managed-keys: ok（基线里还有 ${before.size} 处待补）`);
