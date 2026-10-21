// 选择模型：单选、多选的点击结果，必选时不能取消最后一个；单选的空字符串算没选
import { describe, expect, it } from 'vitest';
import { selectedValues, toggleSelection } from '../selection';

describe('selectedValues', () => {
  it('单选的值变成一项的数组；空字符串、null、undefined 都是没选；多选原样', () => {
    expect(selectedValues('a')).toEqual(['a']);
    expect(selectedValues('')).toEqual([]);
    expect(selectedValues(null)).toEqual([]);
    expect(selectedValues(undefined)).toEqual([]);
    const values = ['a', 'b'];
    expect(selectedValues(values)).toBe(values);
  });
});

describe('toggleSelection', () => {
  it('单选：点别的换成它，点已选的取消；必选时点已选的不变', () => {
    expect(toggleSelection(['a'], 'b', { mode: 'single' })).toEqual(['b']);
    expect(toggleSelection(['a'], 'a', { mode: 'single' })).toEqual([]);
    const selected = ['a'];
    expect(toggleSelection(selected, 'a', { mode: 'single', required: true })).toBe(selected);
  });

  it('多选：加上或去掉；必选时最后一个去不掉', () => {
    expect(toggleSelection(['a'], 'b', { mode: 'multiple' })).toEqual(['a', 'b']);
    expect(toggleSelection(['a', 'b'], 'a', { mode: 'multiple' })).toEqual(['b']);
    const last = ['a'];
    expect(toggleSelection(last, 'a', { mode: 'multiple', required: true })).toBe(last);
    expect(toggleSelection(['a', 'b'], 'a', { mode: 'multiple', required: true })).toEqual(['b']);
  });
});
