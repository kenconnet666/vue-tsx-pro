// 代码演练场的编译：在 Node 里跑与 Worker 相同的编译，再按页面的方式执行、挂载
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../test/mount';
import { compilePlayground } from './compile';
import { evaluate, tokenGroups } from './run';
import { STARTER } from './starter';

it('起始示例：编译、执行，符文与组件照常工作', async () => {
  const { code, css } = await compilePlayground(STARTER, tokenGroups);
  expect(code).not.toMatch(/^import /m);
  expect(css).toContain(`color:${colors.accent}`);
  const root = mount(await evaluate(code));
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
  const { code } = await compilePlayground(source, tokenGroups);
  const root = mount(await evaluate(code));
  expect(root.querySelector('section')!.textContent).toBe('转交的内容');
});

it('token 变量与组件库编译出同一个 CSS 变量，跟着主题走', async () => {
  const source = `import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
const styles = stylex.create({ box: { backgroundColor: colors.surfaceMuted, color: '_accent' } });
export default () => <div {...stylex.attrs(styles.box)} />;`;
  const { css } = await compilePlayground(source, tokenGroups);
  expect(css).toContain(`background-color:${colors.surfaceMuted}`);
  expect(css).toContain(`color:${colors.accent}`);
});

it('写错时抛出带代码帧的错误', async () => {
  await expect(compilePlayground('export default () => (<div>', tokenGroups)).rejects.toThrow(
    /Playground\.tsx: .*\(1:\d+\)/,
  );
  await expect(
    compilePlayground(
      `import * as stylex from '@vue-tsx-pro/tsx/stylex';\nstylex.create({ a: { color: '_nope' } });`,
      tokenGroups,
    ),
  ).rejects.toThrow(/_nope/);
});
