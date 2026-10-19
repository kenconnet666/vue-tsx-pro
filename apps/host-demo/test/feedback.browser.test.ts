// 标记、提示、进度、占位在真实浏览器里（演示页 /base；颜色对比度由 base 的 axe 检查覆盖）
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

describe('Badge · Tag · Alert', () => {
  it('Tag 的移除按钮移除它；焦点交给下一个标签，最后一个被移除时交给上一个', async () => {
    const tags = () => root.querySelectorAll('.tag-demo > span');
    const removeButton = (index: number) => tags()[index]!.querySelector('button')!;
    expect(tags()).toHaveLength(3);
    removeButton(0).focus();
    removeButton(0).click();
    await nextTick();
    await Promise.resolve();
    expect(tags()).toHaveLength(2);
    expect(document.activeElement).toBe(removeButton(0));

    removeButton(1).focus();
    removeButton(1).click();
    await nextTick();
    await Promise.resolve();
    expect(document.activeElement).toBe(removeButton(0));
  });

  it('Alert 关闭后消失，焦点留在相邻的可聚焦元素上而不是掉回页面开头', async () => {
    const close = $('.alert-demo button');
    close.focus();
    close.click();
    await nextTick();
    await Promise.resolve();
    expect(root.querySelector('.alert-demo')).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(root.contains(document.activeElement)).toBe(true);
  });

  it('每种样式的标记高度一致（切换样式时尺寸不变）', () => {
    const heights = new Set(
      [...root.querySelectorAll('[class^="badge-row-"] > span')].map((badge) =>
        Math.round(badge.getBoundingClientRect().height),
      ),
    );
    expect(heights.size).toBe(1);
  });
});

describe('Progress · Skeleton', () => {
  it('有值时着色部分的宽度是比例；不确定进度在动', () => {
    const bar = $('.progress-demo');
    const ratio =
      bar.firstElementChild!.getBoundingClientRect().width / bar.getBoundingClientRect().width;
    expect(ratio).toBeCloseTo(Number(bar.getAttribute('aria-valuenow')) / 100, 1);
    expect($('.progress-indeterminate').firstElementChild!.getAnimations().length).toBe(1);
  });

  it('Skeleton 与内容一样大：加载完成前后卡片的尺寸不变', async () => {
    const card = $('.card-demo');
    const before = card.getBoundingClientRect();
    card.querySelector<HTMLElement>('button')!.click();
    await nextTick();
    const after = card.getBoundingClientRect();
    expect(Math.round(after.height)).toBe(Math.round(before.height));
  });
});

describe('Dialog · AlertDialog · Drawer', () => {
  it('Dialog：标题与说明是无障碍名称与描述；正文过长时只滚正文，标题与页脚留在视口内', async () => {
    const dialog = $<HTMLDialogElement>('.dialog-demo');
    await userEvent.click($('.dialog-open'));
    await expect.poll(() => dialog.open).toBe(true);
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)!;
    expect(title.tagName).toBe('H2');
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)!.textContent).toBe(
      '修改后立即生效。',
    );
    const rect = dialog.getBoundingClientRect();
    expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    const footer = dialog.lastElementChild!.getBoundingClientRect();
    expect(footer.bottom).toBeLessThanOrEqual(rect.bottom + 1);

    await userEvent.click(dialog.querySelector<HTMLElement>('button[aria-label="关闭"]')!);
    await expect.poll(() => dialog.open).toBe(false);
    expect(document.activeElement).toBe($('.dialog-open'));
  });

  it('AlertDialog：role="alertdialog"，焦点先落在取消上，点击遮罩不关闭', async () => {
    const dialog = $<HTMLDialogElement>('.confirm-demo');
    await userEvent.click($('.confirm-open'));
    await expect.poll(() => dialog.open).toBe(true);
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(document.activeElement!.textContent).toBe('取消');
    expect(dialog.querySelector('button[aria-label="关闭"]')).toBeNull();
    await userEvent.click(dialog, { position: { x: 10, y: -10 }, force: true });
    expect(dialog.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => dialog.open).toBe(false);
    expect($('.deleted-count').textContent).toContain('0');
  });

  it('AlertDialog：确认返回 Promise 时显示加载中，完成后关闭', async () => {
    const dialog = $<HTMLDialogElement>('.confirm-demo');
    await userEvent.click($('.confirm-open'));
    await expect.poll(() => dialog.open).toBe(true);
    const confirm = [...dialog.querySelectorAll('button')].find((b) => b.textContent === '删除')!;
    await userEvent.click(confirm);
    await expect.poll(() => confirm.getAttribute('aria-busy')).toBe('true');
    expect(dialog.open).toBe(true);
    await expect.poll(() => dialog.open).toBe(false);
    expect($('.deleted-count').textContent).toContain('1');
  });

  it('Drawer：贴着结束边、占满高度，从那一侧滑入', async () => {
    const drawer = $<HTMLDialogElement>('.drawer-demo');
    await userEvent.click($('.drawer-open'));
    await expect.poll(() => drawer.open).toBe(true);
    await expect.poll(() => getComputedStyle(drawer).translate).toMatch(/^(none|0px)$/);
    const rect = drawer.getBoundingClientRect();
    expect(Math.round(rect.right)).toBe(document.documentElement.clientWidth);
    expect(Math.round(rect.height)).toBe(window.innerHeight);
    expect(drawer.dataset.side).toBe('end');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => drawer.open).toBe(false);
  });

  it.each(['dialog', 'confirm', 'drawer'])('无障碍：%s 打开时 axe-core 没有违规', async (name) => {
    const dialog = $<HTMLDialogElement>(`.${name}-demo`);
    await userEvent.click($(`.${name}-open`));
    await expect.poll(() => dialog.open).toBe(true);
    // 等进场过渡结束再检查对比度（最多 1 秒）
    await Promise.race([
      Promise.all(dialog.getAnimations({ subtree: true }).map((animation) => animation.finished)),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    const { violations } = await axe.run(dialog);
    expect(violations.map((violation) => violation.id)).toEqual([]);
    dialog.close();
  });
});
