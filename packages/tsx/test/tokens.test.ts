// 主题 tokens 的写法：'_xs'、'_space.md'、t.组.名 → token 变量与 import
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileTokens, type TokenModule } from '../src/compiler/index';
import { tokenModule } from '../src/vite/tokens';

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

  it('t.组.名 改写成组变量，与字符串写法共用导入；t 没有别的用处时删掉它的导入', async () => {
    const code = await compile(
      String.raw`import { t } from '@vue-tsx-pro/ui';
      const gap = t.space.sm;
      const s = stylex.create({
        a: {
          fontSize: '_xs',
          minHeight: ${'`'}max(${'$'}{t.sizes.control}, 24px)${'`'},
          outlineOffset: ${'`'}calc(-1 * ${'$'}{t.space['md']})${'`'},
          [vars.highlight]: ${'`'}color-mix(in oklab, ${'$'}{t.colors.text} 9%, transparent)${'`'},
          margin: gap,
        },
      });`,
      () => ({ ...module, importPath: '@vue-tsx-pro/ui/tokens.stylex' }),
    );
    expect(code).toContain(
      'import { space as _space, sizes as _sizes, colors as _colors, fontSizes as _fontSizes } from "@vue-tsx-pro/ui/tokens.stylex";',
    );
    expect(code).toContain('const gap = _space.sm;');
    expect(code).toContain('minHeight: `max(${_sizes.control}, 24px)`');
    expect(code).toContain('outlineOffset: `calc(-1 * ${_space.md})`');
    expect(code).toContain(
      '[vars.highlight]: `color-mix(in oklab, ${_colors.text} 9%, transparent)`',
    );
    expect(code).not.toContain("'@vue-tsx-pro/ui'");
  });

  it('t 还有别的用处时保留导入；别的包导入的 t 不动', async () => {
    const load = () => ({ ...module, importPath: '@vue-tsx-pro/ui/tokens.stylex' });
    const kept = await compile(
      `import { t } from '@vue-tsx-pro/ui';
      const s = stylex.create({ a: { color: t.colors.text } });
      console.log(t);`,
      load,
    );
    expect(kept).toContain("import { t } from '@vue-tsx-pro/ui';");
    expect(kept).toContain('color: _colors.text');
    const other = await compile(
      `import { t } from 'vue-i18n';
      const s = stylex.create({ a: { color: '_text' } });
      t.home.title;`,
      load,
    );
    expect(other).toContain('t.home.title');
  });

  it('组件库自己的源码里相对路径导入的 t 也认', async () => {
    const code = await compile(`import { t } from '../config/theme/tokens';
      const s = stylex.create({ a: { color: t.colors.accent } });`);
    expect(code).toContain('color: _colors.accent');
    expect(code).not.toContain("'../config/theme/tokens'");
  });

  it('引号与 url() 里的下划线不是 token', async () => {
    const code = await compile(
      `const s = stylex.create({ a: { fontSize: '_xs', content: '"_text"', backgroundImage: 'url(_a.png)' } });`,
    );
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

  it('as const、satisfies 这类类型外壳与按条件返回的动态样式里同样改写', async () => {
    const code = await compile(`
      const s = stylex.create({
        a: { fontSize: '_xs' as const, padding: ['_md', '_sm'] as const } as const,
        b: (on: boolean) => (on ? { color: '_accent' } : { color: '_text' }),
        c: (on: boolean) => { if (on) return { margin: '_md' }; return { margin: '_sm' }; },
      });
    `);
    expect(code).not.toMatch(/'_\w/);
    expect(code).toContain('color: _colors.accent');
    expect(code).toContain('margin: _space.sm');
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
    [
      '值里夹着的 token：给出改成 t 的模板字符串',
      `{ outlineOffset: 'calc(-1 * _space.sm)' }`,
      /`calc\(-1 \* \$\{t\.space\.sm\}\)`/,
    ],
    [
      '值里夹着的短写按对照表找组',
      `{ padding: '_sm _md' }`,
      /`\$\{t\.space\.sm\} \$\{t\.space\.md\}`/,
    ],
    [
      't 的 token 不存在',
      '{ padding: t.space.huge }',
      /space 里没有 huge（可用：t\.space\.sm、t\.space\.md）/,
    ],
    ['t 的组不存在', '{ padding: t.blurs.md }', /没有名为 blurs 的 token 组/],
    [
      '模板字符串里的下划线 token',
      '{ padding: `_sm ${1}px` }',
      /模板字符串里的 token 要写成 \$\{t\.组\.名\}/,
    ],
    [
      '覆盖变量用短写：没有属性可查表',
      `{ [vars.highlight]: '_text' }`,
      /\[vars\.highlight\] 不在 token 对照表里.*'_colors\.text'/,
    ],
  ];
  it.each(cases)('%s', async (_, styles, message) => {
    await expect(
      compile(`import { t } from './tokens';\nstylex.create({ a: ${styles} });`),
    ).rejects.toThrow(message);
  });

  it('写在 create 外面的样式对象里的 token 写法不会改写：报错，指出样式要直接写在里面', async () => {
    await expect(
      compile(`const base = { fontSize: '_xs' };
stylex.create({ a: base });`),
    ).rejects.toThrow(/base 里的 token 写法不会改写/);
  });

  it('找不到 token 模块', async () => {
    await expect(compile(`stylex.create({ a: { fontSize: '_xs' } });`, () => null)).rejects.toThrow(
      /找不到主题 tokens 模块/,
    );
  });
});

describe('按导入方找 token 模块', () => {
  const ui = (path: string) => join(import.meta.dirname, '../../ui', path);
  const root = join(import.meta.dirname, '../../..');
  const transform = async (file: string, code: string) =>
    (
      await compileTokens(header + code, file, () =>
        tokenModule('@vue-tsx-pro/ui/tokens.stylex', file, root),
      )
    )?.code;

  it('组件库自己的源码用相对路径导入，token 名从源码读取', async () => {
    const code = await transform(
      ui('src/base/X.tsx'),
      `stylex.create({ a: { fontSize: '_xxxl', color: '_inverseText' } });`,
    );
    expect(code).toContain('from "../config/theme/tokens.stylex"');
    expect(code).toContain('_fontSizes.xxxl');
  });

  it('Vite 给的 / 分隔路径同样认出是同一个包', async () => {
    const code = await transform(
      ui('src/base/X.tsx').replaceAll('\\', '/'),
      `stylex.create({ a: { fontSize: '_md' } });`,
    );
    expect(code).toContain('from "../config/theme/tokens.stylex"');
  });

  it('其他包按包名导入', async () => {
    const code = await transform(
      join(import.meta.dirname, '../../../apps/host-demo/src/X.tsx'),
      `stylex.create({ a: { fontSize: '_md' } });`,
    );
    expect(code).toContain('from "@vue-tsx-pro/ui/tokens.stylex"');
  });
});
