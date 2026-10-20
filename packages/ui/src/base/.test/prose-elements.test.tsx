// 正文排版：列表、引用、高亮标记、长文容器、标题的锚点链接
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Prose } from '../../layout/Prose';
import { Blockquote } from '../Blockquote';
import { H2 } from '../Heading';
import { List, ListItem, OrderedList } from '../List';
import { Mark } from '../Mark';

describe('正文排版', () => {
  it('列表、引用、高亮标记渲染各自的元素，长文容器是 article', () => {
    const root = mount(() => (
      <Prose>
        <List>
          <ListItem>一</ListItem>
        </List>
        <OrderedList start={3}>
          <ListItem>三</ListItem>
        </OrderedList>
        <Blockquote>引文</Blockquote>
        <p>
          <Mark>命中</Mark>
        </p>
      </Prose>
    ));
    const article = root.querySelector('article')!;
    expect(article.querySelector('ul > li')!.textContent).toBe('一');
    expect(article.querySelector('ol')!.getAttribute('start')).toBe('3');
    expect(article.querySelector('blockquote')!.textContent).toBe('引文');
    expect(article.querySelector('mark')!.textContent).toBe('命中');
  });

  it('标题有 id 且 anchor 时末尾有指向本节的链接；没有 id 时不加', () => {
    const root = mount(() => (
      <>
        <H2 id="install" anchor>
          安装
        </H2>
        <H2 anchor>没有 id</H2>
      </>
    ));
    const [withId, withoutId] = root.querySelectorAll('h2');
    const link = withId!.querySelector('a')!;
    expect([link.getAttribute('href'), link.getAttribute('aria-label')]).toEqual([
      '#install',
      '链接到本节',
    ]);
    expect(withoutId!.querySelector('a')).toBeNull();
  });
});
