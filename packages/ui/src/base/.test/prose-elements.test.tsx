// 正文排版：列表、引用、高亮标记、长文容器、标题的锚点链接
import { Check, X } from '@lucide/icons';
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

  it('List 的 icon 代替圆点，ListItem 逐项覆盖；有序列表里不沿用外层的图标', () => {
    const root = mount(() => (
      <List icon={Check} propsIcon={{ class: 'mark' }}>
        <ListItem>包含</ListItem>
        <ListItem icon={X} propsIcon={{ class: 'off' }}>
          不包含
          <OrderedList>
            <ListItem>第一步</ListItem>
          </OrderedList>
        </ListItem>
      </List>
    ));
    const [included, excluded] = [...root.querySelectorAll('ul > li')];
    expect(included!.querySelector('.mark')).not.toBeNull();
    // 逐项的部件属性与列表的合并
    expect(excluded!.querySelector(':scope > .mark.off')).not.toBeNull();
    expect(root.querySelector('ol > li')!.querySelector('svg, .mark')).toBeNull();
  });
});
