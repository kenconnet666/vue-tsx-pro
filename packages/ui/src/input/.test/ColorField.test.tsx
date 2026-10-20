// ColorField：输入规范成 #hex 写回、写不成颜色时标为无效、原生取色器、Field 的名称
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { ColorField } from '../ColorField';

it('输入颜色名、rgb() 后失焦写回 #hex；写不成颜色时无效、值不变，失焦后恢复', async () => {
  let color = _state('#3e63dd');
  const root = mount(() => <ColorField value={_bind(color)} aria-label="品牌色" />);
  const text = root.querySelector<HTMLInputElement>('input[type="text"]')!;
  expect(text.getAttribute('aria-label')).toBe('品牌色');

  text.value = 'rgb(255, 0, 0)';
  text.dispatchEvent(new Event('input'));
  text.dispatchEvent(new Event('blur'));
  await nextTick();
  expect(color).toBe('#ff0000');

  text.value = '不是颜色';
  text.dispatchEvent(new Event('input'));
  await nextTick();
  expect(text.getAttribute('aria-invalid')).toBe('true');
  text.dispatchEvent(new Event('blur'));
  await nextTick();
  expect(color).toBe('#ff0000');
  expect(text.value).toBe('#ff0000');
  expect(text.hasAttribute('aria-invalid')).toBe(false);
});

it('原生取色器选色写回 value；它的名称取语言包', async () => {
  let color = _state('#000000');
  const root = mount(() => <ColorField value={_bind(color)} aria-label="颜色" />);
  const picker = root.querySelector<HTMLInputElement>('input[type="color"]')!;
  expect(picker.getAttribute('aria-label')).toBe('选择颜色');
  picker.value = '#12a594';
  picker.dispatchEvent(new Event('input'));
  await nextTick();
  expect(color).toBe('#12a594');
});
