import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('没有 label 时是装饰性的：不是 status，svg 对读屏隐藏', () => {
    const el = mount(() => <Spinner data-x="1" />).firstElementChild as HTMLElement;
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.dataset.x).toBe('1');
    expect(el.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('有 label 时是 role="status"，读屏念出 label', () => {
    const el = mount(() => <Spinner label="正在加载订单" />).firstElementChild!;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.textContent).toBe('正在加载订单');
  });
});
