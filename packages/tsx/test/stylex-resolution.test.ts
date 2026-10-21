// StyleX 模块解析：src 与 dist 下的同一个 token 文件得到同一个规范名，变量名才一致
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, it } from 'vitest';
import { stylexModuleResolution } from '../src/vite/stylex-resolution';

const ui = (path: string) => join(import.meta.dirname, '../../ui', path);
const { getCanonicalFilePath, filePathResolver } = stylexModuleResolution();

// Windows 上 Node 会缓存找到过的包：这个进程里早已用反斜杠路径解析过，测不出来。
// 起一个缓存为空的新进程，环境变量也不继承（继承 Vitest 的环境时 Windows 上同样测不出来）
it('Vite 给的正斜杠路径：组件库源码按包名引用自己也能解析', () => {
  const from = ui('src/base/Code.tsx').split('\\').join('/');
  const module = pathToFileURL(join(import.meta.dirname, '../src/vite/stylex-resolution.ts')).href;
  const script = `import { resolveFromExports } from ${JSON.stringify(module)};
console.log(resolveFromExports('@vue-tsx-pro/ui/tokens.stylex', ${JSON.stringify(from)}) ?? 'not found');`;
  const resolved = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
  });
  expect(resolved.trim()).toBe(ui('src/config/theme/tokens.stylex.ts'));
});

it('源码与产物规范成同一个名字', () => {
  const name = '@vue-tsx-pro/ui:config/theme/tokens.stylex';
  expect(getCanonicalFilePath(ui('src/config/theme/tokens.stylex.ts'))).toBe(name);
  expect(getCanonicalFilePath(ui('dist/config/theme/tokens.stylex.js'))).toBe(name);
});

it('包导入能解析到 token 文件；相对导入补全扩展名', () => {
  const from = ui('src/config/Provider.tsx');
  const resolved = filePathResolver('@vue-tsx-pro/ui/tokens.stylex', from);
  expect(resolved && getCanonicalFilePath(resolved)).toBe(
    '@vue-tsx-pro/ui:config/theme/tokens.stylex',
  );
  expect(filePathResolver('./theme/tokens.stylex', from)).toBe(
    ui('src/config/theme/tokens.stylex.ts'),
  );
});
