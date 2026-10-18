/** 编译产物用到的运行时函数：按需生成不冲突的本地名，最后每个模块合成一条 import */
import { types as t, type NodePath } from '@babel/core';

/** 编译产物里 prop / bindable 等运行时函数的来源 */
const RUNTIME_MODULE = '@vue-tsx-pro/tsx';

type VueHelper = 'ref' | 'shallowRef' | 'reactive' | 'computed' | 'unref';
type RuntimeHelper =
  | 'prop'
  | 'childrenProp'
  | 'bindable'
  | 'restProps'
  | 'overridable'
  | 'snapshot'
  | 'effect'
  | 'effectRoot';

/** 编译时用到的 Vue 与本包运行时函数：按需生成带前缀的本地名，最后统一插入 import */
export class RuntimeImports {
  /** `模块:名称` → 导入项 */
  private entries = new Map<string, { module: string; name: string; local: t.Identifier }>();

  private program: NodePath<t.Program>;

  constructor(program: NodePath<t.Program>) {
    this.program = program;
  }

  /** 调用 Vue 的响应式 API：vue('ref', [init]) → _vue_ref(init) */
  vue(name: VueHelper, args: t.Expression[]) {
    return this.call('vue', name, args);
  }

  /** 调用本包的运行时函数：runtime('prop', [...]) → _vtp_prop(...) */
  runtime(name: RuntimeHelper, args: t.Expression[]) {
    return this.call(RUNTIME_MODULE, name, args);
  }

  /** 把用到的导入按模块插到文件开头；所有改写完成后调用一次 */
  insert() {
    const byModule = new Map<string, t.ImportSpecifier[]>();
    for (const { module, name, local } of this.entries.values()) {
      const specifiers = byModule.get(module) ?? [];
      specifiers.push(t.importSpecifier(t.identifier(local.name), t.identifier(name)));
      byModule.set(module, specifiers);
    }
    for (const [module, specifiers] of byModule) {
      this.program.unshiftContainer(
        'body',
        t.importDeclaration(specifiers, t.stringLiteral(module)),
      );
    }
  }

  private call(module: string, name: string, args: t.Expression[]) {
    const id = `${module}:${name}`;
    let entry = this.entries.get(id);
    if (!entry) {
      // 生成不冲突的本地名，例如 _vue_ref、_vtp_prop
      const prefix = module === 'vue' ? 'vue' : 'vtp';
      entry = {
        module,
        name,
        local: this.program.scope.generateUidIdentifier(`${prefix}_${name}`),
      };
      this.entries.set(id, entry);
    }
    return t.callExpression(t.identifier(entry.local.name), args);
  }
}
