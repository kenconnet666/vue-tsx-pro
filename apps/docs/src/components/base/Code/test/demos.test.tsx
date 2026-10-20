// Code 的示例
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Basic from '../demo/Basic';

it('Basic：段落里的命令、文件名、代码各是一个 <code>', () => {
  const codes = mount(Basic).querySelectorAll('p > code');
  expect([...codes].map((code) => code.textContent)).toEqual([
    'pnpm add @vue-tsx-pro/ui',
    'main.ts',
    'app.use(createUi())',
  ]);
});
