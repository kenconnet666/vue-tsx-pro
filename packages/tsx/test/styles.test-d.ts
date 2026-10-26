// 样式入口的类型：合法写法通过，拼错的属性、类型不对的值、缺 default 的条件值报错；
// 每个属性接受的值与 CSS 类型表（css-properties.ts）一个不多、一个不少
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { CSSProperties } from '../src/styles/css-properties';

const vars = css.defineVars('vars', {
  accent: '#3e63dd',
  speed: { default: '200ms', '@media (x)': '0ms' },
});

export const documented = css.create({
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

// 返回值、主题、标记都能交给 attrs 与 SxStyles 类型的 prop
const theme = css.createTheme(vars, { accent: 'red' });
const marker = css.defineMarker('test-marker');
export const merged = css.attrs(documented.plain, false, theme, marker, [documented.conditional]);
export const asProp: css.SxStyles = [documented.plain, theme, marker];
// 一次性的覆盖直接写对象，属性与取值照样检查
export const literal: css.SxStyles = [
  documented.plain,
  { marginTop: 8, color: { default: 'red', ':hover': 'blue' } },
];
// @ts-expect-error 拼错的属性名
export const badLiteral: css.SxStyles = { marginTo: 8 };
export const related = css.create({
  link: { opacity: { default: 0, [css.when.ancestor(':hover', marker)]: 1 } },
});
// @ts-expect-error 主题只能覆盖这组变量里有的 token
css.createTheme(vars, { missing: 'red' });

// 动态样式：保留参数类型
const dynamic = css.create({ base: { padding: 4 }, size: (width: number) => ({ width }) });
export const [sized, inline] = dynamic.size(10);
// @ts-expect-error 参数类型是 number
dynamic.size('10');

// 每个属性接受的值与 CSS 类型表一个不多、一个不少（带说明的关键字取值只换了写法）
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Drift = {
  [P in keyof CSSProperties]-?: Same<
    css.DocumentedStyles[P],
    css.StyleValue<CSSProperties[P]> | undefined
  > extends true
    ? never
    : P;
}[keyof CSSProperties];
export const noDrift: [Drift] extends [never] ? true : Drift = true;

// @ts-expect-error 拼错的属性名
css.create({ bad: { paddin: 8 } });
// @ts-expect-error 值的类型不对
css.create({ bad: { padding: true } });
// 条件别名作键（悬停显示说明）
css.create({ ok: { color: { default: 'black', _selected: 'blue', _hover: 'red' } } });
// @ts-expect-error 拼错的条件别名
css.create({ bad: { color: { default: 'black', _selectd: 'blue' } } });
// @ts-expect-error 条件取值必须有 default
css.create({ bad: { color: { ':hover': 'blue' } } });
