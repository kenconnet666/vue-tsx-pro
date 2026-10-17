/**
 * runes 编译器：让本地响应式变量像普通变量一样读写，语义全部交给 Vue。
 *
 * 只做五件事：
 *   1. 把符文声明换成 Vue API：_state → ref / reactive，_derived → computed，_from → 直接持有外部 Ref
 *   2. 把 _component 的参数解构换成实例内的 prop 访问器（参考 Svelte 5 的 $.prop），
 *      并生成 Vue 需要的 props 声明；_bindable 走标准 v-model 协议
 *   3. 把这些变量的读写改写成 .value
 *   4. _ref(x) 取回背后的 Ref，交给需要 Ref 的 Vue API
 *   5. 对会悄悄失去响应性的写法直接报错
 *
 * 生成的代码就是手写 Vue 会写的代码，之后交给官方 @vitejs/plugin-vue-jsx 编译 JSX。
 */
import { transformAsync, types as t, type NodePath, type PluginObj } from '@babel/core';
import type { Binding } from '@babel/traverse';

/** 组件边界：第一个参数是 setup 函数的调用 */
const COMPONENT_CALLEES = new Set(['_component', 'defineComponent']);

/** 编译产物里 prop / bindable 等运行时函数的来源 */
const RUNTIME_MODULE = '@vue-tsx-pro/tsx';

/** 所有符文的全局名；只有未被本地变量遮蔽时才当作符文 */
const RUNE_GLOBALS = new Set(['_state', '_derived', '_bindable', '_from', '_ref']);

/** 用到符文，或定义了 _component（需要编译 props 解构）的文件才需要编译；宿主项目的其他文件原样放过 */
const NEEDS_COMPILE = /\b_(?:state|derived|bindable|from|ref)\b|\b_component\s*\(/;

type Rune = '_state' | '_state.raw' | '_derived' | '_derived.by' | '_bindable' | '_from' | '_ref';

/** 一个需要改写为 .value 的绑定 */
interface TrackedInfo {
  writable: boolean;
  /** 报错时告诉作者它来自哪里：某个符文，或组件 prop */
  source: Rune | 'prop';
  /** children 的所属组件：读取会执行插槽，不能直接写在 setup 函数体里 */
  childrenOf?: t.Function;
}

/** 按需导入的运行时函数：Vue 的响应式 API 与本包的 prop 访问器 */
type Helper =
  | { module: 'vue'; name: 'ref' | 'shallowRef' | 'reactive' | 'computed' | 'unref' }
  | { module: typeof RUNTIME_MODULE; name: 'prop' | 'bindable' };

export async function compileRunes(code: string, filename = 'input.tsx') {
  if (!NEEDS_COMPILE.test(code)) return null;
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    // .ts 不能开 JSX：否则 <T>value 这类类型断言、<T>(x) => x 泛型箭头函数会被当作 JSX 解析
    parserOpts: { plugins: /\.[cm]?ts$/.test(filename) ? ['typescript'] : ['jsx', 'typescript'] },
    generatorOpts: { retainLines: false },
    plugins: [runesBabelPlugin],
  });
  return result && { code: result.code ?? '', map: result.map };
}

export function runesBabelPlugin(): PluginObj {
  return {
    name: 'vue-tsx-pro-runes',
    visitor: {
      Program(program) {
        const ctx = new RunesContext(program);
        ctx.collectDeclarations(); // 第 1 步：符文 → Vue API
        program.scope.crawl(); //     第 2 步：改写后重建作用域
        ctx.resolveBindings();
        ctx.rewriteAccesses(); //     第 3 步：读写 → .value
        ctx.reportMisuse(); //        第 4 步：残留的符文都是误用
        ctx.insertImports();
      },
    },
  };
}

class RunesContext {
  /** 第 1 步记录下的声明节点，第 2 步再换成作用域里的 Binding */
  private pending = new Map<t.VariableDeclarator, TrackedInfo>();
  private tracked = new Map<Binding, TrackedInfo>();
  /** 已导入的运行时函数：`模块:名称` → 本地别名 */
  private helpers = new Map<string, { helper: Helper; local: t.Identifier }>();

  private program: NodePath<t.Program>;

  constructor(program: NodePath<t.Program>) {
    this.program = program;
  }

  // ───────────────────────── 第 1 步：符文声明 ─────────────────────────

