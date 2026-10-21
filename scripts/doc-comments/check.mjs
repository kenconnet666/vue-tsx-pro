/**
 * 注释检查：导出的声明（组件、函数、类型、常量、类）与导出接口、类型字面量、类的成员都要有 JSDoc，
 * 补全列表与悬停才看得到说明（COMPONENTS.md §1 的注释约定）。文件开头的说明不会挂到导出上，所以单独检查。
 *
 * 用法：pnpm docs:check。生成的文件、测试与只在类型里出现的 children 不检查。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { parseSource, root } from '../lib/repo.mjs';

/** 检查范围：已发布的两个包 */
const INCLUDE = [
  'packages/tsx/src/**/*.ts',
  'packages/tsx/types/*.d.ts',
  'packages/ui/src/**/*.ts',
  'packages/ui/src/**/*.tsx',
];
/** 生成的文件（注释由生成器负责）与测试 */
const EXCLUDE = [/\/\.test\//, /\/test\//, /stylex\/styles\.ts$/, /token-names\.ts$/];

const files = execFileSync('git', ['ls-files', ...INCLUDE], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((file) => file && !EXCLUDE.some((pattern) => pattern.test(file)));

const isExported = (node) =>
  node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
const isPrivate = (node) =>
  node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword) ?? false;
const hasDoc = (node) => ts.getJSDocCommentsAndTags(node).length > 0;
const isAugmentation = (node) =>
  ts.isModuleBlock(node.parent) && ts.isStringLiteral(node.parent.parent.name);

const problems = [];
for (const file of files) {
  const source = parseSource(file, readFileSync(join(root, file), 'utf8'));
  const report = (node, label) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    problems.push(`${file}:${line + 1}  ${label}`);
  };
  const checkMembers = (owner, members) => {
    for (const member of members) {
      if (!member.name || ts.isConstructorDeclaration(member) || isPrivate(member)) continue;
      if (member.name.kind === ts.SyntaxKind.PrivateIdentifier) continue;
      const name = member.name.getText(source);
      if (name !== 'children' && !hasDoc(member)) report(member, `${owner}.${name}`);
    }
  };
  const visit = (node) => {
    if (ts.isModuleDeclaration(node) || ts.isModuleBlock(node)) {
      ts.forEachChild(node, visit);
      return;
    }
    const exported = isExported(node) || ts.isModuleBlock(node.parent);
    if (!exported) return;
    if (ts.isInterfaceDeclaration(node)) {
      // declare module 'vue' 里的接口是给已有接口补成员，接口本身的注释在原处
      if (!hasDoc(node) && !isAugmentation(node)) report(node, `interface ${node.name.text}`);
      checkMembers(node.name.text, node.members);
    } else if (ts.isTypeAliasDeclaration(node)) {
      if (!hasDoc(node)) report(node, `type ${node.name.text}`);
      if (ts.isTypeLiteralNode(node.type)) checkMembers(node.name.text, node.type.members);
    } else if (ts.isClassDeclaration(node) && node.name) {
      if (!hasDoc(node)) report(node, `class ${node.name.text}`);
      checkMembers(node.name.text, node.members);
    } else if (ts.isFunctionDeclaration(node) && node.name && node.body == null) {
      // 重载签名（含 declare 的函数）各自要有注释：悬停显示的是匹配到的那个签名
      if (!hasDoc(node)) report(node, `function ${node.name.text}（重载）`);
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      // 有重载时实现签名不显示在悬停里，不要求注释
      const overloaded = node.parent.statements?.some(
        (other) =>
          other !== node && ts.isFunctionDeclaration(other) && other.name?.text === node.name.text,
      );
      if (!overloaded && !hasDoc(node)) report(node, `function ${node.name.text}`);
    } else if (ts.isVariableStatement(node) && !hasDoc(node)) {
      for (const declaration of node.declarationList.declarations) {
        report(declaration, `const ${declaration.name.getText(source)}`);
      }
    }
  };
  ts.forEachChild(source, visit);
}

if (problems.length) {
  console.error(`以下导出缺少 JSDoc 注释（${problems.length} 处）：\n${problems.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`注释检查通过：${files.length} 个文件`);
}
