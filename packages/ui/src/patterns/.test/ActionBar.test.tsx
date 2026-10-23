// ActionBar：起始边的说明与结束边的按钮；吸底时盖着内容的判断要真实的布局，见浏览器里的整页示例
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { ActionBar } from '../ActionBar';

describe('ActionBar', () => {
  it('start 在前、按钮在后；没有 start 时只有按钮区', () => {
    const withStart = mount(() => (
      <ActionBar start="有未保存的改动">
        <button>保存</button>
      </ActionBar>
    )).firstElementChild!;
    expect(withStart.children).toHaveLength(2);
    expect(withStart.firstElementChild!.textContent).toBe('有未保存的改动');
    expect(withStart.lastElementChild!.querySelector('button')).not.toBeNull();
    const plain = mount(() => (
      <ActionBar sticky={false}>
        <button>保存</button>
      </ActionBar>
    )).firstElementChild!;
    expect(plain.children).toHaveLength(1);
    expect(plain.hasAttribute('data-stuck')).toBe(false);
  });
});
