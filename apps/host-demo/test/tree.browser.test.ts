// Tree：焦点留在树上、方向键展开与移动、勾选联动、懒加载（演示页 /base）
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

const tree = (selector: string) => root.querySelector<HTMLElement>(selector)!;
const activeText = (element: HTMLElement) =>
  document.getElementById(element.getAttribute('aria-activedescendant') ?? '')?.textContent;
const item = (element: HTMLElement, text: string) =>
  [...element.querySelectorAll<HTMLElement>('[role="treeitem"]')].find(
    (node) => node.textContent === text,
  )!;

describe('Tree', () => {
  it('点选一项后焦点在树上；方向键移动、→ 展开、Enter 选中', async () => {
    const files = tree('.tree-demo');
    await userEvent.click(item(files, 'package.json'));
    expect(document.activeElement).toBe(files);
    expect(item(files, 'package.json').getAttribute('aria-selected')).toBe('true');
    expect(item(files, 'main.ts').getAttribute('aria-selected')).toBe('false');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(activeText(files)).toBe('components');
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => item(files, 'components').getAttribute('aria-expanded')).toBe('true');
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(item(files, 'Button.tsx').getAttribute('aria-selected')).toBe('true');
  });

  it('勾上父节点时子节点一起勾上；懒加载的节点展开后出现子节点', async () => {
    const permissions = tree('.tree-check-demo');
    await userEvent.click(item(permissions, '订单'));
    expect(item(permissions, '订单').getAttribute('aria-checked')).toBe('true');
    expect(root.querySelector('.tree-check-summary')!.textContent).toBe('已勾选 4 项');
    await userEvent.click(item(permissions, '用户').querySelector('[aria-hidden="true"]')!);
    await expect.poll(() => item(permissions, '邀请')).toBeTruthy();
  });

  it('axe-core 没有违规', async () => {
    const result = await axe.run(tree('.tree-check-demo'));
    expect(result.violations).toEqual([]);
  });
});
