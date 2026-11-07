// ThemeSwitcher：菜单列出“跟随系统”与偏好里的各套主题（内置的有默认文字，其他的用 labels），当前的选择打勾，
// 选一项交给 preference.set（菜单 lazy={false} 直接看内容；圆形展开见浏览器）
import { describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue';
import { lightTheme } from '../../config/theme/light';
import type { ThemePreference } from '../../config/theme/preference';
import { mount } from '../../utils/.test/mount';
import { ThemeSwitcher } from '../ThemeSwitcher';

type Name = 'light' | 'dark' | 'brand';

/** 不碰存储与系统设置的偏好：set 只改选择 */
function fakePreference(): ThemePreference<Name> {
  const state = reactive({
    names: ['light', 'dark', 'brand'] as Name[],
    preference: 'system' as Name | 'system',
    name: 'light' as Name,
    theme: lightTheme,
    async set(next: Name | 'system') {
      state.preference = next;
    },
  });
  return state;
}

const radios = () => [...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];

describe('ThemeSwitcher', () => {
  it('列出跟随系统与各套主题，当前的打勾；选一项交给 preference.set', async () => {
    const preference = fakePreference();
    mount(() => <ThemeSwitcher preference={preference} labels={{ brand: '品牌' }} lazy={false} />);
    expect(radios().map((radio) => radio.textContent)).toEqual([
      '跟随系统',
      '亮色',
      '暗色',
      '品牌',
    ]);
    expect(radios().map((radio) => radio.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);

    radios()[3]!.click();
    await nextTick();
    expect(preference.preference).toBe('brand');
    expect(radios()[3]!.getAttribute('aria-checked')).toBe('true');
  });

  it('system={false} 时不列“跟随系统”', () => {
    mount(() => <ThemeSwitcher preference={fakePreference()} system={false} lazy={false} />);
    expect(radios().map((radio) => radio.textContent)).toEqual(['亮色', '暗色', 'brand']);
  });
});
