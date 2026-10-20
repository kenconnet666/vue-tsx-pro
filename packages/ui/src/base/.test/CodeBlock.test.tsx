import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import type { Highlighter } from '../../config/context';
import { mount } from '../../utils/.test/mount';
import { CodeBlock, parseLineSpec } from '../CodeBlock';

const pre = (root: Element) => root.querySelector('pre')!;
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve));
  await nextTick();
};
/** 把代码包进 span 的假高亮器 */
const fake: Highlighter = async (code, lang) => `<span class="hl-${lang}">${code}</span>`;

describe('CodeBlock', () => {
  it('没有高亮器时显示纯文本：pre > code，外面的滚动区域可聚焦，属性落到 pre 上', async () => {
    const root = mount(() => <CodeBlock code="<b>x</b>" lang="html" data-x="1" />);
    await settle();
    // 长行在 ScrollArea 里横向滚动：可聚焦的是滚动区域（键盘能滚动），不是 pre
    expect(pre(root).closest('[tabindex="0"]')).not.toBeNull();
    expect(pre(root).dataset.x).toBe('1');
    expect(pre(root).dataset.lang).toBe('html');
    // 文本原样显示，不当成 HTML
    expect(pre(root).querySelector('code')!.textContent).toBe('<b>x</b>');
    expect(pre(root).querySelector('b')).toBeNull();
  });

  it('Provider 注入的高亮器：先显示纯文本，结果到了再替换', async () => {
    const root = mount(() => (
      <Provider highlighter={fake}>
        <CodeBlock code="const a = 1" lang="ts" />
      </Provider>
    ));
    expect(pre(root).querySelector('.hl-ts')).toBeNull();
    await settle();
    expect(pre(root).querySelector('code .hl-ts')!.textContent).toBe('const a = 1');
  });

  it('没给语言时不调用高亮器', async () => {
    const highlighter = vi.fn(fake);
    mount(() => (
      <Provider highlighter={highlighter}>
        <CodeBlock code="x" />
      </Provider>
    ));
    await settle();
    expect(highlighter).not.toHaveBeenCalled();
  });

  it('代码变了先回到纯文本；先发出的慢结果晚到时不覆盖新结果', async () => {
    const pending: ((html: string) => void)[] = [];
    const slow: Highlighter = () => new Promise((resolve) => pending.push(resolve));
    let code = _state('old');
    const root = mount(() => (
      <Provider highlighter={slow}>
        <CodeBlock code={code} lang="ts" />
      </Provider>
    ));
    await settle();
    code = 'new';
    await settle();
    expect(pending).toHaveLength(2);
    pending[1]!('<i>new</i>');
    await settle();
    pending[0]!('<i>old</i>');
    await settle();
    expect(pre(root).textContent).toBe('new');
  });

  it('复制按钮：写入剪贴板，图标变成对勾并播报“已复制”；copyable={false} 时没有', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const root = mount(() => <CodeBlock code="pnpm install" />);
    const button = root.querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('复制');
    button.click();
    await settle();
    expect(writeText).toHaveBeenCalledWith('pnpm install');
    expect(root.querySelector('[aria-live]')!.textContent).toBe('已复制');
    expect(mount(() => <CodeBlock code="x" copyable={false} />).querySelector('button')).toBeNull();
  });

  it('高亮失败时保留纯文本并报错', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = mount(() => (
      <Provider highlighter={() => Promise.reject(new Error('boom'))}>
        <CodeBlock code="x" lang="ts" />
      </Provider>
    ));
    await settle();
    expect(pre(root).textContent).toBe('x');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('CodeBlock 的行与折叠', () => {
  const source = ['const a = 1;', 'const b = 2;', 'const c = 3;', 'const d = 4;'].join(
    String.fromCharCode(10),
  );

  it('行号写法：逗号分隔、区间、数组', () => {
    expect([...parseLineSpec('1,3-4')]).toEqual([1, 3, 4]);
    expect([...parseLineSpec([2, 5])]).toEqual([2, 5]);
    expect(parseLineSpec(undefined).size).toBe(0);
  });

  it('按行渲染：行号不进复制的文本，新增与删除的行带 data-diff', () => {
    const root = mount(() => (
      <CodeBlock code={source} lineNumbers addedLines="2" removedLines={[3]} copyable={false} />
    ));
    const lines = pre(root).querySelectorAll('code > span');
    expect(lines).toHaveLength(4);
    expect(lines[0]!.querySelector('[aria-hidden="true"]')!.textContent).toBe('1');
    expect([lines[1]!.getAttribute('data-diff'), lines[2]!.getAttribute('data-diff')]).toEqual([
      'added',
      'removed',
    ]);
  });

  it('有标题时复制按钮在标题栏里；超过 maxLines 时折叠，按钮展开与收起', async () => {
    const root = mount(() => <CodeBlock code={source} title="main.ts" maxLines={2} />);
    expect(root.textContent).toContain('main.ts');
    const toggle = [...root.querySelectorAll('button')].find((b) =>
      b.hasAttribute('aria-expanded'),
    )!;
    expect([toggle.textContent, toggle.getAttribute('aria-expanded')]).toEqual([
      '展开全部',
      'false',
    ]);
    toggle.click();
    await nextTick();
    expect([toggle.textContent, toggle.getAttribute('aria-expanded')]).toEqual(['收起', 'true']);
  });

  it('部件属性：标题、代码区、每一行与行号；行号始终对读屏隐藏', () => {
    const root = mount(() => (
      <CodeBlock
        code={source}
        title="main.ts"
        lineNumbers
        propsTitle={{ class: 'title' }}
        propsBody={{ class: 'body' }}
        propsLine={{ class: 'line' }}
        propsLineNumber={{ class: 'number' }}
      />
    ));
    expect(root.querySelector('.title')!.textContent).toBe('main.ts');
    expect(root.querySelector('.body pre')).not.toBeNull();
    const lines = root.querySelectorAll('code > .line');
    expect(lines).toHaveLength(4);
    const numbers = [...root.querySelectorAll('.number')];
    expect(numbers.map((span) => span.textContent)).toEqual(['1', '2', '3', '4']);
    expect(numbers.every((span) => span.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('部件属性：展开按钮里的箭头图标；展开后的翻转仍由组件加上', async () => {
    const root = mount(() => (
      <CodeBlock code={source} maxLines={2} propsExpandIcon={{ class: 'chevron' }} />
    ));
    const toggle = root.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    const icon = toggle.querySelector('svg.chevron')!;
    const closed = icon.getAttribute('class');
    toggle.click();
    await nextTick();
    expect(icon.classList).toContain('chevron');
    expect(icon.getAttribute('class')).not.toBe(closed);
  });
});
