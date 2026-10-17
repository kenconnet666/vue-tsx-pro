// StyleX 入口的类型：合法写法与原版 @stylexjs/stylex 一样通过，明显的错误比原版多报出来
import * as original from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import * as stylex from '@vue-tsx-pro/tsx/stylex';

declare const vars: original.VarGroup<{ accent: string }>;

// 合法写法：两个入口都接受
const valid = {
  plain: { display: 'flex', padding: 8, gap: '0.5em', lineHeight: 1.5 },
  conditional: { color: { default: 'black', ':hover': 'blue', '@media (min-width: 40em)': 'red' } },
  nested: {
    color: { default: 'black', '@media (min-width: 40em)': { default: 'red', ':hover': 'blue' } },
  },
  pseudoElement: { '::placeholder': { color: 'gray' } },
  token: { color: vars.accent },
  fallback: { height: original.firstThatWorks('100dvh', '100vh') },
} as const;
export const documented = stylex.create(valid);
export const upstream = original.create(valid);

// 返回值能直接交给 attrs 与 StyleXStyles 类型的 prop
export const merged = stylex.attrs(documented.plain, false, documented.conditional);
export const asProp: StyleXStyles = documented.plain;

// 设置变量的值：计算属性键
export const setVar = stylex.create({ theme: { [vars.accent]: 'red' } });

// 动态样式：保留参数类型
const dynamic = stylex.create({ base: { padding: 4 }, size: (width: number) => ({ width }) });
export const [sized, inline] = dynamic.size(10);
// @ts-expect-error 参数类型是 number
dynamic.size('10');

// 原版接受、这里报错的写法
// @ts-expect-error 拼错的属性名
stylex.create({ bad: { paddin: 8 } });
// @ts-expect-error 值的类型不对
stylex.create({ bad: { padding: true } });
// @ts-expect-error 条件取值必须有 default
stylex.create({ bad: { color: { ':hover': 'blue' } } });
export const looseUpstream = original.create({ bad: { paddin: 8, padding: true } });
