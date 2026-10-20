// 颜色工具：解析与格式化、半透明叠加、WCAG 对比度、实色上的文字色
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColor, readableText, toHex, withAlpha } from '../color';

describe('颜色', () => {
  it('解析 #hex、rgb()、颜色名；格式化成 #hex，有透明度时带 alpha；解析不了返回 undefined', () => {
    expect(toHex('#3E63DD')).toBe('#3e63dd');
    expect(toHex('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(toHex('white')).toBe('#ffffff');
    expect(toHex('rgba(0, 0, 0, 0.5)')).toBe('#00000080');
    expect(parseColor('不是颜色')).toBeUndefined();
  });

  it('对比度：黑白 21:1，相同颜色 1:1；半透明前景按叠到背景上的颜色算', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#3e63dd', '#3e63dd')).toBeCloseTo(1, 5);
    // 50% 黑叠在白底上是 #808080
    expect(contrastRatio('rgba(0, 0, 0, 0.5)', '#ffffff')).toBeCloseTo(
      contrastRatio('#808080', '#ffffff'),
      1,
    );
    expect(() => contrastRatio('nope', '#fff')).toThrow('无法解析的颜色');
  });

  it('实色上的文字：白字够 4.5:1 用白字，否则用对比度更高的深色', () => {
    expect(readableText('#3e63dd')).toBe('#ffffff');
    expect(readableText('#ffe629')).toBe('#1c2024');
  });

  it('withAlpha：同一个颜色换透明度', () => {
    expect(withAlpha('#fcfcfd', 0.8)).toBe('rgba(252, 252, 253, 0.8)');
  });
});
