// DocArticle、DocSection、TextTable：文档页的骨架与说明用的表格
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { DocArticle, DocSection } from '../DocArticle';
import { TextTable } from '../TextTable';

describe('DocArticle', () => {
  it('article 里有 h1、简介、lead 与正文；一节的 h2 带 id', () => {
    const root = mount(() => (
      <DocArticle title="快速开始" description="两分钟跑起来" lead={<pre>导入</pre>}>
        <DocSection id="install" title="安装">
          <p>内容</p>
        </DocSection>
      </DocArticle>
    ));
    const article = root.querySelector('article')!;
    expect(article.querySelector('h1')!.textContent).toBe('快速开始');
    expect(article.textContent).toContain('两分钟跑起来');
    expect(article.querySelector('pre')!.textContent).toBe('导入');
    expect(article.querySelector('section h2')!.id).toBe('install');
    expect(article.querySelector('section p')!.textContent).toBe('内容');
  });
});

describe('TextTable', () => {
  it('表头加各行，单元格里反引号是行内代码', () => {
    const root = mount(() => (
      <TextTable
        head={['方法', '含义']}
        rows={[
          ['`has(值)`', '含有这个值'],
          ['`length()`', '元素个数'],
        ]}
      />
    ));
    expect([...root.querySelectorAll('th')].map((cell) => cell.textContent)).toEqual([
      '方法',
      '含义',
    ]);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(root.querySelector('tbody td code')!.textContent).toBe('has(值)');
  });
});
