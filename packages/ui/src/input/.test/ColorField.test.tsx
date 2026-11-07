// ColorField：输入规范成 #hex 写回、写不成颜色时标为无效；色块是打开取色器的按钮；ColorPicker 的色板键盘与输入
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { ColorField } from '../ColorField';
import { ColorPicker } from '../ColorPicker';

it('输入颜色名、rgb() 后失焦写回 #hex；写不成颜色时无效、值不变，失焦后恢复', async () => {
  let color = _state('#3e63dd');
  const root = mount(() => <ColorField _value={color} aria-label="品牌色" />);
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

it('色块是打开取色器的按钮，名称取语言包；只读时不能打开', async () => {
  const root = mount(() => (
    <>
      <ColorField _value="#3e63dd" aria-label="颜色" />
      <ColorField _value="#3e63dd" aria-label="只读" readonly />
    </>
  ));
  const [swatch, locked] = [...root.querySelectorAll<HTMLButtonElement>('button')];
  expect(swatch!.getAttribute('aria-label')).toBe('选择颜色');
  expect(swatch!.getAttribute('aria-haspopup')).toBe('dialog');
  expect(locked!.disabled).toBe(true);
});

it('ColorPicker：色板上 ←→ 改饱和度、↑↓ 改明度；输入 rgb() 回车写回 #hex', async () => {
  let color = _state('#ff0000');
  const root = mount(() => <ColorPicker _value={color} alpha={false} recent={false} />);
  const thumb = root.querySelector<HTMLElement>('[aria-label="饱和度与明度"]')!;
  expect(thumb.getAttribute('aria-valuetext')).toBe('饱和度 100%，明度 100%');
  thumb.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }),
  );
  await nextTick();
  expect(color).toBe('#e60000');
  const text = root.querySelector<HTMLInputElement>('input[type="text"]')!;
  text.value = 'rgb(0, 128, 255)';
  text.dispatchEvent(new Event('input'));
  text.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  await nextTick();
  expect(color).toBe('#0080ff');
});
