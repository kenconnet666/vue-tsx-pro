// ThemeCustomizer：旋钮写回设置、“主题默认”清空、导出代码跟着设置变、恢复默认
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { ThemeCustomizer } from '../ThemeCustomizer';
import type { ThemeSettings } from '../theme/customize';
import { lightTheme } from '../theme/light';

it('选品牌色、圆角写回设置；选“主题默认”清空；代码跟着变；恢复默认清空全部', async () => {
  let settings = _state<ThemeSettings>({});
  const root = mount(() => <ThemeCustomizer settings={_bind(settings)} base={lightTheme} />);
  const button = (label: string) =>
    [...root.querySelectorAll<HTMLButtonElement>('button')].find(
      (item) => item.getAttribute('aria-label') === label || item.textContent === label,
    )!;
  const code = () => root.querySelector('pre code')!.textContent!;

  button('crimson').click();
  await nextTick();
  expect(settings).toEqual({ accent: 'crimson' });
  await nextTick();
  expect(code()).toContain('defineTheme(lightTheme, {');
  expect(code()).toContain('accent:');

  button('大').click();
  await nextTick();
  expect(settings.radius).toBe('large');

  root.querySelectorAll<HTMLButtonElement>('[aria-label="品牌色"] button')[0]!.click();
  await nextTick();
  expect(settings.accent).toBeUndefined();

  button('恢复默认').click();
  await nextTick();
  expect(settings).toEqual({});
});
