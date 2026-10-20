// 内置主题：每套都写全颜色、阴影、字体、圆角四组，套在别的主题里时不继承外层的取值
import { describe, expect, it } from 'vitest';
import { builtinThemeBootColors } from '../theme/boot';
import { builtinThemes } from '../theme/builtin';
import { themeAttrs } from '../theme/theme';

const themes = Object.values(builtinThemes);

describe('内置主题', () => {
  it.each(themes.map((theme) => [theme.name, theme] as const))(
    '%s：四组编译期主题都在，容器上有对应的 class',
    (_name, theme) => {
      expect(theme.styles).toHaveLength(4);
      expect(themeAttrs(theme).class?.split(' ').filter(Boolean).length).toBeGreaterThanOrEqual(4);
    },
  );

  it('builtinThemes 的键就是各主题的 name', () => {
    for (const [name, theme] of Object.entries(builtinThemes)) expect(theme.name).toBe(name);
  });

  it('防闪烁脚本的底色覆盖每套内置主题', () => {
    expect(Object.keys(builtinThemeBootColors).sort()).toEqual(
      themes.map((theme) => theme.name).sort(),
    );
  });
});
