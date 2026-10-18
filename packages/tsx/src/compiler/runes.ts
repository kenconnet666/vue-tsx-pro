/** 符文的名单与识别 */
import { types as t, type NodePath } from '@babel/core';
import { fail } from './errors.ts';

export type Rune =
  | '_state'
  | '_state.raw'
  | '_state.snapshot'
  | '_derived'
  | '_derived.by'
  | '_effect'
  | '_effect.pre'
  | '_effect.root'
  | '_bindable'
  | '_bind'
  | '_fromRef'
  | '_toRef';

/** 所有符文的全局名；只有未被本地变量遮蔽时才当作符文 */
export const RUNE_GLOBALS = new Set([
  '_state',
  '_derived',
  '_effect',
  '_bindable',
  '_bind',
  '_fromRef',
  '_toRef',
]);

/** 带成员的符文 */
const MEMBER_RUNES = new Set<Rune>([
  '_state.raw',
  '_state.snapshot',
  '_derived.by',
  '_effect.pre',
  '_effect.root',
]);

/** _bind 的修饰符，与 Vue v-model 的修饰符一致，只用于原生输入元素 */
const BIND_MODIFIERS = new Set(['trim', 'number', 'lazy']);

/** 判断调用是否为某个符文（且没有被同名本地变量遮蔽） */
export function runeOf(path: NodePath<t.CallExpression>): Rune | null {
  const chain = memberChain(path.node.callee);
  if (!chain) return null;
  const [owner, ...members] = chain as [string, ...string[]];
  if (!RUNE_GLOBALS.has(owner) || path.scope.hasBinding(owner)) return null;
  if (!members.length) return owner as Rune;
  if (owner === '_bind') {
    const unknown = members.find((member) => !BIND_MODIFIERS.has(member));
    if (unknown) throw fail(path, `不支持 _bind.${unknown}，可用的修饰符只有 trim、number、lazy`);
    return '_bind';
  }
  const name = `${owner}.${members.join('.')}` as Rune;
  if (MEMBER_RUNES.has(name)) return name;
  throw fail(path, `不支持 ${name}，可用的只有 ${[...MEMBER_RUNES].join('、')} 与 _bind 的修饰符`);
}

/** a.b.c → ['a', 'b', 'c']；不是纯标识符链时返回 null */
export function memberChain(node: t.Node): string[] | null {
  if (t.isIdentifier(node)) return [node.name];
  if (t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.property)) {
    const chain = memberChain(node.object);
    return chain && [...chain, node.property.name];
  }
  return null;
}

/** 一个需要把读写改写为 .value 的变量：符文声明的变量，或组件 props 解构出的变量 */
export interface TrackedInfo {
  writable: boolean;
  /** 报错时告诉作者它来自哪里：某个符文，或组件 prop */
  source: Rune | 'prop';
  /** children 的所属组件：读取会执行插槽，不能直接写在 setup 函数体里 */
  childrenOf?: t.Function;
}
