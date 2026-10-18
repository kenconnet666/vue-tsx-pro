import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { H1, H2, H3, H4, H5, H6 } from '../Heading';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild as HTMLElement;

describe('H1–H6', () => {
  it('每个组件渲染对应的标签，属性落到元素上', () => {
    const tags = [H1, H2, H3, H4, H5, H6].map((Heading) =>
      render(() => <Heading data-x="1">a</Heading>),
    );
    expect(tags.map((el) => el.tagName)).toEqual(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
    expect(tags[0]!.dataset.x).toBe('1');
  });

  it('默认字号随级别不同；size 可以单独改', () => {
    const h1 = render(() => <H1>a</H1>).getAttribute('class');
    expect(render(() => <H2>a</H2>).getAttribute('class')).not.toBe(h1);
    expect(render(() => <H1 size="xxl">a</H1>).getAttribute('class')).toBe(
      render(() => <H2>a</H2>).getAttribute('class'),
    );
  });
});
