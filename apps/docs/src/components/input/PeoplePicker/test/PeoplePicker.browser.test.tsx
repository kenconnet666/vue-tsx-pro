// PeoplePicker 触发框的键盘：↓ 打开选择对话框（Esc 关掉、不写回），Backspace 删掉最后一个已选
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../../../test/mount';
import Field from '../demo/Field';

it('↓ 打开对话框，Esc 关闭；Backspace 删掉最后一个已选', async () => {
  const root = mount(Field);
  // 第一项是抄送（已选林晓、质量部）
  const label = [...root.querySelectorAll('label')].find((element) =>
    element.textContent?.includes('抄送'),
  )!;
  const field = label.parentElement!;
  const trigger = field.querySelector<HTMLElement>('[aria-haspopup]')!;
  // 触发框里显示的已选（对话框关上后仍在 DOM 里，它的组织架构也有“质量部”，不算）
  const shown = () => {
    const copy = field.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('dialog').forEach((dialog) => dialog.remove());
    return copy.textContent ?? '';
  };
  expect(shown()).toContain('质量部');

  trigger.focus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => document.querySelector('dialog[open]')).toBeNull();
  // 没按确定：已选不变
  expect(shown()).toContain('质量部');

  trigger.focus();
  await userEvent.keyboard('{Backspace}');
  await expect.poll(shown).not.toContain('质量部');
  expect(shown()).toContain('林晓');
});
