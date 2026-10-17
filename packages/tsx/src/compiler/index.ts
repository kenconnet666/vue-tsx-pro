/**
 * runes 编译器：让本地响应式变量像普通变量一样读写，语义全部交给 Vue。
 *
 * 只做四件事：
 *   1. 把符文声明换成 Vue API：_state → ref / reactive，_derived → computed，
 *      _bindable → vue-jsx 的 defineModel，_from → 直接持有外部 Ref
 *   2. 把这些变量的读写改写成 .value
 *   3. _ref(x) 取回背后的 Ref，交给需要 Ref 的 Vue API
 *   4. 对会悄悄失去响应性的写法直接报错
 *
 * 生成的代码就是手写 Vue 会写的代码，之后照常交给 vue-jsx 编译。
 */
import { transformAsync, types as t, type NodePath, type PluginObj } from '@babel/core';
import type { Binding } from '@babel/traverse';

/** 组件边界：第一个参数是 setup 函数的调用 */
const COMPONENT_CALLEES = new Set(['component', 'defineComponent']);

/** 所有符文的全局名；只有未被本地变量遮蔽时才当作符文 */
const RUNE_GLOBALS = new Set(['_state', '_derived', '_bindable', '_from', '_ref']);

type Rune = '_state' | '_state.raw' | '_derived' | '_derived.by' | '_bindable' | '_from' | '_ref';

/** 一个需要改写为 .value 的绑定 */
interface TrackedInfo {
  writable: boolean;
  /** 报错时告诉作者它来自哪个符文 */
  rune: Rune;
}

/** Vue 运行时函数，按需导入 */
type VueHelper = 'ref' | 'shallowRef' | 'reactive' | 'computed';

