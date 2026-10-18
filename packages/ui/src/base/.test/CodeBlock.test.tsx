import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import type { Highlighter } from '../../config/context';
import { mount } from '../../utils/.test/mount';
import { CodeBlock } from '../CodeBlock';

const pre = (root: Element) => root.querySelector('pre')!;
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve));
  await nextTick();
};
/** 把代码包进 span 的假高亮器 */
const fake: Highlighter = async (code, lang) => `<span class="hl-${lang}">${code}</span>`;

describe('CodeBlock', () => {
  it('没有高亮器时显示纯文本：pre > code，可聚焦，属性落到 pre 上', async () => {
    const root = mount(() => <CodeBlock code="<b>x</b>" lang="html" data-x="1" />);
    await settle();
    expect(pre(root).getAttribute('tabindex')).toBe('0');
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
