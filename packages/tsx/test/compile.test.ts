// compile：模块的语言按扩展名或单文件组件脚本的 lang 查询参数；样式的响应式绑定与热更新
import { expect, it } from 'vitest';
import { compile } from '../src/compiler';
import { languageOf } from '../src/compiler/ast';

it('模块的语言：扩展名，或单文件组件脚本的 lang 查询参数；不是脚本时 undefined', () => {
  expect(languageOf('/src/a.mts')).toBe('ts');
  expect(languageOf('/src/A.tsx')).toBe('tsx');
  expect(languageOf('/src/A.vue?vue&type=script&setup=true&lang.tsx')).toBe('tsx');
  expect(languageOf('/src/A.vue?vue&type=style&index=0&lang.css')).toBeUndefined();
});

it('运行时样式：渲染里的动态样式调用改成响应式绑定；字面量参数、渲染外、别处的函数不改', async () => {
  const code = `import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
const styles = css.create({ bar: (width: number) => ({ width }), base: { color: 'red' } });
const other = { bar: (width: number) => width };
const outside = styles.bar(1 + 1);
export const Bar = _component(({ width, rows }: { width: number; rows: number[] }) => () => {
  const double = width * 2;
  return (
    <div {...css.attrs(styles.base, styles.bar(width), styles.bar(10))} data-x={other.bar(width)}>
      <i {...css.attrs(styles.bar(double))} />
      {rows.map((row) => <b {...css.attrs(styles.bar(row))} />)}
    </div>
  );
});`;
  const result = await compile(code, { filename: '/src/Bar.tsx', styleBindings: true });
  const output = result!.code;
  // 只读 props（渲染函数外面的来源）：稳定，第三个参数 true
  expect(output).toMatch(/css\.bind\(styles\.bar, \(\) => \[width\.value\], true\)/);
  // 读渲染函数里的局部变量、map 回调的参数：不稳定
  expect(output).toMatch(/css\.bind\(styles\.bar, \(\) => \[double\]\)/);
  expect(output).toMatch(/css\.bind\(styles\.bar, \(\) => \[row\]\)/);
  expect(output).toContain('styles.bar(10)');
  expect(output).toContain('const outside = styles.bar(1 + 1)');
  expect(output).toMatch(/other\.bar\(width\.value\)/);
});

it('样式热更新：顶层 create 包上 hotStyles；只改样式参数时骨架不变，改了别的代码骨架变', async () => {
  const source = (
    color: string,
    extra = '',
  ) => `import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
export const styles = css.create({ root: { color: '${color}' } });
function local() { return css.create({ a: { color: 'red' } }); }
${extra}`;
  const compileHot = (code: string) =>
    compile(code, { filename: '/src/a.ts', styleHot: 'src/a.ts', sourceMaps: false });
  const first = await compileHot(source('red'));
  expect(first!.code).toMatch(/_hotStyles\("src\/a\.ts#styles", css\.create\(/);
  expect(first!.code).toContain('return css.create({');
  expect((await compileHot(source('blue')))!.styleSkeleton).toBe(first!.styleSkeleton);
  expect((await compileHot(source('red', 'export const x = 1;')))!.styleSkeleton).not.toBe(
    first!.styleSkeleton,
  );
});

it('按状态选样式：只读在样式里的状态改成 select；别处也读、渲染里算出的、不交给样式的不改', async () => {
  const code = `import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
const styles = css.create({ row: { display: 'flex' }, hot: { color: 'red' }, on: { color: 'blue' }, off: { color: 'gray' } });
const sizes = css.create({ sm: { fontSize: 12 }, md: { fontSize: 14 } });
const DEBUG = false;
export const Row = _component(({ item, size, active, shown, rows }: { item: { hot: boolean }; size: 'sm' | 'md'; active: boolean; shown: boolean; rows: { on: boolean }[] }) => {
  let open = _state(false);
  return () => {
    const local = active;
    return (
      <div {...css.attrs(styles.row, item.hot && styles.hot, sizes[size])} data-shown={shown} onClick={() => (open = !open)}>
        <i {...css.attrs(open ? styles.on : styles.off)} />
        <i {...css.attrs(shown && styles.hot)} />
        <i {...css.attrs(local && styles.hot)} />
        <i {...css.attrs(DEBUG && styles.hot)} />
        <Other extra={shown && styles.on} sx={[styles.row, item.hot && styles.on]} />
        {rows.map((row) => <b {...css.attrs(row.on && styles.hot)} />)}
      </div>
    );
  };
});`;
  const output = (await compile(code, { filename: '/src/Row.tsx', styleBindings: true }))!.code;
  // 只在样式里读的 props、组件里的状态：稳定
  expect(output).toMatch(/css\.select\(\(\) => item\.value\.hot && styles\.hot, true\)/);
  // prop 整个值（size）：值变了 Vue 反正重新渲染子组件，不改
  expect(output).toContain('sizes[size.value])');
  expect(output).not.toMatch(/select\(\(\) => sizes/);
  expect(output).toMatch(/css\.select\(\(\) => open\.value \? styles\.on : styles\.off, true\)/);
  // 同一状态在两处样式里读：都改（样式里的读不算“别处”）
  expect(output).toMatch(
    /"sx": \[styles\.row, css\.select\(\(\) => item\.value\.hot && styles\.on, true\)\]/,
  );
  // map 回调的参数：不稳定
  expect(output).toMatch(/css\.select\(\(\) => row\.on && styles\.hot\)/);
  // 别处也读（data-shown）、渲染里算出的局部变量、模块常量、不交给样式的 prop：不改
  expect(output).toContain('css.attrs(shown.value && styles.hot)');
  expect(output).toContain('css.attrs(local && styles.hot)');
  expect(output).toContain('css.attrs(DEBUG && styles.hot)');
  expect(output).toMatch(/"extra": shown\.value && styles\.on/);
});

it('具名导入的 import { css } 与 import * as css 一样：样式绑定和热更新都认', async () => {
  const code = `import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
export const styles = css.create({ bar: (width: number) => ({ width }), hot: { color: 'red' } });
export const Bar = _component(({ width, item }: { width: number; item: { hot: boolean } }) => () => (
  <div {...css.attrs(styles.bar(width), item.hot && styles.hot)} />
));`;
  const output = (await compile(code, {
    filename: '/src/Bar.tsx',
    styleBindings: true,
    styleHot: 'src/Bar.tsx',
    sourceMaps: false,
  }))!.code;
  expect(output).toMatch(/css\.bind\(styles\.bar, \(\) => \[width\.value\], true\)/);
  expect(output).toMatch(/css\.select\(\(\) => item\.value\.hot && styles\.hot, true\)/);
  expect(output).toMatch(/_hotStyles\("src\/Bar\.tsx#styles", css\.create\(/);
});
