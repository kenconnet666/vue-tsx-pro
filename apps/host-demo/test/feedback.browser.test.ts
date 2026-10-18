// 标记、提示、进度、占位在真实浏览器里（演示页 /base；颜色对比度由 base 的 axe 检查覆盖）
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
  it('Tag 的移除按钮移除它', async () => {
    const tags = () => root.querySelectorAll('.tag-demo > span');
    expect(tags()).toHaveLength(3);
    tags()[0]!.querySelector('button')!.click();
    await nextTick();
    expect(tags()).toHaveLength(2);
  });

  it('Alert 关闭后消失', async () => {
    $('.alert-demo button').click();
    await nextTick();
    expect(root.querySelector('.alert-demo')).toBeNull();
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
