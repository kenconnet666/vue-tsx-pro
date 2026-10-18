// attrs 是 Vue 用的入口：行内样式里的自定义属性（动态样式的变量）名字要原样保留
import { expect, it } from 'vitest';
// 用包名导入：StyleX 编译器按导入路径识别（vitest 配置把它指向源码）
import * as stylex from '@vue-tsx-pro/tsx/stylex';

const styles = stylex.create({
  columns: (count: number) => ({ gridTemplateColumns: `repeat(${count}, 1fr)` }),
  base: { backgroundColor: 'red' },
});

it('动态样式的变量名与类名里引用的一致（StyleX 0.19.1 的 attrs 会把它转成连字符）', () => {
  const { class: className, style } = stylex.attrs(styles.base, styles.columns(3));
  expect(className).toBeTruthy();
  const [name, value] = style!.split(/:(.*)/s);
  expect(name).toMatch(/^--[\w-]*[A-Z]/);
  expect(value).toBe('repeat(3, 1fr)');
});

it('普通属性照常转成连字符', () => {
  expect(stylex.attrs([{ $$css: true }, { backgroundColor: 'red' }] as never).style).toBe(
    'background-color:red',
  );
});
