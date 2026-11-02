// CodeText：反引号里的是行内代码，其余是文字
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { CodeText } from '../CodeText';

describe('CodeText', () => {
  it('反引号里的渲染成 code，其余原样', () => {
    const root = mount(() => <CodeText text="`where` 里写数组就是 `AND`" />);
    expect([...root.querySelectorAll('code')].map((code) => code.textContent)).toEqual([
      'where',
      'AND',
    ]);
    expect(root.textContent).toBe('where 里写数组就是 AND');
  });

  it('没有反引号：只有文字', () => {
    const root = mount(() => <CodeText text="普通文字" />);
    expect(root.querySelector('code')).toBeNull();
    expect(root.textContent).toBe('普通文字');
  });
});
