// attrs 是 Vue 用的入口：行内样式交出对象，自定义属性（动态样式的变量）名字原样，值不会被拆成别的声明
import { expect, it } from 'vitest';
// 用包名导入：StyleX 编译器按导入路径识别（vitest 配置把它指向源码）
import * as stylex from '@vue-tsx-pro/tsx/stylex';

const styles = stylex.create({
  columns: (count: number) => ({ gridTemplateColumns: `repeat(${count}, 1fr)` }),
  color: (value: string) => ({ color: value }),
  base: { backgroundColor: 'red' },
});

it('动态样式的变量名与类名里引用的一致（StyleX 的 attrs 会把它转成连字符）', () => {
  // 运行时模式下第一次的值写进类里，值变过之后才进行内变量
  stylex.attrs(styles.base, styles.columns(2));
  const { class: className, style } = stylex.attrs(styles.base, styles.columns(3));
  expect(className).toBeTruthy();
  const [[name, value]] = Object.entries(style!);
  expect(name).toMatch(/^--[\w-]*[A-Z]/);
  expect(value).toBe('repeat(3, 1fr)');
});

it('值里的分号不会带进别的声明：交出的是对象，Vue 逐项设置', () => {
  stylex.attrs(styles.color('blue'));
  const { style } = stylex.attrs(styles.color('red; position: fixed'));
  expect(Object.keys(style!)).toHaveLength(1);
  expect(Object.values(style!)[0]).toBe('red; position: fixed');
});

it('只有原子类时没有 style', () => {
  expect(stylex.attrs(styles.base).style).toBeUndefined();
});
