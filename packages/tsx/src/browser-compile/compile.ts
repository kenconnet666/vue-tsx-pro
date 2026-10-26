/**
 * 在浏览器里编译一个 TSX 模块（Worker 里跑，见 worker.ts；Node 里也能直接调，测试就是这样）。
 *
 * 与 Vite 预设是同一个编译函数（../compiler 的 compile）：动态样式的响应式绑定、符文、Vue JSX、去掉类型；
 * 最后多做一步——把 import 改成从模块表取、export 改成交给导出对象，编译结果可以用 evaluateModule 直接执行：
 *
 *   import { ref } from 'vue'            →  const { ref } = __modules['vue']（按名字逐个取）
 *   export default X                     →  __exports.default = X
 *   export const fields = …              →  const fields = …; __exports.fields = fields
 *
 * 浏览器里跑 Babel 要几个 Node 模块的替身（fs、assert、path、process）：用 Vite 时加上 browserCompile() 插件（../vite）。
 */
import { types as t, type NodePath, type PluginObject, type PluginItem } from '@babel/core';
import { compile } from '../compiler/index.ts';

/** compileModule 的选项 */
export interface CompileModuleOptions {
  /** 报错时代码帧里显示的文件名，默认 Module.tsx */
  filename?: string;
  /** 再加的 Babel 插件：在符文、样式绑定之后、改写导入导出之前执行 */
  plugins?: PluginItem[];
}

/** 编译一个模块，返回能交给 evaluateModule 执行的代码；语法或写法错误时抛出带代码帧的错误 */
export async function compileModule(
  source: string,
  options: CompileModuleOptions = {},
): Promise<string> {
  const result = await compile(source, {
    filename: options.filename ?? 'Module.tsx',
    // JSX 里的动态样式调用改成响应式绑定（同 Vite 预设）
    styleBindings: true,
    // 值的导入都留着：importsFromTable 把它们换成从模块表取
    typescript: { onlyRemoveTypeImports: true },
    plugins: [...(options.plugins ?? []), importsFromTable],
    sourceMaps: false,
  });
  return result?.code ?? '';
}

/** 导入导出改成读写 __modules、__exports（Program 退出时做，此时别的插件都已处理完） */
function importsFromTable(): PluginObject {
  return {
    name: 'vue-tsx-pro:imports-from-table',
    visitor: {
      Program: {
        exit(program) {
          for (const statement of program.get('body')) {
            if (statement.isImportDeclaration()) rewriteImport(statement);
            else if (statement.isExportDefaultDeclaration()) rewriteDefaultExport(statement);
            else if (statement.isExportNamedDeclaration()) rewriteNamedExport(statement);
          }
        },
      },
    },
  };
}

/** `__exports.name` */
const exported = (name: string) =>
  t.memberExpression(t.identifier('__exports'), t.identifier(name));

/** import → 从模块表按名字取；只为副作用的导入（import 'x'）去掉 */
function rewriteImport(statement: NodePath<t.ImportDeclaration>): void {
  const table = t.memberExpression(
    t.identifier('__modules'),
    t.stringLiteral(statement.node.source.value),
    true,
  );
  const declarations = statement.node.specifiers.map((specifier) => {
    if (t.isImportNamespaceSpecifier(specifier))
      return t.variableDeclarator(specifier.local, table);
    const imported = t.isImportDefaultSpecifier(specifier)
      ? 'default'
      : t.isIdentifier(specifier.imported)
        ? specifier.imported.name
        : specifier.imported.value;
    return t.variableDeclarator(
      specifier.local,
      t.memberExpression(table, t.stringLiteral(imported), true),
    );
  });
  if (declarations.length) statement.replaceWith(t.variableDeclaration('const', declarations));
  else statement.remove();
}

/** export default X → __exports.default = X（函数、类声明保留名字，再导出） */
function rewriteDefaultExport(statement: NodePath<t.ExportDefaultDeclaration>): void {
  const declaration = statement.node.declaration;
  if (
    (t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration)) &&
    declaration.id
  ) {
    const name = declaration.id;
    statement.replaceWithMultiple([
      declaration,
      t.expressionStatement(t.assignmentExpression('=', exported('default'), name)),
    ]);
    return;
  }
  const value = t.isFunctionDeclaration(declaration)
    ? t.functionExpression(
        null,
        declaration.params,
        declaration.body,
        declaration.generator,
        declaration.async,
      )
    : t.isClassDeclaration(declaration)
      ? t.classExpression(null, declaration.superClass, declaration.body, declaration.decorators)
      : (declaration as t.Expression);
  statement.replaceWith(
    t.expressionStatement(t.assignmentExpression('=', exported('default'), value)),
  );
}

/** export const a = …、export function f() {}、export { a, b as c } → 声明照旧，再写进 __exports */
function rewriteNamedExport(statement: NodePath<t.ExportNamedDeclaration>): void {
  const { declaration, specifiers, source } = statement.node;
  if (source)
    throw statement.buildCodeFrameError('re-exporting from another module is not supported here');
  const assignments: t.Statement[] = [];
  const assign = (local: string, as: string) =>
    assignments.push(
      t.expressionStatement(t.assignmentExpression('=', exported(as), t.identifier(local))),
    );
  if (declaration) {
    // 只取声明出来的名字，不含函数的参数
    for (const name of Object.keys(t.getBindingIdentifiers(declaration, false, true)))
      assign(name, name);
    statement.replaceWithMultiple([declaration, ...assignments]);
    return;
  }
  for (const specifier of specifiers) {
    if (!t.isExportSpecifier(specifier) || !t.isIdentifier(specifier.local)) continue;
    assign(
      specifier.local.name,
      t.isIdentifier(specifier.exported) ? specifier.exported.name : specifier.exported.value,
    );
  }
  statement.replaceWithMultiple(assignments);
}
