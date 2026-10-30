#!/usr/bin/env node
/**
 * 小程序的命令行，在应用目录（有 mini.config.ts）里运行：
 *
 *   vtp-mini build [wx] [my]   构建两端（或指定的一端）工程到 dist/<平台>
 *   vtp-mini dev [wx|my]       监听模式（默认微信）：改了源码只重打应用代码
 *   vtp-mini open [wx|my]      在开发者工具里打开产物（默认微信）
 *   vtp-mini create <目录>     从模板建一个新项目：H5 加两端小程序
 *
 * 微信开发者工具的命令行默认按安装位置找，装在别处时设环境变量 WECHAT_DEVTOOLS_CLI；
 * 支付宝用 minidev（npx 临时取）
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { MiniConfig } from './build/index.ts';

type PlatformName = 'wx' | 'my';

const [command = 'help', ...args] = process.argv.slice(2);
const cwd = process.cwd();
const platformsIn = (list: string[]) =>
  list.filter((arg): arg is PlatformName => arg === 'wx' || arg === 'my');

/** 读应用目录里的 mini.config.ts（Node 直接按 TS 加载，不在 node_modules 里的文件会去掉类型） */
async function loadConfig(): Promise<MiniConfig> {
  const file = resolve(cwd, 'mini.config.ts');
  if (!existsSync(file)) throw new Error(`没有找到 ${file}：vtp-mini 要在应用目录里运行`);
  const { default: config } = (await import(pathToFileURL(file).href)) as { default?: MiniConfig };
  if (!config || typeof config !== 'object')
    throw new Error(`${file} 要默认导出 defineMiniConfig(…)`);
  return config;
}

async function build(platforms: PlatformName[]) {
  const { buildMini } = await import('./build/index.ts');
  const config = await loadConfig();
  for (const platform of platforms.length ? platforms : (['wx', 'my'] as const)) {
    const started = performance.now();
    const { outDir, pages } = await buildMini({ ...config, root: cwd, platform });
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    console.log(`${platform}: ${pages.length} 个页面 → ${outDir}（${seconds}s）`);
  }
}

async function dev(platform: PlatformName) {
  const { watchMini } = await import('./build/index.ts');
  const config = await loadConfig();
  await watchMini({ ...config, root: cwd, platform, development: true }, ({ outDir, ms, count }) =>
    console.log(`${platform}: 第 ${count} 次（${ms} ms）→ ${outDir}`),
  );
}

/** 微信开发者工具的命令行：环境变量优先，再按 Windows、macOS 的默认安装位置找 */
function wechatCli(): string {
  const candidates = [
    process.env.WECHAT_DEVTOOLS_CLI,
    'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat',
    'C:\\Program Files\\Tencent\\微信web开发者工具\\cli.bat',
    '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
  ];
  const found = candidates.find((path) => path && existsSync(path));
  if (!found)
    throw new Error('没找到微信开发者工具的命令行，装在别处时设环境变量 WECHAT_DEVTOOLS_CLI');
  return found;
}

async function open(platform: PlatformName) {
  const config = await loadConfig();
  const project = resolve(cwd, config.outDir ?? `dist/${platform}`);
  if (!existsSync(project))
    throw new Error(`${project} 还没有构建，先运行 vtp-mini build ${platform}`);
  // Windows 上 cli.bat、npx 是批处理，要经 shell 启动
  const [file, fileArgs] =
    platform === 'wx'
      ? [wechatCli(), ['open', '--project', project]]
      : ['npx', ['--yes', 'minidev', 'ide', '-p', project]];
  const quoted = [file, ...fileArgs].map((part) => (/\s/.test(part) ? `"${part}"` : part));
  const result = spawnSync(quoted.join(' '), { stdio: 'inherit', shell: true });
  process.exitCode = result.status ?? 1;
}

/** 模板在包里的 template 目录（src/cli.ts 与 dist/cli.js 都在它的上一级） */
const TEMPLATE = new URL('../template/', import.meta.url);

function create(dir: string | undefined) {
  if (!dir) throw new Error('用法：vtp-mini create <目录>');
  const target = resolve(cwd, dir);
  if (existsSync(target) && readdirSync(target).length) throw new Error(`${target} 不是空目录`);
  cpSync(TEMPLATE, target, { recursive: true });
  // npm 发布时会去掉包里的 .gitignore，模板里叫 gitignore
  renameSync(join(target, 'gitignore'), join(target, '.gitignore'));
  // 三个包一起发布：mobile 与 mini 同一个版本，tsx 取 mini 的 peer 范围
  const own = JSON.parse(readFileSync(new URL('../package.json', TEMPLATE), 'utf8')) as {
    version: string;
    peerDependencies: Record<string, string>;
  };
  const manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')) as {
    name: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  manifest.name = basename(target);
  Object.assign(manifest.dependencies, {
    '@zerodep-dev/vue-tsx-pro-mobile': `^${own.version}`,
    '@zerodep-dev/vue-tsx-pro-tsx': own.peerDependencies['@zerodep-dev/vue-tsx-pro-tsx'],
    vue: own.peerDependencies.vue,
  });
  Object.assign(manifest.devDependencies, {
    '@zerodep-dev/vue-tsx-pro-mini': `^${own.version}`,
    vite: own.peerDependencies.vite,
  });
  writeFileSync(join(target, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `已建好 ${target}\n  cd ${dir}\n  npm install\n  npm run dev        # H5\n  npm run dev:wx     # 微信，另开一个终端 npm run open:wx`,
  );
}

const HELP = `用法：
  vtp-mini build [wx] [my]   构建两端（或指定的一端）
  vtp-mini dev [wx|my]       监听模式（默认微信）
  vtp-mini open [wx|my]      在开发者工具里打开产物（默认微信）
  vtp-mini create <目录>     从模板建一个新项目`;

try {
  if (command === 'build') await build(platformsIn(args));
  else if (command === 'dev') await dev(platformsIn(args)[0] ?? 'wx');
  else if (command === 'open') await open(platformsIn(args)[0] ?? 'wx');
  else if (command === 'create') create(args[0]);
  else console.log(HELP);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
