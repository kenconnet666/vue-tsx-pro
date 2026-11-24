// Vite 预设给依赖预构建的配置：含 import.meta.glob 的 .tsx 在扫描时先编掉 JSX（Vite 8 的扫描会把它标成 JS 再解析）
import { describe, expect, it } from 'vitest';
import type { Plugin, Rolldown, UserConfig } from 'vite';
import { vueTsxPro } from '../src/vite/index.ts';

const configOf = (command: 'serve' | 'build'): UserConfig => {
  const plugin = vueTsxPro({ cache: false, parallel: false })[0] as Plugin;
  const hook = plugin.config as (
    user: UserConfig,
    env: { command: 'serve' | 'build'; mode: string },
  ) => UserConfig;
  return hook({ root: import.meta.dirname }, { command, mode: 'development' });
};

describe('vueTsxPro 的依赖预构建', () => {
  it('扫描时含 import.meta.glob 的 .tsx 编成不带 JSX 的 JS，导入和 glob 留着', async () => {
    const [scan] = configOf('serve').optimizeDeps!.rolldownOptions!.plugins as Rolldown.Plugin[];
    const transform = scan!.transform as {
      filter: { id: RegExp; code: string };
      handler: (code: string, id: string) => Promise<{ code: string; moduleType: string }>;
    };
    expect(transform.filter.id.test('/src/Panel.tsx')).toBe(true);
    expect(transform.filter.id.test('/src/util.ts')).toBe(false);
    const source = `import { Flex } from 'ui';
const icons = import.meta.glob<string>('./icons/*.svg', { eager: true });
export const Panel = (props: { title: string }) => <Flex gap="sm"><span>{props.title}</span><>{Object.keys(icons)}</></Flex>;`;
    const result = await transform.handler(source, '/src/Panel.tsx');
    expect(result.moduleType).toBe('js');
    expect(result.code).not.toMatch(/<Flex|<span|<>/);
    expect(result.code).toMatch(/import { Flex } from ["']ui["']/);
    expect(result.code).toContain('import.meta.glob');
  });

  it('构建时不预构建热更新用的样式入口', () => {
    expect(configOf('build').optimizeDeps!.include).toEqual([]);
  });
});
