import { describe, expect, it } from 'vitest';
import { mount } from '../../../utils/.test/mount';
import { Kbd } from '../../Kbd';
import { Code } from '../Code';

describe('Code 与 Kbd', () => {
  it('语义标签：<code> 与 <kbd>，属性落到元素上', () => {
    const host = mount(() => (
      <p>
        <Code data-x="1">pnpm i</Code>
        <Kbd>Ctrl</Kbd>
      </p>
    ));
    expect(host.querySelector('code')!.dataset.x).toBe('1');
    expect(host.querySelector('code')!.textContent).toBe('pnpm i');
    expect(host.querySelector('kbd')!.textContent).toBe('Ctrl');
  });
});
