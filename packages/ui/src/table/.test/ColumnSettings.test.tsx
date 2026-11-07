// ColumnSettings：按当前顺序列出全部列，勾掉的写进 _hidden；只剩一列可见时不能再隐藏；“重置”清空隐藏与顺序
// （拖动排序见 Sortable 的测试；弹出层 lazy={false} 直接看内容）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import type { DataTableColumn } from '../columns';
import { ColumnSettings } from '../ColumnSettings';

interface Order {
  id: string;
  customer: string;
  amount: number;
}
const columns: DataTableColumn<Order>[] = [
  { key: 'id', header: '单号' },
  { key: 'customer', header: '客户' },
  { key: 'amount', header: '金额' },
];

describe('ColumnSettings', () => {
  it('按顺序列出，勾掉写回 _hidden；最后一列不能隐藏；重置清空', async () => {
    let hidden = _state<string[]>([]);
    let order = _state<string[]>(['amount', 'id', 'customer']);
    mount(() => (
      <ColumnSettings
        columns={columns}
        _hidden={hidden}
        _order={order}
        propsPanel={{ lazy: false }}
      />
    ));
    // 弹出层的面板在挂载后的下一拍才渲染
    await nextTick();
    const boxes = () => [...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    const labels = () => boxes().map((box) => box.closest('label')?.textContent);
    expect(labels()).toEqual(['金额', '单号', '客户']);

    boxes()[0]!.click();
    boxes()[1]!.click();
    await nextTick();
    expect(hidden).toEqual(['amount', 'id']);
    // 只剩“客户”可见：它的勾选框不可用
    expect(boxes().map((box) => box.disabled)).toEqual([false, false, true]);

    const reset = [...document.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('重置'),
    )!;
    reset.click();
    await nextTick();
    expect([hidden, order]).toEqual([[], []]);
    expect(labels()).toEqual(['单号', '客户', '金额']);
  });
});
