/** 符文编译：一个文件的流程按顺序执行 run() 里的各步，runesBabelPlugin 是它的 Babel 插件形式 */
import { types as t, type NodePath, type PluginObject, type PluginPass } from '@babel/core';
import {
  type Binding,
  findDeclarator,
  isAttached,
  isComponentChild,
  isComponentSetup,
  isInsideRender,
  isInTypePosition,
  isPropsComponent,
  isVueWatchSource,
  replaceWithValue,
  writeTargets,
} from './ast.ts';
import { rejectDirective, rewriteBind } from './bind.ts';
import { fail, warning, type RunesWarning } from './errors.ts';
import { RuntimeImports } from './imports.ts';
import { optimizeRender } from './optimize.ts';
import { declareProps } from './props.ts';
import { RUNE_GLOBALS, runeOf, type Rune, type TrackedInfo } from './runes.ts';

/** 用到符文，或定义了 _component（需要编译 props 解构）的文件才需要编译；宿主项目的其他文件原样放过 */
const NEEDS_COMPILE = /\b_(?:state|derived|bindable|bind|effect|fromRef|toRef)\b|\b_component\s*\(/;

/** 文件里有没有要编译的符文（解析之前的快速判断） */
export const needsRunes = (code: string) => NEEDS_COMPILE.test(code);

/** 符文编译的选项 */
export interface RunesOptions {
  /** 渲染优化（稳定插槽、缓存属性里的函数与常量，见 optimize.ts），默认 true */
  optimize?: boolean;
}

/** 符文编译的 Babel 插件：误用直接抛出 RunesError，警告放在文件的 metadata.runesWarnings */
export function runesBabelPlugin(): PluginObject<PluginPass<RunesOptions>> {
  return {
    name: 'vue-tsx-pro-runes',
    visitor: {
      Program(program, state) {
        const transform = new RunesTransform(program, state.filename, state.opts.optimize ?? true);
        transform.run();
        (state.file.metadata as { runesWarnings?: RunesWarning[] }).runesWarnings =
          transform.warnings;
      },
    },
  };
}

/** 一个文件的符文改写：五个步骤见 run()，由 runesBabelPlugin 对每个文件新建一个 */
export class RunesTransform {
  /** 不影响正确性、但多半不是作者本意的写法 */
  readonly warnings: RunesWarning[] = [];

  /** 第 1 步记录下的声明节点，第 2 步再换成作用域里的 Binding */
  private pending = new Map<t.VariableDeclarator, TrackedInfo>();
  private tracked = new Map<Binding, TrackedInfo>();
  private pendingRest = new Set<t.VariableDeclarator>();
  private rest = new Set<Binding>();
  private program: NodePath<t.Program>;
  private readonly filename: string | undefined;
  private readonly imports: RuntimeImports;
  private readonly optimize: boolean;

  constructor(program: NodePath<t.Program>, filename: string | undefined, optimize = true) {
    this.program = program;
    this.filename = filename;
    this.optimize = optimize;
    this.imports = new RuntimeImports(program);
  }

  /** 按顺序执行全部步骤，结果直接改在 Babel 的 AST 上 */
  run() {
    this.declareRunes(); //       1. 符文与 props 解构 → Vue API
    this.program.scope.crawl(); //   改写后重建作用域
    this.resolveBindings(); //    2. 声明节点 → 作用域里的绑定
    this.narrowReadonlyProps(); //   没被写过的 prop 用只读访问器
    this.rewriteAccesses(); //    3. 读写 → .value
    this.rewriteCalls(); //       4. _bind → v-model，_state.snapshot / _effect → 运行时函数
    this.reportMisuse(); //       5. 残留的符文都是误用
    if (this.optimize) {
      //                            6. 稳定插槽与缓存（optimize.ts）
      optimizeRender(this.program, {
        imports: this.imports,
        tracked: this.tracked,
        rest: this.rest,
      });
    }
    this.imports.insert();
  }

  // ───────────────────────── 1. 声明 ─────────────────────────

  private declareRunes() {
    this.program.traverse({
      Function: (path) => {
        if (!isPropsComponent(path)) return;
        declareProps(path, {
          imports: this.imports,
          filename: this.filename,
          track: (declarator, info) => this.pending.set(declarator, info),
          trackRest: (declarator) => this.pendingRest.add(declarator),
        });
      },
      JSXAttribute: (path) => rejectDirective(path),
      CallExpression: (path) => {
        const rune = runeOf(path);
        switch (rune) {
          case null:
          case '_toRef': // 这些不是声明，在第 3、4 步随引用一起处理
          case '_bind':
          case '_state.snapshot':
          case '_untrack':
          case '_effect':
          case '_effect.pre':
          case '_effect.root':
            return;
          case '_bindable':
            throw fail(
              path,
              '_bindable() 只能写在 _component 参数解构的默认值位置，例如 ({ checked = _bindable(false) })',
            );
          default:
            this.declareState(path, rune);
        }
      },
    });
  }

  /** let x = _state(0) 之类：把调用换成 Vue API，并记下声明 */
  private declareState(
    path: NodePath<t.CallExpression>,
    rune: '_state' | '_state.raw' | '_derived' | '_derived.by' | '_fromRef',
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
        // 一律是 ref。const 只表示不能整体替换，对象的属性照常可改（ref 内的对象是深层响应式的）
        if (kind === 'const' && isPrimitiveLiteral(arg)) {
          throw fail(path, 'const 声明的原始值无法修改，响应式状态请用 let');
        }
        requireIdentifier(declarator, rune);
        // export const settings = _state({...})（同 Svelte）：不会被整体替换，导出 ref 里的对象本身，
        // 即 reactive(...)；导入方读写它的属性都是响应式的
        if (kind === 'const' && declarator.parentPath.parentPath?.isExportNamedDeclaration()) {
          path.replaceWith(this.imports.vue('reactive', [initial]));
          return;
        }
        path.replaceWith(this.imports.vue('ref', [initial]));
        this.pending.set(declarator.node, { writable: kind === 'let', source: rune });
        return;
      }
      case '_state.raw': {
        if (kind !== 'let') throw fail(path, '_state.raw 只能用 let 声明（它只能整体替换）');
        requireIdentifier(declarator, rune);
        path.replaceWith(this.imports.vue('shallowRef', [initial]));
        this.pending.set(declarator.node, { writable: true, source: rune });
        return;
      }
      case '_derived':
      case '_derived.by': {
        // const：只读的 computed；let：可以临时覆盖，依赖变化后重新跟随（同 Svelte 5.25）
        if (!arg) throw fail(path, `${rune} 需要一个参数`);
        const getter = rune === '_derived' ? t.arrowFunctionExpression([], arg) : arg;
        const writable = kind === 'let';
        if (t.isObjectPattern(id) || t.isArrayPattern(id)) {
          this.declareDestructuredDerived(declarator, id, getter, rune, writable);
          return;
        }
        requireIdentifier(declarator, rune);
        path.replaceWith(this.derived(getter, writable));
        this.pending.set(declarator.node, { writable, source: rune });
        return;
      }
      case '_fromRef': {
        // 直接持有外部 Ref：let theme = _fromRef(useStorage(...))
        // 也支持解构一组 Ref：const { x, y } = _fromRef(useMouse())
        if (!arg) throw fail(path, '_fromRef 需要一个 Ref 或由 Ref 组成的对象');
        if (!t.isIdentifier(id) && !t.isObjectPattern(id)) {
          throw fail(path, '_fromRef 的结果请赋给一个变量或对象解构');
        }
        path.replaceWith(arg);
        this.pending.set(declarator.node, { writable: kind === 'let', source: rune });
        return;
      }
    }
  }

  /**
   * 解构派生（同 Svelte 5）：每个变量各自是一个派生值。
   *
   *   const { name, tags: [first] } = _derived(user)
   *   ↓
   *   const _derivedSource = computed(() => user)
   *   const name = computed(() => { const { name, tags: [first] } = _derivedSource.value; return name })
   *   const first = computed(() => { const { name, tags: [first] } = _derivedSource.value; return first })
   *
   * 每个变量都按原样重新解构一次，默认值、嵌套与 ...rest 因此与普通解构完全一致。
   * let 声明时每个变量都可以临时覆盖。
   */
  private declareDestructuredDerived(
    declarator: NodePath<t.VariableDeclarator>,
    pattern: t.ObjectPattern | t.ArrayPattern,
    getter: t.Expression,
    rune: Rune,
    writable: boolean,
  ) {
    const source = declarator.scope.generateUidIdentifier('derivedSource');
    const sourceValue = () => t.memberExpression(t.identifier(source.name), t.identifier('value'));
    const declarators = [t.variableDeclarator(source, this.imports.vue('computed', [getter]))];
    for (const name of Object.keys(t.getBindingIdentifiers(pattern))) {
      const pick = t.arrowFunctionExpression(
        [],
        t.blockStatement([
          t.variableDeclaration('const', [
            t.variableDeclarator(t.cloneNode(pattern), sourceValue()),
          ]),
          t.returnStatement(t.identifier(name)),
        ]),
      );
      const derived = t.variableDeclarator(t.identifier(name), this.derived(pick, writable));
      this.pending.set(derived, { writable, source: rune });
      declarators.push(derived);
    }
    declarator.replaceWithMultiple(declarators);
  }

  /** 只读派生 → computed；可覆盖的派生 → overridable */
  private derived(getter: t.Expression, writable: boolean) {
    return writable
      ? this.imports.runtime('overridable', [getter])
      : this.imports.vue('computed', [getter]);
  }

  // ───────────────────────── 2. 绑定 ─────────────────────────

  private resolveBindings() {
    this.program.traverse({
      VariableDeclarator: (path) => {
        if (this.pendingRest.has(path.node) && t.isIdentifier(path.node.id)) {
          this.rest.add(path.scope.getBinding(path.node.id.name)!);
        }
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
              `不能导出会被整体替换的响应式变量 ${name}：导入方只会拿到一个值。共享对象请写 export const ${name} = _state({...})，或导出读写函数`,
            );
          }
        }
      },
    });
  }

  /**
   * 组件里没赋值过、也没交给 _toRef / _bind（拿到 Ref 的一方可能写入）的普通 prop，
   * 换成只读访问器 readonlyProp：不建可覆盖所需的 computed、customRef 与 watch（runtime/props.ts）
   */
  private narrowReadonlyProps() {
    for (const [binding, info] of this.tracked) {
      if (info.source !== 'prop' || info.childrenOf || binding.constantViolations.length) continue;
      const escapes = binding.referencePaths.some((reference) => {
        const parent = reference.parentPath;
        const rune = parent?.isCallExpression() ? runeOf(parent) : null;
        return rune === '_toRef' || rune === '_bind';
      });
      const init = (binding.path.node as t.VariableDeclarator).init;
      if (escapes || !t.isCallExpression(init)) continue;
      this.imports.retarget(init, 'prop', 'readonlyProp');
      // 默认值是字面量（'md'、false、0）时直接传值：不用惰性求值，运行时也不必缓存
      const fallback = init.arguments[2];
      if (t.isArrowFunctionExpression(fallback) && isConstantLiteral(fallback.body)) {
        init.arguments[2] = fallback.body;
      }
    }
  }

  // ───────────────────────── 3. 读写 ─────────────────────────

  private rewriteAccesses() {
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
    const name = binding.identifier.name;

    // _toRef(x)：取回背后的 Ref 本身
    if (
      parent.isCallExpression() &&
      runeOf(parent) === '_toRef' &&
      parent.node.arguments[0] === reference.node
    ) {
      parent.replaceWith(t.identifier(name));
      return;
    }
    if (parent.isCallExpression() && runeOf(parent) === '_bind' && !info.writable) {
      throw fail(reference, `${readonlyMessage(binding, info)}，不能用 _bind 双向绑定`);
    }
    if (info.childrenOf && reference.getFunctionParent()?.node === info.childrenOf) {
      throw fail(
        reference,
        `${name} 是父级传入的内容，读取时才生成；请在渲染函数或回调里读取，不要直接写在组件函数体中`,
      );
    }
    if (parent.isExportSpecifier()) throw fail(reference, `不能导出响应式变量 ${name}`);
    // watch(form, cb) 传进去的是当前值：原始值 TypeScript 会报错，对象则悄悄监听旧对象，整体替换后失效
    if (isVueWatchSource(reference)) {
      throw fail(
        reference,
        `watch 的监听源请写成 getter：watch(() => ${name}, …)；需要 Ref 时写 watch(_toRef(${name}), …)`,
      );
    }

    const owner = reference.getFunctionParent();
    // _untrack(x) 明确表示只要当前值，不警告
    if (owner && isComponentSetup(owner) && !isInsideUntrack(reference)) {
      this.warnings.push(
        warning(
          reference,
          `${name} 在组件函数体里直接读取，只拿到当前值、之后不会更新；需要跟随变化请放进渲染函数、回调或 _derived`,
        ),
      );
    }
    // <List>{children}</List>：JSX 编译器只对标识符子节点判断"是不是插槽函数"，
    // 改写成 x.value 会被当成普通内容；换成调用 unref(x) 才能把渲染函数原样转交
    if (isComponentChild(parent)) {
      reference.replaceWith(this.imports.vue('unref', [t.identifier(name)]));
      return;
    }
    replaceWithValue(reference);
  }

  // ───────────────────────── 4. 其余符文调用 ─────────────────────────

  private rewriteCalls() {
    this.program.traverse({
      CallExpression: (path) => {
        const rune = runeOf(path);
        if (rune === '_bind') rewriteBind(path);
        if (rune === '_state.snapshot') {
          path.replaceWith(this.imports.runtime('snapshot', [singleArgument(path, rune)]));
        }
        if (rune === '_untrack') {
          const read = t.arrowFunctionExpression([], singleArgument(path, rune));
          path.replaceWith(this.imports.runtime('untrack', [read]));
        }
        if (rune === '_effect' || rune === '_effect.pre' || rune === '_effect.root') {
          this.rewriteEffect(path, rune);
        }
      },
    });
  }

  /**
   * _effect(fn) → effect(fn)，_effect.pre(fn) → effect(fn, 'pre')，_effect.root(fn) → effectRoot(fn)。
   * 读写已在第 3 步改成 .value，effect 里读到的响应式变量自然成为依赖。
   */
  private rewriteEffect(
    path: NodePath<t.CallExpression>,
    rune: '_effect' | '_effect.pre' | '_effect.root',
  ) {
    const fn = singleArgument(path, rune);
    if (isInsideRender(path)) {
      throw fail(
        path,
        `${rune} 写在渲染函数里，每次重新渲染都会重新创建；请移到组件函数体中 return 之前`,
      );
    }
    if (rune === '_effect.root') {
      path.replaceWith(this.imports.runtime('effectRoot', [fn]));
      return;
    }
    if (!path.parentPath.isExpressionStatement()) {
      throw fail(path, `${rune}() 没有返回值，请单独写成一条语句`);
    }
    const args = rune === '_effect.pre' ? [fn, t.stringLiteral('pre')] : [fn];
    path.replaceWith(this.imports.runtime('effect', args));
  }

  // ───────────────────────── 5. 误用检查 ─────────────────────────

  private reportMisuse() {
    this.program.traverse({
      Identifier(path) {
        const { name } = path.node;
        if (!RUNE_GLOBALS.has(name) || path.scope.hasBinding(name)) return;
        if (!path.isReferencedIdentifier() || isInTypePosition(path)) return;
        switch (name) {
          case '_toRef':
            throw fail(
              path,
              '_toRef(x) 的参数必须是 _state / _derived / _bindable / _fromRef 声明的变量',
            );
          case '_bind':
            throw fail(
              path,
              '_bind 只能在 JSX 属性的值里直接调用，例如 <Switch checked={_bind(on)} />',
            );
          default:
            throw fail(path, `${name} 只能按约定的位置直接调用，不能当作普通值使用`);
        }
      },
    });
  }
}

