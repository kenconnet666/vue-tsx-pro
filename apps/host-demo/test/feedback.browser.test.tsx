// 标记、提示、进度、占位在真实浏览器里（演示页 /base；颜色对比度由 base 的 axe 检查覆盖）
import axe from 'axe-core';
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';
import { toaster } from '../src/toaster';
import { stopsAnimationWhenReduced } from './reduced-motion';

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
  for (const toast of [...toaster.toasts]) toaster.remove(toast.id);
  app.unmount();
  root.remove();
});

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;

describe('Badge · Tag · Alert', () => {
  it('Tag 的移除按钮先播离场再移除它；焦点交给下一个标签，最后一个被移除时交给上一个', async () => {
    const tags = () => root.querySelectorAll<HTMLElement>('.tag-demo > span');
    const removeButton = (index: number) => tags()[index]!.querySelector('button')!;
    expect(tags()).toHaveLength(5);
    removeButton(0).focus();
    removeButton(0).click();
    await nextTick();
    expect(tags()[0]!.dataset.state).toBe('closed');
    await expect.poll(() => tags().length).toBe(4);
    await expect.poll(() => document.activeElement).toBe(removeButton(0));

    removeButton(3).focus();
    removeButton(3).click();
    await expect.poll(() => tags().length).toBe(3);
    await expect.poll(() => document.activeElement).toBe(removeButton(2));
  });

  it('Alert 关闭后消失，焦点留在相邻的可聚焦元素上而不是掉回页面开头', async () => {
    const close = $('.alert-demo button');
    close.focus();
    close.click();
    await expect.poll(() => root.querySelector('.alert-demo'), { timeout: 3000 }).toBeNull();
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
  it('骨架：各形状对读屏隐藏，光带在扫；减少动态效果时不扫', () => {
    const shapes = [...root.querySelectorAll<HTMLElement>('.skeleton-shapes [aria-hidden="true"]')];
    expect(shapes.length).toBeGreaterThanOrEqual(4);
    const circle = shapes[0]!;
    const { width, height } = circle.getBoundingClientRect();
    expect(width).toBeGreaterThan(0);
    expect(width).toBeCloseTo(height, 0);
    expect(circle.getAnimations().some((animation) => 'animationName' in animation)).toBe(true);
    // 光带真的画出来了：变量值无效时渐变整条失效、动画照跑，只看动画发现不了
    expect(getComputedStyle(circle).backgroundImage).toContain('gradient');
    expect(stopsAnimationWhenReduced(circle)).toBe(true);
    // 加载中的卡片：正文是骨架，卡片带 aria-busy，读屏读不到骨架
    const card = $('.card-loading-demo');
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(card.textContent).toBe('加载中的卡片');
  });

  it('有值时着色部分的宽度是比例；不确定进度在动', () => {
    const bar = $('.progress-demo');
    const ratio =
      bar.firstElementChild!.getBoundingClientRect().width / bar.getBoundingClientRect().width;
    expect(ratio).toBeCloseTo(Number(bar.getAttribute('aria-valuenow')) / 100, 1);
    expect($('.progress-indeterminate').firstElementChild!.getAnimations().length).toBe(1);
  });

  it('LoadingOverlay：刷新时遮罩盖住整个区域并淡入，结束后移除', async () => {
    // 遮罩的去留是一串前后相接的计时器（演示加载 1.5 秒 → 至少显示 0.5 秒 → 离场过渡）：
    // 用真实时间时，页面被别的浏览器实例抢占一阵后，poll 的期限先到、后面的计时器还没轮上（CI 上 Windows 的 Firefox）。
    // 由测试推进计时器；只有离场的 CSS 过渡走真实时间。poll 自己用的是 Vitest 保存的真计时器
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const area = $('.overlay-demo');
      const overlay = () => area.querySelector<HTMLElement>('[data-state]');
      $('.overlay-trigger').click();
      await nextTick();
      expect(area.getAttribute('aria-busy')).toBe('true');
      // 很快完成的加载不出现遮罩：延迟 200ms 才盖上
      await vi.advanceTimersByTimeAsync(199);
      expect(overlay()).toBeNull();
      await vi.advanceTimersByTimeAsync(1);
      expect(overlay()?.dataset.state).toBe('open');
      const box = overlay()!.getBoundingClientRect();
      const outer = area.getBoundingClientRect();
      expect([box.width, box.height]).toEqual([outer.width, outer.height]);
      // 加载结束：忙碌立即解除，遮罩已显示超过最短时长，随即离场
      await vi.advanceTimersByTimeAsync(1300);
      expect(area.hasAttribute('aria-busy')).toBe(false);
      // 延迟为 0 的计时器在推进中按 1ms 算（fake-timers）
      await vi.advanceTimersByTimeAsync(1);
      await nextTick();
      // 正在淡出（closed），或没有进行中的过渡、已经移除
      expect(overlay()?.dataset.state).not.toBe('open');
      await expect.poll(overlay).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('Indicator 的角标中心在按钮的右上角；AvatarGroup 的头像叠放、大小一致', () => {
    const indicator = $('.indicator-demo');
    const button = indicator.querySelector('button')!.getBoundingClientRect();
    const badge = indicator.querySelector('[data-placement]')!.getBoundingClientRect();
    expect(Math.abs(badge.left + badge.width / 2 - button.right)).toBeLessThan(1);
    expect(Math.abs(badge.top + badge.height / 2 - button.top)).toBeLessThan(1);

    const [first, second, , more] = [...$('.avatar-group-demo').children].map((item) =>
      item.getBoundingClientRect(),
    );
    expect(second!.left).toBeLessThan(first!.right);
    expect(more!.width).toBeCloseTo(first!.width, 0);
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
    // 进场是滑入过渡；Linux 上的 WebKit 偶尔把过渡停在起点（同 Firefox 的 running 问题），
    // 这里只验证最终布局：最多等 1 秒，然后让还没播完的过渡直接到终点
    await Promise.race([
      Promise.all(drawer.getAnimations().map((animation) => animation.finished)),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    for (const animation of drawer.getAnimations()) animation.finish();
    expect(getComputedStyle(drawer).translate).toMatch(/^(none|0px)$/);
    const rect = drawer.getBoundingClientRect();
    expect(Math.round(rect.right)).toBe(document.documentElement.clientWidth);
    expect(Math.round(rect.height)).toBe(window.innerHeight);
    expect(drawer.dataset.side).toBe('end');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => drawer.open).toBe(false);
  });

  it('useConfirm：对话框挂在 body 末尾（组件树之外），确认得到 true，关闭后卸载；沿用页面的主题', async () => {
    await userEvent.click($('.confirm-imperative'));
    const dialog = await expect
      .poll(() => document.body.querySelector<HTMLDialogElement>(':scope > div dialog[open]'))
      .not.toBeNull()
      .then(() => document.body.querySelector<HTMLDialogElement>(':scope > div dialog[open]')!);
    expect(root.contains(dialog)).toBe(false);
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.closest('[data-theme]')).not.toBeNull();
    const confirm = [...dialog.querySelectorAll('button')].find((b) => b.textContent === '清空')!;
    await userEvent.click(confirm);
    await expect.poll(() => $('.cart-result').textContent).toBe('已清空');
    await expect.poll(() => dialog.isConnected).toBe(false);

    await userEvent.click($('.confirm-imperative'));
    await expect
      .poll(() => document.querySelector('dialog[open][role="alertdialog"]'))
      .not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => $('.cart-result').textContent).toBe('已取消');
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

describe('Toast', () => {
  const region = () => document.querySelector<HTMLElement>('.toaster-demo')!;
  const items = () => [...region().querySelectorAll<HTMLElement>('li[data-state="open"]')];

  // 指针停在通知区上时计时暂停：先移到页面顶部（上一个测试的指针位置随演示页的排版而变）
  beforeEach(() => userEvent.hover($('.toggle-theme')));

  it('区域是带名称的 landmark，显示在顶层；到时自动关闭并移除', async () => {
    expect(region().tagName).toBe('SECTION');
    expect(region().getAttribute('aria-label')).toBe('通知');
    expect(region().matches(':popover-open')).toBe(true);
    toaster.show({ tone: 'success', title: '已保存', duration: 300 });
    await expect.poll(() => items().length).toBe(1);
    expect(region().querySelector('ol')!.getAttribute('aria-live')).toBe('polite');
    await expect.poll(() => region().querySelectorAll('li').length, { timeout: 3000 }).toBe(0);
  });

  it('stack：叠成一摞只露出最新的一条，悬停时展开、离开后收起', async () => {
    $<HTMLInputElement>('.toast-stack').click();
    await expect.poll(() => region().dataset.expanded).toBe('false');
    for (const title of ['一', '二', '三']) toaster.show({ title, duration: Infinity });
    await expect.poll(() => items().length).toBe(3);
    const bottoms = () => items().map((item) => Math.round(item.getBoundingClientRect().bottom));
    // 收起：后面的两条只错开一点点，整摞比一条高不了多少
    await expect
      .poll(() => Math.max(...bottoms()) - Math.min(...bottoms()), { timeout: 3000 })
      .toBeLessThan(40);
    region().dispatchEvent(new PointerEvent('pointerenter'));
    await expect.poll(() => region().dataset.expanded).toBe('true');
    // 展开：一条接一条，不再重叠
    await expect
      .poll(
        () =>
          items().every(
            (item, index) =>
              index === 0 ||
              item.getBoundingClientRect().top >=
                items()[index - 1]!.getBoundingClientRect().bottom - 1,
          ),
        { timeout: 3000 },
      )
      .toBe(true);
    region().dispatchEvent(new PointerEvent('pointerleave'));
    await expect.poll(() => region().dataset.expanded).toBe('false');
  });

  it('剩余时间条从满到空，悬停暂停计时时一起停', async () => {
    toaster.show({ title: '计时', duration: 4000 });
    await expect.poll(() => items().length).toBe(1);
    const bar = items()[0]!.querySelector<HTMLElement>('span[aria-hidden="true"]:not(svg)')!;
    const animation = () => bar.getAnimations()[0]!;
    expect(animation().playState).toBe('running');
    region().dispatchEvent(new PointerEvent('pointerenter'));
    await expect.poll(() => animation().playState).toBe('paused');
    region().dispatchEvent(new PointerEvent('pointerleave'));
    await expect.poll(() => animation().playState).toBe('running');
  });

  it('关闭一条后焦点交给相邻的通知', async () => {
    toaster.show({ title: '第一条', duration: Infinity });
    toaster.show({ title: '第二条', duration: Infinity });
    await expect.poll(() => items().length).toBe(2);
    const close = (item: HTMLElement) =>
      item.querySelector<HTMLElement>('button[aria-label="关闭"]')!;
    const [first, second] = items();
    close(first!).focus();
    close(first!).click();
    // 离场动画结束才移除：CI 上 Windows 的 Firefox 偶尔超过默认的 1 秒
    await expect.poll(() => region().querySelectorAll('li').length, { timeout: 3000 }).toBe(1);
    expect(document.activeElement).toBe(close(second!));
  });

  it('promise：加载中显示加载指示，完成后换成结果', async () => {
    await userEvent.click($('.toast-promise'));
    await expect.poll(() => items()[0]?.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expect.poll(() => items()[0]?.textContent, { timeout: 3000 }).toContain('上传完成');
    expect(items()[0]!.querySelector('[aria-busy]')).toBeNull();
  });

  it('模态打开时区域移进对话框里，通知里的按钮仍能点击；关闭后回到 body', async () => {
    const dialog = $<HTMLDialogElement>('.dialog-demo');
    await userEvent.click($('.dialog-open'));
    await expect.poll(() => dialog.open).toBe(true);
    // 对话框打开时页面上的按钮是 inert 的：直接用控制器发通知
    const id = toaster.show({
      title: '在对话框里',
      duration: Infinity,
      action: (
        <button class="in-dialog-action" onClick={() => toaster.dismiss(id)}>
          好的
        </button>
      ),
    });
    await expect.poll(() => dialog.contains(region())).toBe(true);
    await expect.poll(() => region().matches(':popover-open')).toBe(true);
    await userEvent.click(region().querySelector<HTMLElement>('.in-dialog-action')!);
    await expect.poll(() => region().querySelectorAll('li').length).toBe(0);
    expect(dialog.open).toBe(true);
    dialog.close();
    await expect.poll(() => region().parentElement?.parentElement).toBe(document.body);
    await expect.poll(() => region().matches(':popover-open')).toBe(true);
  });

  it('横向滑动超过宽度的 35% 关闭，不够时弹回', async () => {
    toaster.show({ title: '可以滑走', duration: Infinity });
    await expect.poll(() => items().length).toBe(1);
    const item = items()[0]!;
    const rect = item.getBoundingClientRect();
    const swipe = async (distance: number) => {
      const init = (x: number) => ({
        clientX: x,
        clientY: rect.top + rect.height / 2,
        pointerId: 1,
        pointerType: 'touch',
        button: 0,
        buttons: 1,
        bubbles: true,
        cancelable: true,
      });
      const start = rect.left + 20;
      item.dispatchEvent(new PointerEvent('pointerdown', init(start)));
      for (let step = 1; step <= 4; step++) {
        item.dispatchEvent(new PointerEvent('pointermove', init(start + (distance * step) / 4)));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      item.dispatchEvent(new PointerEvent('pointerup', init(start + distance)));
    };
    await swipe(rect.width * 0.2);
    expect(item.dataset.state).toBe('open');
    // 弹簧弹回后去掉内联的位移与透明度
    await expect.poll(() => [item.style.transform, item.style.opacity]).toEqual(['', '']);
    await swipe(rect.width * 0.5);
    await expect.poll(() => region().querySelectorAll('li').length).toBe(0);
  });

  it('传送到 body 后仍跟随页面的主题', async () => {
    const scope = region().parentElement!;
    expect(scope.dataset.theme).toBe('light');
    $('.toggle-theme').click();
    await expect.poll(() => scope.dataset.theme).toBe('dark');
  });

  it('无障碍：有通知时 axe-core 没有违规', async () => {
    toaster.show({ tone: 'danger', title: '保存失败', description: '请重试', duration: Infinity });
    toaster.show({ tone: 'success', title: '已保存', duration: Infinity });
    await expect.poll(() => items().length).toBe(2);
    await Promise.race([
      Promise.all(
        region()
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      ),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    const { violations } = await axe.run(region());
    expect(violations.map((violation) => violation.id)).toEqual([]);
  });
});
