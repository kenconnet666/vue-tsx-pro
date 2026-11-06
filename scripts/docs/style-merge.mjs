// 样式合并基准：组件库 Button、只走引擎样式路径、原生 CSS（@layer）、不挂样式四种写法，生产构建里比挂载、重渲染、
// 换档位、换主题、加定制层的开销（页面见 apps/docs/bench/style-merge.tsx）。
//
//   node scripts/docs/style-merge.mjs --build                 先构建（改了组件库或基准页之后），四种写法都跑
//   node scripts/docs/style-merge.mjs real,native --rounds=9  只跑几种，轮数（取中位数）默认 7
//   node scripts/docs/style-merge.mjs real --count=4000       按钮个数，默认 2000
//   node scripts/docs/style-merge.mjs real --profile=rerender --build   不压缩地构建，剖析某个场景的 CPU（按函数自身耗时）
//   node scripts/docs/style-merge.mjs real,lite --against=<目录>   和另一份构建交错跑（A/B），它的结果名带 @against
//   --json=out.json                                           结果另存
//
// 每轮每种写法新开一页（冷挂载才可比），写法之间交错；每个场景前先 GC。
// script = 改状态到 Vue 更新完（渲染、比对、改 DOM、插规则），layout = 之后强制布局（样式重算 + 布局）
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

const { chromium } = requireFrom('apps/host-demo')('playwright');
const args = process.argv.slice(2);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const modes = args.find((arg) => !arg.startsWith('--'))?.split(',') ?? [
  'real',
  'lite',
  'native',
  'bare',
];
const rounds = Number(option('rounds') ?? 7);
const count = Number(option('count') ?? 2000);
const profile = option('profile');
const against = option('against');
const outDir = join(root, 'apps/docs/node_modules/.cache/bench-style-merge');

if (args.includes('--build') || profile) {
  // 整条命令交给 shell（Windows 上 pnpm 是 .cmd）；参数是固定的，不拼外部输入
  const result = spawnSync(
    'pnpm exec vite build --configLoader native --config bench/vite.config.ts',
    {
      cwd: join(root, 'apps/docs'),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, BENCH_PROFILE: profile ? '1' : '' },
    },
  );
  if (result.status) process.exit(result.status);
}

// [结果里的名字, 场景, 次数]：次数 > 1 的取每次的平均
const SEQUENCE = [
  ['mount (cold)', 'mount', 1],
  ['rerender', 'rerender', 5],
  ['variant change', 'variant', 3],
  ['theme toggle', 'theme', 2],
  ['unmount', 'unmount', 1],
  ['mount (warm)', 'mount', 1],
  ['unmount', 'unmount', 1],
  ['custom mount', 'customMount', 1],
  ['custom rerender', 'rerender', 5],
  ['reset', 'reset', 1],
  ['explode mount', 'explodeMount', 1],
  ['reset', 'reset', 1],
];
const REPORTED = [...new Set(SEQUENCE.map(([label]) => label))].filter(
  (label) => label !== 'reset' && label !== 'unmount',
);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const servers = [];
/** 一份构建一个本地服务，返回它的地址 */
async function serve(dir) {
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://x').pathname;
    try {
      const body = readFileSync(join(dir, path === '/' ? 'index.html' : path));
      response.writeHead(200, { 'content-type': TYPES[extname(path) || '.html'] ?? 'text/plain' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, resolve));
  servers.push(server);
  return `http://localhost:${server.address().port}`;
}
const builds = [{ suffix: '', origin: await serve(outDir) }];
if (against) builds.push({ suffix: '@against', origin: await serve(against) });
/** 要跑的组合：写法 × 构建，结果按 name 汇总 */
const runs = modes.flatMap((mode) =>
  builds.map(({ suffix, origin }) => ({ name: mode + suffix, mode, origin })),
);

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const browser = await chromium.launch();

/** 一页跑完整个序列：每个场景的计时与 CDP 指标（样式重算、布局、脚本的耗时） */
async function runPage({ mode, origin }, profiled) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (error) => console.log(`[${mode}] pageerror`, error.message));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () =>
    Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]),
    );
  await page.goto(`${origin}/?mode=${mode}&count=${count}`);
  await page.waitForFunction(() => window.__bench);
  const row = {};
  let profileResult;
  for (const [label, scenario, times] of SEQUENCE) {
    await cdp.send('HeapProfiler.collectGarbage');
    if (profiled === label) {
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', { interval: 50 });
      await cdp.send('Profiler.start');
    }
    const before = await metrics();
    const runs = [];
    for (let i = 0; i < times; i++) {
      runs.push(await page.evaluate((name) => window.__bench.run(name), scenario));
    }
    const after = await metrics();
    if (profiled === label) profileResult = (await cdp.send('Profiler.stop')).profile;
    const average = (key) => runs.reduce((sum, run) => sum + run[key], 0) / times;
    const delta = (key) => ((after[key] - before[key]) * 1000) / times;
    row[label] ??= {
      script: average('script'),
      layout: average('layout'),
      total: average('total'),
      recalc: delta('RecalcStyleDuration'),
      layoutCdp: delta('LayoutDuration'),
      js: delta('ScriptDuration'),
    };
    if (label === 'mount (cold)') {
      row.heapAfterMount = after.JSHeapUsedSize / 1024 / 1024;
      row.statsAfterMount = await page.evaluate(() => window.__bench.stats());
    }
  }
  row.statsAtEnd = await page.evaluate(() => window.__bench.stats());
  await page.close();
  return { row, profile: profileResult };
}

