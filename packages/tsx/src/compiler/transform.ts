/** 一个文件的编译流程：按顺序执行 run() 里的各步 */
import { types as t, type NodePath } from '@babel/core';
import type { Binding } from '@babel/traverse';
import {
  findDeclarator,
  isAttached,
  isComponentChild,
  isComponentSetup,
  isInsideRender,
  isInTypePosition,
  isPropsComponent,
  replaceWithValue,
  writeTargets,
} from './ast.ts';
import { rejectDirective, rewriteBind } from './bind.ts';
import { fail, warning, type RunesWarning } from './errors.ts';
import { RuntimeImports } from './imports.ts';
import { declareProps } from './props.ts';
import { RUNE_GLOBALS, runeOf, type Rune, type TrackedInfo } from './runes.ts';

export class RunesTransform {
  /** 不影响正确性、但多半不是作者本意的写法 */
  readonly warnings: RunesWarning[] = [];

  /** 第 1 步记录下的声明节点，第 2 步再换成作用域里的 Binding */
  private pending = new Map<t.VariableDeclarator, TrackedInfo>();
  private tracked = new Map<Binding, TrackedInfo>();
  private program: NodePath<t.Program>;
  private filename: string | undefined;
  private imports: RuntimeImports;

  constructor(program: NodePath<t.Program>, filename: string | undefined) {
    this.program = program;
    this.filename = filename;
    this.imports = new RuntimeImports(program);
  }

  run() {
    this.declareRunes(); //       1. 符文与 props 解构 → Vue API
    this.program.scope.crawl(); //   改写后重建作用域
    this.resolveBindings(); //    2. 声明节点 → 作用域里的绑定
    this.rewriteAccesses(); //    3. 读写 → .value
    this.rewriteBinds(); //       4. 属性={_bind(x)} → v-model
    this.reportMisuse(); //       5. 残留的符文都是误用
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
        });
      },
      JSXAttribute: (path) => rejectDirective(path),
      CallExpression: (path) => {
        const rune = runeOf(path);
        switch (rune) {
          case null:
          case '_toRef': // _toRef(x) 与 _bind(x) 在第 3、4 步随引用一起处理
          case '_bind':
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
    rune: Exclude<Rune, '_bindable' | '_bind' | '_toRef'>,
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
        if (kind !== 'const') throw fail(path, `${rune} 是只读的，请用 const 声明`);
        if (!arg) throw fail(path, `${rune} 需要一个参数`);
        const getter = rune === '_derived' ? t.arrowFunctionExpression([], arg) : arg;
        if (t.isObjectPattern(id) || t.isArrayPattern(id)) {
          this.declareDestructuredDerived(declarator, id, getter, rune);
          return;
        }
        requireIdentifier(declarator, rune);
        path.replaceWith(this.imports.vue('computed', [getter]));
        this.pending.set(declarator.node, { writable: false, source: rune });
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
   */
  private declareDestructuredDerived(
    declarator: NodePath<t.VariableDeclarator>,
    pattern: t.ObjectPattern | t.ArrayPattern,
    getter: t.Expression,
    rune: Rune,
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
      const derived = t.variableDeclarator(
        t.identifier(name),
        this.imports.vue('computed', [pick]),
      );
      this.pending.set(derived, { writable: false, source: rune });
      declarators.push(derived);
    }
    declarator.replaceWithMultiple(declarators);
  }

  // ───────────────────────── 2. 绑定 ─────────────────────────

  private resolveBindings() {
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
              `不能直接导出响应式变量 ${name}：导入方只会拿到一个值。跨文件共享状态请用 pinia 或组合式函数，或导出读写函数`,
            );
          }
        }
      },
    });
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

    const owner = reference.getFunctionParent();
    if (owner && isComponentSetup(owner)) {
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

  // ───────────────────────── 4. 双向绑定 ─────────────────────────

  private rewriteBinds() {
    this.program.traverse({
      CallExpression: (path) => {
        if (runeOf(path) === '_bind') rewriteBind(path);
      },
    });
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

function requireIdentifier(declarator: NodePath<t.VariableDeclarator>, rune: Rune) {
  if (!t.isIdentifier(declarator.node.id)) {
    throw fail(declarator, `${rune} 不能解构声明：解构得到的是快照。请先声明变量，再读取属性`);
  }
}

/** 只读绑定被写入时的提示：prop 建议改用 _bindable，符文直接说明来源 */
function readonlyMessage(binding: Binding, info: TrackedInfo) {
  const name = binding.identifier.name;
  if (info.source === 'prop') {
    return `prop ${name} 是只读的；需要在组件内修改并同步给父级，请写成 ${name} = _bindable(默认值)`;
  }
  if (info.source === '_state' || info.source === '_fromRef') {
    return `${name} 用 const 声明，不能整体替换（属性照常可改）；需要替换请用 let`;
  }
  return `${name} 来自 ${info.source}，是只读的`;
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
