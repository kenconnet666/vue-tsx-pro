// 手机宽度的检查：在 375 宽、触屏的手机上逐个打开组件页，列出把页面撑宽的元素（在哪个示例、哪个部件），
// 以及字号小于 16px 的输入框（iOS 聚焦时会放大整页）。先开着文档站（pnpm -C apps/docs dev）。
//
//   node scripts/docs/mobile-audit.mjs                 全部组件页
//   node scripts/docs/mobile-audit.mjs button,select   只看这几页
//   --open                                       每个示例点开第一个触发器，打开的弹层、对话框超出屏幕的也列出
//   --origin=http://localhost:5175 --jobs=6 --json=out.json
import { globSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

const { chromium } = requireFrom('apps/host-demo')('playwright');
const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const list = args.find((arg) => !arg.startsWith('--'));
const origin = option('origin', 'http://localhost:5174');
const jobs = Number(option('jobs', 6));
const WIDTH = 375;

const kebab = (name) => name.replace(/(?<=[a-z0-9])([A-Z])/g, '-$1').toLowerCase();
const pages = list
  ? list.split(',')
  : globSync('apps/docs/src/components/*/*/docs.tsx', { cwd: root })
      .map((file) => kebab(basename(dirname(file))))
      .sort();

/** 页面里：超出屏幕、祖先都没裁剪的最外层元素；小于 16px 的输入框 */
function inspect(width) {
  const clipped = (element) => {
    for (let p = element.parentElement; p; p = p.parentElement) {
      const style = getComputedStyle(p);
      if (style.overflowX !== 'visible' || style.position === 'fixed') return true;
    }
    return false;
  };
  const label = (element) => {
    const example = element.closest('[id]');
    const scope = element.getAttribute('data-scope');
    const part = element.getAttribute('data-part');
    return {
      example: example?.id ?? '',
      element: `${element.tagName.toLowerCase()}${scope ? `[${scope}${part ? `/${part}` : ''}]` : ''}`,
      right: Math.round(element.getBoundingClientRect().right),
      text: element.textContent.trim().slice(0, 40),
    };
  };
  const wide = [...document.querySelectorAll('main *')].filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.right > width + 1 && !clipped(element);
  });
  const outermost = wide.filter((element) => !wide.includes(element.parentElement));
  const small = [
    ...document.querySelectorAll('main input, main textarea, main [contenteditable="true"]'),
  ]
    .filter((element) => {
      const type = element.getAttribute('type');
      if (['checkbox', 'radio', 'range', 'color', 'file', 'hidden'].includes(type)) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && parseFloat(getComputedStyle(element).fontSize) < 16;
    })
    .slice(0, 6)
    .map((element) => {
      const owner = element.closest('[data-scope]');
      return {
        element: `${element.tagName.toLowerCase()}${owner ? `[${owner.getAttribute('data-scope')}/${owner.getAttribute('data-part')}]` : ''}`,
        fontSize: getComputedStyle(element).fontSize,
      };
    });
  return {
    pageWidth: document.documentElement.scrollWidth,
    wide: outermost.slice(0, 8).map(label),
    smallInputs: small,
  };
}

// --open：每个示例点开第一个触发器（同 shot.mjs 的 --open），打开的弹层、对话框超出屏幕的记下来
const open = args.includes('--open');
const OPENED = ':is(:popover-open, dialog[open]):not([data-audit-before])';

async function openExamples(page) {
  const found = [];
  let opened = 0;
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('main section > h2[id]')].map((heading) => heading.id),
  );
  for (const id of ids) {
    const demo = page.locator(`[id="${id}"]`).locator('xpath=..').locator('[data-demo]');
    const marked = demo.locator('[aria-haspopup], [aria-expanded]');
    const trigger = (
      (await marked.count())
        ? marked
        : demo.locator('button:not([aria-pressed], [role="radio"], [role="tab"])')
    ).first();
    if (!(await trigger.count())) continue;
    await page.evaluate(() => {
      for (const element of document.querySelectorAll(':popover-open, dialog[open]'))
        element.setAttribute('data-audit-before', '');
    });
    try {
      await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await trigger.click({ timeout: 3000 });
      await page.waitForTimeout(600);
      opened += await page.locator(OPENED).count();
      const out = await page.evaluate(
        ([opened, width]) =>
          [...document.querySelectorAll(opened)]
            .map((element) => ({ element, rect: element.getBoundingClientRect() }))
            .filter(({ rect }) => rect.width > 0 && (rect.left < -1 || rect.right > width + 1))
            .map(({ element, rect }) => ({
              element: `${element.tagName.toLowerCase()}[${element.getAttribute('data-scope') ?? ''}/${element.getAttribute('data-part') ?? ''}]`,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
            })),
        [OPENED, WIDTH],
      );
      for (const item of out) found.push({ example: id, ...item });
    } catch {
      // 点不开（被遮住、是链接）：跳过
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.evaluate((opened) => {
      for (const element of document.querySelectorAll(opened)) {
        if (element instanceof HTMLDialogElement) element.close();
        else element.hidePopover?.();
      }
    }, OPENED);
  }
  return { opened, found };
}

const browser = await chromium.launch();
const results = {};
const queue = [...pages];
async function worker() {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  for (let name = queue.shift(); name; name = queue.shift()) {
    try {
      await page.goto(`${origin}/components/${name}`, { waitUntil: 'load', timeout: 60_000 });
      await page.waitForSelector('main h1', { timeout: 30_000 });
      await page.waitForTimeout(1500);
      results[name] = await page.evaluate(inspect, WIDTH);
      if (open) {
        const { opened, found } = await openExamples(page);
        Object.assign(results[name], { opened, overlays: found });
      }
    } catch (error) {
      results[name] = { error: String(error.message).split('\n')[0] };
    }
  }
  await context.close();
}
await Promise.all(Array.from({ length: jobs }, worker));
await browser.close();

const failing = Object.entries(results).filter(
  ([, r]) =>
    r.error || r.pageWidth > WIDTH || r.wide?.length || r.smallInputs?.length || r.overlays?.length,
);
for (const [name, r] of failing) {
  if (r.error) {
    console.log(`✗ ${name}：${r.error}`);
    continue;
  }
  const notes = [];
  if (r.pageWidth > WIDTH) notes.push(`页面宽 ${r.pageWidth}`);
  if (r.smallInputs.length)
    notes.push(
      `输入框字号小于 16px：${[...new Set(r.smallInputs.map((i) => `${i.element} ${i.fontSize}`))].join('、')}`,
    );
  if (r.overlays?.length) notes.push('打开的浮层超出屏幕');
  console.log(`✗ ${name}：${notes.join('，')}`);
  for (const w of r.wide)
    console.log(`    ${w.example || '—'} ${w.element} 到 ${w.right}：${w.text}`);
  for (const o of r.overlays ?? [])
    console.log(`    ${o.example} 打开的 ${o.element} 在 ${o.left}–${o.right}`);
}
const opened = Object.values(results).reduce((sum, r) => sum + (r.opened ?? 0), 0);
console.log(
  `${pages.length - failing.length} / ${pages.length} 页没问题${open ? `（打开了 ${opened} 个浮层）` : ''}`,
);
const out = option('json', '');
if (out) writeFileSync(out, JSON.stringify(results, null, 2));
