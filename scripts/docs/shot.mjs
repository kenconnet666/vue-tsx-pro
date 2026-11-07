// 文档页的示例截图：每个示例一张（卡片连同打开的弹层），各主题各一张，PNG 存到 node_modules/.cache/docs-shots。
// 先开着文档站的开发服务器（pnpm dev:docs，端口 5174）。改完示例后看一眼效果用，不进 CI。
//
//   pnpm docs:shot /components/menu                       全部示例，亮、暗两套主题
//   pnpm docs:shot /components/menu basic,groups --themes=dark
//   pnpm docs:shot /components/menu page                  整页；keyboard 是键盘小节
//   pnpm docs:shot /components/select basic --click=basic:城市    截图前点开一个按钮或下拉框（按名称找）
//   pnpm docs:shot /components/select --variant=rtl        从右到左；forced 是强制颜色（Windows 高对比），mobile 是手机（390 宽、触屏）
//   pnpm docs:shot /components/menu --open                 每个示例再截一张打开后的（点示例里的第一个按钮）
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

// playwright 装在 host-demo（浏览器测试）里
const { chromium } = requireFrom('apps/host-demo')('playwright');
const [path, which = 'all'] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
if (!path?.startsWith('/')) {
  console.error(
    '用法：pnpm docs:shot /components/<页面> [示例 id,…|all|page|keyboard] [--themes=light,dark]',
  );
  process.exit(1);
}
const option = (name, fallback) =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const themes = option('themes', 'light,dark').split(',');
const width = Number(option('width', '1280'));
const origin = option('origin', 'http://localhost:5174');
const clicks = new Map(
  process.argv
    .filter((arg) => arg.startsWith('--click='))
    .map((arg) => arg.slice(8).split(':'))
    .map(([id, ...text]) => [id, text.join(':')]),
);
// 变体：浏览器上下文多给的选项；文件名带上变体名
const VARIANTS = {
  rtl: {},
  forced: { forcedColors: 'active' },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};
const variant = option('variant', '');
if (variant && !(variant in VARIANTS)) {
  console.error(`没有这个变体：${variant}（可选 ${Object.keys(VARIANTS).join('、')}）`);
  process.exit(1);
}
const suffix = variant ? `-${variant}` : '';
// --open：浮层页的示例再截一张打开后的（点示例里的第一个按钮，打开了弹层或对话框才截）
const open = process.argv.includes('--open');

// 新打开的顶层（弹层、对话框）：markOpen 之后打开的，常驻的（Toaster 的区域）不算
const OPENED = ':is(:popover-open, dialog[open]):not([data-shot-before])';

/** 记下现在已经打开的顶层：之后的截图与“打开了没有”不算它们 */
const markOpen = (page) =>
  page.evaluate(() => {
    for (const element of document.querySelectorAll(':popover-open, dialog[open]'))
      element.setAttribute('data-shot-before', '');
  });

/** 截一个示例：换成页面坐标，卡片与新打开的顶层合起来 */
async function shoot(page, id, file) {
  // 无限循环的动画（转圈、扫光、进度条的流动）停在第一帧：每次截到同一帧；有限的过渡不动（弹层还在展开）
  await page.evaluate(() => {
    for (const animation of document.getAnimations())
      if (animation.effect?.getComputedTiming().iterations === Infinity) {
        animation.pause();
        animation.currentTime = 0;
      }
  });
  const clip = await page.evaluate(
    ([id, opened]) => {
      const rects = [
        document.getElementById(id).parentElement.getBoundingClientRect(),
        ...[...document.querySelectorAll(opened)]
          .map((element) => element.getBoundingClientRect())
          .filter((rect) => rect.width > 0 && rect.height > 0),
      ];
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      return { x: left + scrollX, y: top + scrollY, width: right - left, height: bottom - top };
    },
    [id, OPENED],
  );
  await page.screenshot({ path: join(dir, file), clip, fullPage: true });
}

/**
 * 打开示例里的触发器（标了 aria-haspopup / aria-expanded 的，没有就是第一个不是选项的按钮或链接）：先悬停
 * （Tooltip、HoverCard；点过再悬停，有的提示要等指针离开才再出现），没开再点（链接不点，会离开页面）；
 * 打开了弹层或对话框就截一张，再关掉（Esc 关不掉的直接关）
 */
