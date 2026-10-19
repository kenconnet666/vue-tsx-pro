// Tour：模态、镂空贴着目标、卡片在目标旁边；上一步 / 下一步 / 完成、Esc 关闭后焦点回到按钮（演示页 /base）
import axe from 'axe-core';
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type App } from 'vue';
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
const tour = () => $<HTMLDialogElement>('.tour-demo');
const button = (text: string) =>
  [...tour().querySelectorAll('button')].find((item) => item.textContent === text)!;

describe('Tour', () => {
  it('打开后是模态，镂空罩住目标，标题是 dialog 的名称；焦点在卡片里', async () => {
    await userEvent.click($('.tour-start'));
    await expect.poll(() => tour().matches(':modal')).toBe(true);
    const title = document.getElementById(tour().getAttribute('aria-labelledby')!)!;
    expect(title.textContent).toBe('切换主题');
    const spotlight = tour().firstElementChild as HTMLElement;
    const target = $('.toggle-theme').getBoundingClientRect();
    await expect
      .poll(() => {
        const box = spotlight.getBoundingClientRect();
        return box.left <= target.left && box.right >= target.right && box.top <= target.top;
      })
      .toBe(true);
    expect(tour().contains(document.activeElement)).toBe(true);
    expect(tour().textContent).toContain('1 / 4');
  });

  it('下一步换目标；最后一步没有目标时卡片居中；完成后关闭，焦点回到打开按钮', async () => {
    const start = $('.tour-start');
    await userEvent.click(start);
    await expect.poll(() => tour().open).toBe(true);
    await userEvent.click(button('下一步'));
    await expect.poll(() => tour().textContent).toContain('目录树');
    await userEvent.click(button('上一步'));
    await expect.poll(() => tour().textContent).toContain('切换主题');
    await userEvent.click(button('下一步'));
    await userEvent.click(button('下一步'));
    await userEvent.click(button('下一步'));
    await expect.poll(() => tour().textContent).toContain('4 / 4');
    const panel = tour().children[1]!.getBoundingClientRect();
    expect(Math.abs(panel.left + panel.width / 2 - window.innerWidth / 2)).toBeLessThan(2);
    await userEvent.click(button('完成'));
    await expect.poll(() => tour().open).toBe(false);
    expect(document.activeElement).toBe(start);
  });

  it('Esc 关闭；axe-core 没有违规', async () => {
    await userEvent.click($('.tour-start'));
    await expect.poll(() => tour().open).toBe(true);
    const result = await axe.run(tour());
    expect(result.violations).toEqual([]);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => tour().open).toBe(false);
  });
});