  collectDeclarations() {
    this.program.traverse({
      Function: (path) => {
        if (isPropsComponent(path)) this.declareProps(path);
      },
      CallExpression: (path) => {
        const rune = runeOf(path);
        switch (rune) {
          case null:
          case '_ref': // _ref(x) 在第 3 步随引用一起处理
            return;
          case '_bindable':
            throw fail(
              path,
              '_bindable() 只能写在 _component 参数解构的默认值位置，例如 ({ checked = _bindable(false) })',
            );
          default:
            this.declareState(path, rune);
            return;
        }
      },
    });
  }

  /** let x = _state(0) 之类：把调用换成 Vue API，并记下声明 */
  private declareState(
    path: NodePath<t.CallExpression>,
    rune: Exclude<Rune, '_bindable' | '_ref'>,
  ) {
    const declarator = path.parentPath;
    if (!declarator.isVariableDeclarator() || declarator.node.init !== path.node) {
      throw fail(path, `${rune}() 只能直接初始化一个变量，例如 let count = ${rune}(0)`);
    }
    const kind = (declarator.parent as t.VariableDeclaration).kind;
    if (kind === 'var') throw fail(declarator, '响应式变量请用 let 或 const 声明');
    if (isInsideRender(path)) {
      throw fail(
        path,
        `${rune} 写在渲染函数里，每次重新渲染都会重新创建；请移到组件函数体中 return 之前`,
      );
    }
    if (path.node.arguments.length > 1) throw fail(path, `${rune}() 只接受一个参数`);

    const id = declarator.node.id;
    const arg = path.node.arguments[0] as t.Expression | undefined;
    const initial = arg ?? t.identifier('undefined');

    switch (rune) {
      case '_state': {
        // const + 对象/数组字面量：就是 Vue 的 reactive 对象，变量本身不需要改写，
        // 因此可以直接导出、传进任意函数而不丢响应性
        if (kind === 'const') {
          if (t.isObjectExpression(arg) || t.isArrayExpression(arg)) {
            path.replaceWith(this.vue('reactive', [arg]));
            return;
          }
          throw fail(
            path,
            'const 声明的 _state 只能是对象或数组字面量；需要重新赋值的状态请用 let',
          );
        }
        this.requireIdentifier(declarator, rune);
        path.replaceWith(this.vue('ref', [initial]));
        this.pending.set(declarator.node, { writable: true, source: rune });
        return;
      }
      case '_state.raw': {
        if (kind !== 'let') throw fail(path, '_state.raw 只能用 let 声明（它只能整体替换）');
        this.requireIdentifier(declarator, rune);
        path.replaceWith(this.vue('shallowRef', [initial]));
        this.pending.set(declarator.node, { writable: true, source: rune });
        return;
      }
      case '_derived':
      case '_derived.by': {
        if (kind !== 'const') throw fail(path, `${rune} 是只读的，请用 const 声明`);
        if (!arg) throw fail(path, `${rune} 需要一个参数`);
        this.requireIdentifier(declarator, rune);
        const getter = rune === '_derived' ? t.arrowFunctionExpression([], arg) : arg;
        path.replaceWith(this.vue('computed', [getter]));
        this.pending.set(declarator.node, { writable: false, source: rune });
        return;
      }
      case '_from': {
        // 直接持有外部 Ref：let theme = _from(useStorage(...))
        // 也支持解构一组 Ref：const { x, y } = _from(useMouse())
        if (!arg) throw fail(path, '_from 需要一个 Ref 或由 Ref 组成的对象');
        if (!t.isIdentifier(id) && !t.isObjectPattern(id)) {
          throw fail(path, '_from 的结果请赋给一个变量或对象解构');
        }
        path.replaceWith(arg);
        this.pending.set(declarator.node, { writable: kind === 'let', source: rune });
        return;
      }
    }
  }

