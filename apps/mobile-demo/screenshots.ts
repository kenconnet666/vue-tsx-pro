// 演示页面的截图：node screenshots.ts [h5|wx] [--out <目录>]，不给平台时两端都截，默认放到 dist/screenshots/<平台>/<页面>.png。
//   - h5：起 Vite 开发服务器，Playwright 的 Chromium 按 iPhone 13 的视口与触摸屏打开每个页面
//   - wx：先 node build.ts wx 出微信工程；用开发者工具自带的 wechatide CLI 逐页打开、截模拟器（要先在开发者工具里授权客户端 claude）
// 支付宝的开发者工具没有命令行截图（minidev 只能编译、预览要扫码），截图在本地手动做。
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium, devices } from 'playwright';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const out = resolve(import.meta.dirname, outIndex >= 0 ? args[outIndex + 1]! : 'dist/screenshots');
const named = args.filter((arg) => arg === 'h5' || arg === 'wx');
const platforms = named.length ? named : ['h5', 'wx'];

/** 演示页的名字：按 src/pages/index.ts 里 DEMO_PAGES 的键（Node 读不了 TSX，按文本取） */
const pages = [
  ...readFileSync(join(import.meta.dirname, 'src/pages/index.ts'), 'utf8').matchAll(
    /^\s+(\w+): \w+Page,$/gm,
  ),
].map((match) => match[1]!);

async function h5() {
  const dir = join(out, 'h5');
  mkdirSync(dir, { recursive: true });
  const server = await createServer({ root: import.meta.dirname, logLevel: 'warn' });
  await server.listen();
  const url = server.resolvedUrls!.local[0]!;
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();
    for (const name of pages) {
      await page.goto(`${url}#${name}`, { waitUntil: 'networkidle' });
      // 进场动画、图片的淡入播完
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(dir, `${name}.png`) });
      console.log(`h5: ${name}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

function wx() {
  const dir = join(out, 'wx');
  mkdirSync(dir, { recursive: true });
  const project = join(import.meta.dirname, 'dist', 'wx');
  // wechatide 是 .cmd，要经 cmd 启动；结果是 JSON，ok 为 false（没授权、项目没打开……）时停下
  const ide = (...rest: string[]) => {
    const output = execFileSync(
      'cmd',
      ['/c', 'wechatide', '-c', 'claude', ...rest, '--project', project],
      { encoding: 'utf8', stdio: 'pipe' },
    );
    if (!output.includes('"ok": true')) throw new Error(`wechatide ${rest[0]} 失败：${output}`);
  };
  for (const name of pages) {
    ide('simulator_open_page', '--page', `pages/${name}/index`);
    // 开发者工具打开页面要先编译；列表的第一页数据也要等它加载
    const path = join(dir, `${name}.png`);
    ide('simulator_screenshot', '--path', path, '--wait', '4', '--optimize', 'false');
    console.log(`wx: ${name}`);
  }
}

for (const platform of platforms) {
  if (platform === 'h5') await h5();
  else wx();
}
