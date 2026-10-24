/**
 * 条件键：伪类（':hover'、css.when.* 生成的键）、@ 规则（'@media (…)'、'@supports (…)'、'@container (…)'），
 * 还可以写属性选择器（'[data-hot]'、'[data-state="open"]'）：状态写在 DOM 属性上，变化时只改属性
 */
type Condition = `:${string}` | `@${string}` | `[${string}]`;

/**
 * 一个 CSS 属性的取值，同 StyleX：
 *   - 普通值：`padding: 8`
 *   - 按条件取值，必须有 default：`color: { default: 'black', ':hover': 'blue' }`，条件可以嵌套
 *   - 回退值数组：`display: ['grid', 'flex']`（浏览器用第一个支持的）
 */
export type StyleValue<V> =
  | V
  | ReadonlyArray<V>
  | Readonly<{ default: StyleValue<V>; [condition: Condition]: StyleValue<V> }>;

/**
 * 只接受固定几个关键字的属性（StyleX 的取值类型 V 是字面量联合）：接受的值与 V 完全相同，
 * K 的每个键是 V 里的一个关键字，键上的注释在悬停取值时显示（WebStorm 把字符串字面量解析到 keyof 的键上）
 */
export type KeywordValue<K, V> = keyof K | Exclude<V, keyof K>;

/**
 * 接受任意字符串的属性：V 里 string 以外的部分（数字、null）加上 OpenString。
 * 生成的类型再并上各段语法的关键字与主题 token（`keyof LineStyleKeywords`），补全与悬停说明都来自那些键
 */
export type OpenValue<V> = Exclude<V, string> | OpenString;

/**
 * 接受任意字符串、但不吸收同一联合里的字面量。不能直接写 `string & {}`：
 * 在泛型实例化里 TypeScript 会把它化简成 string（实测 6.0），关键字就丢了；具名别名不会被化简。
 */
type OpenString = string & Record<never, never>;
