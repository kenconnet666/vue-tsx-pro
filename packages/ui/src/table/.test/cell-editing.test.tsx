// DataTable 的单元格导航与编辑：有可编辑的列时是 role="grid"、方向键在格之间走；Enter 开始编辑、Enter 提交、Esc 放弃、
// Tab 提交并到下一个可编辑的格、直接打字替换原值；列的 validate 与 onCellChange 返回的原因不提交并显示；validateRow 标在格上
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import type { DataTableColumn } from '../columns';
import { DataTable } from '../DataTable';

const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { get: () => 400 });
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
});

interface Line {
  id: string;
  part: string;
  quantity: number;
  start: string;
  end: string;
}

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};
const key = (element: Element, name: string, init: KeyboardEventInit = {}) =>
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }),
  );

function setup(
  options: { onCellChange?: (row: Line, key: string, value: unknown) => unknown } = {},
) {
  let lines = _state<Line[]>([
    { id: 'a', part: '支架', quantity: 10, start: '2026-10-01', end: '2026-10-20' },
    { id: 'b', part: '底座', quantity: 4, start: '2026-10-10', end: '2026-10-05' },
  ]);
  const columns: DataTableColumn<Line>[] = [
    { key: 'id', header: '编号' },
    { key: 'part', header: '零件', editable: true },
    {
      key: 'quantity',
      header: '数量',
      type: 'number',
      editable: true,
      validate: (value) => (typeof value === 'number' && value > 0 ? null : '数量要大于 0'),
    },
    { key: 'end', header: '交期', editable: true },
  ];
  const onCellChange = vi.fn(
    options.onCellChange ??
      ((row: Line, field: string, value: unknown) => {
        lines = lines.map((line) => (line === row ? { ...line, [field]: value } : line));
      }),
  );
  const root = mount(() => (
    <DataTable
      rows={lines}
      columns={columns}
      getKey={(line) => line.id}
      onCellChange={onCellChange}
      validateRow={(line) => (line.end < line.start ? { end: '交期早于开工' } : null)}
      aria-label="明细"
    />
  ));
  const cell = (row: string, column: string) =>
    root.querySelector<HTMLElement>(`tr[data-key="${row}"] td[data-column="${column}"]`)!;
  return { root, cell, onCellChange, lines: () => lines };
}

describe('DataTable 的单元格编辑', () => {
  it('有可编辑的列：role="grid"，只有一格能 Tab 进入，方向键在格之间走；validateRow 的错误标在格上', async () => {
    const { root, cell } = setup();
    await flush();
    expect(root.querySelector('table')!.getAttribute('role')).toBe('grid');
    expect(root.querySelectorAll('td[tabindex="0"]')).toHaveLength(1);
    cell('a', 'id').focus();
    key(cell('a', 'id'), 'ArrowRight');
    expect(document.activeElement).toBe(cell('a', 'part'));
    key(cell('a', 'part'), 'ArrowDown');
    expect(document.activeElement).toBe(cell('b', 'part'));
    expect(cell('b', 'end').getAttribute('aria-invalid')).toBe('true');
    expect(cell('b', 'end').getAttribute('title')).toBe('交期早于开工');
    expect(cell('a', 'end').hasAttribute('aria-invalid')).toBe(false);
  });

  it('Enter 开始编辑、Enter 提交写回、焦点回到格上；Esc 放弃', async () => {
    const { cell, onCellChange, lines } = setup();
    await flush();
    cell('a', 'part').focus();
    key(cell('a', 'part'), 'Enter');
    await flush();
    const input = cell('a', 'part').querySelector('input')!;
    expect(input.value).toBe('支架');
    // 开始编辑后焦点在编辑器里
    expect(document.activeElement).toBe(input);
    input.value = '加强支架';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    key(input, 'Enter');
    await flush();
    expect(onCellChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a' }),
      'part',
      '加强支架',
    );
    expect(lines()[0]!.part).toBe('加强支架');
    expect(cell('a', 'part').querySelector('input')).toBeNull();
    expect(document.activeElement).toBe(cell('a', 'part'));

    key(cell('a', 'part'), 'F2');
    await flush();
    key(cell('a', 'part').querySelector('input')!, 'Escape');
    await flush();
    expect(cell('a', 'part').querySelector('input')).toBeNull();
    expect(onCellChange).toHaveBeenCalledTimes(1);
  });

  it('直接打字替换原值；列的 validate 不通过时不提交并显示原因；Tab 提交并到下一个可编辑的格', async () => {
    const { cell, onCellChange } = setup();
    await flush();
    cell('a', 'quantity').focus();
    key(cell('a', 'quantity'), '0');
    await flush();
    const input = cell('a', 'quantity').querySelector('input')!;
    key(input, 'Enter');
    await flush();
    expect(onCellChange).not.toHaveBeenCalled();
    expect(cell('a', 'quantity').querySelector('[role="alert"]')!.textContent).toBe('数量要大于 0');

    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    key(input, 'Tab');
    await flush();
    expect(onCellChange).toHaveBeenCalledWith(expect.anything(), 'quantity', 12);
    // 下一个可编辑的是交期：直接进入编辑
    expect(cell('a', 'end').querySelector('input')).not.toBeNull();
  });

  it('onCellChange 返回原因：编辑器留着并显示它', async () => {
    const { cell } = setup({ onCellChange: () => '这个零件已经下单，不能改名' });
    await flush();
    cell('a', 'part').focus();
    key(cell('a', 'part'), 'Enter');
    await flush();
    key(cell('a', 'part').querySelector('input')!, 'Enter');
    await flush();
    expect(cell('a', 'part').querySelector('input')).not.toBeNull();
    expect(cell('a', 'part').querySelector('[role="alert"]')!.textContent).toBe(
      '这个零件已经下单，不能改名',
    );
  });
});
