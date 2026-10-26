// 文档站外壳在真实浏览器里：AppShell 的响应式与抽屉、SkipLink、本页目录的滚动高亮、命令面板、主题切换、色块
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  CommandPalette,
  H2,
  NavItem,
  NavList,
  TableOfContents,
  collectHeadings,
  createThemePreference,
  createUi,
  darkTheme,
  isApplePlatform,
  lightTheme,
  paperTheme,
  type HeadingEntry,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';
import { AppShell, ThemeSwitcher } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { ColorSwatch } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';
import { page, userEvent } from 'vitest/browser';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { createApp, nextTick, type App, type VNodeChild } from 'vue';

// Windows 上的 Playwright WebKit 在 View Transitions 期间会崩溃（Safari 正常）。这里的测试关心切换的结果，
// 不测过渡：去掉 startViewTransition，revealTransition 走直接更新的分支
beforeAll(() => {
  Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true });
});
afterAll(() => {
  delete (document as { startViewTransition?: unknown }).startViewTransition;
});

let app: App | undefined;
let root: HTMLElement;
afterEach(async () => {
  app?.unmount();
  root.remove();
  window.scrollTo(0, 0);
  await page.viewport(1280, 800);
});

function render(view: () => VNodeChild) {
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(_component(() => view));
  app.use(createUi());
  app.mount(root);
}

const sections = ['安装', '用法', '属性', '样式', '无障碍'].map((label, index) => ({
  id: `section-${index}`,
  label,
}));

function docsPage(toc: () => HeadingEntry[]) {
  return () => (
    <AppShell
      header={<strong>文档</strong>}
      sidebar={
        <NavList aria-label="组件">
          <NavItem href="#section-1">按钮</NavItem>
        </NavList>
      }
      aside={<TableOfContents items={toc()} />}
    >
      {sections.map((section) => (
        <section key={section.id} style={{ minHeight: '120vh' }}>
          <H2 id={section.id} anchor>
            {section.label}
          </H2>
        </section>
      ))}
    </AppShell>
  );
}

it('AppShell：宽屏显示两侧栏；窄屏时侧栏收进抽屉，点了链接自动关闭', async () => {
  await page.viewport(1280, 800);
  render(docsPage(() => []));
  const sidebar = () => root.querySelector<HTMLElement>('nav[aria-label="组件"]')!;
  const menuButton = root.querySelector<HTMLButtonElement>('header button')!;
  expect(getComputedStyle(menuButton).display).toBe('none');
  expect(sidebar().checkVisibility()).toBe(true);
  expect(root.querySelector('aside')!.checkVisibility()).toBe(true);

  await page.viewport(600, 800);
  await expect.poll(() => getComputedStyle(menuButton).display).not.toBe('none');
  expect(sidebar().checkVisibility()).toBe(false);
  expect(root.querySelector('aside')!.checkVisibility()).toBe(false);

  await userEvent.click(menuButton);
  const drawer = () => document.querySelector<HTMLDialogElement>('dialog[data-side="start"]')!;
  await expect.poll(() => drawer()?.open).toBe(true);
  expect(menuButton.getAttribute('aria-expanded')).toBe('true');
  await userEvent.click(drawer().querySelector('a')!);
  await expect.poll(() => drawer().open).toBe(false);
});

it('SkipLink：聚焦时出现，点击后焦点到正文', async () => {
  render(docsPage(() => []));
  const skip = root.querySelector<HTMLAnchorElement>('a')!;
  expect(skip.textContent).toBe('跳到正文');
  expect(skip.getBoundingClientRect().bottom).toBeLessThanOrEqual(0);
  // WebKit 默认 Tab 不经过链接（Safari 的系统设置），直接聚焦
  skip.focus();
  await expect.poll(() => skip.getBoundingClientRect().top).toBeGreaterThan(0);
  await userEvent.click(skip);
  expect(document.activeElement).toBe(root.querySelector('main'));
});

it('本页目录：从标题收集；滚到哪一节高亮哪一节，锚点跳转后标题不被顶栏挡住', async () => {
  // 右侧目录只在 80rem 以上显示：不依赖前面的测试设好的视口
  await page.viewport(1280, 800);
  let toc = _state<HeadingEntry[]>([]);
  render(docsPage(() => toc));
  toc = collectHeadings(root.querySelector('main')!);
  await nextTick();
  expect(toc.map((entry) => entry.label)).toEqual(sections.map((section) => section.label));

  const current = () =>
    root.querySelector('a[aria-current="location"]')?.getAttribute('href') ?? null;
  await expect.poll(current).toBe(null);
  await userEvent.click(root.querySelector('aside a[href="#section-2"]')!);
  await expect.poll(current).toBe('#section-2');
  // 标题停在顶栏下面（scroll-margin = 顶栏高度 + 间距）
  const header = root.querySelector('header')!.getBoundingClientRect();
  const heading = document.getElementById('section-2')!.getBoundingClientRect();
  expect(heading.top).toBeGreaterThanOrEqual(header.bottom);
  // 滚到底：最后一节到不了阅读线也高亮它
  window.scrollTo(0, document.documentElement.scrollHeight);
  await expect.poll(current).toBe('#section-4');
});

