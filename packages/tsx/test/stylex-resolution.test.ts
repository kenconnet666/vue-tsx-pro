// StyleX 模块解析：src 与 dist 下的同一个 token 文件得到同一个规范名，变量名才一致
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { stylexModuleResolution } from '../src/vite/stylex-resolution';

const ui = (path: string) => join(import.meta.dirname, '../../ui', path);
const { getCanonicalFilePath, filePathResolver } = stylexModuleResolution();

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
