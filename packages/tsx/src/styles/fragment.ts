/**
 * 片段与组合类：create 的每个命名空间是一个片段（声明表）；attrs 把一个元素的片段合成一个类，第一次出现时插入规则。
 * 记下“组合类 ← 片段”的关系，热更新换了片段的声明时按原类名改写规则。
 */
import {
  familyOf,
  hasCoveringDefault,
  merge,
  serialize,
  SELF,
  type Declarations,
  type PropertyEntry,
} from './declarations';
import { hash, insert, isInserted } from './sheet';

/** 片段上的声明表 */
export const FRAGMENT = Symbol('style fragment');
/** 固定类（createTheme 的主题类、defineMarker 的标记类）上的 [去重键, 类名] */
export const CLASS = Symbol('style class');
/** 动态样式的结果（[片段, 行内变量]）的标记 */
export const DYNAMIC = Symbol('style dynamic');
/** css.bind 的结果的标记 */
export const BINDING = Symbol('style binding');
/** 动态样式函数上的求值入口 */
export const EVALUATE = Symbol('style evaluate');

/** 绑定算一次的结果：参与组合的一段样式（动态样式的片段只随形状变）与行内变量 */
export interface Evaluated {
  /** 这一段样式：动态样式的片段（值变过的属性写成 var(--x-属性)，没变过的写死），或 css.select 选中的样式 */
  readonly part: StylePart;
  /** 行内变量：变量名 → 这次的值 */
  readonly inline: Readonly<Record<string, string>>;
}
/** 绑定求值的入口：动态样式、css.select 的选择 */
export interface Evaluator {
  /** 按参数求值（有记忆），attrs 与元素上的绑定用 */
  readonly [EVALUATE]: (args: readonly unknown[]) => Evaluated;
}
/** create 里的函数：调用得到 [片段, 行内变量] */
export interface DynamicStyle extends Evaluator {
  (...args: never[]): readonly [StylePart, Readonly<Record<string, string>>];
}

/** create 的一个命名空间（对外的类型是 CompiledStyles） */
export interface Fragment {
  /** 声明表；热更新时换成新的 */
  readonly [FRAGMENT]: Declarations;
}
/** 固定类：同一去重键（主题的变量组、标记名）在一次 attrs 里后者覆盖前者 */
export interface ClassStyle {
  /** [去重键, 类名] */
  readonly [CLASS]: readonly [key: string, className: string];
}

/** 参与组合的一段样式：片段，或固定类（主题、标记） */
export type StylePart = Fragment | ClassStyle;

/** 一个响应式绑定：动态样式（或 css.select 的选择）与读参数的函数 */
export interface Binding {
  /** 标记：attrs 据此认出绑定 */
  readonly [BINDING]: true;
  /** 绑定的动态样式，或 css.select 的选择 */
  readonly style: Evaluator;
  /** 读参数的函数：effect 里调用，读到的响应式值变化时重新求值 */
  readonly args: () => readonly unknown[];
  /** 读取函数只读渲染函数外面的来源（编译器判断）：重新渲染时换上新的读取函数即可，不必重跑 effect */
  readonly stable: boolean;
}

/** 新的片段；声明表可写：热更新时换成新的（hotStyles），片段对象本身不变，用到它的缓存、已渲染的类照样有效 */
export const fragment = (table: Declarations): Fragment =>
  Object.defineProperty({}, FRAGMENT, { value: table, writable: true }) as Fragment;

/** 是 create 产出的片段 */
export const isFragment = (value: unknown): value is Fragment =>
  typeof value === 'object' && value !== null && FRAGMENT in value;

