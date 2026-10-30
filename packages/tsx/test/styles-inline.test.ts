// @vitest-environment node
// 行内样式（小程序等没有 CSSOM 的宿主）：按组合类查回声明表，宿主判定条件，成立的条件块按层叠顺序展开
import { expect, it } from 'vitest';
import { attrs, create, createTheme, defineVars, inlineStyle } from '../src/styles/runtime';

const never = () => false;

it('无条件的声明展开成行内样式；不是引擎生成的类名返回 undefined', () => {
  const styles = create({ base: { color: 'red', paddingInline: 4 } });
  const className = attrs(styles.base).class!;
  // 块内顺序同样式表：按属性优先级（简写在前）
  expect(inlineStyle(className, never)).toBe('padding-inline:4px;color:red');
  expect(inlineStyle('user-class', never)).toBeUndefined();
});

it('条件块只在宿主判定成立时加上，排在无条件声明后面覆盖它', () => {
  const styles = create({
    base: { color: { default: 'black', ':active': 'blue', _disabled: 'gray' } },
  });
  const className = attrs(styles.base).class!;
  expect(inlineStyle(className, never)).toBe('color:black');
  expect(inlineStyle(className, (condition) => condition === ':active')).toBe(
    'color:black;color:blue',
  );
  const disabled = inlineStyle(className, (condition) => condition.startsWith(':is('));
  expect(disabled).toBe('color:black;color:gray');
});

it('合并后的组合类按后者覆盖前者展开，与样式表结果一致', () => {
  const styles = create({
    base: { color: 'black', borderRadius: 4 },
    pill: { borderRadius: 999 },
  });
  const className = attrs(styles.base, styles.pill).class!;
  expect(inlineStyle(className, never)).toBe('border-radius:999px;color:black');
});

it('@ 规则外层的条件与选择器里的伪类都交给宿主判定；伪元素跳过', () => {
  const styles = create({
    base: {
      opacity: { default: 1, '@media (prefers-reduced-motion: reduce)': { ':hover': 0.5 } },
      '::before': { content: '""' },
    },
  });
  const className = attrs(styles.base).class!;
  const asked: string[] = [];
  const skipped: string[] = [];
  const style = inlineStyle(
    className,
    (condition) => {
      asked.push(condition);
      return true;
    },
    (selector) => skipped.push(selector),
  );
  expect(asked).toEqual(['@media (prefers-reduced-motion: reduce)', ':hover']);
  expect(style).toBe('opacity:1;opacity:0.5');
  expect(skipped).toEqual(['::before']);
});

it('主题类展开成变量声明；按条件取的值在宿主判定 @ 规则成立时加上', () => {
  const colors = defineVars('inline-theme-colors', { text: '#111', surface: '#fff' });
  const dark = createTheme(colors, { text: '#eee', surface: '#111' });
  const system = createTheme(colors, {
    text: { default: '#111', '@media (prefers-color-scheme: dark)': '#eee' },
  });
  const darkClass = attrs(dark).class!;
  expect(inlineStyle(darkClass, never)).toBe(
    '--inline-theme-colors-text:#eee;--inline-theme-colors-surface:#111',
  );
  const systemClass = attrs(system).class!;
  expect(inlineStyle(systemClass, never)).toBe('--inline-theme-colors-text:#111');
  expect(inlineStyle(systemClass, (condition) => condition.includes('dark'))).toBe(
    '--inline-theme-colors-text:#111;--inline-theme-colors-text:#eee',
  );
});
