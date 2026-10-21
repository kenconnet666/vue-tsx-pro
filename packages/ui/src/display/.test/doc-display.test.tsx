// 文档展示：代码示例卡片 CodePreview、色块 ColorSwatch
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { CodePreview } from '../CodePreview';
import { ColorSwatch } from '../ColorSwatch';

describe('CodePreview', () => {
  it('效果区是一组；源码默认收起，按钮切换并带 aria-expanded / aria-controls', async () => {
    let shown = _state(false);
    const root = mount(() => (
      <CodePreview code="<Button>保存</Button>" showCode={_bind(shown)}>
        <button>保存</button>
      </CodePreview>
    ));
    const preview = root.querySelector('[role="group"]')!;
    expect([preview.getAttribute('aria-label'), preview.textContent]).toEqual(['预览', '保存']);
    const toggle = [...root.querySelectorAll('button')].find((button) =>
      button.hasAttribute('aria-controls'),
    )!;
    const region = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect([toggle.textContent, toggle.getAttribute('aria-expanded')]).toEqual([
      '显示代码',
      'false',
    ]);
    expect(region.querySelector('code')!.textContent).toBe('<Button>保存</Button>');
    toggle.click();
    await nextTick();
    expect(shown).toBe(true);
    expect([toggle.textContent, toggle.getAttribute('aria-expanded')]).toEqual([
      '隐藏代码',
      'true',
    ]);
    // 复制按钮在工具栏上，源码里不再重复一个
    expect(root.querySelectorAll('button[aria-label="复制"]')).toHaveLength(1);
  });

  it('收起的源码不高亮：指针移到或焦点进入工具栏时才交给高亮器', async () => {
    const highlighter = vi.fn(async (code: string) => `<span class="hl">${code}</span>`);
    const root = mount(() => (
      <Provider highlighter={highlighter}>
        <CodePreview code="const a = 1">x</CodePreview>
      </Provider>
    ));
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve));
    expect(highlighter).not.toHaveBeenCalled();
    const toolbar = root.querySelector<HTMLElement>('button[aria-controls]')!.parentElement!;
    toolbar.dispatchEvent(new PointerEvent('pointerenter'));
    await nextTick();
    expect(highlighter).toHaveBeenCalledOnce();
  });

  it('按需加载的源码：打开时不加载，工具栏上的意图或展开时才加载一次；复制拿到的是加载的源码', async () => {
    const load = vi.fn(() => Promise.resolve('const lazy = true'));
    const root = mount(() => <CodePreview code={load}>x</CodePreview>);
    await nextTick();
    expect(load).not.toHaveBeenCalled();
    const toggle = root.querySelector<HTMLElement>('button[aria-controls]')!;
    const toolbar = toggle.parentElement!;
    toolbar.dispatchEvent(new FocusEvent('focusin'));
    toolbar.dispatchEvent(new PointerEvent('pointerenter'));
    toggle.click();
    await new Promise((resolve) => setTimeout(resolve));
    expect(load).toHaveBeenCalledOnce();
    const region = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(region.querySelector('code')!.textContent).toBe('const lazy = true');
  });

  it('actions 排在工具栏最前面', () => {
    const root = mount(() => (
      <CodePreview code="x" actions={<a href="/edit">编辑</a>}>
        x
      </CodePreview>
    ));
    const toolbar = root.querySelector('a')!.parentElement!;
    expect(toolbar.firstElementChild!.textContent).toBe('编辑');
    expect(toolbar.querySelector('button[aria-controls]')).not.toBeNull();
  });
});

describe('ColorSwatch', () => {
  it('显示名称与取值：普通颜色显示它本身，value 可以改写，false 不显示', () => {
    const root = mount(() => (
      <>
        <ColorSwatch color="#3e63dd" label="品牌色" />
        <ColorSwatch color="rgb(0 0 0 / 0.5)" label="遮罩" value="50% 黑" />
        <ColorSwatch color="red" value={false} />
      </>
    ));
    const texts = [...root.children].map((swatch) =>
      [...swatch.querySelectorAll('span')].map((span) => span.textContent),
    );
    expect(texts).toEqual([['品牌色', '#3e63dd'], ['遮罩', '50% 黑'], []]);
    expect(root.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
