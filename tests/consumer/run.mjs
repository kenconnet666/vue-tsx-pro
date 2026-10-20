/**
 * 发布产物验证：用 pnpm pack 打出的包，在仓库之外的独立应用（tests/consumer/app 的副本）里
 * 安装、类型检查、构建，再在真实浏览器里运行，确认使用方只靠 npm 产物就能用。
 *
 * 重点是 StyleX：组件库保留 stylex.create，由使用方编译；token 变量名在使用方必须对得上，
 * 否则颜色、间距全部失效。
 *
 * 用法：pnpm test:consumer（先构建 packages，失败时保留临时目录便于排查）
 */
import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const work = mkdtempSync(join(tmpdir(), 'vue-tsx-pro-consumer-'));
const app = join(work, 'app');

/**
 * 独立应用里的环境：仓库的 nodeOptions（pnpm-workspace.yaml）让 Node 按 @vue-tsx-pro/source 条件读各包源码，
 * 使用方没有这个条件，装的包里也没有源码，在独立应用里要去掉，否则会去找不存在的 src/
 */
const consumerEnv = {
  ...process.env,
  NODE_OPTIONS: (process.env.NODE_OPTIONS ?? '')
    .replace(/--conditions[= ]@vue-tsx-pro\/source/g, '')
    .trim(),
};

/** 经过 shell 执行（Windows 上 pnpm、npm、npx 是 .cmd）；参数里有空格时加引号 */
function run(command, args, cwd) {
  const line = [command, ...args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg))].join(' ');
  console.log(`\n> ${line}`);
  execSync(line, { cwd, stdio: 'inherit', env: cwd === root ? process.env : consumerEnv });
}

/** 使用方要装的第三方依赖，版本与仓库 catalog 一致 */
function catalogVersions(names) {
  const yaml = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  return Object.fromEntries(
    names.map((name) => {
      const match = new RegExp(`^\\s+'?${name.replace('/', '\\/')}'?: (\\S+)`, 'm').exec(yaml);
      if (!match) throw new Error(`pnpm-workspace.yaml 的 catalog 里没有 ${name}`);
      return [name, match[1]];
    }),
  );
}

function pack(pkg) {
  run('pnpm', ['pack', '--pack-destination', work], join(root, 'packages', pkg));
  const file = readdirSync(work).find((name) => name.startsWith(`vue-tsx-pro-${pkg}-`));
  return `file:../${file}`;
}

/**
 * 托管构建产物的静态服务器。不从临时应用里加载 vite：它的原生模块在 Windows 上会锁住文件，
 * 进程结束前临时目录就删不掉
 */
async function serveStatic(dir) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  const server = createServer((request, response) => {
    const path = join(dir, request.url === '/' ? 'index.html' : request.url.split('?')[0]);
    if (!existsSync(path)) return response.writeHead(404).end();
    response.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
    response.end(readFileSync(path));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

async function checkInBrowser() {
  const { server, url } = await serveStatic(join(app, 'dist'));
  // 浏览器用仓库里已安装的 Playwright（宿主示例的开发依赖）
  const { chromium } = createRequire(join(root, 'apps/host-demo/package.json'))('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    await page.goto(url);
    await page.waitForSelector('.count svg');

    const style = (selector, property) =>
      page.$eval(selector, (element, name) => getComputedStyle(element)[name], property);
    const checks = {
      'token 颜色生效（accent = indigo 9）': [
        await style('.count', 'backgroundColor'),
        'rgb(62, 99, 221)',
      ],
      '暗色 Provider 里的文字色（slate 12 dark）': [
        await style('.dark-text', 'color'),
        'rgb(237, 238, 240)',
      ],
      'Icon 有无障碍名称': [
        await page.$eval('.count svg', (svg) => svg.getAttribute('role')),
        'img',
      ],
    };
    // 语言按需加载，高亮结果异步到达
    await page.waitForSelector('.code code span');
    checks['Shiki 高亮的关键字取主题颜色（accentText = indigo 11）'] = [
      await page.$eval('.code code span', (span) => getComputedStyle(span).color),
      'rgb(58, 91, 199)',
    ];
    await page.click('.count');
    checks['符文状态可交互'] = [(await page.textContent('.count')).trim(), '1'];
    checks['控制台没有错误'] = [errors.join('\n'), ''];

    const failed = Object.entries(checks).filter(([, [actual, expected]]) => actual !== expected);
    for (const [name, [actual, expected]] of Object.entries(checks)) {
      console.log(
        `${actual === expected ? '✓' : '✗'} ${name}${actual === expected ? '' : `：得到 ${JSON.stringify(actual)}，应为 ${JSON.stringify(expected)}`}`,
      );
    }
    if (failed.length) throw new Error(`${failed.length} 项浏览器检查未通过`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run('pnpm', ['build'], root);
cpSync(join(root, 'tests/consumer/app'), app, { recursive: true });
writeFileSync(
  join(app, 'package.json'),
  JSON.stringify(
    {
      name: 'consumer',
      private: true,
      type: 'module',
      dependencies: {
        '@vue-tsx-pro/tsx': pack('tsx'),
        '@vue-tsx-pro/ui': pack('ui'),
        ...catalogVersions(['vue', '@stylexjs/stylex', '@lucide/icons', 'shiki', 'zod']),
      },
      devDependencies: catalogVersions(['vite', 'typescript']),
    },
    null,
    2,
  ),
);
run('npm', ['install', '--no-audit', '--no-fund'], app);
run('npx', ['tsc', '-p', '.'], app);
run('npx', ['vite', 'build'], app);
await checkInBrowser();

console.log('\n发布产物验证通过');
try {
  // Windows 上构建工具的文件句柄可能稍后才释放
  rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
} catch (error) {
  console.warn(`临时目录没能删除（不影响结果）：${work}\n${error.message}`);
}
