// Toolbar：方向键在项之间移动（漫游焦点）、里面的 ToggleGroup；真实焦点移动见 apps/host-demo 的浏览器测试
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { ToggleGroup, ToggleItem } from '../../input/ToggleGroup';
import { Toolbar } from '../Toolbar';

const key = (element: Element, name: string) =>
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }),
  );

describe('Toolbar', () => {
  it('role="toolbar"，整组只有一个 Tab 进入点，方向键在按钮之间移动', async () => {
    const root = mount(() => (
      <Toolbar aria-label="格式">
        <button>粗</button>
        <button>斜</button>
        <input aria-label="字号" />
      </Toolbar>
    ));
    await nextTick();
    const toolbar = root.querySelector('[role="toolbar"]')!;
    expect(toolbar.getAttribute('aria-orientation')).toBe('horizontal');
    const [bold, italic] = toolbar.querySelectorAll('button');
    expect([bold!.tabIndex, italic!.tabIndex]).toEqual([0, -1]);
    // 输入框不参与方向键移动
    expect(toolbar.querySelector('input')!.hasAttribute('tabindex')).toBe(false);
    bold!.focus();
    key(bold!, 'ArrowRight');
    expect(document.activeElement).toBe(italic);
  });

  it('里面的 ToggleGroup 不另占 Tab 进入点：方向键跨过组内外的按钮，进入点是第一项而不是按下的那个', async () => {
    const root = mount(() => (
      <Toolbar aria-label="格式">
        <button>撤销</button>
        <ToggleGroup value="center" aria-label="对齐">
          <ToggleItem value="left">左</ToggleItem>
          <ToggleItem value="center">中</ToggleItem>
        </ToggleGroup>
      </Toolbar>
    ));
    await nextTick();
    const buttons = [...root.querySelectorAll('button')];
    expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1]);
    buttons[0]!.focus();
    key(buttons[0]!, 'ArrowRight');
    expect(document.activeElement).toBe(buttons[1]);
    key(buttons[1]!, 'ArrowRight');
    expect(document.activeElement).toBe(buttons[2]);
  });
});
