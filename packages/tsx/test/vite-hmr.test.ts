// 组件的热更新登记：哪些导出是组件、工厂函数做的组件运行时确认、导出了别的值时让导入方重新执行
import { parseSync } from '@babel/core';
import { describe, expect, it } from 'vitest';
import { exportedComponents, hmrCode } from '../src/vite/hmr';

const parse = (code: string) =>
  parseSync(code, { filename: 'a.tsx', babelrc: false, configFile: false })!;
const exports = (code: string) => exportedComponents(parse(code), '/src/a.tsx');

describe('exportedComponents', () => {
  it('_component 的结果一定是组件；大写开头、由别的调用得到的“可能是”（运行时确认）', () => {
    const { components, otherExports } = exports(`
      export const Card = _component(() => () => null);
      export const Toolbar = createFlex('nav', 'Toolbar');
      const Inner = _component(() => () => null);
      export { Inner as Panel };
    `);
    expect(components.map(({ local, exported, maybe }) => [local, exported, maybe])).toEqual([
      ['Card', 'Card', false],
      ['Toolbar', 'Toolbar', true],
      ['Inner', 'Panel', false],
    ]);
    expect(otherExports).toBe(false);
  });

  it('还导出了函数、常量（本文件里定义的）时 otherExports；转出别处的不算', () => {
    expect(
      exports('export const Card = _component(() => () => null); export function helper() {}')
        .otherExports,
    ).toBe(true);
    expect(
      exports('export const Card = _component(() => () => null); export const size = 1;')
        .otherExports,
    ).toBe(true);
    expect(
      exports("export const Card = _component(() => () => null); export { x } from './x';")
        .otherExports,
    ).toBe(false);
  });
});

describe('hmrCode', () => {
  it('可能是组件的先确认再登记；不是组件、或有别的导出时 invalidate', () => {
    const { components, otherExports } = exports(`
      export const Card = _component(() => () => null);
      export const Toolbar = createFlex('nav', 'Toolbar');
    `);
    const code = hmrCode(components, otherExports);
    expect(code).toContain('const __isComponent =');
    expect(code).toMatch(/if \(__isComponent\(Toolbar\)\) \{\s*Toolbar\.__hmrId/);
    expect(code).toContain('let __other = false');
    expect(code).toMatch(/if \(__isComponent\(__Toolbar\)\) \{[^}]*\} else __other = true/);
    expect(code).toContain('if (__other) import.meta.hot.invalidate(');
    expect(hmrCode(components, true)).toContain('let __other = true');
  });
});
