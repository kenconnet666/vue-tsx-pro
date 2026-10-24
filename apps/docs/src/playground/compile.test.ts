// 代码演练场的编译：在 Node 里跑与 Worker 相同的编译，再按页面的方式执行、挂载
import { styleText } from '@vue-tsx-pro/tsx/stylex';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../test/mount';
import { compilePlayground } from './compile';
import { evaluate } from './run';
import { STARTER } from './starter';

it('起始示例：编译、执行，符文与组件照常工作', async () => {
  const { code } = await compilePlayground(STARTER);
  expect(code).not.toMatch(/^import /m);
  const root = mount(await evaluate(code));
  // 样式在页面上执行时由运行时引擎生成
  expect(styleText()).toContain(`color:${colors.accent}`);
  expect(root.textContent).toContain('还没点过');
  root.querySelector('button')!.click();
  await nextTick();
  expect(root.textContent).toContain('点了 1 次');
});

it('组件把 children 原样转交给另一个组件：内容照常显示，不是插槽对象', async () => {
  const source = `import { _component } from '@vue-tsx-pro/tsx';
const Box = _component(({ children }: { children?: unknown }) => () => <section>{children}</section>);
const Outer = _component(({ children }: { children?: unknown }) => () => <Box>{children}</Box>);
export default _component(() => () => <Outer>转交的内容</Outer>);`;
  const { code } = await compilePlayground(source);
  const root = mount(await evaluate(code));
  expect(root.querySelector('section')!.textContent).toBe('转交的内容');
});

it('token 变量、token 短写与组件库是同一个 CSS 变量，跟着主题走', async () => {
  const source = `import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
const styles = stylex.create({ box: { backgroundColor: colors.surfaceMuted, color: '_accent' } });
export default () => <div {...stylex.attrs(styles.box)} />;`;
  const { code } = await compilePlayground(source);
  mount(await evaluate(code));
  expect(styleText()).toContain(`background-color:${colors.surfaceMuted}`);
  expect(styleText()).toContain(`color:${colors.accent}`);
});

it('语法写错时编译抛出带代码帧的错误；token 写错时用到那段样式时报错', async () => {
  await expect(compilePlayground('export default () => (<div>')).rejects.toThrow(
    /Playground\.tsx: .*\(1:\d+\)/,
  );
  const { code } = await compilePlayground(`import * as stylex from '@vue-tsx-pro/tsx/stylex';
const styles = stylex.create({ a: { color: '_nope' } });
export default () => <div {...stylex.attrs(styles.a)} />;`);
  const component = await evaluate(code);
  expect(() => mount(component)).toThrow(/_nope/);
});
