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
