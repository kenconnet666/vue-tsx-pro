// Marquee：动画时长按一份内容的长度与速度换算；暂停按钮停住动画；axe（演示页 /base）
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

describe('Marquee', () => {
  it('一圈的时长 = 一份内容的长度 ÷ 速度（默认 40px/s）；暂停后动画停住', async () => {
    const track = $('.marquee-demo').firstElementChild as HTMLElement;
    const group = track.firstElementChild as HTMLElement;
    await expect
      .poll(() => parseFloat(getComputedStyle(track).animationDuration))
      .toBeCloseTo(group.offsetWidth / 40, 1);
    expect(getComputedStyle(track).animationPlayState).toBe('running');
    await userEvent.click($('.marquee-toggle'));
    await expect.poll(() => getComputedStyle(track).animationPlayState).toBe('paused');
  });

  it('axe-core 没有违规', async () => {
    const result = await axe.run($('.marquee-demo').parentElement!);
    expect(result.violations).toEqual([]);
  });
});
