import { describe, expect, it } from 'vitest';
import { mount } from '../../../test/mount';
import { Container } from './Container';

describe('Container', () => {
  it('as 可以换成 main，档位追加样式，属性落到元素上', () => {
    const el = mount(() => (
      <Container as="main" size="sm" aria-label="正文">
        a
      </Container>
    )).firstElementChild!;
    expect(el.tagName).toBe('MAIN');
    expect(el.getAttribute('aria-label')).toBe('正文');
    expect(el.getAttribute('class')!.split(' ').length).toBeGreaterThan(3);
  });
});
