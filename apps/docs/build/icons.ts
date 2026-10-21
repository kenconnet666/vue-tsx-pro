/**
 * 构建时把 `import { Box, Search } from '@lucide/icons'` 改成直接导入单个图标模块
 * （`import Box from '@lucide/icons/icons/box'`），让首页的依赖图里不出现 @lucide/icons 的桶文件。
 *
 * 为什么要这样：桶文件 lucide-icons.mjs 还以命名空间再导出了全部图标的子桶（icons/index.mjs）。
 * 图标库页（IconGallery）与代码演练场的模块表对桶文件做命名空间使用，全部 1900 个图标都得保留；
 * 桶文件只要在首页的依赖图里，这些图标就跟着它进了首页加载的块（gzip 后 173 KB）。
 * 改写之后桶文件只出现在那两个懒加载的页面里。只在构建时做：开发时桶文件是预构建好的一个文件，无所谓。
 *
 * 构建结束前检查：桶文件还能从入口经静态导入到达时报错，并给出导入链，免得以后悄悄退回去。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"]@lucide\/icons['"];?/g;
const BARREL = /[\\/]@lucide[\\/]icons[\\/]dist[\\/]esm[\\/]lucide-icons\.mjs$/;

/**
 * 桶文件里的 `export { default as Box, default as BoxIcon, … } from './icons/box.mjs'` → 名字 → 文件名。
 * 按 ESM 解析（import.meta.resolve）：require 解析到的是 CommonJS 版，没有这些 export 行
 */
function iconFiles() {
  const barrel = fileURLToPath(import.meta.resolve('@lucide/icons'));
  const files = new Map<string, string>();
  const source = readFileSync(barrel, 'utf8');
  for (const [, names, file] of source.matchAll(
    /export \{([^}]+)\} from '\.\/icons\/([\w-]+)\.mjs'/g,
  )) {
    for (const [, name] of names!.matchAll(/default as (\w+)/g)) files.set(name!, file!);
  }
  return files;
}

/** 一条具名导入改写成：类型留在桶文件（随后被去掉类型时删除），图标各自从单个模块导入 */
function rewrite(list: string, files: Map<string, string>) {
  const specifiers = list
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    .split(',')
    .map((specifier) => specifier.trim())
    .filter(Boolean);
  const types = specifiers.filter((specifier) => specifier.startsWith('type '));
  const statements = types.length ? [`import { ${types.join(', ')} } from '@lucide/icons';`] : [];
  for (const specifier of specifiers.filter((specifier) => !types.includes(specifier))) {
    const [name, local = name] = specifier.split(/\s+as\s+/) as [string, string?];
    const file = files.get(name);
    // 对不上的名字留在桶文件：构建结束前的检查会指出它
    statements.push(
      file
        ? `import ${local} from '@lucide/icons/icons/${file}';`
        : `import { ${specifier} } from '@lucide/icons';`,
    );
  }
  return statements.join(' ');
}

/** 构建插件：图标的具名导入改成单个图标模块，并检查首页的依赖图里没有桶文件（见文件开头） */
export function iconImports(): Plugin {
  let files: Map<string, string> | undefined;
  return {
    name: 'docs:icon-imports',
    apply: 'build',
    enforce: 'pre',
    transform: {
      filter: { id: /\.[jt]sx?$/, code: '@lucide/icons' },
      handler(code, id) {
        if (id.includes('/node_modules/')) return;
        files ??= iconFiles();
        const known = files;
        return code.replace(IMPORT, (_, list: string) => rewrite(list, known));
      },
    },
    generateBundle() {
      const entries = [...this.getModuleIds()].filter((id) => this.getModuleInfo(id)?.isEntry);
      const via = new Map<string, string>();
      const queue = [...entries];
      for (let id = queue.shift(); id; id = queue.shift()) {
        for (const imported of this.getModuleInfo(id)?.importedIds ?? []) {
          if (via.has(imported) || entries.includes(imported)) continue;
          via.set(imported, id);
          if (BARREL.test(imported)) {
            const chain = [imported];
            for (let from = via.get(imported); from; from = via.get(from)) chain.unshift(from);
            this.error(
              `@lucide/icons 的桶文件进了首页的依赖图，全部图标会跟着进首页（见 build/icons.ts）：\n  ${chain.join('\n  → ')}`,
            );
          }
          queue.push(imported);
        }
      }
    },
  };
}
