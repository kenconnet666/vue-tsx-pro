// 主题定制：设置换算成 token 覆盖、套在主题上、生成可以粘贴的代码
import * as radix from '@radix-ui/colors';
import { describe, expect, it } from 'vitest';
import { customizeTheme, themeSettingsCode, themeSettingsOverrides } from '../theme/customize';
import { lightTheme } from '../theme/light';

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
