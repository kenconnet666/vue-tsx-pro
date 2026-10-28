/**
 * 包之间的分层检查（ROADMAP 11.6）：各包 src 里的运行时导入不能越过包族的边界，只导入类型的不算。
 *
 *   - 组件库（tsx、ui）不导入 easy-query：组件库要能装进普通的 Vue 项目，不带服务端的依赖
 *   - easy-query 不导入 vue 与组件库：ORM 在服务端用，不依赖界面
 *   - 流程引擎的模型包两端通用，不导入 vue、组件库与 easy-query；引擎在服务端，不导入 vue 与组件库
 *   - 组件库不导入框架（kit），框架不导入 easy-query 与流程引擎
 *
 * 用法：node scripts/structure/package-deps.mjs（pnpm layers:check 里一起跑）
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { root } from '../lib/repo.mjs';

/** 包所在的目录 → 不能在运行时导入的包（前缀匹配） */
const RULES = [
  {
    dirs: ['packages/tsx', 'packages/ui'],
    forbidden: ['@zerodep-dev/easy-query-ts', '@zerodep-dev/vue-tsx-pro-kit'],
  },
  // 框架只管渲染、数据、action 与会话；ORM、流程引擎由应用接进来
  { dirs: ['packages/kit'], forbidden: ['@zerodep-dev/easy-query-ts', '@zerodep-dev/flow-ts-'] },
  { dirs: familyDirs('packages/easy-query'), forbidden: ['vue', '@zerodep-dev/vue-tsx-pro-'] },
  {
    dirs: ['packages/flow/model'],
    forbidden: ['vue', '@zerodep-dev/vue-tsx-pro-', '@zerodep-dev/easy-query-ts'],
  },
  { dirs: ['packages/flow/engine'], forbidden: ['vue', '@zerodep-dev/vue-tsx-pro-'] },
];

function familyDirs(dir) {
  return readdirSync(join(root, dir), { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && existsSync(join(root, dir, entry.name, 'package.json')),
    )
    .map((entry) => `${dir}/${entry.name}`);
}

function sources(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '.test' ? [] : sources(path);
    return /\.(?:ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name) ? [path] : [];
  });
}

/** 'vue' 只认它本身与子路径（vue/server-renderer），不连带 vue-router；其余按前缀（easy-query 的各方言包） */
const matches = (specifier, name) =>
  name === 'vue' ? specifier === 'vue' || specifier.startsWith('vue/') : specifier.startsWith(name);

/** 运行时导入（`import type`、`export type` 不算）的模块名 */
const IMPORT =
  /^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm;

const problems = [];
let files = 0;
for (const { dirs, forbidden } of RULES) {
  for (const dir of dirs) {
    for (const file of sources(join(root, dir, 'src'))) {
      files++;
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(IMPORT)) {
        const specifier = match[1] ?? match[2];
        const hit = forbidden.find((name) => matches(specifier, name));
        if (hit)
          problems.push(
            `${relative(root, file).replaceAll('\\', '/')} 导入了 ${specifier}（${dir} 不能依赖 ${hit}）`,
          );
      }
    }
  }
}

if (problems.length) {
  console.error(
    `包之间的分层检查没通过（${problems.length} 处）：\n${problems.map((p) => `  ${p}`).join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log(`包之间的分层检查通过：${files} 个文件`);
}
