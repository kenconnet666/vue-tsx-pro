// FilterBar：role="search" 的表单，回车与“查询”调用 onSearch；more 收起时不渲染，展开按钮带 aria-expanded 与已填几项
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { TextField } from '../../input/TextField';
import { mount } from '../../utils/.test/mount';
import { Field } from '../Field';
import { FilterBar } from '../FilterBar';

describe('FilterBar', () => {
  it('提交（回车、点查询）调用 onSearch；重置调用 onReset；条件的标签默认在起始边', () => {
    const onSearch = vi.fn();
    const onReset = vi.fn();
    const root = mount(() => (
      <FilterBar onSearch={onSearch} onReset={onReset}>
        <Field label="项目名称">
          <TextField />
        </Field>
      </FilterBar>
    ));
    const form = root.querySelector('form')!;
    expect(form.getAttribute('role')).toBe('search');
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(onSearch).toHaveBeenCalledOnce();
    const reset = [...root.querySelectorAll('button')].find((b) => b.textContent === '重置')!;
    reset.click();
    expect(onReset).toHaveBeenCalledOnce();
    expect(root.querySelector<HTMLElement>('[data-label-placement]')!.dataset.labelPlacement).toBe(
      'start',
    );
  });

  it('more 默认收起、不渲染；展开按钮显示收起的条件里填了几项，展开后关联到条件', async () => {
    const root = mount(() => (
      <FilterBar moreActive={2} more={<span class="extra">完成年度</span>}>
        <span>名称</span>
      </FilterBar>
    ));
    const toggle = root.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    expect(root.querySelector('.extra')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toContain('已设 2 项');
    toggle.click();
    await nextTick();
    expect(root.querySelector('.extra')).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).not.toBeNull();
    expect(toggle.textContent).toBe('收起');
  });
});
