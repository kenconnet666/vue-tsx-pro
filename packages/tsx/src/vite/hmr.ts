/**
 * 组件的热更新、tree-shaking 标注与 SSR 登记，取自 @vitejs/plugin-vue-jsx 5.1（MIT）：
 *   - 开发时：顶层声明或导出的组件（_component / defineComponent 的结果）登记到 Vue 的热更新运行时，
 *     文件改了只重新加载这些组件；export default 的组件先赋给变量才能登记。工厂函数做的组件
 *     （export const Toolbar = createFlex('nav')，大写开头、由调用得到）运行时确认是组件才登记（同 React Refresh 的判断）。
 *     模块还导出了组件以外的值（函数、常量）时，改动后让导入方重新执行（invalidate），它们才拿到新值
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

/** 一个要登记热更新的组件 */
export interface ComponentExport {
  /** 本地名 */
  local: string;
  /** 导出名 */
  exported: string;
  /** 按模块与导出名算的热更新 id */
  id: string;
  /** 工厂函数的结果：运行时确认是组件才登记 */
  maybe: boolean;
}

/** 文件顶层声明或导出的组件，以及有没有导出组件以外的值（本文件里定义的，转出别处的不算） */
export function exportedComponents(
  ast: t.File,
  id: string,
): { components: ComponentExport[]; otherExports: boolean } {
  const declared = new Map<string, boolean>();
  const components: ComponentExport[] = [];
  let otherExports = false;
  const add = (local: string, exported: string, maybe: boolean) =>
    components.push({
      local,
      exported,
      id: hash('sha256', id + exported, 'hex').slice(0, 8),
      maybe,
    });
  for (const node of ast.program.body) {
    if (t.isVariableDeclaration(node)) {
      for (const [name, maybe] of componentDeclarations(node)) declared.set(name, maybe);
    }
    if (t.isExportNamedDeclaration(node)) {
      if (node.source) continue;
      if (t.isVariableDeclaration(node.declaration)) {
        const found = componentDeclarations(node.declaration);
        for (const [name, maybe] of found) add(name, name, maybe);
        if (found.size < node.declaration.declarations.length) otherExports = true;
      } else if (node.declaration) {
        otherExports = true;
      } else {
        for (const specifier of node.specifiers) {
          if (!t.isExportSpecifier(specifier) || !t.isIdentifier(specifier.local)) continue;
          const maybe = declared.get(specifier.local.name);
          if (maybe !== undefined && t.isIdentifier(specifier.exported)) {
            add(specifier.local.name, specifier.exported.name, maybe);
          } else otherExports = true;
        }
      }
    }
    if (t.isExportDefaultDeclaration(node)) {
      const maybe = t.isIdentifier(node.declaration)
        ? declared.get(node.declaration.name)
        : undefined;
      if (maybe !== undefined) add((node.declaration as t.Identifier).name, 'default', maybe);
      else if (isComponentCall(unwrapTypeAssertion(node.declaration))) {
        add('__default__', 'default', false);
      } else otherExports = true;
    }
  }
  return { components, otherExports };
}

/** 运行时判断是不是组件（工厂函数的结果）：有 setup 或 render 的对象 */
const IS_COMPONENT =
  "const __isComponent = (c) => !!c && typeof c === 'object' && (typeof c.setup === 'function' || typeof c.render === 'function')";

/** 登记到热更新运行时，文件更新时重新加载这些组件；还导出了别的值时让导入方重新执行 */
export function hmrCode(components: readonly ComponentExport[], otherExports: boolean) {
  const records = components.map(({ local, id, maybe }) => {
    const record = `\n${local}.__hmrId = "${id}"\n__VUE_HMR_RUNTIME__.createRecord("${id}", ${local})`;
    return maybe ? `\nif (__isComponent(${local})) {${record}}` : record;
  });
  // 工厂函数的结果不是组件（createContext(…) 这类）时也算组件以外的值
  const reloads = components.map(({ exported, id, maybe }) => {
    const reload = `\n__VUE_HMR_RUNTIME__.reload("${id}", __${exported})`;
    return maybe ? `\nif (__isComponent(__${exported})) {${reload}} else __other = true` : reload;
  });
  const parameters = components.map(({ exported }) => `${exported}: __${exported}`).join(',');
  const helper = components.some(({ maybe }) => maybe) ? `\n${IS_COMPONENT}` : '';
  // 导入方拿着旧模块里的函数、常量：交给 Vite 往上找能接住更新的模块重新执行
  return [
    helper,
    ...records,
    `\nimport.meta.hot.accept(({${parameters}}) => {\nlet __other = ${otherExports}`,
    ...reloads,
    "\nif (__other) import.meta.hot.invalidate('还导出了组件以外的值，导入方重新执行')\n})",
  ].join('');
}

/** SSR：组件渲染时把模块路径（相对项目根目录）记进 ssrContext */
export function ssrCode(components: readonly ComponentExport[], id: string, root: string) {
  const moduleId = relative(root, id).split('\\').join('/');
  const registers = components.map(({ local, maybe }) =>
    maybe
      ? `\nif (${local} && typeof ${local} === 'object' && 'setup' in ${local}) ssrRegisterHelper(${local}, __moduleId)`
      : `\nssrRegisterHelper(${local}, __moduleId)`,
  );
  return `\nimport { ssrRegisterHelper } from "${SSR_REGISTER_ID}"\nconst __moduleId = ${JSON.stringify(moduleId)}${registers.join('')}`;
}

/**
 * 声明里的组件：名字 → 是否只是“可能”（工厂函数的结果）。_component / defineComponent 的结果一定是；
 * 大写开头、由别的调用得到的（createFlex('nav')、createPresetIconButton(…)）运行时再确认
 */
function componentDeclarations(node: t.VariableDeclaration) {
  const found = new Map<string, boolean>();
  for (const declarator of node.declarations) {
    if (!t.isIdentifier(declarator.id)) continue;
    const init = unwrapTypeAssertion(declarator.init);
    if (isComponentCall(init)) found.set(declarator.id.name, false);
    else if (/^[A-Z]/.test(declarator.id.name) && t.isCallExpression(init)) {
      found.set(declarator.id.name, true);
    }
  }
  return found;
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
