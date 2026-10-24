// compile：模块的语言按扩展名或单文件组件脚本的 lang 查询参数；StyleX 的导入来源总认官方包与本包入口
import { expect, it } from 'vitest';
import { compile } from '../src/compiler';
import { languageOf } from '../src/compiler/ast';

it('模块的语言：扩展名，或单文件组件脚本的 lang 查询参数；不是脚本时 undefined', () => {
  expect(languageOf('/src/a.mts')).toBe('ts');
  expect(languageOf('/src/A.tsx')).toBe('tsx');
  expect(languageOf('/src/A.vue?vue&type=script&setup=true&lang.tsx')).toBe('tsx');
  expect(languageOf('/src/A.vue?vue&type=style&index=0&lang.css')).toBeUndefined();
});

it('StyleX：另给了 importSources 时，官方包与本包入口照样编译', async () => {
  for (const source of ['@stylexjs/stylex', '@vue-tsx-pro/tsx/stylex']) {
    const code = `import * as stylex from '${source}';
export const styles = stylex.create({ root: { color: 'red' } });`;
    const result = await compile(code, {
      filename: '/src/a.ts',
      stylex: { importSources: ['my-stylex'] },
    });
    expect(result?.stylex.length, source).toBeGreaterThan(0);
  }
});

it('运行时样式：渲染里的动态样式调用改成响应式绑定；字面量参数、渲染外、别处的函数不改', async () => {
  const code = `import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { _component } from '@vue-tsx-pro/tsx';
const styles = stylex.create({ bar: (width: number) => ({ width }), base: { color: 'red' } });
const other = { bar: (width: number) => width };
const outside = styles.bar(1 + 1);
export const Bar = _component(({ width }: { width: number }) => () => (
  <div {...stylex.attrs(styles.base, styles.bar(width), styles.bar(10))} data-x={other.bar(width)} />
));`;
  const result = await compile(code, { filename: '/src/Bar.tsx', styleBindings: true });
  const output = result!.code;
  expect(output).toMatch(/stylex\.bind\(styles\.bar, \(\) => \[width\.value\]\)/);
  expect(output).toContain('styles.bar(10)');
  expect(output).toContain('const outside = styles.bar(1 + 1)');
  expect(output).toMatch(/other\.bar\(width\.value\)/);
});

it('样式热更新：顶层 create 包上 hotStyles；只改样式参数时骨架不变，改了别的代码骨架变', async () => {
  const source = (color: string, extra = '') => `import * as stylex from '@vue-tsx-pro/tsx/stylex';
export const styles = stylex.create({ root: { color: '${color}' } });
function local() { return stylex.create({ a: { color: 'red' } }); }
${extra}`;
  const compileHot = (code: string) =>
    compile(code, { filename: '/src/a.ts', styleHot: 'src/a.ts', sourceMaps: false });
  const first = await compileHot(source('red'));
  expect(first!.code).toMatch(/_hotStyles\("src\/a\.ts#styles", stylex\.create\(/);
  expect(first!.code).toContain('return stylex.create({');
  expect((await compileHot(source('blue')))!.styleSkeleton).toBe(first!.styleSkeleton);
  expect((await compileHot(source('red', 'export const x = 1;')))!.styleSkeleton).not.toBe(
    first!.styleSkeleton,
  );
});