  /**
   * _component 的参数解构 → 实例内的 prop 访问器（参考 Svelte 5 的 $.prop）：
   *
   *   _component(({ size = 'md', icon = pick(size), checked = _bindable(false), ...rest }) => …)
   *   ↓
   *   _component((__props, __ctx) => {
   *     const size = prop(__props, 'size', () => 'md')
   *     const icon = prop(__props, 'icon', () => pick(size.value))
   *     const checked = bindable(__props, 'checked', () => false, __ctx.emit)
   *     const rest = __ctx.attrs
   *     …
   *   }, { name: 'Toggle', props: ['size', 'icon', 'checked', 'onUpdate:checked'] })
   *
   * 默认值在实例内惰性求值：可以是任意表达式，也可以引用前面的 prop。
   * 解构出的变量和符文一样登记为响应式绑定，读写在第 3 步统一改成 .value。
   */
  private declareProps(setup: NodePath<t.Function>) {
    const params = setup.get('params');
    const pattern = params[0];
    const names: string[] = [];

    if (pattern) {
      if (params.length > 1) throw fail(params[1]!, '组件只接收一个参数：props 解构');
      if (!pattern.isObjectPattern()) {
        throw fail(
          pattern,
          '请解构 props，例如 _component(({ size = "md", ...rest }) => …)；解构出的变量会保持响应式',
        );
      }

      const propsId = setup.scope.generateUidIdentifier('props');
      const ctxId = setup.scope.generateUidIdentifier('ctx');
      const declarations: t.Statement[] = [];

      for (const property of pattern.get('properties')) {
        // ...rest：没有声明为 prop 的属性都在 attrs 里
        if (property.isRestElement()) {
          const local = property.node.argument;
          if (!t.isIdentifier(local)) throw fail(property, '...rest 需要是一个变量名');
          declarations.push(
            t.variableDeclaration('const', [
              t.variableDeclarator(local, t.memberExpression(ctxId, t.identifier('attrs'))),
            ]),
          );
          continue;
        }

        const { key, local, fallback, isBindable } = readPropPattern(property);
        // children 来自默认插槽（见 runtime/component.ts），不是真正的 Vue prop
        if (key !== 'children') names.push(key);
        if (isBindable) names.push(`onUpdate:${key}`);

        const thunk = fallback && t.arrowFunctionExpression([], fallback);
        const init = isBindable
          ? this.runtime('bindable', [
              propsId,
              t.stringLiteral(key),
              thunk ?? t.identifier('undefined'),
              t.memberExpression(ctxId, t.identifier('emit')),
            ])
          : this.runtime('prop', [propsId, t.stringLiteral(key), ...(thunk ? [thunk] : [])]);
        const declarator = t.variableDeclarator(t.identifier(local), init);
        this.pending.set(declarator, {
          writable: isBindable,
          source: isBindable ? '_bindable' : 'prop',
          childrenOf: key === 'children' ? setup.node : undefined,
        });
        declarations.push(t.variableDeclaration('const', [declarator]));
      }

      // 参数换成 (__props: 原类型, __ctx)，声明按书写顺序放到函数体开头
      propsId.typeAnnotation = pattern.node.typeAnnotation;
      setup.node.params = [propsId, ctxId];
      prependToBody(setup, declarations);
    }

    addComponentOptions(setup.parentPath as NodePath<t.CallExpression>, names);
  }

  private requireIdentifier(declarator: NodePath<t.VariableDeclarator>, rune: Rune) {
    if (!t.isIdentifier(declarator.node.id)) {
      throw fail(declarator, `${rune} 不能解构声明：解构得到的是快照。请先声明变量，再读取属性`);
    }
  }

  // ───────────────────────── 第 2 步：绑定 ─────────────────────────

  resolveBindings() {
    this.program.traverse({
      VariableDeclarator: (path) => {
        const info = this.pending.get(path.node);
        if (!info) return;
        for (const name of Object.keys(path.getBindingIdentifiers())) {
          this.tracked.set(path.scope.getBinding(name)!, info);
        }
      },
      ExportNamedDeclaration: (path) => {
        const declaration = path.get('declaration');
        if (!declaration.isVariableDeclaration()) return;
        for (const name of Object.keys(declaration.getBindingIdentifiers())) {
          if (this.pending.has(findDeclarator(declaration, name)!)) {
            throw fail(
              path,
              `不能直接导出响应式变量 ${name}：导入方只会拿到一个值。请导出 const 对象 _state({...})，或导出读写函数`,
            );
          }
        }
      },
    });
  }

  // ───────────────────────── 第 3 步：读写改写 ─────────────────────────

  rewriteAccesses() {
    for (const [binding, info] of this.tracked) {
      // 先处理写入，再处理读取；同一个标识符只改写一次
      for (const violation of binding.constantViolations) {
        if (!info.writable) throw fail(violation, readonlyMessage(binding, info));
        for (const target of writeTargets(violation, binding)) replaceWithValue(target);
      }
      for (const reference of binding.referencePaths) {
        if (!isAttached(reference) || isInTypePosition(reference)) continue;
        this.rewriteRead(reference, binding, info);
      }
    }
  }

