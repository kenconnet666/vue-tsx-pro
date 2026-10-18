// 弹层基础设施依赖的浏览器原生行为（不经过 Vue 与组件）：浏览器升级后行为变了，这里先失败
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
});

function html<T extends HTMLElement>(markup: string, selector: string): T {
  document.body.insertAdjacentHTML('beforeend', markup);
  return document.body.querySelector<T>(selector)!;
}

it('模态 dialog：Esc 关闭，焦点回到打开前的元素', async () => {
  const trigger = html<HTMLButtonElement>('<button id="t">打开</button>', '#t');
  const dialog = html<HTMLDialogElement>(
    '<dialog id="d"><button id="in">里面</button></dialog>',
    '#d',
  );
  trigger.focus();
  dialog.showModal();
  expect(document.activeElement?.id).toBe('in');
  await userEvent.keyboard('{Escape}');
  expect(dialog.open).toBe(false);
  expect(document.activeElement).toBe(trigger);
});

it('模态 dialog 打开时外部元素不可聚焦（inert）', async () => {
  const outside = html<HTMLButtonElement>('<button id="out">外面</button>', '#out');
  const dialog = html<HTMLDialogElement>('<dialog id="d"><button>里面</button></dialog>', '#d');
  dialog.showModal();
  outside.focus();
  expect(document.activeElement).not.toBe(outside);
});

it('模态 dialog 不会让焦点循环：最后一个元素再按 Tab 不回到第一个（所以组件自己做焦点循环）', async () => {
  const dialog = html<HTMLDialogElement>(
    '<dialog id="d"><button id="a">一</button><button id="b">二</button></dialog>',
    '#d',
  );
  dialog.showModal();
  document.getElementById('b')!.focus();
  await userEvent.keyboard('{Tab}');
  // Chromium、WebKit 让焦点离开页面，Firefox 停在原地；都不会回到第一个
  expect(document.activeElement?.id).not.toBe('a');
});

it('dialog 里的 auto popover：第一次 Esc 只关 popover，第二次才关 dialog', async () => {
  const dialog = html<HTMLDialogElement>(
    '<dialog id="d"><button id="in">里面</button><div id="p" popover="auto"><button>弹层</button></div></dialog>',
    '#d',
  );
  const popover = document.getElementById('p')!;
  dialog.showModal();
  popover.showPopover();
  await userEvent.keyboard('{Escape}');
  expect([popover.matches(':popover-open'), dialog.open]).toEqual([false, true]);
  await userEvent.keyboard('{Escape}');
  expect(dialog.open).toBe(false);
});

it('嵌套的 auto popover（点击打开）：Esc 只关最里层', async () => {
  // 没有用户操作就打开的弹层会被浏览器并成一组，一次 Esc 全关；实际使用中弹层都是点击打开的
  html(
    '<button id="open-outer" popovertarget="outer">外</button><div id="outer" popover="auto"><button id="open-inner" popovertarget="inner">里</button><div id="inner" popover="auto">里层</div></div>',
    '#outer',
  );
  const outer = document.getElementById('outer')!;
  const inner = document.getElementById('inner')!;
  await userEvent.click(document.getElementById('open-outer')!);
  await userEvent.click(document.getElementById('open-inner')!);
  expect([outer.matches(':popover-open'), inner.matches(':popover-open')]).toEqual([true, true]);
  await userEvent.keyboard('{Escape}');
  expect([outer.matches(':popover-open'), inner.matches(':popover-open')]).toEqual([true, false]);
});

it('dialog 里的 auto popover：点击 dialog 内其他位置只关 popover', async () => {
  const dialog = html<HTMLDialogElement>(
    '<dialog id="d" style="width:300px;height:200px"><p id="text">内容</p><div id="p" popover="auto" style="inset:auto;top:0;left:0">弹层</div></dialog>',
    '#d',
  );
  const popover = document.getElementById('p')!;
  dialog.showModal();
  popover.showPopover();
  await userEvent.click(document.getElementById('text')!);
  expect([popover.matches(':popover-open'), dialog.open]).toEqual([false, true]);
});

it('点击模态 dialog 的背景（::backdrop）时，事件目标是 dialog 自身', async () => {
  const dialog = html<HTMLDialogElement>(
    '<dialog id="d" style="width:100px;height:100px;padding:0"><p style="margin:0">内容</p></dialog>',
    '#d',
  );
  let target: EventTarget | null = null;
  dialog.addEventListener('click', (event) => (target = event.target));
  dialog.showModal();
  await userEvent.click(dialog, { position: { x: -40, y: -40 } });
  expect(target).toBe(dialog);
});
