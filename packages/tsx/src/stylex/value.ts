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
