// 色块 ColorSwatch
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { ColorSwatch } from '../ColorSwatch';

describe('ColorSwatch', () => {
  it('显示名称与取值：普通颜色显示它本身，value 可以改写，false 不显示', () => {
    const root = mount(() => (
      <>
        <ColorSwatch color="#3e63dd" label="品牌色" />
        <ColorSwatch color="rgb(0 0 0 / 0.5)" label="遮罩" value="50% 黑" />
        <ColorSwatch color="red" value={false} />
      </>
    ));
    const texts = [...root.children].map((swatch) =>
      [...swatch.querySelectorAll('span')].map((span) => span.textContent),
    );
    expect(texts).toEqual([['品牌色', '#3e63dd'], ['遮罩', '50% 黑'], []]);
    expect(root.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
