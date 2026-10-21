/**
 * 组件的热更新、tree-shaking 标注与 SSR 登记，取自 @vitejs/plugin-vue-jsx 5.1（MIT）：
 *   - 开发时：顶层声明或导出的组件（_component / defineComponent 的结果）登记到 Vue 的热更新运行时，
 *     文件改了只重新加载这些组件；export default 的组件先赋给变量才能登记
 *   - 构建时：组件调用标为纯调用，没用到的组件能被去掉
 *   - SSR：组件登记到 ssrContext.modules，服务端据此预加载用到的模块
 */
import { hash } from 'node:crypto';
import { relative } from 'node:path';
import { types as t, type PluginObject } from '@babel/core';

/** 组件边界：第一个参数是 setup 函数、结果是组件的调用 */
const COMPONENT_FACTORIES = ['defineComponent', '_component'];

/** SSR 时登记组件模块的虚拟模块 */
export const SSR_REGISTER_ID = '/__vue-jsx-ssr-register-helper';

/** SSR_REGISTER_ID 的代码：包一层 setup，渲染时把模块记进 ssrContext.modules */
export const SSR_REGISTER_CODE = `import { useSSRContext } from "vue";
export function ssrRegisterHelper(comp, filename) {
  const setup = comp.setup;
  comp.setup = (props, ctx) => {
    const ssrContext = useSSRContext();
    (ssrContext.modules || (ssrContext.modules = new Set())).add(filename);
    if (setup) return setup(props, ctx);
  };
}
`;

/**
 * 编译的第 2 遍末尾加的 Babel 插件。
 * 要登记组件时（热更新、SSR）：`export default _component(…)` 改成先赋给 `__default__` 再导出；
 * 否则（构建）：组件调用标为纯调用
 */
export function componentMarkers(register: boolean): PluginObject {
  return {
    name: 'vue-tsx-pro-components',
    visitor: register
      ? {
          ExportDefaultDeclaration(path) {
            const declaration = unwrapTypeAssertion(path.node.declaration);
            if (!isComponentCall(declaration)) return;
            const [variable] = path.replaceWithMultiple([
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier('__default__'),
                  t.callExpression(declaration.callee, declaration.arguments),
                ),
              ]),
              t.exportDefaultDeclaration(t.identifier('__default__')),
            ]);
            path.scope.registerDeclaration(variable!);
          },
        }
      : {
          CallExpression(path) {
            if (isComponentCall(path.node)) path.addComment('leading', '#__PURE__');
          },
        },
  };
}

/** 文件顶层声明或导出的组件：本地名、导出名，以及按模块与导出名算的热更新 id */
export function exportedComponents(ast: t.File, id: string) {
  const declared = new Set<string>();
  const components: { local: string; exported: string; id: string }[] = [];
  const add = (local: string, exported: string) =>
    components.push({ local, exported, id: hash('sha256', id + exported, 'hex').slice(0, 8) });
  for (const node of ast.program.body) {
    if (t.isVariableDeclaration(node)) {
      for (const name of componentDeclarations(node)) declared.add(name);
    }
    if (t.isExportNamedDeclaration(node)) {
      if (t.isVariableDeclaration(node.declaration)) {
        for (const name of componentDeclarations(node.declaration)) add(name, name);
      } else {
        for (const specifier of node.specifiers) {
          if (!t.isExportSpecifier(specifier) || !t.isIdentifier(specifier.local)) continue;
          if (t.isIdentifier(specifier.exported) && declared.has(specifier.local.name)) {
            add(specifier.local.name, specifier.exported.name);
          }
        }
      }
    }
    if (t.isExportDefaultDeclaration(node)) {
      if (t.isIdentifier(node.declaration) && declared.has(node.declaration.name)) {
        add(node.declaration.name, 'default');
      } else if (isComponentCall(unwrapTypeAssertion(node.declaration))) {
        add('__default__', 'default');
      }
    }
  }
  return components;
}

/** 登记到热更新运行时，文件更新时重新加载这些组件 */
export function hmrCode(components: ReturnType<typeof exportedComponents>) {
  const records = components.map(
    ({ local, id }) =>
      `\n${local}.__hmrId = "${id}"\n__VUE_HMR_RUNTIME__.createRecord("${id}", ${local})`,
  );
  const reloads = components.map(
    ({ exported, id }) => `\n__VUE_HMR_RUNTIME__.reload("${id}", __${exported})`,
  );
  const parameters = components.map(({ exported }) => `${exported}: __${exported}`).join(',');
  return `${records.join('')}\nimport.meta.hot.accept(({${parameters}}) => {${reloads.join('')}\n})`;
}

/** SSR：组件渲染时把模块路径（相对项目根目录）记进 ssrContext */
export function ssrCode(
  components: ReturnType<typeof exportedComponents>,
  id: string,
  root: string,
) {
  const moduleId = relative(root, id).split('\\').join('/');
  const registers = components.map(({ local }) => `\nssrRegisterHelper(${local}, __moduleId)`);
  return `\nimport { ssrRegisterHelper } from "${SSR_REGISTER_ID}"\nconst __moduleId = ${JSON.stringify(moduleId)}${registers.join('')}`;
}

function componentDeclarations(node: t.VariableDeclaration) {
  return node.declarations.flatMap((declarator) =>
    t.isIdentifier(declarator.id) && isComponentCall(unwrapTypeAssertion(declarator.init))
      ? [declarator.id.name]
      : [],
  );
}

function isComponentCall(node: t.Node | null | undefined): node is t.CallExpression {
  return (
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee) &&
    COMPONENT_FACTORIES.includes(node.callee.name)
  );
}

function unwrapTypeAssertion(node: t.Node | null | undefined) {
  let current = node;
  while (
    t.isTSAsExpression(current) ||
    t.isTSSatisfiesExpression(current) ||
    t.isTSTypeAssertion(current)
  ) {
    current = current.expression;
  }
  return current;
}
