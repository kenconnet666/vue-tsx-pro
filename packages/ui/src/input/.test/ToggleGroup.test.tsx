import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { toggleSelection } from '../../utils/data/selection';
import { ToggleGroup, ToggleItem } from '../ToggleGroup';

describe('toggleSelection', () => {
  it.each([
    [[], 'a', 'single', false, ['a']],
    [['a'], 'b', 'single', false, ['b']],
    [['a'], 'a', 'single', false, []],
    [['a'], 'a', 'single', true, ['a']],
    [['a'], 'b', 'multiple', false, ['a', 'b']],
    [['a', 'b'], 'a', 'multiple', false, ['b']],
    [['a'], 'a', 'multiple', true, ['a']],
  ] as const)('%j 点 %s（%s，required=%s）→ %j', (selected, key, mode, required, expected) => {
    expect(toggleSelection(selected, key, { mode, required })).toEqual(expected);
  });
});

describe('ToggleGroup', () => {
  it('单选：role="group"，aria-pressed 表示选中，点击写回；required 时不能取消', async () => {
    let view = _state<string | undefined>('list');
    const root = mount(() => (
      <ToggleGroup value={_bind(view)} required aria-label="视图">
        <ToggleItem value="list">列表</ToggleItem>
        <ToggleItem value="grid">网格</ToggleItem>
      </ToggleGroup>
    ));
    await nextTick();
    const group = root.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).toBe('视图');
    const [list, grid] = group.querySelectorAll('button');
    expect([list!.getAttribute('aria-pressed'), grid!.getAttribute('aria-pressed')]).toEqual([
      'true',
      'false',
    ]);
    grid!.click();
    expect(view).toBe('grid');
    grid!.click();
    expect(view).toBe('grid');
    await nextTick();
    expect(grid!.dataset.state).toBe('on');
    // 整组一个 Tab 进入点：当前选中项
    expect([list!.tabIndex, grid!.tabIndex]).toEqual([-1, 0]);
  });

  it('多选：每项独立切换；整组不可用时都不能点', async () => {
    let marks = _state<string[]>([]);
    let disabled = _state(false);
    const root = mount(() => (
      <ToggleGroup type="multiple" value={_bind(marks)} disabled={disabled} aria-label="格式">
        <ToggleItem value="bold" aria-label="加粗" />
        <ToggleItem value="italic" aria-label="斜体" />
      </ToggleGroup>
    ));
    const [bold, italic] = root.querySelectorAll('button');
    bold!.click();
    italic!.click();
    expect(marks).toEqual(['bold', 'italic']);
    bold!.click();
    expect(marks).toEqual(['italic']);
    disabled = true;
    await nextTick();
    expect(bold!.disabled).toBe(true);
  });
});
