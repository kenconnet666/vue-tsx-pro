// SelectedTags：多选下拉前面那排已选标签只给指针用（aria-hidden、移除按钮不进 Tab 顺序），
// maxTagCount 是数字时只显示前几个、其余收进“+N”；点移除交给 onRemove
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { SelectedTags } from '../SelectedTags';

const tags = [
  { value: 'bj', label: '北京' },
  { value: 'sh', label: '上海' },
  { value: 'gz', label: '广州' },
];

describe('SelectedTags', () => {
  it('对读屏隐藏，移除按钮不进 Tab 顺序；点移除交给 onRemove（标签离场之后）', async () => {
    const removed: string[] = [];
    const root = mount(() => (
      <SelectedTags tags={tags} onRemove={(value) => removed.push(value)} />
    ));
    const row = root.firstElementChild!;
    expect(row.getAttribute('aria-hidden')).toBe('true');
    const buttons = [...row.querySelectorAll('button')];
    expect(buttons.every((button) => button.tabIndex === -1)).toBe(true);
    buttons[1]!.click();
    await vi.waitFor(() => expect(removed).toEqual(['sh']));
  });

  it('“+N”标签的部件属性（propsMore）合并到它上面', () => {
    const root = mount(() => (
      <SelectedTags tags={tags} maxTagCount={1} propsMore={{ class: 'more', tone: 'accent' }} />
    ));
    const more = root.querySelector('.more')!;
    expect(more.textContent).toContain('2');
  });

  it('maxTagCount 是数字时只显示前几个，其余收进“+N”', () => {
    const root = mount(() => <SelectedTags tags={tags} maxTagCount={1} />);
    expect(root.textContent).toContain('北京');
    expect(root.textContent).not.toContain('上海');
    expect(root.textContent).toContain('+2');
  });
});
