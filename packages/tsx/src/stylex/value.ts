/** 条件键：伪类（':hover'、stylex.when.* 生成的键）或 @ 规则（'@media (…)'、'@supports (…)'、'@container (…)'） */
type Condition = `:${string}` | `@${string}`;

/**
 * 一个 CSS 属性的取值，与 StyleX 编译器接受的写法一致：
 *   - 普通值：`padding: 8`
 *   - 按条件取值，必须有 default：`color: { default: 'black', ':hover': 'blue' }`，条件可以嵌套
 *   - 回退值数组：`display: ['grid', 'flex']`（推荐改用 stylex.firstThatWorks）
 */
export type StyleValue<V> =
  | V
  | ReadonlyArray<V>
  | Readonly<{ default: StyleValue<V>; [condition: Condition]: StyleValue<V> }>;

/**
 * 带说明的关键字取值，接受的值与 StyleX 的取值类型 V 完全相同。
 * K 的每个键是一个关键字，键上的注释在悬停取值时显示（WebStorm 把字符串字面量解析到 keyof 的键上）。
 * V 含 string 时改写成 `string & {}`，否则关键字会被 string 吸收，失去补全与说明。
 */
export type KeywordValue<K, V> =
  keyof K | (string extends V ? Exclude<V, string> | (string & {}) : Exclude<V, keyof K>);
