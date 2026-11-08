// @vitest-environment node
// 组件规格的键盘行为：从文档页的键盘一节读出按键，字面量数组、共享常量与展开拼接都认得
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { keyboardByComponent } from './keyboard.ts';

const keyboard = keyboardByComponent(fileURLToPath(new URL('../src/components', import.meta.url)));

it('字面量数组：挂到页面介绍的组件上', () => {
  expect(keyboard.get('Splitter')?.[0]).toEqual({
    keys: '← / →',
    action: expect.stringContaining('起始一栏变窄、变宽 5%'),
  });
});

it('共享常量（date/keyboard.ts）：DatePicker 有分段输入与日历网格的按键', () => {
  const keys = keyboard.get('DatePicker')?.map((binding) => binding.keys) ?? [];
  expect(keys).toContain('数字键');
  expect(keys).toContain('Shift+PageUp / Shift+PageDown');
});

it('没有键盘一节的组件不在里面', () => {
  expect(keyboard.has('Badge')).toBe(false);
});