export async function compileRunes(code: string, filename = 'input.tsx') {
  if (!/\b_(state|derived|bindable|from|ref)\b/.test(code)) return null;
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    parserOpts: { plugins: ['jsx', 'typescript'] },
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
  /** 组件参数解构出的普通 prop：只读 */
  private props = new Set<Binding>();
  private helpers = new Map<VueHelper, t.Identifier>();

  private program: NodePath<t.Program>;

  constructor(program: NodePath<t.Program>) {
    this.program = program;
  }

  // ───────────────────────── 第 1 步：符文声明 ─────────────────────────

  collectDeclarations() {
    this.program.traverse({
      CallExpression: (path) => {
        const rune = runeOf(path);
        switch (rune) {
          case null:
          case '_ref': // _ref(x) 在第 3 步随引用一起处理
            return;
          case '_bindable':
            this.declareBindable(path);
            return;
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
            path.replaceWith(this.call('reactive', [arg]));
            return;
          }
          throw fail(
            path,
            'const 声明的 _state 只能是对象或数组字面量；需要重新赋值的状态请用 let',
          );
        }
        this.requireIdentifier(declarator, rune);
        path.replaceWith(this.call('ref', [initial]));
        this.pending.set(declarator.node, { writable: true, rune });
        return;
      }
      case '_state.raw': {
        if (kind !== 'let') throw fail(path, '_state.raw 只能用 let 声明（它只能整体替换）');
        this.requireIdentifier(declarator, rune);
        path.replaceWith(this.call('shallowRef', [initial]));
        this.pending.set(declarator.node, { writable: true, rune });
        return;
      }
      case '_derived':
      case '_derived.by': {
        if (kind !== 'const') throw fail(path, `${rune} 是只读的，请用 const 声明`);
        if (!arg) throw fail(path, `${rune} 需要一个参数`);
        this.requireIdentifier(declarator, rune);
        const getter = rune === '_derived' ? t.arrowFunctionExpression([], arg) : arg;
        path.replaceWith(this.call('computed', [getter]));
        this.pending.set(declarator.node, { writable: false, rune });
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
        this.pending.set(declarator.node, { writable: kind === 'let', rune });
        return;
      }
    }
  }

  /**
   * 组件参数里的 { checked = _bindable(false) }：
   * 从参数解构中移除，换成函数体开头的 const checked = defineModel('checked', { default: false })。
   * defineModel 由 vue-jsx 宏处理，走的是 Vue 标准的 v-model 协议（checked + onUpdate:checked）。
   */
  private declareBindable(path: NodePath<t.CallExpression>) {
    const misplaced = () =>
      fail(
        path,
        '_bindable() 只能写在组件参数解构的默认值位置，例如 ({ checked = _bindable(false) })',
      );

    const assign = path.parentPath;
    if (!assign.isAssignmentPattern() || assign.node.right !== path.node) throw misplaced();
    const property = assign.parentPath;
    if (
      !property.isObjectProperty() ||
      property.node.computed ||
      !t.isIdentifier(property.node.key)
    )
      throw misplaced();
    const pattern = property.parentPath;
    const setup = pattern.parentPath;
    if (
      !pattern?.isObjectPattern() ||
      !setup?.isFunction() ||
      setup.node.params[0] !== pattern.node
    )
      throw misplaced();
    if (!isComponentSetup(setup)) throw misplaced();
    if (!t.isIdentifier(assign.node.left)) throw misplaced();

    const key = property.node.key.name;
    const local = assign.node.left.name;
    const fallback = path.node.arguments[0] as t.Expression | undefined;
    const options = fallback
      ? [t.objectExpression([t.objectProperty(t.identifier('default'), fallback)])]
      : [];

    const declarator = t.variableDeclarator(
      t.identifier(local),
      t.callExpression(t.identifier('defineModel'), [t.stringLiteral(key), ...options]),
    );
    property.remove();
    prependToBody(setup, t.variableDeclaration('const', [declarator]));
    this.pending.set(declarator, { writable: true, rune: '_bindable' });
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
      Function: (path) => {
        if (!isComponentSetup(path)) return;
        const first = path.get('params')[0];
        if (!first) return;
        for (const name of Object.keys(first.getBindingIdentifiers())) {
          const binding = path.scope.getBinding(name);
          if (binding?.kind === 'param') this.props.add(binding);
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
        if (!info.writable) {
          throw fail(violation, `${binding.identifier.name} 来自 ${info.rune}，是只读的`);
        }
        for (const target of writeTargets(violation, binding)) replaceWithValue(target);
      }
      for (const reference of binding.referencePaths) {
        if (!isAttached(reference) || isInTypePosition(reference)) continue;
        this.rewriteRead(reference, binding);
      }
    }

    // 普通 prop 是只读的：写入时提示改用 _bindable
    for (const binding of this.props) {
      const violation = binding.constantViolations[0];
      if (violation) {
        throw fail(
          violation,
          `prop ${binding.identifier.name} 是只读的；需要在组件内修改并同步给父级，请写成 ${binding.identifier.name} = _bindable(默认值)`,
        );
      }
    }
  }

  private rewriteRead(reference: NodePath, binding: Binding) {
    const parent = reference.parentPath!;

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

  private call(helper: VueHelper, args: t.Expression[]) {
    let id = this.helpers.get(helper);
    if (!id) {
      id = this.program.scope.generateUidIdentifier(`vue_${helper}`);
      this.helpers.set(helper, id);
    }
    return t.callExpression(t.identifier(id.name), args);
  }

  insertImports() {
    if (!this.helpers.size) return;
    const specifiers = [...this.helpers].map(([name, local]) =>
      t.importSpecifier(t.identifier(local.name), t.identifier(name)),
    );
    this.program.unshiftContainer('body', t.importDeclaration(specifiers, t.stringLiteral('vue')));
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

/** 箭头函数简写体先补成块，再在开头插入声明 */
function prependToBody(fn: NodePath<t.Function>, statement: t.Statement) {
  const body = fn.get('body');
  if (body.isBlockStatement()) {
    body.unshiftContainer('body', statement);
  } else {
    body.replaceWith(t.blockStatement([statement, t.returnStatement(body.node as t.Expression)]));
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
