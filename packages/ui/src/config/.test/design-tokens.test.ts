// 设计令牌：主题取值换算成 Figma 变量能导入的 DTCG JSON
import { describe, expect, it } from 'vitest';
import { designTokens, type ThemeValues } from '../theme/design-tokens';
import { tokenCatalog } from '../theme/token-catalog';

/** 亮色主题的取值：token 目录里的默认值 */
const defaults: ThemeValues = Object.fromEntries(
  tokenCatalog.map((group) => [
    group.name,
    Object.fromEntries(group.tokens.map((token) => [token.name, token.value])),
  ]),
);
const bases = { em: 14, rem: 16 };

describe('designTokens', () => {
  const tokens = designTokens(defaults, bases);

  it('颜色写 sRGB 分量、透明度与 hex；说明取自 token 目录', () => {
    expect(tokens.colors!.accent).toEqual({
      $type: 'color',
      $value: {
        colorSpace: 'srgb',
        components: [0.2431, 0.3882, 0.8667],
        alpha: 1,
        hex: '#3e63dd',
      },
      $description: tokenCatalog[0]!.tokens.find((token) => token.name === 'accent')!.description,
    });
    const overlay = designTokens({ colors: { overlay: 'rgba(0, 0, 0, 0.4)' } }, bases);
    expect(overlay.colors!.overlay!.$value).toMatchObject({ alpha: 0.4, hex: '#000000' });
  });

  it('长度一律换成 px：em 按基准字号、rem 按根元素字号；百分比不导出', () => {
    expect(tokens.space!.md!.$value).toEqual({ value: 10.5, unit: 'px' });
    expect(tokens.space!.none!.$value).toEqual({ value: 0, unit: 'px' });
    expect(tokens.sizes!.xs!.$value).toEqual({ value: 480, unit: 'px' });
    expect(tokens.sizes).not.toHaveProperty('full');
    expect(tokens.radii!.full!.$value).toEqual({ value: 9999, unit: 'px' });
    expect(tokens.letterSpacings!.tighter!.$value).toEqual({ value: -0.28, unit: 'px' });
  });

  it('字体取字体栈里 Figma 自带的开源字体，都没有时取第一个', () => {
    expect(tokens.fonts!.sans).toMatchObject({ $type: 'fontFamily', $value: 'Noto Sans SC' });
    expect(tokens.fonts!.mono!.$value).toBe('JetBrains Mono');
    const custom = designTokens({ fonts: { sans: '"Inter", sans-serif' } }, bases);
    expect(custom.fonts!.sans!.$value).toBe('Inter');
  });

  it('字重、行高、不透明度是数字，时长是秒', () => {
    expect(tokens.fontWeights!.semibold).toMatchObject({ $type: 'number', $value: 600 });
    expect(tokens.lineHeights!.normal!.$value).toBe(1.5);
    expect(tokens.durations!.md).toMatchObject({
      $type: 'duration',
      $value: { value: 0.2, unit: 's' },
    });
  });

  it('阴影按层拆开（括号里的逗号不算），缓动是贝塞尔的四个数；none 不导出', () => {
    const shadow = designTokens(
      { shadows: { sm: '0 1px 2px -1px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #00000014' } },
      bases,
    );
    expect(shadow.shadows!.sm).toMatchObject({
      $type: 'shadow',
      $value: [
        {
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 1, unit: 'px' },
          blur: { value: 2, unit: 'px' },
          spread: { value: -1, unit: 'px' },
          color: { alpha: 0.1 },
          inset: false,
        },
        { spread: { value: 1, unit: 'px' }, color: { hex: '#000000' }, inset: true },
      ],
    });
    expect(tokens.shadows).not.toHaveProperty('none');
    expect(tokens.easings!.standard).toMatchObject({
      $type: 'cubicBezier',
      $value: [0.2, 0, 0, 1],
    });
  });

  it('只导出 token 目录里有的组与 token', () => {
    expect(Object.keys(tokens)).toEqual(tokenCatalog.map((group) => group.name));
    expect(designTokens({ colors: { unknown: '#fff' } }, bases).colors).toEqual({});
  });
});
