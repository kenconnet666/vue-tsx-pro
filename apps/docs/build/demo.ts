/**
 * `?demo` 导入：一行同时拿到示例组件与加载它源码的函数，源码原样显示在示例卡片里。
 *
 *   import Basic from './demo/Basic.tsx?demo';   // { component, source: () => Promise<string>, path }
 *
 * 生成的是一个虚拟模块：导入真正的示例文件拿组件；源码是同一个文件的 ?raw，按需动态导入——
 * 卡片只展示、不在原地编辑，源码只有“显示代码”“复制”“编辑”时才用到，不必打进页面的块
 * （两百多个示例共 400 多 KB 文本）。示例文件改动时组件与源码一起热更新。
 */
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
      const path = relative(COMPONENTS, file)
        .split('\\')
        .join('/')
        .replace(/\.tsx$/, '');
      const raw = JSON.stringify(`${file}?raw`);
      return [
        `import component from ${JSON.stringify(file)};`,
        `const source = () => import(${raw}).then((module) => module.default.trimEnd());`,
        `export default { component, source, path: ${JSON.stringify(path)} };`,
        '',
      ].join('\n');
    },
  };
}
