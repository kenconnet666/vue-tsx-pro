// 开发时桶文件的具名导入改成直接导入所在模块：热更新不经过桶文件，组件库里不是组件的模块改了不会整页刷新
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { directImports } from '../src/vite/workspace';

const dir = mkdtempSync(join(tmpdir(), 'workspace-'));
const file = (name: string, code: string) => {
  writeFileSync(join(dir, name), code);
  return join(dir, name).split('\\').join('/');
};
const barrel = file(
  'index.ts',
  [
    "import './types';",
    "export { Button, buttonStyles as styles } from './button';",
    "export { default as Card, type CardProps } from './card';",
    "export type { Theme } from './theme';",
  ].join('\n'),
);
const tokens = file('tokens.ts', "export const colors = { text: 'red' };");
const packages: Record<string, string> = {
  '@zerodep-dev/vue-tsx-pro-ui': barrel,
  '@zerodep-dev/vue-tsx-pro-ui/tokens': tokens,
};
const context = {
  resolve: async (source: string, importer?: string) => {
    if (packages[source]) return { id: packages[source]!, external: false };
    if (source.startsWith('./'))
      return { id: join(importer!, '..', `${source}.ts`).split('\\').join('/'), external: false };
    return null;
  },
} as never;
const rewrite = async (code: string) =>
  (await directImports(context, code, '/app/page.js', new Map()))?.code;

it('具名导入改成直接导入所在模块；改名、default 再导出照样对得上；入口的副作用导入保留', async () => {
  const code = await rewrite(
    "import { Button as B, styles, Card } from '@zerodep-dev/vue-tsx-pro-ui';\nconsole.log(B, styles, Card);",
  );
  expect(code).toBe(
    [
      `import "${dir.split('\\').join('/')}/types.ts";`,
      `import { Button as B, buttonStyles as styles } from "${dir.split('\\').join('/')}/button.ts";`,
      `import { default as Card } from "${dir.split('\\').join('/')}/card.ts";`,
    ].join(' ') + '\nconsole.log(B, styles, Card);',
  );
});

it('多行的导入改写后行数不变；入口里没有的名字留给入口', async () => {
  const code = (await rewrite(
    "import {\n  Button,\n  Missing,\n} from '@zerodep-dev/vue-tsx-pro-ui';\nfoo();",
  ))!;
  expect(code.split('\n')).toHaveLength(5);
  expect(code).toContain('import { Missing } from "@zerodep-dev/vue-tsx-pro-ui";');
  expect(code.endsWith('\n\n\n\nfoo();')).toBe(true);
});

it('字符串里的导入语句、命名空间导入、默认导入、不是桶文件的入口都不动', async () => {
  for (const code of [
    'const sample = "import { Button } from \'@zerodep-dev/vue-tsx-pro-ui\'";',
    "import * as ui from '@zerodep-dev/vue-tsx-pro-ui';",
    "import ui, { Button } from '@zerodep-dev/vue-tsx-pro-ui';",
    "import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';",
    "import { thing } from 'other';",
  ]) {
    expect(await rewrite(code)).toBeUndefined();
  }
});
