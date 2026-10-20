// Code：行内代码的语义标签
import { expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Code } from '../Code';

it('渲染 <code>，属性落到元素上', () => {
  const host = mount(() => <Code data-x="1">pnpm i</Code>);
  expect(host.querySelector('code')!.dataset.x).toBe('1');
  expect(host.querySelector('code')!.textContent).toBe('pnpm i');
});
