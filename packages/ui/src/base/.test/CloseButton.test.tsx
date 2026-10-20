// CloseButton、ClearButton：名称取语言包
import { expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { ClearButton, CloseButton } from '../CloseButton';

it('CloseButton、ClearButton：名称取语言包，可以用 aria-label 改', () => {
  const root = mount(() => (
    <>
      <CloseButton />
      <ClearButton />
      <CloseButton aria-label="关闭对话框" />
    </>
  ));
  expect([...root.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual([
    '关闭',
    '清空',
    '关闭对话框',
  ]);
});
