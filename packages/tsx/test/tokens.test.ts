// 主题 tokens 的字符串写法：'_xs'、'_space.md' → token 变量与 import
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileTokens, type TokenModule } from '../src/compiler/index';
import { themeTokens } from '../src/vite/tokens';

const module: TokenModule = {
  importPath: './tokens.stylex',
  groups: new Map([
    ['fontSizes', new Set(['xs', 'md'])],
    ['space', new Set(['sm', 'md'])],
    ['colors', new Set(['text', 'accent'])],
    ['sizes', new Set(['control'])],
  ]),
};

const header = "import * as stylex from '@vue-tsx-pro/tsx/stylex';\n";
const compile = async (body: string, load: () => TokenModule | null = () => module) =>
  (await compileTokens(header + body, 'a.tsx', load))?.code;

describe('改写', () => {
  it('短写按对照表找组，带组名的任何属性都能用；同组只导入一次', async () => {
    const code = await compile(
      `const s = stylex.create({ a: { fontSize: '_xs', padding: '_md', margin: '_sm', height: '_control', width: '_space.md' } });`,
    );
    expect(code).toContain(
      'import { fontSizes as _fontSizes, space as _space, sizes as _sizes } from "./tokens.stylex";',
    );
    expect(code).toContain('fontSize: _fontSizes.xs');
    expect(code).toContain('padding: _space.md');
    expect(code).toContain('margin: _space.sm');
    expect(code).toContain('height: _sizes.control');
    expect(code).toContain('width: _space.md');
  });

  it('条件值、回退数组、伪元素、动态样式与 keyframes 里同样改写', async () => {
    const code = await compile(`
      const s = stylex.create({
        a: { color: { default: '_text', ':hover': { default: '_accent', '@media (x)': '_text' } } },
        b: { '::before': { color: '_accent' }, fontSize: ['_md', '_xs'] },
        c: (big: boolean) => ({ fontSize: big ? '_md' : '_xs' }),
      });
      const k = stylex.keyframes({ from: { color: '_text' } });
    `);
    expect(code).not.toMatch(/'_\w/);
    expect(code).toContain("':hover': {\n");
  });

  it('值里夹着的 token 改写成模板字符串：计算、多值、跨组；引号与 url() 里的不动', async () => {
    const code = await compile(`
      const s = stylex.create({
        a: {
          minHeight: 'max(_control, 24px)',
          padding: '_sm _md',
          outlineOffset: 'calc(-1 * _space.sm)',
          content: '"_text"',
          backgroundImage: 'url(_a.png)',
          transition: 'opacity 1s, color 1s',
        },
      });
    `);
    expect(code).toContain('minHeight: `max(${_sizes.control}, 24px)`');
    expect(code).toContain('padding: `${_space.sm} ${_space.md}`');
    expect(code).toContain('outlineOffset: `calc(-1 * ${_space.sm})`');
    expect(code).toContain(`content: '"_text"'`);
    expect(code).toContain("backgroundImage: 'url(_a.png)'");
  });

  it('具名导入的 create 也认；其他字符串、其他函数不动', async () => {
    const code = (await compileTokens(
      "import { create } from '@stylexjs/stylex';\nconst s = create({ a: { fontSize: '_xs' } }); const x = { fontSize: '_xs' }; f('_xs');",
      'a.ts',
      () => module,
    ))!.code;
    expect(code).toContain('fontSize: _fontSizes.xs');
    expect(code).toContain("const x = {\n  fontSize: '_xs'");
    expect(code).toContain("f('_xs')");
  });

  it('没有 token 写法时不改写，也不去找 token 模块', async () => {
    const load = () => {
      throw new Error('不该加载');
    };
    expect(
      await compile(`const s = stylex.create({ a: { fontSize: 12 } });`, load),
    ).toBeUndefined();
    expect(await compileTokens("const s = { a: '_xs' };", 'a.ts', load)).toBeNull();
  });
});

describe('报错', () => {
  const cases: [string, string, RegExp][] = [
    [
      '表外属性用短写：列出有这个 token 的组',
      `{ zIndex: '_md' }`,
      /zIndex 不在 token 对照表里.*'_fontSizes\.md' 或 '_space\.md'/,
    ],
    ['表外属性用短写：哪组都没有时给出格式', `{ zIndex: '_nope' }`, /'_组名\.nope'/],
    ['短写的 token 不存在', `{ fontSize: '_xxl' }`, /fontSizes 里没有 xxl（可用：'_xs'、'_md'）/],
    ['带组名的 token 不存在', `{ width: '_sizes.width' }`, /'_sizes\.control'/],
    ['组不存在', `{ height: '_blurs.md' }`, /没有名为 blurs 的 token 组/],
    ['格式不对', `{ fontSize: '_x-s' }`, /不是主题 token 的写法/],
    ['值里夹着的 token 不存在', `{ padding: '_sm _huge' }`, /space 里没有 huge/],
  ];
  it.each(cases)('%s', async (_, styles, message) => {
    await expect(compile(`stylex.create({ a: ${styles} });`)).rejects.toThrow(message);
  });

  it('找不到 token 模块', async () => {
    await expect(compile(`stylex.create({ a: { fontSize: '_xs' } });`, () => null)).rejects.toThrow(
      /找不到主题 tokens 模块/,
    );
  });
});

describe('Vite 插件', () => {
  const ui = (path: string) => join(import.meta.dirname, '../../ui', path);
  const transform = async (file: string, code: string) => {
    const plugin = themeTokens('@vue-tsx-pro/ui/tokens.stylex');
    const context = { addWatchFile() {} };
    const hook = plugin.transform as (
      this: unknown,
      code: string,
      id: string,
    ) => Promise<{ code: string } | null>;
    return (await hook.call(context, header + code, file))?.code;
  };

  it('组件库自己的源码用相对路径导入，token 名从源码读取', async () => {
    const code = await transform(
      ui('src/base/X.tsx'),
      `stylex.create({ a: { fontSize: '_xxxl', color: '_inverseText' } });`,
    );
    expect(code).toContain('from "../config/theme/tokens.stylex"');
    expect(code).toContain('_fontSizes.xxxl');
  });

  it('其他包按包名导入', async () => {
    const code = await transform(
      join(import.meta.dirname, '../../../apps/host-demo/src/X.tsx'),
      `stylex.create({ a: { fontSize: '_md' } });`,
    );
    expect(code).toContain('from "@vue-tsx-pro/ui/tokens.stylex"');
  });
});
