// 文档站示例的计算样式快照：样式引擎、组件结构重构前后各记一份，逐个元素、逐个属性比对（截图看不出的光标、过渡、悬停态也算）。
// 每个示例区（[data-demo]）里的每个元素记约 60 个外观属性；可交互的元素再强制 :hover、:focus-visible、:active 各记一次（CDP）。
// 先开着文档站（截图专用的工作树：pnpm 预览 docs-shots，端口 5175）。
//
//   node scripts/docs/computed-styles.mjs base all --origin=http://localhost:5175   全部组件页，存到 node_modules/.cache/docs-computed-base
//   node scripts/docs/computed-styles.mjs after button,card                         只记几页
//   node scripts/docs/computed-styles.mjs --compare base after                      比对：列出不同的页、示例、元素、状态、属性
//   node scripts/docs/computed-styles.mjs --compare base after --ignore=base2       两份基线之间本来就不稳定的（动画、时钟）不算
import { globSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const positional = args.filter((arg) => !arg.startsWith('--'));
const dirOf = (label) => join(root, `node_modules/.cache/docs-computed-${label}`);

/** 记下的属性：外观与布局，不含随内容变的（滚动位置）与只在动画中间才有的 */
const PROPERTIES = [
  'display',
  'position',
  'box-sizing',
  'width',
  'height',
  'min-height',
  'max-width',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'color',
  'background-color',
  'background-image',
  'opacity',
  'box-shadow',
  'outline-style',
  'outline-width',
  'outline-color',
  'outline-offset',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration-line',
  'text-transform',
  'white-space',
  'text-overflow',
  'overflow-x',
  'overflow-y',
  'cursor',
  'visibility',
  'pointer-events',
  'user-select',
  'gap',
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'align-self',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'grid-template-columns',
  'z-index',
  'transform',
  'transition-property',
  'transition-duration',
  'vertical-align',
  'fill',
  'stroke',
];

/** 强制的伪类：只给可交互的元素 */
const STATES = ['hover', 'focus-visible', 'active'];
const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"]), [role="option"], [role="tab"], [role="menuitem"], [role="treeitem"], [role="gridcell"]';

if (args.includes('--compare')) compare();
else await record();

/* ───────── 记录 ───────── */

async function record() {
  const [label, list = 'all'] = positional;
  if (!label) {
    console.error(
      '用法：node scripts/docs/computed-styles.mjs <标签> [all|页面,…] [--origin=…] [--jobs=3]',
    );
    process.exit(1);
  }
  const kebab = (name) => name.replace(/(?<=[a-z0-9])([A-Z])/g, '-$1').toLowerCase();
  const pages =
    list === 'all'
      ? globSync('apps/docs/src/components/*/*/docs.tsx', { cwd: root })
          .map((file) => kebab(basename(dirname(file))))
          .sort()
      : list.split(',');
  const dir = dirOf(label);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const origin = option('origin', 'http://localhost:5174');
  const { chromium } = requireFrom('apps/host-demo')('playwright');
  const browser = await chromium.launch();
  const queue = [...pages];
  const failed = [];
  const worker = async () => {
    for (let page = queue.shift(); page; page = queue.shift()) {
      try {
        const data = await snapshot(browser, `${origin}/components/${page}`);
        writeFileSync(join(dir, `${page}.json`), JSON.stringify(data));
        console.log(`✓ ${page}（${Object.keys(data).length} 个示例）`);
      } catch (error) {
        failed.push(page);
        console.log(`✗ ${page}：${String(error.message).split('\n')[0]}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Number(option('jobs', 3)) }, worker));
  await browser.close();
  console.log(
    `${pages.length - failed.length} / ${pages.length} 页${failed.length ? `，失败：${failed.join(',')}` : ''}`,
  );
}

/** 一页：示例 id → { 元素路径 → { 状态 → { 属性 → 值 } } } */
async function snapshot(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() => localStorage.setItem('vue-tsx-pro-theme', 'light'));
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('main h1'), null, { timeout: 120_000 });
  // 推迟渲染的示例滚到才出来：先滚一遍
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  const data = await page.evaluate(
    ({ properties, interactive }) => {
      const result = {};
      let mark = 0;
      for (const demo of document.querySelectorAll('main [data-demo]')) {
        const id = demo.closest('section')?.querySelector('h2[id]')?.id ?? `demo${mark}`;
        const elements = {};
        const walk = (element, path) => {
          const style = getComputedStyle(element);
          const values = {};
          for (const property of properties) values[property] = style.getPropertyValue(property);
          elements[path] = { default: values };
          if (element.matches(interactive))
            element.setAttribute('data-computed-mark', String(mark++));
          [...element.children].forEach((child, index) =>
            walk(child, `${path}/${child.tagName.toLowerCase()}${index}`),
          );
        };
        [...demo.children].forEach((child, index) =>
          walk(child, `${child.tagName.toLowerCase()}${index}`),
        );
        result[id] = elements;
      }
      return result;
    },
    { properties: PROPERTIES, interactive: INTERACTIVE },
  );
  // 可交互的元素：用 CDP 强制伪类，各记一次
  const cdp = await context.newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root: doc } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
    nodeId: doc.nodeId,
    selector: '[data-computed-mark]',
  });
  for (const nodeId of nodeIds) {
    const { object } = await cdp.send('DOM.resolveNode', { nodeId });
    const where = await cdp.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      returnByValue: true,
      functionDeclaration: `function () {
        const demo = this.closest('[data-demo]');
        const id = demo?.closest('section')?.querySelector('h2[id]')?.id;
        const path = [];
        for (let node = this; node && node !== demo; node = node.parentElement)
          path.unshift(node.tagName.toLowerCase() + [...node.parentElement.children].indexOf(node));
        return { id, path: path.join('/') };
      }`,
    });
    const { id, path } = where.result.value ?? {};
    const entry = id && data[id]?.[path];
    if (!entry) continue;
    for (const state of STATES) {
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [state] });
      const values = await cdp.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        returnByValue: true,
        arguments: [{ value: PROPERTIES }],
        functionDeclaration: `function (properties) {
          const style = getComputedStyle(this);
          return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
        }`,
      });
      // 只记和默认态不同的属性
      const changed = Object.fromEntries(
        Object.entries(values.result.value).filter(
          ([property, value]) => entry.default[property] !== value,
        ),
      );
      if (Object.keys(changed).length) entry[state] = changed;
    }
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
  }
  await context.close();
  return data;
}

/* ───────── 比对 ───────── */

function compare() {
  const [a, b] = positional;
  const ignoreLabel = option('ignore');
  const load = (label, file) => {
    try {
      return JSON.parse(readFileSync(join(dirOf(label), file), 'utf8'));
    } catch {
      return null;
    }
  };
  /** 一页拍平成 "示例 元素 状态 属性" → 值 */
  const flatten = (data) => {
    const flat = new Map();
    for (const [demo, elements] of Object.entries(data ?? {}))
      for (const [path, states] of Object.entries(elements))
        for (const [state, values] of Object.entries(states))
          for (const [property, value] of Object.entries(values))
            flat.set(`${demo} ${path} ${state} ${property}`, value);
    return flat;
  };
  let total = 0;
  const lines = [];
  for (const file of readdirSync(dirOf(a)).filter((name) => name.endsWith('.json'))) {
    const before = flatten(load(a, file));
    const after = flatten(load(b, file));
    const unstable = new Set();
    if (ignoreLabel) {
      const other = flatten(load(ignoreLabel, file));
      for (const [key, value] of before) if (other.get(key) !== value) unstable.add(key);
    }
    const differences = [];
    for (const key of new Set([...before.keys(), ...after.keys()])) {
      if (unstable.has(key) || before.get(key) === after.get(key)) continue;
      differences.push(`  ${key}: ${before.get(key) ?? '（无）'} → ${after.get(key) ?? '（无）'}`);
    }
    if (!differences.length) continue;
    total += differences.length;
    lines.push(
      `${file.replace('.json', '')}：${differences.length} 处`,
      ...differences.slice(0, 20),
    );
    if (differences.length > 20) lines.push(`  …还有 ${differences.length - 20} 处`);
  }
  console.log(lines.join('\n'));
  console.log(total ? `共 ${total} 处不同` : '计算样式完全相同');
  process.exitCode = total ? 1 : 0;
}
