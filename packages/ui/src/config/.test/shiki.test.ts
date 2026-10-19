// Shiki 高亮器：真实加载语法与 JavaScript 正则引擎（不需要 wasm）
import { bundledLanguages } from 'shiki/langs';
import { describe, expect, it, vi } from 'vitest';
import { createShikiHighlighter } from '../shiki';

describe('createShikiHighlighter', () => {
  const highlight = createShikiHighlighter();

  it('输出行内结构：只有 span 与 br，颜色是指向主题 tokens 的 CSS 变量', async () => {
    const html = await highlight('const a = 1\n// note', 'ts');
    expect(html).not.toMatch(/<pre|<code/);
    expect(html).toContain('<br>');
    expect(html).toMatch(/var\(--shiki-token-keyword, var\(--/);
  });

  it('别名与大小写都认；不认识的语言按纯文本输出且转义', async () => {
    expect(await highlight('let x', 'TypeScript')).toContain('--shiki-token');
    const plain = await highlight('<b>x</b>', 'no-such-language');
    expect(plain).toContain('&#x3C;b>');
    expect(plain).not.toContain('--shiki-token');
  });

  it('同一种语言只加载一次；下载失败不缓存，下次重试', async () => {
    const grammar = await bundledLanguages.json();
    let attempts = 0;
    const load = vi.fn(async () => {
      if (++attempts === 1) throw new Error('offline');
      return grammar;
    });
    const custom = createShikiHighlighter({ languages: { json: load } });
    await expect(custom('{}', 'json')).rejects.toThrow('offline');
    await Promise.all([custom('{}', 'json'), custom('[]', 'json')]);
    await custom('1', 'json');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