/** 引用位于 _untrack(…) 的参数里（第 3 步时调用还没改写） */
function isInsideUntrack(path: NodePath) {
  return !!path.findParent((parent) => parent.isCallExpression() && runeOf(parent) === '_untrack');
}

/** _state.snapshot(x)、_effect(fn) 这类只接受一个参数的符文 */
function singleArgument(path: NodePath<t.CallExpression>, rune: Rune) {
  const args = path.node.arguments;
  if (args.length !== 1 || !t.isExpression(args[0])) throw fail(path, rune + '() 只接受一个参数');
  return args[0];
}

function requireIdentifier(declarator: NodePath<t.VariableDeclarator>, rune: Rune) {
  if (!t.isIdentifier(declarator.node.id)) {
    throw fail(declarator, `${rune} 不能解构声明：解构得到的是快照。请先声明变量，再读取属性`);
  }
}

/** 只读绑定被写入时的提示：prop 建议改用 _bindable，符文直接说明来源 */
function readonlyMessage(binding: Binding, info: TrackedInfo) {
  const name = binding.identifier.name;
  if (info.source === '_state' || info.source === '_fromRef') {
    return `${name} 用 const 声明，不能整体替换（属性照常可改）；需要替换请用 let`;
  }
  return `${name} 来自 ${info.source}，是只读的`;
}

/** 不引用任何变量的原始值字面量：'md'、0、-1、false、null、1n、不含插值的模板字符串 */
function isConstantLiteral(node: t.Node): node is t.Expression {
  if (t.isUnaryExpression(node, { operator: '-' })) return t.isNumericLiteral(node.argument);
  if (t.isTemplateLiteral(node)) return node.expressions.length === 0;
  return (
    t.isStringLiteral(node) ||
    t.isNumericLiteral(node) ||
    t.isBooleanLiteral(node) ||
    t.isNullLiteral(node) ||
    t.isBigIntLiteral(node)
  );
}

/** 0、'x'、true、null、模板字符串、undefined 或不传参数：const 声明这类初始值就永远改不了 */
function isPrimitiveLiteral(node: t.Expression | undefined) {
  if (!node || t.isIdentifier(node, { name: 'undefined' })) return true;
  return (
    t.isNumericLiteral(node) ||
    t.isStringLiteral(node) ||
    t.isBooleanLiteral(node) ||
    t.isNullLiteral(node) ||
    t.isBigIntLiteral(node) ||
    t.isTemplateLiteral(node)
  );
}
