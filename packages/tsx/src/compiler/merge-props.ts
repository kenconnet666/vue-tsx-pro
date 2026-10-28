/**
 * Vue JSX 生成的属性合并换成本包的 mergeJsxProps（runtime/refs.ts）：展开的属性与写在后面的属性都带 ref 时
 * （`<div {...css.attrs(…)} ref={el}>`），Vue 的 mergeProps 只留后一个，样式绑定或使用方的 ref 会被盖掉。
 *
 * 只改导入：`import { mergeProps as _mergeProps } from "vue"` 的这一项改从本包导入 mergeJsxProps，本地名不变，调用处不用动。
 * 放在 Vue JSX 插件之后，在 Program 退出时做（Vue JSX 遇到元素才插入导入）。
 */
import { types as t, type PluginObject } from '@babel/core';

const RUNTIME_MODULE = '@zerodep-dev/vue-tsx-pro-tsx';

export function mergePropsPlugin(): PluginObject {
  return {
    name: 'vue-tsx-pro-merge-props',
    visitor: {
      Program: {
        exit(program) {
          for (const statement of program.get('body')) {
            if (!statement.isImportDeclaration() || statement.node.source.value !== 'vue') continue;
            const specifier = statement.node.specifiers.find(
              (item): item is t.ImportSpecifier =>
                t.isImportSpecifier(item) && t.isIdentifier(item.imported, { name: 'mergeProps' }),
            );
            if (!specifier) continue;
            const replacement = t.importDeclaration(
              [t.importSpecifier(specifier.local, t.identifier('mergeJsxProps'))],
              t.stringLiteral(RUNTIME_MODULE),
            );
            if (statement.node.specifiers.length === 1) statement.replaceWith(replacement);
            else {
              statement.node.specifiers = statement.node.specifiers.filter(
                (item) => item !== specifier,
              );
              statement.insertAfter(replacement);
            }
            return;
          }
        },
      },
    },
  };
}