/**
 * 一个元素的样式按合并来源分段（组件自己的、每层定制、使用方的 sx……，见 runtime.ts 的 layers），每段一个组合类，
 * 第 k 段的规则在级联层 vtp.s{k}：后面的段不论特异性都盖过前面的段，组合数随段相加而不是相乘。
 *
 * 语义与把全部片段合成一个类逐字相同：第 k 段（k > 0）输出它改到的属性所在的属性族（declarations.ts 的 familyOf）
 * 在前 k + 1 段合并后的完整取值，含它没改的条件值。这样每个属性族最高的那一层里总有这一族完整的合并结果，
 * 层里按条件、按属性优先级排出的规则与单个组合类相同。
 * 还有一处要补：层叠时高层在某个状态下没有规则，就轮到低层的规则——单个组合类里被后来的普通值、null 换掉的条件值
 * 会从低层“漏”上来。所以后段里没有无条件取值、而前面的段写过的属性，补一条无条件的 revert（回到浏览器默认，
 * 同“引擎没写这个属性”）；去掉的属性（顶层的 null）同样写成 revert
 */
export interface Segment {
  /** 这个元素的全部段（每段的片段） */
  readonly segments: readonly (readonly Fragment[])[];
  /** 这个类是第几段 */
  readonly index: number;
}

/** 组合类 → 它是哪一组片段的第几段；片段 → 用到它的组合类（热更新改了片段时据此改写规则，带入过它的后段一起改） */
const composites = new Map<string, Segment>();
const usedBy = new WeakMap<Fragment, Set<string>>();

const tablesOf = (fragments: readonly Fragment[]) => fragments.map((part) => part[FRAGMENT]);

/** 第 index 段的声明表（见文件这一节开头的说明） */
export function segmentTable(segments: Segment['segments'], index: number): Declarations {
  const own = merge(tablesOf(segments[index]!));
  if (index === 0) return own;
  const families = new Set([...own.keys()].map(familyOf));
  const earlier = segments.slice(0, index).flatMap(tablesOf);
  const prefix = merge([...earlier, ...tablesOf(segments[index]!)]);
  const table = new Map<string, PropertyEntry>();
  for (const [property, entry] of prefix) {
    if (!families.has(familyOf(property))) continue;
    // 没有无条件取值、前面的段又写过它：补一条无条件的 revert，挡住低层的规则（见上面的说明）；
    // 这一层有无条件的简写重设它时不补（简写已经盖住了低层，revert 反而会盖掉简写给的值）
    const blocked =
      !entry.values.has('') &&
      earlier.some((part) => part.has(property)) &&
      !hasCoveringDefault(prefix, property);
    table.set(
      property,
      blocked
        ? { replace: entry.replace, values: new Map([['', REVERT], ...entry.values]) }
        : entry,
    );
  }
  return table;
}
const REVERT = ['revert'];

/** 第 index 段的组合类：类名是规则内容（与段号）的哈希，第一次出现时插入到它的层里；没有声明时为空 */
export function segmentClass(segments: Segment['segments'], index: number): string {
  const rules = serialize(segmentTable(segments, index));
  if (!rules.length) return '';
  // 第 0 段的类名与不分段时相同；后面的段带上段号，同样的规则在不同的层里是不同的类
  const name = `x${hash(index ? `${index}|${rules.join('')}` : rules.join(''))}`;
  if (!isInserted(name))
    insert(
      name,
      rules.map((rule) => rule.replaceAll(SELF, name)),
      index,
    );
  if (!composites.has(name)) {
    composites.set(name, { segments, index });
    for (const part of segments.slice(0, index + 1).flat()) {
      let names = usedBy.get(part);
      if (!names) usedBy.set(part, (names = new Set()));
      names.add(name);
    }
  }
  return name;
}

/** 组合类是哪一组片段的第几段；不是引擎生成的组合类时 undefined（小程序按它展开成行内样式，见 inline.ts） */
export const compositeOf = (name: string): Segment | undefined => composites.get(name);

/** 片段换成新的声明表，用到它的组合类按原类名、原来的层重写规则 */
export function replaceFragment(target: Fragment, table: Declarations) {
  (target as { [FRAGMENT]: Declarations })[FRAGMENT] = table;
  for (const name of usedBy.get(target) ?? []) {
    const { segments, index } = composites.get(name)!;
    insert(
      name,
      serialize(segmentTable(segments, index)).map((rule) => rule.replaceAll(SELF, name)),
      index,
    );
  }
}
