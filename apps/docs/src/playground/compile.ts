/**
 * 代码演练场（试点）的编译：把一段 TSX 编译成能直接执行的代码与它的 CSS，在 Worker 里运行（compile.worker.ts）。
 *
 * 插件顺序与 Vite 预设一致：token 字符串写法（compileTokens）→ 去掉类型 → 符文（runesBabelPlugin）→ StyleX → Vue JSX；
 * 最后把 import 改成从主线程给的模块表里取（见 run.ts），export default 改成交出组件。
 * StyleX 生成的样式规则从 metadata 取出转成 CSS，由主线程插进页面（与打包工具的做法相同；
 * StyleX 浏览器版的“运行时注入”会插入 import 语句，它精简过的 Babel 类型工具里缺少需要的函数，用不了）。
 */
import { transformAsync, types as t, type PluginObj } from '@babel/core';
import typescript from '@babel/plugin-transform-typescript';
import stylex from '@stylexjs/babel-plugin';
import vueJsx from '@vue/babel-plugin-jsx';
import { compileTokens, runesBabelPlugin } from '@vue-tsx-pro/tsx/compiler';

/** 主题 token 的组名 → token 名：'_md' 这类写法据此改写成 token 变量 */
export type TokenGroups = Record<string, string[]>;

const FILENAME = 'Playground.tsx';

/**
 * import → 从模块表取：`import { ref } from 'vue'` → `const { ref } = __modules['vue']`；
 * `export default X` → `__exports.default = X`。在其他插件之后（Program 退出时）做
 */
function modulesToGlobals(): PluginObj {
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

/** token 模块：用户代码与组件库从同一个包名导入 */
const TOKENS = '@vue-tsx-pro/ui/tokens.stylex';

/**
 * StyleX 按“规范路径 + 导出名”给 defineVars 的变量算哈希。规范路径与站点构建时一致
 * （packages/tsx/src/vite/stylex-resolution.ts 的 包名:去掉 src/ 与扩展名的路径），
 * 用户代码里的 colors.accent 才会编译成与组件库相同的 CSS 变量，跟着主题走。
 */
const moduleResolution = {
  type: 'custom',
  filePathResolver: (importPath: string) =>
    importPath === TOKENS ? '@vue-tsx-pro/ui:config/theme/tokens.stylex' : undefined,
  getCanonicalFilePath: (filePath: string) => filePath,
};

/** 编译用户代码；语法或写法错误时抛出带代码帧的错误 */
export async function compilePlayground(code: string, tokenGroups: TokenGroups) {
  const groups = new Map(
    Object.entries(tokenGroups).map(([group, names]) => [group, new Set(names)]),
  );
  const tokenized = await compileTokens(code, FILENAME, () => ({ importPath: TOKENS, groups }));
  const result = await transformAsync(tokenized?.code ?? code, {
    filename: FILENAME,
    babelrc: false,
    configFile: false,
    plugins: [
      [typescript, { isTSX: true, allExtensions: true, onlyRemoveTypeImports: true }],
      runesBabelPlugin,
      [
        stylex,
        {
          dev: true,
          runtimeInjection: false,
          importSources: ['@stylexjs/stylex', '@vue-tsx-pro/tsx/stylex'],
          unstable_moduleResolution: moduleResolution,
          // 调试用的文件路径直接取文件名：默认会去找所在的包（读 package.json），浏览器里没有文件系统
          debugFilePath: (file: string) => file,
        },
      ],
      vueJsx,
      modulesToGlobals,
    ],
  });
  const rules = (result?.metadata as { stylex?: unknown[] } | undefined)?.stylex ?? [];
  return { code: result?.code ?? '', css: stylex.processStylexRules(rules as never, false) };
}