it('命令面板：快捷键打开，输入过滤，↓ 与 Enter 执行并关闭', async () => {
  const actions: string[] = [];
  const items = [
    { value: 'button', label: '按钮 Button', description: '触发一个操作' },
    { value: 'badge', label: '徽标 Badge', description: '状态与计数' },
    { value: 'dialog', label: '对话框 Dialog', description: '模态面板' },
  ];
  render(() => <CommandPalette items={items} onAction={(item) => actions.push(item.value)} />);
  const dialog = () => document.querySelector('dialog')!;
  await userEvent.keyboard(isApplePlatform() ? '{Meta>}k{/Meta}' : '{Control>}k{/Control}');
  await expect.poll(() => dialog().open).toBe(true);
  const input = dialog().querySelector('input')!;
  await expect.poll(() => document.activeElement).toBe(input);
  await userEvent.type(input, 'b');
  // “按钮 Button”“徽标 Badge” 含 b；“对话框 Dialog”不含
  await expect.poll(() => dialog().querySelectorAll('[role="option"]').length).toBe(2);
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(actions).toEqual(['badge']);
  await expect.poll(() => dialog().open).toBe(false);

  // 触发按钮也能打开；再打开时输入框是空的。按钮的名称就是看得见的文字（WCAG 2.5.3）
  const trigger = root.querySelector<HTMLElement>('button[aria-haspopup="dialog"]')!;
  expect(trigger.hasAttribute('aria-label')).toBe(false);
  expect(trigger.textContent).toContain('搜索文档');
  expect(trigger.querySelector('kbd')!.getAttribute('aria-hidden')).toBe('true');
  await userEvent.click(trigger);
  await expect.poll(() => dialog().open).toBe(true);
  expect(dialog().querySelector('input')!.value).toBe('');
});

it('主题切换：菜单列出跟随系统与各主题，选中后切换并记下', async () => {
  const preference = createThemePreference({
    themes: { light: lightTheme, dark: darkTheme, paper: paperTheme },
    storageKey: false,
    fallback: 'light',
  });
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(_component(() => () => <ThemeSwitcher preference={preference} />));
  app.use(createUi({ theme: () => preference.theme }));
  app.mount(root);

  await userEvent.click(root.querySelector('button[aria-label="主题"]')!);
  const items = () => [...document.querySelectorAll('[role="menuitemradio"]')];
  await expect
    .poll(() => items().map((item) => item.textContent))
    .toEqual(['跟随系统', '亮色', '暗色', '纸张']);
  expect(items()[1]!.getAttribute('aria-checked')).toBe('true');
  await userEvent.click(items()[3]!);
  await expect.poll(() => preference.name).toBe('paper');
});

it('色块：token 的取值按当前主题读出，换主题时跟着变', async () => {
  const preference = createThemePreference({
    themes: { light: lightTheme, dark: darkTheme },
    storageKey: false,
    fallback: 'light',
  });
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(_component(() => () => <ColorSwatch color={colors.text} label="text" />));
  app.use(createUi({ theme: () => preference.theme }));
  app.mount(root);
  const value = () => root.querySelectorAll('span')[1]?.textContent;
  await expect.poll(value).toMatch(/^#/);
  const light = value();
  await preference.set('dark');
  await expect.poll(value).not.toBe(light);
  expect(value()).toMatch(/^#/);
});

it('整页浮层滚动条：隐藏原生滚动条，滚动时出现、滑块跟着位置走，拖动能滚动页面；卸载后恢复', async () => {
  await page.viewport(1280, 800);
  const html = document.documentElement;
  const classesBefore = html.className;
  render(docsPage(() => []));
  // 隐藏原生滚动条的样式写在页面根元素的 class 上
  expect(html.className).not.toBe(classesBefore);
  expect(getComputedStyle(html).scrollbarWidth).toBe('none');
  const track = () =>
    [...document.body.querySelectorAll<HTMLElement>('[data-axis="y"]')].find(
      (element) => getComputedStyle(element).position === 'fixed',
    )!;
  const thumb = () => track().firstElementChild as HTMLElement;
  expect(track().getAttribute('aria-hidden')).toBe('true');
  expect(track().dataset.state).toBe('hidden');

  window.scrollTo(0, html.scrollHeight / 2);
  await expect.poll(() => track().dataset.state).toBe('visible');
  await expect
    .poll(() => new DOMMatrix(getComputedStyle(thumb()).transform).m42)
    .toBeGreaterThan(0);

  // 拖动滑块往回拉：页面跟着往上滚（移动事件发在滑块上：startMove 用指针捕获，跟着它走）
  const before = html.scrollTop;
  const box = thumb().getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const init = (clientY: number) => ({
    clientX: x,
    clientY,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    bubbles: true,
    cancelable: true,
  });
  thumb().dispatchEvent(new PointerEvent('pointerdown', init(y)));
  thumb().dispatchEvent(new PointerEvent('pointermove', init(y - 100)));
  thumb().dispatchEvent(new PointerEvent('pointerup', init(y - 100)));
  await expect.poll(() => html.scrollTop).toBeLessThan(before);

  app!.unmount();
  app = undefined;
  expect(html.className).toBe(classesBefore);
});
