// 主题定制：设置换算成 token 覆盖、套在主题上、生成可以粘贴的代码
import * as radix from '@radix-ui/colors';
import { describe, expect, it } from 'vitest';
import { customizeTheme, themeSettingsCode, themeSettingsOverrides } from '../customize';
import { lemonTheme } from '../../config/theme/lemon';
import { lightTheme } from '../../config/theme/light';

describe('themeSettingsOverrides', () => {
  it('没有设置时什么都不覆盖，主题原样返回', () => {
    expect(themeSettingsOverrides({}, 'light')).toEqual({});
    expect(customizeTheme(lightTheme, {})).toBe(lightTheme);
  });

  it('品牌色、中性色按 Radix 色阶整组替换；暗色取暗色色阶', () => {
    const light = themeSettingsOverrides({ accent: 'crimson', neutral: 'mauve' }, 'light');
    expect(light.colors?.accent).toBe(radix.crimson.crimson9);
    expect(light.colors?.background).toBe(radix.mauve.mauve1);
    const dark = themeSettingsOverrides({ accent: 'crimson' }, 'dark');
    expect(dark.colors?.accentText).toBe(radix.crimsonDark.crimson11);
  });

  it('圆角、字号按默认值等比缩放（圆角的 none、full 不动）；默认档位不覆盖', () => {
    const large = themeSettingsOverrides({ radius: 'large', scaling: 1.1 }, 'light');
    expect(large.radii?.md).toBe('0.7em');
    expect(large.radii).not.toHaveProperty('full');
    expect(large.fontSizes?.md).toBe('15.4px');
    expect(themeSettingsOverrides({ radius: 'medium', scaling: 1 }, 'light')).toEqual({});
  });

  it('套在主题上时圆角按这套主题自己的取值缩放：自带圆角的柠檬主题上小 < 默认 < 大', () => {
    // 页面里量出来的柠檬圆角（单元测试的 happy-dom 不按样式表计算变量，量不到时按默认值缩放、不出错）
    const radii = { xs: '0.25em', sm: '0.45em', md: '0.75em', lg: '1.1em', xl: '1.5em' };
    const radius = (setting: 'small' | 'large') =>
      customizeTheme(lemonTheme, { radius: setting }, { radii }).overrides.radii?.md;
    expect(customizeTheme(lemonTheme, { radius: 'large' }).overrides.radii?.md).toBe('0.7em');
    expect([radius('small'), radius('large')]).toEqual(['0.375em', '1.313em']);
  });

  it('动效按倍数缩放时长；用户开启“减少动态效果”时不覆盖', () => {
    expect(themeSettingsOverrides({ motion: 'fast' }, 'light').durations?.sm).toBe('72ms');
    expect(themeSettingsOverrides({ motion: 'slow' }, 'light', { reducedMotion: true })).toEqual(
      {},
    );
  });

  it('套在主题上：名字加 -custom，覆盖写进 overrides', () => {
    const theme = customizeTheme(lightTheme, { accent: 'teal' });
    expect(theme.name).toBe('light-custom');
    expect(theme.overrides.colors?.accent).toBe(radix.teal.teal9);
  });
});

it('生成代码：defineTheme(基础主题, 覆盖)，字体名里的双引号原样保留在单引号字符串里', () => {
  const code = themeSettingsCode('lightTheme', { accent: 'teal', font: 'serifHeadings' }, 'light');
  expect(code).toContain("import { defineTheme, lightTheme } from '@vue-tsx-pro/ui';");
  expect(code).toContain('export const myTheme = defineTheme(lightTheme, {');
  expect(code).toContain(`accent: '${radix.teal.teal9}',`);
  expect(code).toMatch(/heading: '"Noto Serif SC", [^']+',/);
});
