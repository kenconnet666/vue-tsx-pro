/**
 * 代码演练场的编译：把一段 TSX 编译成能直接执行的代码，在 Worker 里运行（compile.worker.ts）。
 *
 * 与 Vite 预设是同一个编译函数（@vue-tsx-pro/tsx/compiler 的 compile）：动态样式的响应式绑定、符文、Vue JSX、
 * 去掉类型；最后把 import 改成从主线程给的模块表里取（见 run.ts），export default 改成交出组件。
 * 样式同站点一样走运行时引擎：css.create 在页面上执行时生成规则（token 短写也在那时换成变量）。
 */
import { types as t, type PluginObject } from '@babel/core';
import { compile } from '@vue-tsx-pro/tsx/compiler';

const FILENAME = 'Playground.tsx';

/**
 * import → 从模块表取：`import { ref } from 'vue'` → `const { ref } = __modules['vue']`；
 * `export default X` → `__exports.default = X`。在其他插件之后（Program 退出时）做
 */
function modulesToGlobals(): PluginObject {
  return {
    name: 'playground-modules',
    visitor: {
      Program: {
        exit(program) {
          for (const statement of program.get('body')) {
            if (statement.isImportDeclaration()) {
              const source = t.memberExpression(
                t.identifier('__modules'),
                t.stringLiteral(statement.node.source.value),
                true,
              );
              const declarations = statement.node.specifiers.map((specifier) => {
                if (t.isImportNamespaceSpecifier(specifier)) {
                  return t.variableDeclarator(specifier.local, source);
                }
                const imported = t.isImportDefaultSpecifier(specifier)
                  ? 'default'
                  : t.isIdentifier(specifier.imported)
                    ? specifier.imported.name
                    : specifier.imported.value;
                return t.variableDeclarator(
                  specifier.local,
                  t.memberExpression(source, t.stringLiteral(imported), true),
                );
              });
              if (declarations.length)
                statement.replaceWith(t.variableDeclaration('const', declarations));
              else statement.remove();
            } else if (statement.isExportDefaultDeclaration()) {
              const declaration = statement.node.declaration;
              statement.replaceWith(
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.memberExpression(t.identifier('__exports'), t.identifier('default')),
                    t.isExpression(declaration) ? declaration : t.identifier('undefined'),
                  ),
                ),
              );
            }
          }
        },
      },
    },
  };
}

/** 编译用户代码；语法或写法错误时抛出带代码帧的错误 */
export async function compilePlayground(code: string) {
  const result = await compile(code, {
    filename: FILENAME,
    // JSX 里的动态样式调用改成响应式绑定（同站点）
    styleBindings: true,
    // 值的导入都留着：modulesToGlobals 把它们换成从模块表取
    typescript: { onlyRemoveTypeImports: true },
    plugins: [modulesToGlobals],
    sourceMaps: false,
  });
  return { code: result?.code ?? '' };
}