  private rewriteRead(reference: NodePath, binding: Binding, info: TrackedInfo) {
    const parent = reference.parentPath!;

    if (info.childrenOf && reference.getFunctionParent()?.node === info.childrenOf) {
      throw fail(
        reference,
        `${binding.identifier.name} 是父级传入的内容，读取时才生成；请在渲染函数或回调里读取，不要直接写在组件函数体中`,
      );
    }

    // _ref(x)：取回背后的 Ref 本身
    if (
      parent.isCallExpression() &&
      runeOf(parent) === '_ref' &&
      parent.node.arguments[0] === reference.node
    ) {
      parent.replaceWith(t.identifier(binding.identifier.name));
      return;
    }
    if (parent.isExportSpecifier()) {
      throw fail(reference, `不能导出响应式变量 ${binding.identifier.name}`);
    }
    // <List>{children}</List>：JSX 编译器只对标识符子节点判断"是不是插槽函数"，
    // 改写成 x.value 会被当成普通内容；换成调用 unref(x) 才能把渲染函数原样转交
    if (isComponentChild(parent)) {
      reference.replaceWith(this.vue('unref', [t.identifier(binding.identifier.name)]));
      return;
    }
    replaceWithValue(reference);
  }

  // ───────────────────────── 第 4 步：误用检查 ─────────────────────────

  reportMisuse() {
    this.program.traverse({
      Identifier(path) {
        if (!RUNE_GLOBALS.has(path.node.name) || path.scope.hasBinding(path.node.name)) return;
        if (!path.isReferencedIdentifier() || isInTypePosition(path)) return;
        const name = path.node.name;
        switch (name) {
          case '_ref':
            throw fail(
              path,
              '_ref(x) 的参数必须是 _state / _derived / _bindable / _from 声明的变量',
            );
          default:
            throw fail(path, `${name} 只能按约定的位置直接调用，不能当作普通值使用`);
        }
      },
    });
  }

  // ───────────────────────── 导入 ─────────────────────────

  private vue(name: Extract<Helper, { module: 'vue' }>['name'], args: t.Expression[]) {
    return this.helper({ module: 'vue', name }, args);
  }

  private runtime(
    name: Extract<Helper, { module: typeof RUNTIME_MODULE }>['name'],
    args: t.Expression[],
  ) {
    return this.helper({ module: RUNTIME_MODULE, name }, args);
  }

  private helper(helper: Helper, args: t.Expression[]) {
    const id = `${helper.module}:${helper.name}`;
    let entry = this.helpers.get(id);
    if (!entry) {
      // 生成不冲突的本地名，例如 _vue_ref、_vtp_prop
      const prefix = helper.module === 'vue' ? 'vue' : 'vtp';
      entry = {
        helper,
        local: this.program.scope.generateUidIdentifier(`${prefix}_${helper.name}`),
      };
      this.helpers.set(id, entry);
    }
    return t.callExpression(t.identifier(entry.local.name), args);
  }

  insertImports() {
    // 按模块分组，每个模块一条 import
    const byModule = new Map<string, t.ImportSpecifier[]>();
    for (const { helper, local } of this.helpers.values()) {
      const specifiers = byModule.get(helper.module) ?? [];
      specifiers.push(t.importSpecifier(t.identifier(local.name), t.identifier(helper.name)));
      byModule.set(helper.module, specifiers);
    }
    for (const [module, specifiers] of byModule) {
      this.program.unshiftContainer(
        'body',
        t.importDeclaration(specifiers, t.stringLiteral(module)),
      );
    }
  }
}

// ───────────────────────── 工具函数 ─────────────────────────

