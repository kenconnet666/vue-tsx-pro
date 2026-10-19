// Table、TreeTable 在真实浏览器里：虚拟滚动、吸顶表头、固定列、列宽调整、排序、勾选、加载、懒加载（演示页 /base）
import axe from 'axe-core';
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick, type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let app: App;
let root: HTMLElement;

beforeEach(async () => {
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/base');
  await host.router.isReady();
  root = document.createElement('div');
  document.body.append(root);
  app = host.app;
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
});

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
const table = () => $<HTMLTableElement>('table.table-demo');
const viewport = () => table().closest<HTMLElement>('[tabindex="0"]')!;
const bodyRows = () => [
  ...table().querySelectorAll<HTMLTableRowElement>('tbody tr[aria-rowindex]'),
];
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe('Table', () => {
  it('一万行只渲染看得见的几十行；滚到底能看到最后一行', async () => {
    await expect.poll(() => bodyRows().length).toBeGreaterThan(0);
    expect(bodyRows().length).toBeLessThan(80);
    expect(table().getAttribute('aria-rowcount')).toBe('10001');
    // 行渲染后实测比估计的高，总高度会变：像用户一样反复滚到底，直到最后一行出现
    await expect
      .poll(
        () => {
          viewport().scrollTop = viewport().scrollHeight;
          return bodyRows().at(-1)?.getAttribute('aria-rowindex');
        },
        { timeout: 5000 },
      )
      .toBe('10001');
  });

  it('吸顶表头与固定列：纵向、横向滚动后仍贴在视口边上', async () => {
    await expect.poll(() => bodyRows().length).toBeGreaterThan(0);
    const scroller = viewport();
    scroller.scrollTop = 600;
    scroller.scrollLeft = 200;
    await nextFrame();
    await nextFrame();
    const box = scroller.getBoundingClientRect();
    const header = table().querySelector('thead th')!.getBoundingClientRect();
    expect(Math.round(header.top)).toBe(Math.round(box.top));
    // 第一列是勾选列，第二列是固定在起始边的订单号
    const idCell = bodyRows()[3]!.cells[1]!.getBoundingClientRect();
    expect(idCell.left).toBeGreaterThanOrEqual(box.left);
    expect(idCell.left).toBeLessThan(box.left + 60);
  });

  it('点列标题排序（aria-sort），再点换方向', async () => {
    const amount = [...table().querySelectorAll('th')].find((th) =>
      th.textContent?.includes('金额'),
    )!;
    expect(amount.getAttribute('aria-sort')).toBe('descending');
    await userEvent.click(amount.querySelector('button')!);
    await expect.poll(() => amount.getAttribute('aria-sort')).toBe('none');
    const customer = [...table().querySelectorAll('th')].find((th) =>
      th.textContent?.includes('客户'),
    )!;
    await userEvent.click(customer.querySelector('button')!);
    await expect.poll(() => customer.getAttribute('aria-sort')).toBe('ascending');
  });

  it('勾选与全选写回；搜索过滤后全选只选当前结果', async () => {
    const summary = () => $('.table-summary').textContent!;
    await expect.poll(() => bodyRows().length).toBeGreaterThan(0);
    await userEvent.click(bodyRows()[0]!.querySelector('input')!);
    await expect.poll(summary).toContain('已选 1 条');
    await userEvent.click($('.table-toolbar input'));
    await userEvent.keyboard('Ada');
    await expect.poll(summary).toMatch(/共 \d+ 条/);
    const total = Number(/共 (\d+) 条/.exec(summary())![1]);
    expect(total).toBeLessThan(10_000);
    await userEvent.click(table().querySelector<HTMLInputElement>('thead input')!);
    await expect.poll(summary).toContain(`已选 ${total + 1} 条`);
  });

  it('拖动列宽手柄与键盘 → 调整宽度', async () => {
    const th = [...table().querySelectorAll('th')].find((cell) =>
      cell.textContent?.includes('客户'),
    )!;
    const handle = th.querySelector<HTMLElement>('[role="separator"]')!;
    const before = th.getBoundingClientRect().width;
    const rect = handle.getBoundingClientRect();
    const init = (x: number) => ({
      clientX: x,
      clientY: rect.top + 4,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    handle.dispatchEvent(new PointerEvent('pointerdown', init(rect.left)));
    handle.dispatchEvent(new PointerEvent('pointermove', init(rect.left + 40)));
    handle.dispatchEvent(new PointerEvent('pointerup', init(rect.left + 40)));
    await expect
      .poll(() => Math.round(th.getBoundingClientRect().width))
      .toBe(Math.round(before + 40));
    handle.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect
      .poll(() => Math.round(th.getBoundingClientRect().width))
      .toBe(Math.round(before + 24));
  });

  it('刷新时表头下方出现进度条，表格 aria-busy', async () => {
    await userEvent.click($('.table-refresh'));
    await expect.poll(() => table().getAttribute('aria-busy')).toBe('true');
    // 进度条防闪烁：过一会儿才出现（useDelayedLoading）
    await expect.poll(() => table().querySelector('thead [role="progressbar"]')).not.toBeNull();
    await expect.poll(() => table().getAttribute('aria-busy'), { timeout: 3000 }).toBeNull();
  });

  it('无障碍：表格与树形表格 axe-core 没有违规', async () => {
    await expect.poll(() => bodyRows().length).toBeGreaterThan(0);
    const result = await axe.run(table().closest('section')!);
    expect(
      result.violations.map(
        (violation) =>
          `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
      ),
    ).toEqual([]);
  });
});

describe('TreeTable', () => {
  const tree = () => $<HTMLTableElement>('table.tree-table-demo');
  const names = () =>
    [...tree().querySelectorAll('tbody tr[aria-rowindex] td:first-child')].map(
      (td) => td.textContent,
    );

  it('展开的部门显示子项（缩进），收起后隐藏；懒加载的部门展开时加载中再显示子项', async () => {
    await expect.poll(names).toContain('前端组');
    const rd = tree().querySelector<HTMLButtonElement>('button[aria-expanded="true"]')!;
    await userEvent.click(rd);
    await expect.poll(names).toEqual(['研发部', '市场部']);
    const market = [...tree().querySelectorAll<HTMLButtonElement>('button[aria-expanded]')].find(
      (button) => button.getAttribute('aria-label') === '市场部 的子项',
    )!;
    await userEvent.click(market);
    await expect.poll(() => market.getAttribute('aria-busy')).toBe('true');
    await expect.poll(names, { timeout: 3000 }).toEqual(['研发部', '市场部', '品牌组', '渠道组']);
    await nextTick();
  });
});
