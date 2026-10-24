import { describe, expect, it } from 'vitest';
import { mount, styleOf } from '../../utils/.test/mount';
import { Container, createContainer } from '../Container';

describe('Container', () => {
  it('div，档位追加样式，属性落到元素上', () => {
    const el = mount(() => (
      <Container size="sm" data-x="1">
        a
      </Container>
    )).firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.dataset.x).toBe('1');
    expect(styleOf(el).size).toBeGreaterThan(3);
  });

  it('createContainer 生成 main 等语义容器', () => {
    const Page = createContainer('main', 'Page');
    const el = mount(() => <Page aria-label="正文">a</Page>).firstElementChild!;
    expect(el.tagName).toBe('MAIN');
    expect(el.getAttribute('aria-label')).toBe('正文');
  });
});
