// 交互状态的截取：一个可交互元素的默认、悬停、键盘焦点、按下四张裁图（docs:states 拼成表，docs:states-audit 比对）

/** 裁图时元素四周多留的像素：外侧的焦点环、阴影也截进来 */
const PAD = 6;

/** 示例里默认要看的可交互元素：按钮、链接、选项、标签页、菜单项、开关 */
export const INTERACTIVE =
  'button:not([aria-hidden="true"]), a[href], [role="option"], [role="tab"], [role="menuitem"], [role="switch"]';

/** 站点的粘性页头会盖住滚到顶部的示例：截图前藏起来 */
export const hideSiteHeader = (page) =>
  page.evaluate(() =>
    document
      .querySelector('[data-scope="app-shell"][data-part="header"]')
      ?.style.setProperty('visibility', 'hidden'),
  );

/**
 * 截一个元素的各个状态：默认、悬停、键盘焦点，可用时再加按下（在元素外松开，不触发点击）。
 * 返回名称、是否不可用、焦点是否真的落到了它上面（焦点留在容器上、经 aria-activedescendant 指的选项落不上），
 * 以及各状态的 PNG（base64；元素看不见时是空字符串）
 */
export async function captureStates(page, target, { active = true, settle = 150 } = {}) {
  const label = (
    (await target.getAttribute('aria-label')) ??
    (await target.innerText()).trim().slice(0, 16) ??
    ''
  ).replaceAll('\n', ' ');
  const disabled = await target.evaluate(
    (element) =>
      element.matches(':disabled, [aria-disabled="true"], [data-disabled]') ||
      element.closest('[aria-disabled="true"]') != null,
  );
  const shot = async () => {
    const box = await target.boundingBox();
    if (!box) return '';
    const clip = {
      x: Math.max(0, box.x - PAD),
      y: Math.max(0, box.y - PAD),
      width: box.width + PAD * 2,
      height: box.height + PAD * 2,
    };
    return (await page.screenshot({ clip })).toString('base64');
  };
  // 指针移开、焦点移走，回到默认
  const reset = async () => {
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await page.evaluate(() =>
      document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null,
    );
    await page.waitForTimeout(settle);
  };
  await target.scrollIntoViewIfNeeded();
  await reset();
  const cells = { default: await shot() };
  await target.hover({ force: true });
  await page.waitForTimeout(settle + 100);
  cells.hover = await shot();
  await reset();
  // 键盘焦点：先按一下 Shift 让浏览器认为是键盘操作，再程序聚焦（:focus-visible 才成立）
  await page.keyboard.press('Shift');
  const focusable = await target.evaluate((element) => {
    element.focus();
    return document.activeElement === element;
  });
  await page.waitForTimeout(settle);
  cells.focus = await shot();
  await reset();
  if (active && !disabled) {
    const box = await target.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(settle);
      cells.active = await shot();
      await page.mouse.move(0, 0);
      await page.mouse.up();
    }
  }
  await reset();
  return { label, disabled, focusable, cells };
}
