// 样式入口的类型：合法写法通过，拼错的属性、类型不对的值、缺 default 的条件值报错；
// 每个属性接受的值与 CSS 类型表（css-properties.ts）一个不多、一个不少
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { CSSProperties } from '../src/stylex/css-properties';

const vars = stylex.defineVars('vars', {
  accent: '#3e63dd',
  speed: { default: '200ms', '@media (x)': '0ms' },
});

export const documented = stylex.create({
  plain: { display: 'flex', padding: 8, gap: '0.5em', lineHeight: 1.5 },
  conditional: { color: { default: 'black', ':hover': 'blue', '@media (min-width: 40em)': 'red' } },
  nested: {
    color: { default: 'black', '@media (min-width: 40em)': { default: 'red', ':hover': 'blue' } },
  },
  pseudoElement: { '::placeholder': { color: 'gray' } },
  token: { color: vars.accent },
  fallback: { height: ['100vh', '100dvh'] },
  // 设置变量的值：变量组的 token 作为计算属性键
  setVar: { [vars.accent]: 'red' },
});

// 返回值、主题、标记都能交给 attrs 与 StyleXStyles 类型的 prop
const theme = stylex.createTheme(vars, { accent: 'red' });
const marker = stylex.defineMarker('test-marker');
export const merged = stylex.attrs(documented.plain, false, theme, marker, [
  documented.conditional,
]);
export const asProp: stylex.StyleXStyles = [documented.plain, theme, marker];
export const related = stylex.create({
  link: { opacity: { default: 0, [stylex.when.ancestor(':hover', marker)]: 1 } },
});
// @ts-expect-error 主题只能覆盖这组变量里有的 token
stylex.createTheme(vars, { missing: 'red' });

// 动态样式：保留参数类型
const dynamic = stylex.create({ base: { padding: 4 }, size: (width: number) => ({ width }) });
export const [sized, inline] = dynamic.size(10);
// @ts-expect-error 参数类型是 number
dynamic.size('10');

// 每个属性接受的值与 CSS 类型表一个不多、一个不少（带说明的关键字取值只换了写法）
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Drift = {
  [P in keyof CSSProperties]-?: Same<
    stylex.DocumentedStyles[P],
    stylex.StyleValue<CSSProperties[P]> | undefined
  > extends true
    ? never
    : P;
}[keyof CSSProperties];
export const noDrift: [Drift] extends [never] ? true : Drift = true;

// @ts-expect-error 拼错的属性名
stylex.create({ bad: { paddin: 8 } });
// @ts-expect-error 值的类型不对
stylex.create({ bad: { padding: true } });
// @ts-expect-error 条件取值必须有 default
stylex.create({ bad: { color: { ':hover': 'blue' } } });
