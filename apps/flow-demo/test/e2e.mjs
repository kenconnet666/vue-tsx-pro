/**
 * 端到端测试（ROADMAP 14.9）：对构建产物跑一遍审批——申请人发起 5 天的请假，经理同意，人事备案，结束；
 * 再发起一张 1 天的，经理退回、申请人重新提交后直接回到经理；管理员在设计器里用模板、试运行、发布，申请人马上能发起；
 * 8 万的采购：发起人催办、抄送；经理的待办标着时限，同意后经理与人事会签，会签里退回到经理（处理的人选退回到哪）、
 * 再同意后经理把自己那一份转办给管理员，都同意后调用“供应商核实”子流程，人事核实后采购单结束。
 * 按页面的模式跑一遍，整站浏览器渲染（RENDER_MODE=csr）再跑一遍。
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
    // 故意的：退回不写意见（接口回 400）、申请人打开设计页（403），浏览器会记一条加载失败
    if (/status of (400|403)/.test(message.text())) return;
    if (message.type() === 'error' || /hydrat/i.test(message.text())) problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  const signIn = (user, back) =>
    page.goto(`${base}/api/sign-in?user=${user}&back=${encodeURIComponent(back)}`, {
      waitUntil: 'networkidle',
    });
  const state = () => page.getByTestId('state');
  /** 审批单上按一个处理按钮：弹出的对话框里写意见（可以不写）再确认 */
  const handle = async (name, comment) => {
    // 上一次的对话框可能还在关闭的动画里（同名的确认按钮还在）：等它关掉
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name, exact: true }).click();
    const dialog = page.getByRole('dialog');
    if (comment) await dialog.getByRole('textbox', { name: '意见' }).fill(comment);
    await dialog.getByRole('button', { name, exact: true }).click();
  };

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
    await handle('同意');
    await state().getByText('进行中：人事备案').waitFor();

    // 超过 3 天：人事备案后结束
    await signIn('carol', `/instances/${instance}`);
    await handle('已备案');
    await state().getByText('已结束：approved').waitFor();

    // 1 天的：经理退回（要写意见），申请人重新提交后直接回到经理
    await signIn('alice', '/start');
    await page.getByRole('textbox', { name: '事由' }).fill('看病');
    await page.getByRole('spinbutton', { name: '天数' }).fill('1');
    await page.getByRole('button', { name: '发起请假' }).click();
    await state().getByText('进行中：经理审批').waitFor();
    const second = page.url().split('/').pop();
    await signIn('bob', `/instances/${second}`);
    // 退回要写意见：不写时对话框里报“必填”，写了才提交
    await page.getByRole('button', { name: '退回修改', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '退回修改', exact: true }).click();
    await dialog.getByText('必填').waitFor();
    await dialog.getByRole('textbox', { name: '意见' }).fill('写清楚日期');
    await dialog.getByRole('button', { name: '退回修改', exact: true }).click();
    await state().getByText('进行中：申请人修改').waitFor();
    // 留言出现在“留言”页
    await page.getByRole('tab', { name: /留言/ }).click();
    await page.getByRole('textbox', { name: /留言/ }).fill('日期写在事由里就行');
    await page.getByRole('button', { name: '发送' }).click();
    await page.getByRole('tab', { name: '留言（1）' }).waitFor();
    await signIn('alice', `/instances/${second}`);
    await handle('重新提交');
    await state().getByText('进行中：经理审批').waitFor();

    // 管理员在设计器里用报销模板，试运行看停在财务，发布后申请人在发起页看得到
    await signIn('admin', '/design');
    await page.getByRole('button', { name: '用这个模板' }).nth(2).click();
    await page.getByRole('button', { name: '试运行' }).click();
    await page.getByLabel('试运行').getByText('发起后停在：财务复核').waitFor();
    await page.getByRole('button', { name: '发布', exact: true }).click();
    await page.getByTestId('design-message').getByText('已发布 expense 第 1 版').waitFor();
    await signIn('alice', '/start');
    await page.getByRole('button', { name: '发起报销' }).waitFor();
    // 设计页要求管理员：申请人打开是“没有权限”
    await signIn('alice', '/design');
    await page.getByText('没有权限打开这一页').waitFor();

    // 我发起的：两张，一张完成
    await signIn('alice', '/');
    await page.getByRole('list', { name: '我发起的' }).getByText('已完成').waitFor();

    // 采购 8 万：经理审批限时一天，待办上有时限标记
    await signIn('alice', '/start');
    // 报销、供应商核实也有“金额”“供应商”：在采购的表单里填
    const form = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: '发起采购' }) });
    await form.getByRole('textbox', { name: '物品' }).fill('服务器');
    await form.getByRole('spinbutton', { name: '金额' }).fill('80000');
    await form.getByRole('textbox', { name: '供应商' }).fill('远山精密');
    await form.getByRole('button', { name: '发起采购' }).click();
    await state().getByText('进行中：经理审批').waitFor();
    const order = page.url().split('/').pop();
    // 发起人催办、抄送：都记进流转记录
    await handle('催办');
    await page.getByText('催办 · 经理审批').waitFor();
    await page.getByRole('button', { name: '抄送', exact: true }).click();
    const ccDialog = page.getByRole('dialog');
    await ccDialog.getByRole('combobox', { name: '抄送给' }).click();
    await page.getByRole('option', { name: '沈若水' }).click();
    // 点一下对话框的标题收起多选的下拉
    await ccDialog.getByRole('heading', { name: '抄送' }).click();
    await ccDialog.getByRole('button', { name: '抄送', exact: true }).click();
    await page.getByText('抄送 · 给 沈若水').waitFor();
    await signIn('bob', '/');
    const todoItem = page
      .getByRole('list', { name: '待办列表' })
      .getByRole('listitem')
      .filter({ hasText: '采购：服务器' });
    await todoItem.getByTitle(/^截止 /).waitFor();
    // 超过 5 万：经理同意后经理与人事会签，各一份
    await todoItem.getByRole('link').click();
    await handle('同意');
    await state().getByText('进行中：经理与人事会签').waitFor();
    const countersign = page.getByTestId('countersign');
    await countersign.getByText('周启航 · 待处理').waitFor();
    // 会签里退回：退回到哪一步由处理的人选（默认最近的经理审批），要写意见
    await handle('退回', '金额再核一下');
    await state().getByText('进行中：经理审批').waitFor();
    await handle('同意');
    await state().getByText('进行中：经理与人事会签').waitFor();
    // 周启航把自己那一份转给管理员，管理员同意
    await page.getByRole('button', { name: '转办', exact: true }).click();
    const transferDialog = page.getByRole('dialog');
    await transferDialog.getByRole('combobox', { name: '转给' }).click();
    await page.getByRole('option', { name: '管理员' }).click();
    await transferDialog.getByRole('button', { name: '转办', exact: true }).click();
    await countersign.getByText('管理员 · 待处理').waitFor();
    await page.getByText('转办 · 经理与人事会签 · 给 管理员').waitFor();
    await signIn('admin', `/instances/${order}`);
    await handle('同意');
    await countersign.getByText('管理员 · 同意').waitFor();
    await countersign.getByText('沈若水 · 待处理').waitFor();
    // 人事也同意：会签通过，调用“供应商核实”子流程
    await signIn('carol', `/instances/${order}`);
    await handle('同意');
    await state().getByText('进行中：供应商核实').waitFor();
    await page
      .getByTestId('children')
      .getByRole('link', { name: /核实供应商：远山精密/ })
      .click();
    await page.getByRole('link', { name: '采购：服务器（¥80000）' }).waitFor();
    await handle('资质齐全');
    await state().getByText('已结束：approved').waitFor();
    // 子流程结束，采购单跟着结束
    await page.getByRole('link', { name: '采购：服务器（¥80000）' }).click();
    await state().getByText('已结束：approved').waitFor();

    assert.deepEqual(problems, [], `${mode}：没有报错与水合警告`);
    console.log(`${mode}：通过`);
  } finally {
    await browser.close();
    server.kill();
  }
}

await run('ssr');
await run('csr');
