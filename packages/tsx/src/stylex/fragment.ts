/**
 * 片段与组合类：create 的每个命名空间是一个片段（声明表）；attrs 把一个元素的片段合成一个类，第一次出现时插入规则。
 * 记下“组合类 ← 片段”的关系，热更新换了片段的声明时按原类名改写规则。
 */
import { merge, serialize, SELF, type Declarations } from './declarations';
import { hash, insert, isInserted } from './sheet';

/** 片段上的声明表 */
export const FRAGMENT = Symbol('stylex fragment');
/** createTheme 的结果上的 [变量组, 主题类] */
export const THEME = Symbol('stylex theme');
/** 动态样式的结果（[片段, 行内变量]）的标记 */
export const DYNAMIC = Symbol('stylex dynamic');
/** stylex.bind 的结果的标记 */
export const BINDING = Symbol('stylex binding');
/** 动态样式函数上的求值入口 */
export const EVALUATE = Symbol('stylex evaluate');

/** 动态样式算一次的结果：片段（只随形状变）与行内变量 */
export interface Evaluated {
  readonly fragment: Fragment;
  readonly inline: Readonly<Record<string, string>>;
}
/** create 里的函数：调用得到 [片段, 行内变量]；EVALUATE 给 attrs 与绑定用 */
export interface DynamicStyle {
  (...args: never[]): readonly [Fragment, Readonly<Record<string, string>>];
  readonly [EVALUATE]: (args: readonly unknown[]) => Evaluated;
}

/** create 的一个命名空间（对外的类型是 CompiledStyles，$$css 让它能和编译版的样式一起传） */
export interface Fragment {
  readonly $$css: true;
  readonly [FRAGMENT]: Declarations;
}
/** createTheme 的结果：变量组 → 主题类 */
export interface ThemeStyle {
  readonly $$css: true;
  readonly [THEME]: readonly [group: string, className: string];
}

/** 一个响应式绑定：动态样式与读参数的函数 */
export interface Binding {
  readonly [BINDING]: true;
  readonly style: DynamicStyle;
  readonly args: () => readonly unknown[];
  /** 读取函数只读渲染函数外面的来源（编译器判断）：重新渲染时换上新的读取函数即可，不必重跑 effect */
  readonly stable: boolean;
}

/** 新的片段；声明表可写：热更新时换成新的（hotStyles），片段对象本身不变，用到它的缓存、已渲染的类照样有效 */
export const fragment = (table: Declarations): Fragment =>
  Object.defineProperty({ $$css: true }, FRAGMENT, { value: table, writable: true }) as Fragment;

/** 是 create 产出的片段 */
export const isFragment = (value: unknown): value is Fragment =>
  typeof value === 'object' && value !== null && FRAGMENT in value;

/** 组合类 → 组成它的片段；片段 → 用到它的组合类（热更新改了片段时据此改写规则） */
const composites = new Map<string, readonly Fragment[]>();
const usedBy = new WeakMap<Fragment, Set<string>>();

/** 组合一组片段：类名是规则内容的哈希，第一次出现时插入 */
export function composite(fragments: readonly Fragment[]): string {
  const rules = serialize(merge(fragments.map((part) => part[FRAGMENT])));
  if (!rules.length) return '';
  const name = `x${hash(rules.join(''))}`;
  if (!isInserted(name))
    insert(
      name,
      rules.map((rule) => rule.replaceAll(SELF, name)),
    );
  if (!composites.has(name)) {
    composites.set(name, fragments);
    for (const part of fragments) {
      let names = usedBy.get(part);
      if (!names) usedBy.set(part, (names = new Set()));
      names.add(name);
    }
  }
  return name;
}

/** 片段换成新的声明表，用到它的组合类按原类名重写规则 */
export function replaceFragment(target: Fragment, table: Declarations) {
  (target as { [FRAGMENT]: Declarations })[FRAGMENT] = table;
  for (const name of usedBy.get(target) ?? []) {
    const fragments = composites.get(name)!;
    const rules = serialize(merge(fragments.map((part) => part[FRAGMENT])));
    insert(
      name,
      rules.map((rule) => rule.replaceAll(SELF, name)),
    );
  }
}
