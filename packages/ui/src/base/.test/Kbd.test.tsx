// Kbd：按键的语义标签
import { expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Kbd } from '../Kbd';

it('渲染 <kbd>', () => {
  expect(mount(() => <Kbd>Ctrl</Kbd>).querySelector('kbd')!.textContent).toBe('Ctrl');
});
