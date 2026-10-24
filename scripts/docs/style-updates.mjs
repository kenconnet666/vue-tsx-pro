// 样式更新基准：打开文档站的 /bench/style-updates，逐个场景改状态，统计样式层动了什么。
// 先开着文档站（pnpm dev:docs，端口 5174）。
//
//   node scripts/docs/style-updates.mjs                 四种写法（sx、attr、emotion、vars）都跑
//   node scripts/docs/style-updates.mjs sx --json=out.json
//   node scripts/docs/style-updates.mjs sx,vars --rounds=9     轮数（取中位数），默认 3
//
// 每个场景：耗时（含 Vue 调度与强制布局，三轮取中位数）、样式重算次数与耗时（CDP Performance 指标）、
// DOM 改动（按属性名）、CSSOM 改动、行组件渲染次数、规则总数的变化
import { writeFileSync } from 'node:fs';
import { requireFrom } from '../lib/repo.mjs';

const { chromium } = requireFrom('apps/host-demo')('playwright');
const args = process.argv.slice(2);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const modes = args.find((arg) => !arg.startsWith('--'))?.split(',') ?? [
  'sx',
  'attr',
  'emotion',
  'vars',
];
const origin = option('origin') ?? 'http://localhost:5174';

// [场景, 每轮次数]
const SCENARIOS = [
  ['widths', 20],
  ['oneWidth', 20],
  ['hot', 10],
  ['unrelated', 10],
  ['tabs', 10],
  ['disabled', 10],
  ['tone', 10],
  ['theme', 4],
];
const ROUNDS = Number(option('rounds') ?? 3);

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const browser = await chromium.launch();
// 预热：开发服务器第一次转换模块很慢，不算进挂载
{
  const page = await browser.newPage();
  await page.goto(`${origin}/bench/style-updates?mode=vars`);
  await page.waitForFunction(() => window.__bench);
  await page.close();
}
const results = {};
for (const mode of modes) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.on('pageerror', (error) => console.log(`[${mode}] pageerror`, error.message));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () =>
    Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]),
    );
  const mountStart = Date.now();
  await page.goto(`${origin}/bench/style-updates?mode=${mode}`);
  await page.waitForFunction(
    () => window.__bench && document.querySelectorAll('[role=tab]').length,
  );
  const mount = Date.now() - mountStart;
  const row = { mount, rulesAtStart: await page.evaluate(() => window.__bench.rules()) };
  for (const [name, times] of SCENARIOS) {
    const rounds = [];
    for (let round = 0; round < ROUNDS; round++) {
      const before = await metrics();
      const run = await page.evaluate(([n, t]) => window.__bench.run(n, t), [name, times]);
      const after = await metrics();
      rounds.push({
        ...run,
        recalcStyles: after.RecalcStyleCount - before.RecalcStyleCount,
        recalcMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
        layouts: after.LayoutCount - before.LayoutCount,
      });
    }
    const last = rounds.at(-1);
    row[name] = {
      ms: +median(rounds.map((r) => r.ms)).toFixed(1),
      recalcMs: +median(rounds.map((r) => r.recalcMs)).toFixed(1),
      // 每次状态变化的平均：DOM 改动、CSSOM 改动、行渲染
      perChange: {
        renders: last.renders / times,
        mutations: Object.fromEntries(
          Object.entries(last.mutations).map(([key, value]) => [key, value / times]),
        ),
        cssom: Object.fromEntries(
          Object.entries(last.cssom).map(([key, value]) => [key, value / times]),
        ),
      },
    };
  }
  row.rulesAtEnd = await page.evaluate(() => window.__bench.rules());
  results[mode] = row;
  await page.close();
}
await browser.close();

for (const [mode, row] of Object.entries(results)) {
  console.log(`\n== ${mode}：挂载 ${row.mount}ms，规则 ${row.rulesAtStart} → ${row.rulesAtEnd}`);
  for (const [name] of SCENARIOS) {
    const { ms, recalcMs, perChange } = row[name];
    const format = (table) =>
      Object.entries(table)
        .map(([key, value]) => `${key}×${+value.toFixed(2)}`)
        .join(' ') || '无';
    console.log(
      `  ${name.padEnd(10)} ${String(ms).padStart(7)}ms  重算样式 ${String(recalcMs).padStart(6)}ms  ` +
        `渲染 ${perChange.renders}  DOM ${format(perChange.mutations)}  CSSOM ${format(perChange.cssom)}`,
    );
  }
}
const json = option('json');
if (json) writeFileSync(json, JSON.stringify(results, null, 2));
