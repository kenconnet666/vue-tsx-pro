// 流程中心端到端（替代原来 apps/flow-demo 的端到端测试）：真实浏览器里 Worker 起 PGlite、建库、写种子、编译合同的流程工程，
// 林小满在工作台同意陈晓的年假，人事经理在收件箱里备案，单子结束；总经理在工作室里给请假加一个抄送、检查通过后发布第 2 版，
// 单据页里查得到全部单据。只在 Chromium 上跑（引擎、PGlite、编译器都在 Worker 里，Firefox、WebKit 首次启动太慢）
import { createUi } from '@zerodep-dev/vue-tsx-pro-ui';
import { vueRouterAdapter } from '@zerodep-dev/vue-tsx-pro-ui/vue-router';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, h, type App } from 'vue';
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router';
import { flowRoutes } from './routes';
import { useFlowCenter } from './runtime/center';

const chromium = navigator.userAgent.includes('Chrome');

/** 等到 read 返回真值，最多 timeout 毫秒（建库、写种子、编译都要时间） */
async function waitFor<T>(read: () => T | undefined | null | false, timeout = 20_000): Promise<T> {
  const deadline = performance.now() + timeout;
  for (;;) {
    const value = read();
    if (value) return value;
    if (performance.now() > deadline)
      throw new Error(
        `等待超时；路由 ${router?.currentRoute.value.fullPath}，页面上是：${main()?.innerText.slice(0, 200)}`,
      );
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

const main = () => document.querySelector('main');
const text = () => main()?.innerText ?? '';
/** 页面上的按钮（不含页签） */
const button = (label: string, root: ParentNode = document) =>
  [...root.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === label && b.getAttribute('role') !== 'tab' && !b.disabled,
  );
const tab = (label: string) =>
  [...document.querySelectorAll<HTMLElement>('[role=tab]')].find(
    (t) => t.textContent?.trim() === label,
  );
const openDialog = () => [...document.querySelectorAll('dialog')].find((d) => d.open);

let app: App | undefined;
let host: HTMLElement | undefined;
let router: Router;

describe.skipIf(!chromium)('流程中心', () => {
  beforeAll(async () => {
    // 全新的库：删掉上次留下的 IndexedDB（Worker 还没起）
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('/pglite/flow-center');
      request.onsuccess = request.onerror = request.onblocked = resolve;
    });
    localStorage.setItem('flow-center', JSON.stringify({ actor: '1003', offset: 0 }));
    router = createRouter({ history: createMemoryHistory(), routes: [flowRoutes] });
    await router.push('/flow/work');
    host = document.createElement('div');
    document.body.append(host);
    app = createApp({ render: () => h(RouterView) })
      .use(router)
      .use(createUi({ router: vueRouterAdapter(router) }));
    app.mount(host);
    await waitFor(() => text().includes('年假'), 90_000);
  }, 120_000);

  afterAll(() => {
    app?.unmount();
    host?.remove();
  });

  it('林小满同意陈晓的年假，人事经理备案，单子结束', async () => {
    (
      await waitFor(() =>
        button('同意', document.querySelector('[data-flow-outcomes]') ?? document),
      )
    ).click();
    await waitFor(() => text().includes('没有要处理的'));

    useFlowCenter().setActor('1013');
    const item = await waitFor(() =>
      [...document.querySelectorAll<HTMLElement>('main li button')].find((b) =>
        b.textContent?.includes('年假'),
      ),
    );
    item.click();
    await waitFor(() => text().includes('人事备案'));
    (
      await waitFor(() =>
        button('已备案', document.querySelector('[data-flow-outcomes]') ?? document),
      )
    ).click();
    await waitFor(
      () =>
        ![...document.querySelectorAll('main li button')].some((b) =>
          b.textContent?.includes('年假'),
        ),
    );
  }, 60_000);

  it('总经理在工作室里给请假加抄送，检查通过后发布第 2 版', async () => {
    useFlowCenter().setActor('1001');
    await router.push('/flow/studio/leave');
    await waitFor(() => text().includes('检查通过'), 30_000);
    (await waitFor(() => button('加抄送'))).click();
    await waitFor(() => text().includes('有改动') && text().includes('检查通过'), 30_000);
    (await waitFor(() => button('发布', main()!))).click();
    const dialog = await waitFor(openDialog);
    const note = dialog.querySelector('textarea')!;
    note.value = '加一个抄送';
    note.dispatchEvent(new Event('input', { bubbles: true }));
    (await waitFor(() => button('发布', dialog))).click();
    await waitFor(() => document.body.innerText.includes('已发布第 2 版'), 30_000);
    // 发布后重新取版本：标题旁的版本跟着变
    await waitFor(() => text().includes('第 2 版'));
  }, 90_000);

  it('单据页：管理员查得到全部单据', async () => {
    await router.push('/flow/documents');
    (await waitFor(() => tab('全部单据'))).click();
    // 共 0 条是还在取：等到有数
    const total = await waitFor(() => Number(/共 (\d+) 条/.exec(text())?.[1] ?? 0));
    expect(total).toBeGreaterThanOrEqual(10);
  }, 30_000);
});
