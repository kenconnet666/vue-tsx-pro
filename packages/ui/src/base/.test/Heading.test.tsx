import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Heading } from '../Heading';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild as HTMLElement;

describe('Heading', () => {
  it('level 决定标签，默认 h2', () => {
    expect(render(() => <Heading>a</Heading>).tagName).toBe('H2');
    expect(render(() => <Heading level={4}>a</Heading>).tagName).toBe('H4');
  });

  it('size 可以单独改：同一级别、不同字号得到不同的样式', () => {
    const byLevel = render(() => <Heading level={1}>a</Heading>).getAttribute('class');
    const resized = render(() => (
      <Heading level={1} size="lg">
        a
      </Heading>
    )).getAttribute('class');
    expect(resized).not.toBe(byLevel);
  });
});
