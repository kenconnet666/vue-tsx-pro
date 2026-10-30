/**
 * 发布产物验证：用 pnpm pack 打出的包，在仓库之外的独立应用里安装、类型检查、构建，再在真实浏览器里运行，
 * 确认使用方只靠 npm 产物就能用。两个应用：
 *   - tests/consumer/app：桌面组件库（ui）
 *   - 移动端：用 mini 的 vtp-mini create 从新项目模板（packages/mini/template）建应用，
 *     出 H5（mobile 组件库）与 vtp-mini build 出的微信、支付宝工程；模板里写的第三方依赖范围照原样装
 *
 * 重点是样式：组件库发布编译好的 JS，样式由运行时引擎在页面里生成；主题 tokens 要在使用方登记上，
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
const mobileApp = join(work, 'mobile');

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
  const file = readdirSync(work).find((name) => name.startsWith(`zerodep-dev-vue-tsx-pro-${pkg}-`));
  if (!file) throw new Error(`pnpm pack 没有在 ${work} 里打出 ${pkg} 的包`);
  return `file:../${file}`;
}

/** 应用目录的 package.json 换上这些依赖（打出的包、catalog 的版本）后安装；没有 package.json 时新建一个 */
function install(dir, dependencies, devDependencies) {
  const path = join(dir, 'package.json');
  const manifest = existsSync(path)
    ? JSON.parse(readFileSync(path, 'utf8'))
    : { name: 'consumer', private: true, type: 'module' };
  manifest.dependencies = { ...manifest.dependencies, ...dependencies };
  manifest.devDependencies = { ...manifest.devDependencies, ...devDependencies };
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  run('npm', ['install', '--no-audit', '--no-fund'], dir);
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

/** 逐项打印检查结果（名字 → [得到的, 应为的]），有没通过的就抛错 */
function report(checks) {
  const failed = Object.entries(checks).filter(([, [actual, expected]]) => actual !== expected);
  for (const [name, [actual, expected]] of Object.entries(checks)) {
    console.log(
      `${actual === expected ? '✓' : '✗'} ${name}${actual === expected ? '' : `：得到 ${JSON.stringify(actual)}，应为 ${JSON.stringify(expected)}`}`,
    );
  }
  if (failed.length) throw new Error(`${failed.length} 项检查未通过`);
}

/** 在 Chromium 里打开 dir 下的构建产物交给 check；页面报的错收集在 errors 里 */
async function inBrowser(dir, check, contextOptions = {}) {
  const { server, url } = await serveStatic(dir);
  // 浏览器用仓库里已安装的 Playwright（宿主示例的开发依赖）
  const { chromium } = createRequire(join(root, 'apps/host-demo/package.json'))('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage(contextOptions);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    await page.goto(url);
    await check(page, errors);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function checkDesktop() {
  await inBrowser(join(app, 'dist'), async (page, errors) => {
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
      'customizeTheme 换的品牌色（grass 9）': [
        await style('.grass-text', 'color'),
        'rgb(70, 167, 88)',
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
    report(checks);
  });
}

/** 移动端：H5 在手机视口、触摸屏里看 token 与点按；小程序看两端工程的文件与 app 样式表里的主题变量 */
async function checkMobile() {
  await inBrowser(
    join(mobileApp, 'dist'),
    async (page, errors) => {
      const button = page.getByRole('button', { name: '加一' });
      await button.waitFor();
      const checks = {
        'H5：按钮取移动端的 accent（indigo 9）': [
          await button.evaluate((element) => getComputedStyle(element).backgroundColor),
          'rgb(62, 99, 221)',
        ],
      };
      await button.tap();
      // 计数那一行的标题与值挨着：页面文字里出现“计数1”
      checks['H5：点按后计数加一'] = [(await page.textContent('body')).includes('计数1'), true];
      checks['H5：控制台没有错误'] = [errors.join('\n'), ''];
      report(checks);
    },
    { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true },
  );
  const read = (path) => readFileSync(join(mobileApp, 'dist', path), 'utf8');
  report({
    '微信：app.json 登记了页面': [
      JSON.parse(read('wx/app.json')).pages.join(),
      'pages/index/index',
    ],
    '微信：app.wxss 里有 page 上的主题变量': [/page\{--vtm-/.test(read('wx/app.wxss')), true],
    '微信：页面模板': [existsSync(join(mobileApp, 'dist/wx/pages/index/index.wxml')), true],
    '支付宝：app.acss 里有 page 上的主题变量': [/page\{--vtm-/.test(read('my/app.acss')), true],
    '支付宝：页面模板': [existsSync(join(mobileApp, 'dist/my/pages/index/index.axml')), true],
  });
}

run('pnpm', ['build'], root);
const tsx = pack('tsx');

cpSync(join(root, 'tests/consumer/app'), app, { recursive: true });
install(
  app,
  {
    '@zerodep-dev/vue-tsx-pro-tsx': tsx,
    '@zerodep-dev/vue-tsx-pro-ui': pack('ui'),
    ...catalogVersions(['vue', '@lucide/icons', 'shiki', 'zod']),
  },
  catalogVersions(['vite', 'typescript']),
);
run('npx', ['tsc', '-p', '.'], app);
run('npx', ['vite', 'build'], app);
await checkDesktop();

// 模板与 create 用仓库里的（源码），装的是打出的包
run('node', [join(root, 'packages/mini/src/cli.ts'), 'create', mobileApp], root);
install(
  mobileApp,
  {
    '@zerodep-dev/vue-tsx-pro-tsx': tsx,
    '@zerodep-dev/vue-tsx-pro-mobile': pack('mobile'),
  },
  { '@zerodep-dev/vue-tsx-pro-mini': pack('mini') },
);
run('npx', ['tsc', '-p', '.'], mobileApp);
// 先出 H5（vite build 会清空 dist），再出两端小程序（dist/wx、dist/my）
run('npm', ['run', 'build'], mobileApp);
run('npm', ['run', 'build:mini'], mobileApp);
await checkMobile();

console.log('\n发布产物验证通过');
try {
  // Windows 上构建工具的文件句柄可能稍后才释放
  rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
} catch (error) {
  console.warn(`临时目录没能删除（不影响结果）：${work}\n${error.message}`);
}
