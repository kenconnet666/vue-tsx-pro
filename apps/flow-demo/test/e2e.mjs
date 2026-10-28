/**
 * 端到端测试（ROADMAP 14.9）：对构建产物跑一遍审批——申请人发起 5 天的请假，经理同意，人事备案，结束；
 * 再发起一张 1 天的，经理退回、申请人重新提交后直接回到经理。按页面的模式跑一遍，整站浏览器渲染（RENDER_MODE=csr）再跑一遍。
 *
 *   pnpm build && node test/e2e.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = 5186;
const base = `http://localhost:${port}`;

async function startServer(env) {
  const server = spawn(process.execPath, [join(app, '.output/server/index.mjs')], {
    env: { ...process.env, PORT: String(port), ...env },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return server;
    } catch {
      // 还没起来
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  server.kill();
  throw new Error('服务器 10 秒内没有起来');
}

async function run(mode) {
  const server = await startServer(mode === 'csr' ? { RENDER_MODE: 'csr' } : {});
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => {
    // 退回不写意见是故意的，接口回 400，浏览器会记一条加载失败
    if (/status of 400/.test(message.text())) return;
    if (message.type() === 'error' || /hydrat/i.test(message.text())) problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  const signIn = (user, back) =>
    page.goto(`${base}/api/sign-in?user=${user}&back=${encodeURIComponent(back)}`, {
      waitUntil: 'networkidle',
    });
  const state = () => page.getByTestId('state');

  try {
    // 没登录：待办页 403
    assert.equal((await fetch(base)).status, 403);

    // 申请人发起 5 天的请假
    await signIn('alice', '/start');
    await page.getByRole('textbox', { name: '事由' }).fill('回老家');
    await page.getByRole('spinbutton', { name: '天数' }).fill('5');
    await page.getByRole('button', { name: '发起请假' }).click();
    await state().getByText('进行中：经理审批').waitFor();
    const instance = page.url().split('/').pop();

    // 经理在待办里看到、同意（收件箱里的待办直接处理等于先认领）
    await signIn('bob', '/');
    await page.getByRole('list', { name: '待办列表' }).getByText('请假：回老家（5 天）').click();
    await page.getByRole('button', { name: '同意', exact: true }).click();
    await state().getByText('进行中：人事备案').waitFor();

    // 超过 3 天：人事备案后结束
    await signIn('carol', `/instances/${instance}`);
    await page.getByRole('button', { name: '已备案' }).click();
    await state().getByText('已结束：approved').waitFor();

    // 1 天的：经理退回（要写意见），申请人重新提交后直接回到经理
    await signIn('alice', '/start');
    await page.getByRole('textbox', { name: '事由' }).fill('看病');
    await page.getByRole('spinbutton', { name: '天数' }).fill('1');
    await page.getByRole('button', { name: '发起请假' }).click();
    await state().getByText('进行中：经理审批').waitFor();
    const second = page.url().split('/').pop();
    await signIn('bob', `/instances/${second}`);
    await page.getByRole('button', { name: '退回修改' }).click();
    await page.getByText('要写意见').waitFor();
    await page.getByRole('textbox', { name: '意见' }).fill('写清楚日期');
    await page.getByRole('button', { name: '退回修改' }).click();
    await state().getByText('进行中：申请人修改').waitFor();
    await signIn('alice', `/instances/${second}`);
    await page.getByRole('button', { name: '重新提交' }).click();
    await state().getByText('进行中：经理审批').waitFor();

    // 我发起的：两张，一张完成
    await signIn('alice', '/');
    await page.getByRole('list', { name: '我发起的' }).getByText('已完成').waitFor();

    assert.deepEqual(problems, [], `${mode}：没有报错与水合警告`);
    console.log(`${mode}：通过`);
  } finally {
    await browser.close();
    server.kill();
  }
}

await run('ssr');
await run('csr');
