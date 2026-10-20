/**
 * `?demo` 导入：一行同时拿到示例组件与它的源码，源码原样显示在示例卡片里。
 *
 *   import Basic from './demo/Basic.tsx?demo';   // { component, source, path }
 *
 * 生成的是一个虚拟模块：导入真正的示例文件拿组件，读出文件文本作源码。示例文件改动时两者一起热更新。
 */
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const QUERY = '?demo';
// 虚拟模块的 id 不以 .tsx 结尾：不让 JSX 与符文的转换再处理一遍
const PREFIX = '\0docs-demo:';
// path 相对组件目录（layout/AppShell/frames/Admin）：整页示例的 /frame/… 路由按它找到文件
const COMPONENTS = fileURLToPath(new URL('../src/components/', import.meta.url));

export function demoSource(): Plugin {
  return {
    name: 'docs:demo-source',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (!id.endsWith(QUERY)) return;
      const resolved = await this.resolve(id.slice(0, -QUERY.length), importer, { skipSelf: true });
      return resolved && PREFIX + resolved.id;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return;
      const file = id.slice(PREFIX.length);
      this.addWatchFile(file);
      const source = readFileSync(file, 'utf8').trimEnd();
      const path = relative(COMPONENTS, file)
        .replaceAll('\\', '/')
        .replace(/\.tsx$/, '');
      return `import component from ${JSON.stringify(file)};\nexport default { component, source: ${JSON.stringify(source)}, path: ${JSON.stringify(path)} };\n`;
    },
  };
}
