/**
 * 焦点环没有被裁（计划 P0.3）：示例里每个可聚焦的元素，用键盘的方式聚焦后按 outline 的宽度与偏移算出焦点环的范围，
 * 检查它没有被 overflow 不是 visible 的祖先裁掉（CodeBlock 的“展开全部”曾被外框整圈裁掉）。被裁的改用
 * focusRingStyles.inset（画在里面）或给容器留出余量。元素本身就在容器外（滚走了）的不算。
 * 已知的还没修的记在 focus-ring-baseline.json（示例与元素）：出现基线外的才失败，修好的从基线删掉。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { createUi, lightTheme } from '@zerodep-dev/vue-tsx-pro-ui';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createApp, h, type App, type Component } from 'vue';
import baseline from './focus-ring-baseline.json';
import { demoLoaders, loadDemos } from './demos';

const loaded = new Map<string, Component>();
beforeAll(async () => {
  for (const [path, demo] of await loadDemos()) loaded.set(path, demo);
  await new Promise((resolve) => setTimeout(resolve, 2000));
}, 120_000);

let app: App | undefined;
let host: HTMLElement | undefined;
afterEach(() => {
  app?.unmount();
  host?.remove();
});

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** 一个元素的简短描述：标签、名称、部件 */
const describe = (element: Element) =>
  [
    element.tagName.toLowerCase(),
    element.getAttribute('aria-label') ??
      element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 16),
    element.getAttribute('data-scope') &&
      `${element.getAttribute('data-scope')}/${element.getAttribute('data-part')}`,
  ]
    .filter(Boolean)
    .join(' ');

/** 焦点环被哪个祖先裁掉；没被裁时 null */
function clipperOf(element: HTMLElement, stop: Element): Element | null {
  const style = getComputedStyle(element);
  if (style.outlineStyle === 'none' || style.outlineStyle === '') return null;
  const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
  if (!(reach > 0)) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  for (let node = element.parentElement; node && node !== stop; node = node.parentElement) {
    const own = getComputedStyle(node);
    if (own.overflowX === 'visible' && own.overflowY === 'visible') continue;
    const box = node.getBoundingClientRect();
    const left = box.left + node.clientLeft;
    const top = box.top + node.clientTop;
    const right = left + node.clientWidth;
    const bottom = top + node.clientHeight;
    // 元素自己就在外面（滚走了、被有意截断）：不算
    if (
      rect.left < left - 0.5 ||
      rect.top < top - 0.5 ||
      rect.right > right + 0.5 ||
      rect.bottom > bottom + 0.5
    )
      return null;
    const tolerance = reach - 0.5;
    if (
      (own.overflowX !== 'visible' &&
        (rect.left - left < tolerance || right - rect.right < tolerance)) ||
      (own.overflowY !== 'visible' &&
        (rect.top - top < tolerance || bottom - rect.bottom < tolerance))
    )
      return node;
  }
  return null;
}

const paths = demoLoaders.map(([path]) => path).filter((path) => !path.includes('/frames/'));
const categories = [...new Set(paths.map((path) => path.split('/')[1]!))];

it.each(categories)(
  '%s 分类的示例：键盘聚焦时焦点环没有被祖先的 overflow 裁掉',
  { timeout: 120_000 },
  async (category) => {
    const items = paths.filter((path) => path.split('/')[1] === category);
    host = document.createElement('main');
    document.body.append(host);
    app = createApp(
      _component(
        () => () =>
          items.map((path) =>
            h('section', { key: path, 'data-demo': path }, [h(loaded.get(path)!)]),
          ),
      ),
    ).use(createUi({ theme: lightTheme, paintDocument: true }));
    app.mount(host);
    await new Promise((resolve) => setTimeout(resolve, 500));
    // 先按一下 Tab：之后的 focus() 算键盘聚焦（:focus-visible）
    await userEvent.keyboard('{Tab}');
    const clipped: string[] = [];
    for (const element of host.querySelectorAll<HTMLElement>(FOCUSABLE)) {
      element.focus({ preventScroll: true });
      if (document.activeElement !== element) continue;
      const clipper = clipperOf(element, host);
      if (!clipper) continue;
      const demo = element.closest('[data-demo]')?.getAttribute('data-demo');
      const key = `${demo}：${describe(element)}`;
      if (!(baseline as string[]).includes(key))
        clipped.push(`${key}（被 ${describe(clipper)} 裁掉）`);
    }
    expect(clipped).toEqual([]);
  },
);