/** 符文误用时抛出的错误：带代码帧的说明，以及供编辑器/语言服务定位的起止位置 */
export interface RunesError extends Error {
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

function fail(path: NodePath, message: string): RunesError {
  const error: RunesError = path.buildCodeFrameError(message);
  const loc = path.node.loc;
  if (loc) error.loc = { start: { ...loc.start }, end: { ...loc.end } };
  return error;
}

/**
 * 是否位于组件的渲染函数（setup 返回的函数）之内，包括其中嵌套的回调。
 * 渲染函数每次更新都会重新执行，在里面创建的状态会被重置。
 */
function isInsideRender(path: NodePath): boolean {
  for (let fn = path.getFunctionParent(); fn; fn = fn.parentPath?.getFunctionParent() ?? null) {
    const parent = fn.parentPath;
    // _component(() => { ...; return () => <div /> })
    if (parent?.isReturnStatement()) {
      const owner = parent.getFunctionParent();
      if (owner && isComponentSetup(owner)) return true;
    }
    // _component(() => () => <div />)
    if (
      parent?.isArrowFunctionExpression() &&
      parent.node.body === fn.node &&
      isComponentSetup(parent)
    ) {
      return true;
    }
  }
  return false;
}

/** 是否是组件元素（大写开头或 a.B 形式的标签）的直接子节点表达式 */
function isComponentChild(container: NodePath) {
  const element = container.parentPath;
  if (!container.isJSXExpressionContainer() || !element?.isJSXElement()) return false;
  const name = element.node.openingElement.name;
  return t.isJSXMemberExpression(name) || (t.isJSXIdentifier(name) && /^[A-Z]/.test(name.name));
}

/** 只读绑定被写入时的提示：prop 建议改用 _bindable，符文直接说明来源 */
function readonlyMessage(binding: Binding, info: TrackedInfo) {
  const name = binding.identifier.name;
  switch (info.source) {
    case 'prop':
      return `prop ${name} 是只读的；需要在组件内修改并同步给父级，请写成 ${name} = _bindable(默认值)`;
    default:
      return `${name} 来自 ${info.source}，是只读的`;
  }
}

/** 读取一项 props 解构：键名（驼峰）、本地变量名、默认值，以及是否 _bindable */
function readPropPattern(property: NodePath) {
  if (!property.isObjectProperty() || property.node.computed) {
    throw fail(property, 'props 解构不支持计算属性名');
  }
  const keyNode = property.node.key;
  const key = t.isIdentifier(keyNode)
    ? keyNode.name
    : t.isStringLiteral(keyNode)
      ? keyNode.value
      : null;
  if (key === null) throw fail(property, 'props 的键名需要是标识符或字符串');

  let value = property.get('value') as NodePath;
  let fallback: t.Expression | undefined;
  let isBindable = false;
  if (value.isAssignmentPattern()) {
    const right = value.get('right');
    if (right.isCallExpression() && runeOf(right) === '_bindable') {
      isBindable = true;
      fallback = right.node.arguments[0] as t.Expression | undefined;
    } else {
      fallback = right.node;
    }
    value = value.get('left');
  }
  if (!value.isIdentifier()) {
    throw fail(value, 'props 不支持嵌套解构：先解构出整个值，再在函数体里读取它的属性');
  }
  // Vue 把声明的 prop 名与传入的属性名都转成驼峰：'aria-label' 要按 ariaLabel 读取
  const camelKey = key.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
  return { key: camelKey, local: value.node.name, fallback, isBindable };
}

/**
 * 给 _component 补上第二个参数：组件名（取自 const X = _component(...)）与 props 声明。
 * 作者已经写了选项对象时，只补充其中缺少的项。
 */
function addComponentOptions(call: NodePath<t.CallExpression>, names: string[]) {
  const generated: t.ObjectProperty[] = [];
  const declarator = call.parentPath;
  if (declarator?.isVariableDeclarator() && t.isIdentifier(declarator.node.id)) {
    generated.push(
      t.objectProperty(t.identifier('name'), t.stringLiteral(declarator.node.id.name)),
    );
  }
  if (names.length) {
    generated.push(
      t.objectProperty(
        t.identifier('props'),
        t.arrayExpression(names.map((n) => t.stringLiteral(n))),
      ),
    );
  }
  if (!generated.length) return;

  const existing = call.node.arguments[1];
  if (!existing) {
    call.node.arguments.push(t.objectExpression(generated));
  } else if (t.isObjectExpression(existing)) {
    const has = (name: string) =>
      existing.properties.some((p) => t.isObjectProperty(p) && t.isIdentifier(p.key, { name }));
    existing.properties.unshift(...generated.filter((p) => !has((p.key as t.Identifier).name)));
  } else {
    call.node.arguments[1] = t.objectExpression([
      ...generated,
      t.spreadElement(existing as t.Expression),
    ]);
  }
}

/** 判断调用是否为某个符文（且没有被同名本地变量遮蔽） */
function runeOf(path: NodePath<t.CallExpression>): Rune | null {
  const callee = path.node.callee;
  if (t.isIdentifier(callee)) {
    return RUNE_GLOBALS.has(callee.name) && !path.scope.hasBinding(callee.name)
      ? (callee.name as Rune)
      : null;
  }
  if (
    t.isMemberExpression(callee) &&
    !callee.computed &&
    t.isIdentifier(callee.object) &&
    t.isIdentifier(callee.property)
  ) {
    const owner = callee.object.name;
    if (!RUNE_GLOBALS.has(owner) || path.scope.hasBinding(owner)) return null;
    const name = `${owner}.${callee.property.name}`;
    switch (name) {
      case '_state.raw':
      case '_derived.by':
        return name;
      default:
        throw fail(path, `不支持 ${name}，可用的只有 _state.raw 和 _derived.by`);
    }
  }
  return null;
}

function isComponentSetup(path: NodePath<t.Function>) {
  const call = path.parentPath;
  return (
    !!call?.isCallExpression() &&
    call.node.arguments[0] === path.node &&
    t.isIdentifier(call.node.callee) &&
    COMPONENT_CALLEES.has(call.node.callee.name)
  );
}

/** 由我们编译 props 的组件：_component(setup)。Vue 自己的 defineComponent 保持原样 */
function isPropsComponent(path: NodePath<t.Function>) {
  const call = path.parentPath;
  return (
    !!call?.isCallExpression() &&
    call.node.arguments[0] === path.node &&
    t.isIdentifier(call.node.callee, { name: '_component' })
  );
}

/** 箭头函数简写体先补成块，再在开头插入声明 */
function prependToBody(fn: NodePath<t.Function>, statements: t.Statement[]) {
  if (!statements.length) return;
  const body = fn.get('body');
  if (body.isBlockStatement()) {
    body.unshiftContainer('body', statements);
  } else {
    body.replaceWith(
      t.blockStatement([...statements, t.returnStatement(body.node as t.Expression)]),
    );
  }
}

/** 把标识符 x 改成 x.value（JSX 标签名改成 <x.value />，对象简写改成 { x: x.value }） */
function replaceWithValue(path: NodePath) {
  const node = path.node;
  if (t.isJSXIdentifier(node)) {
    path.replaceWith(t.jsxMemberExpression(t.jsxIdentifier(node.name), t.jsxIdentifier('value')));
    return;
  }
  if (!t.isIdentifier(node)) return;
  const parent = path.parentPath;
  if (parent?.isObjectProperty() && parent.node.shorthand && parent.node.value === node) {
    parent.node.shorthand = false;
  }
  path.replaceWith(t.memberExpression(t.identifier(node.name), t.identifier('value')));
  path.skip();
}

/**
 * 一次写入里，属于该绑定的所有目标标识符。
 * 支持 x = 1、x += 1、x++、[a, b] = [b, a]、({ x } = obj)、for (x of list)
 */
function writeTargets(violation: NodePath, binding: Binding): NodePath[] {
  let target: NodePath | null = null;
  switch (violation.node.type) {
    case 'AssignmentExpression':
      target = violation.get('left') as NodePath;
      break;
    case 'UpdateExpression':
      target = violation.get('argument') as NodePath;
      break;
    case 'ForOfStatement':
    case 'ForInStatement':
      target = violation.get('left') as NodePath;
      break;
    default:
      throw fail(violation, `不支持这种方式修改响应式变量 ${binding.identifier.name}`);
  }
  if (target.isIdentifier()) return [target];

  // 解构赋值：只挑出解析到同一绑定、且处于“被赋值”位置的标识符
  const found: NodePath[] = [];
  target.traverse({
    Identifier(path) {
      const parent = path.parentPath;
      const isKey =
        parent.isObjectProperty() && parent.node.key === path.node && !parent.node.shorthand;
      if (isKey || path.node.name !== binding.identifier.name) return;
      if (path.scope.getBinding(path.node.name) === binding) found.push(path);
    },
  });
  return found;
}

function isInTypePosition(path: NodePath) {
  return !!path.findParent(
    (p) => p.isTSType() || p.isTSTypeQuery() || p.isTSInterfaceDeclaration(),
  );
}

/** 路径对应的节点是否仍在树上（避免对已被替换的旧路径重复改写） */
function isAttached(path: NodePath) {
  const container = path.container as any;
  if (!container) return false;
  const value = path.listKey ? container[path.key as number] : container[path.key as string];
  return value === path.node;
}

function findDeclarator(declaration: NodePath<t.VariableDeclaration>, name: string) {
  return declaration.node.declarations.find((d) =>
    Object.keys(t.getBindingIdentifiers(d.id)).includes(name),
  );
}
