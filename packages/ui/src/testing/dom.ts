/**
 * 测试辅助的底层：等 Vue 更新、按名称找控件、派发事件。各个 harness（controls.ts）都建在它上面。
 * 只派发 DOM 事件，happy-dom、jsdom 与真实浏览器（Vitest 的浏览器模式）都能用；不依赖假时钟以外的计时器。
 */
import { nextTick } from 'vue';

/** setupTestingDom 的选项 */
export interface TestingDomOptions {
  /**
   * 不排版的环境（happy-dom、jsdom）里元素的 clientWidth / clientHeight：虚拟滚动的列表、树、表格按它算渲染几行，
   * 默认 1024 × 600；浏览器里排版，不用它
   */
  viewport?: { width: number; height: number };
}

/**
 * 补上 happy-dom、jsdom 缺的浏览器 API：弹出层（popover）、滚动到可见、元素尺寸的观察，不排版时给元素一个视口大小
 * （虚拟滚动的 Tree、DataTable、VirtualList 才有行）。测试的 setup 文件里调一次
 */
export function setupTestingDom({
  viewport = { width: 1024, height: 600 },
}: TestingDomOptions = {}): void {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  // 量一个写了高度的元素：量出 0 就是不排版
  const probe = document.createElement('div');
  probe.style.height = '10px';
  document.body.append(probe);
  const laysOut = probe.clientHeight > 0;
  probe.remove();
  if (!laysOut) {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => viewport.height,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => viewport.width,
    });
  }
  proto.showPopover ??= function (this: HTMLElement) {
    this.toggleAttribute('data-popover-open', true);
  };
  proto.hidePopover ??= function (this: HTMLElement) {
    this.removeAttribute('data-popover-open');
  };
  proto.togglePopover ??= function (this: HTMLElement) {
    this.toggleAttribute('data-popover-open');
  };
  proto.scrollIntoView ??= () => {};
  const scope = globalThis as unknown as Record<string, unknown>;
  scope.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/** 等组件把这次改动渲染完（几轮 Vue 的更新与它们引起的更新） */
export async function settle(rounds = 5): Promise<void> {
  for (let index = 0; index < rounds; index++) await nextTick();
}

/** 元素读屏念的名称：aria-label、aria-labelledby 指向的文字，或 label[for] */
export function accessibleName(element: Element): string {
  const label = element.getAttribute('aria-label');
  if (label) return label.trim();
  const ids = element.getAttribute('aria-labelledby');
  const document = element.ownerDocument;
  if (ids) {
    return ids
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
  }
  const id = element.id;
  const forLabel = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
  return forLabel?.textContent?.trim() ?? '';
}

/** 可以交互的控件：按钮、输入框、组合框、分组、表格、树 */
const CONTROLS =
  'button, input, textarea, select, [role="combobox"], [role="group"], [role="spinbutton"], [role="slider"], [role="tree"], [role="grid"], [role="listbox"], table, [role="radiogroup"], [role="switch"], [role="checkbox"]';

/**
 * 按名称（标签文字）找控件：Field 的标签、aria-label、aria-labelledby 都算；名称里的必填星号不算。
 * 找不到时报错并列出容器里有的名称
 */
export function getControl(container: Element, name: string): HTMLElement {
  const candidates = [...container.querySelectorAll<HTMLElement>(CONTROLS)];
  const clean = (text: string) => text.replace(/\s*\*\s*/g, ' ').trim();
  const found = candidates.find((element) => {
    const own = clean(accessibleName(element));
    return own === name || own.split(' ')[0] === name;
  });
  if (found) return found;
  const names = [...new Set(candidates.map((element) => clean(accessibleName(element))))]
    .filter(Boolean)
    .join('、');
  throw new Error(`找不到名称是“${name}”的控件；有：${names || '（没有带名称的控件）'}`);
}

/** 点击：先按下指针（有的组件在 pointerdown 上处理），再 click */
export async function click(element: Element): Promise<void> {
  const view = element.ownerDocument.defaultView!;
  element.dispatchEvent(new view.PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new view.PointerEvent('pointerup', { bubbles: true, cancelable: true }));
  (element as HTMLElement).click();
  await settle();
}

/** 按键（keydown）：发给 target，没给时发给当前的焦点 */
export async function press(
  key: string,
  target: Element | null = document.activeElement,
  init: KeyboardEventInit = {},
): Promise<void> {
  if (!target) throw new Error(`按 ${key} 时没有焦点`);
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
  );
  await settle();
}

/** 输入文字：原生输入框改 value 再派发 input；别的（日期的段）派发 beforeinput，同软键盘 */
export async function typeText(target: HTMLElement, text: string): Promise<void> {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    target.focus();
    target.value = text;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    return;
  }
  target.focus();
  for (const char of text) {
    target.ownerDocument.activeElement!.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: char,
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle(2);
  }
}

/** 选项、树节点的文字：读屏名称优先，否则是去掉首尾空白的文字 */
export const itemText = (element: Element) =>
  element.getAttribute('aria-label')?.trim() || (element.textContent ?? '').trim();
