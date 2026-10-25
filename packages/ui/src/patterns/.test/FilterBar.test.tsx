// FilterBar：role="search" 的表单，回车与“查询”调用 onSearch；more 收起时不渲染，展开按钮带 aria-expanded 与已填几项；
// 高级筛选：按钮展开条件构造器、收起时写摘要与“清除”、重置时条件清成 null
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { TextField } from '../../input/TextField';
import { mount } from '../../utils/.test/mount';
import { Field } from '../../form/Field';
import type { Condition, ConditionField } from '../../input/condition';
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

  it('高级筛选：按钮旁是比较的条数，展开后是条件构造器；收起时写成一句话、可清空；重置时清成 null', async () => {
    const fields: ConditionField[] = [{ name: 'amount', label: '金额', type: 'number' }];
    let condition = _state<Condition | null>({
      any: [
        { field: 'amount', op: 'gt', value: 5 },
        { field: 'amount', op: 'lt', value: 1 },
      ],
    });
    const onReset = vi.fn();
    const root = mount(() => (
      <FilterBar conditionFields={fields} _condition={condition} onReset={onReset} />
    ));
    const button = (text: string) =>
      [...root.querySelectorAll('button')].find((b) => b.textContent?.startsWith(text))!;
    const toggle = button('高级筛选');
    expect(toggle.textContent).toBe('高级筛选已设 2 项');
    expect(root.textContent).toContain('高级筛选：金额 大于 5，或 金额 小于 1');
    toggle.click();
    await nextTick();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const builder = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(builder.getAttribute('aria-label')).toBe('高级筛选');
    expect(builder.querySelectorAll('[data-condition-rule]')).toHaveLength(2);
    toggle.click();
    await nextTick();
    button('清空').click();
    await nextTick();
    expect(condition).toBeNull();
    condition = { all: [{ field: 'amount', op: 'exists' }] };
    await nextTick();
    button('重置').click();
    expect(condition).toBeNull();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