/** CPU 剖析按函数的自身耗时汇总（同名同位置合并） */
function summarize(profileData) {
  const byId = new Map(profileData.nodes.map((node) => [node.id, node]));
  const self = new Map();
  const interval = (profileData.endTime - profileData.startTime) / profileData.samples.length;
  for (const id of profileData.samples) {
    const { callFrame } = byId.get(id);
    const file = callFrame.url.split('/').pop() || '(native)';
    const key = `${callFrame.functionName || '(anonymous)'}  ${file}:${callFrame.lineNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + interval / 1000);
  }
  const total = [...self.values()].reduce((sum, value) => sum + value, 0);
  return { total, top: [...self].sort((a, b) => b[1] - a[1]).slice(0, 40) };
}

const close = async () => {
  await browser.close();
  for (const server of servers) server.close();
};

if (profile) {
  for (const run of runs) {
    await runPage(run); // 预热
    const { profile: data } = await runPage(run, profile);
    const { total, top } = summarize(data);
    console.log(`\n== ${run.name} · ${profile}：${total.toFixed(1)} ms（含空闲）`);
    for (const [key, ms] of top) console.log(`  ${ms.toFixed(2).padStart(8)} ms  ${key}`);
  }
  await close();
  process.exit(0);
}

await runPage(runs[0]); // 预热浏览器
const results = Object.fromEntries(runs.map(({ name }) => [name, []]));
for (let round = 0; round < rounds; round++) {
  for (const run of runs) results[run.name].push((await runPage(run)).row);
}
await close();

const names = runs.map(({ name }) => name);
const summary = {};
for (const mode of names) {
  const rows = results[mode];
  summary[mode] = Object.fromEntries(
    REPORTED.map((label) => [
      label,
      Object.fromEntries(
        ['script', 'layout', 'total', 'recalc', 'js'].map((key) => [
          key,
          +median(rows.map((row) => row[label][key])).toFixed(2),
        ]),
      ),
    ]),
  );
  summary[mode].heapAfterMount = +median(rows.map((row) => row.heapAfterMount)).toFixed(1);
  summary[mode].statsAfterMount = rows.at(-1).statsAfterMount;
  summary[mode].statsAtEnd = rows.at(-1).statsAtEnd;
}

console.log(
  `\n${count} 个按钮，${rounds} 轮中位数（ms）；script = 渲染到 DOM 更新完，layout = 强制布局（含样式重算）`,
);
const pad = (value, width) => String(value).padStart(width);
console.log(`${'场景'.padEnd(18)}${names.map((mode) => pad(mode, 22)).join('')}`);
for (const label of REPORTED) {
  const cells = names.map((mode) => {
    const { script, layout, total } = summary[mode][label];
    return pad(`${total.toFixed(1)} (${script.toFixed(1)}+${layout.toFixed(1)})`, 22);
  });
  console.log(`${label.padEnd(18)}${cells.join('')}`);
}
console.log(
  `${'heap after mount'.padEnd(18)}${names.map((mode) => pad(`${summary[mode].heapAfterMount} MB`, 22)).join('')}`,
);
for (const mode of names) {
  const { statsAfterMount: a, statsAtEnd: b } = summary[mode];
  console.log(
    `${mode}: 规则 挂载后 ${a.rules} → 最后 ${b.rules}；引擎样式表 ${(a.engineCssBytes / 1024).toFixed(1)} KB → ${(b.engineCssBytes / 1024).toFixed(1)} KB；原生 CSS ${(b.nativeCssBytes / 1024).toFixed(1)} KB`,
  );
}
const json = option('json');
if (json) writeFileSync(json, JSON.stringify({ count, rounds, summary, results }, null, 2));