async function shootOpen(page, target, id, file) {
  const demo = target.locator('[data-demo]');
  const marked = demo.locator('[aria-haspopup], [aria-expanded]');
  const trigger = (
    (await marked.count())
      ? marked
      : demo.locator(':is(button, a[href]):not([aria-pressed], [role="radio"], [role="tab"])')
  ).first();
  // 键盘、API 这类不是示例的小节、没有触发器的示例：跳过（不然下面每一步都要等到超时）
  if (!(await trigger.count())) return;
  await markOpen(page);
  const opened = () => page.locator(OPENED).count();
  try {
    // 触发器放到视口中间：贴着底边时弹层只剩一点高度
    await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await trigger.hover({ timeout: 3000 });
    await page.waitForTimeout(1000);
    if (!(await opened()) && (await trigger.evaluate((element) => element.tagName)) === 'BUTTON') {
      await trigger.click({ timeout: 3000 });
      await page.waitForTimeout(500);
    }
    if (await opened()) await shoot(page, id, file);
  } catch (error) {
    console.log(`${id}：没能打开（${error.message.split('\n')[0]}）`);
  }
  // 指针移开：留在原处会落在下一个示例上，带出悬停效果
  await page.mouse.move(0, 0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.evaluate((opened) => {
    for (const element of document.querySelectorAll(opened))
      if (element instanceof HTMLDialogElement) element.close();
      else element.hidePopover();
  }, OPENED);
}
// --out=<目录>：存到别处（shots-batch.mjs 并发截多页时各页直接写进同一批的目录）
const dir = option('out', join(root, 'node_modules/.cache/docs-shots'));
mkdirSync(dir, { recursive: true });
const name = path.replaceAll('/', '_').replace(/^_/, '');

// 同一份代码每次截出同样的图（前后比对、CI 与上一次比对用）：固定时钟与时区（“今天”、相对时间、倒计时不随日子变），
// 减少动态效果（跑马灯、扫光、加载动画停住）
const FIXED_NOW = new Date('2026-10-20T10:00:00+08:00');
const browser = await chromium.launch();
for (const theme of themes) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    reducedMotion: 'reduce',
    ...VARIANTS[variant],
  });
  await context.addInitScript((value) => localStorage.setItem('vue-tsx-pro-theme', value), theme);
  // 随机数固定种子（mulberry32）：随机出题、随机配色的示例每次截出同样的图
  await context.addInitScript(() => {
    let seed = 20261020;
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  });
  // 整页从右到左：解析完、页面脚本运行之前（readyState 变成 interactive）加上，组件挂载时就是从右到左
  if (variant === 'rtl')
    await context.addInitScript(() =>
      document.addEventListener(
        'readystatechange',
        () => document.documentElement.setAttribute('dir', 'rtl'),
        { once: true },
      ),
    );
  const page = await context.newPage();
  await page.clock.setFixedTime(FIXED_NOW);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.goto(`${origin}${path}`);
  // 开发服务器冷启动时第一次编译要一会儿
  await page.waitForFunction(() => document.querySelector('main h1'), null, { timeout: 120_000 });
  // 推迟渲染的示例卡片：滚一遍让它们都渲染出来
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
    // 站点的页头（第一个 AppShell 的 header）是粘性的：整页截图里会按当时的滚动位置盖在示例上。隐藏它（保留占位）；
    // 示例里的 AppShell 在它后面，不受影响
    document
      .querySelector('[data-scope="app-shell"][data-part="header"]')
      ?.style.setProperty('visibility', 'hidden');
  });
  await page.waitForTimeout(800);
  if (which === 'page') {
    await page.screenshot({
      path: join(dir, `${name}-page-${theme}${suffix}.png`),
      fullPage: true,
    });
  } else {
    const ids =
      which === 'all'
        ? await page.evaluate(() =>
            [...document.querySelectorAll('main section > h2[id]')].map((heading) => heading.id),
          )
        : which.split(',');
    for (const id of ids) {
      // 示例：标题所在的 section；键盘、API 等小节：标题的父元素
      const target = page.locator(`[id="${id}"]`).locator('xpath=..');
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await markOpen(page);
      if (clicks.has(id)) {
        // 按钮或下拉框（Select 的触发器是 role="combobox"），按名称找
        await target
          .getByRole('button', { name: clicks.get(id) })
          .or(target.getByRole('combobox', { name: clicks.get(id) }))
          .first()
          .click();
        await page.waitForTimeout(500);
      }
      await shoot(page, id, `${name}-${id}-${theme}${suffix}.png`);
      if (clicks.has(id)) await page.keyboard.press('Escape');
      if (open && !clicks.has(id))
        await shootOpen(page, target, id, `${name}-${id}-${theme}${suffix}-open.png`);
    }
  }
  if (errors.length)
    console.log(`${theme}：${errors.length} 个错误：${errors.slice(0, 3).join(' | ')}`);
  await context.close();
}
await browser.close();
console.log(`截图在 ${dir}`);
