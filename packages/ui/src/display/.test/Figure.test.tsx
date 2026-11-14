// Figure：figure + figcaption，说明在下面或上面；没有说明时不出 figcaption
import { describe, expect, it } from 'vitest';
import { mount, styleOf } from '../../utils/.test/mount';
import { Figure } from '../Figure';

describe('Figure', () => {
  it('内容后面是 figcaption；没有说明时只有内容', () => {
    const root = mount(() => (
      <>
        <Figure caption="图 1：采购额" data-x="1">
          <img src="/chart.png" alt="按月的采购额" />
        </Figure>
        <Figure>
          <img src="/chart.png" alt="" />
        </Figure>
      </>
    ));
    const [captioned, plain] = root.querySelectorAll('figure');
    expect(captioned!.getAttribute('data-x')).toBe('1');
    expect(captioned!.lastElementChild!.tagName).toBe('FIGCAPTION');
    expect(captioned!.querySelector('figcaption')!.textContent).toBe('图 1：采购额');
    expect(plain!.querySelector('figcaption')).toBeNull();
    // 去掉浏览器给 figure 的外边距
    const style = styleOf(captioned!);
    expect(style.get('&|margin') ?? style.get('&|margin-top')).toMatch(/^0/);
  });

  it('captionSide="top"：说明排在上面；align 改对齐', () => {
    const root = mount(() => (
      <Figure caption="表 2" captionSide="top" align="center">
        <table />
      </Figure>
    ));
    const figure = root.querySelector('figure')!;
    expect(styleOf(figure).get('&|flex-direction')).toBe('column-reverse');
    expect(styleOf(figure).get('&|text-align')).toBe('center');
  });
});
