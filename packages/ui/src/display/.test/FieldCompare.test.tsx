// FieldCompare：表格列出全部字段并标出改了的、列表只列改了的（del → ins）、变化量按好坏着色、没有改动时的提示
import { describe, expect, it } from 'vitest';
import { createStatusMap } from '../../utils/data/status';
import { mount } from '../../utils/.test/mount';
import { FieldCompare, type CompareField } from '../FieldCompare';

interface Quote {
  price: number;
  quantity: number;
  supplier: string;
  status: string;
}

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  approved: { label: '已批准', tone: 'success' },
});

const fields: CompareField<Quote>[] = [
  { key: 'price', header: '单价', type: 'currency', better: 'lower' },
  { key: 'quantity', header: '数量', better: 'higher' },
  { key: 'supplier', header: '供应商' },
  { key: 'status', header: '状态', statuses },
];

const before: Quote = { price: 1200, quantity: 10, supplier: '华辰', status: 'draft' };
const after: Quote = { price: 1350, quantity: 8, supplier: '华辰', status: 'approved' };

describe('FieldCompare', () => {
  it('表格：字段、原值、新值、变化四列；全部字段都列出，改了的行带 data-changed', () => {
    const root = mount(() => <FieldCompare fields={fields} before={before} after={after} />);
    const headers = [...root.querySelectorAll('th')].map((cell) => cell.textContent);
    expect(headers).toEqual(['字段', '原值', '新值', '变化']);
    const rows = [...root.querySelectorAll('tbody tr')];
    expect(rows.map((row) => row.hasAttribute('data-changed'))).toEqual([true, true, false, true]);
    const price = [...rows[0]!.querySelectorAll('td')].map((cell) => cell.textContent);
    expect(price).toEqual(['单价', '¥1,200.00', '¥1,350.00', '+¥150.00（+12.5%）']);
    expect(rows[3]!.textContent).toContain('已批准');
  });

  it('变化量按 better 着色：越低越好的涨了是 danger，越高越好的降了也是 danger', () => {
    const root = mount(() => <FieldCompare fields={fields} before={before} after={after} />);
    const changes = [...root.querySelectorAll('tbody tr')].map(
      (row) => row.querySelectorAll('td')[3]!.firstElementChild?.className ?? '',
    );
    expect(changes[0]).toBe(changes[1]);
    expect(changes[0]).not.toBe('');
  });

  it('列表：只列改了的；原值是 del、新值是 ins，中间有给读屏的“改为”', () => {
    const root = mount(() => (
      <FieldCompare fields={fields} before={before} after={after} layout="list" />
    ));
    const labels = [...root.querySelectorAll('dt')].map((cell) => cell.textContent);
    expect(labels).toEqual(['单价', '数量', '状态']);
    const quantity = root.querySelectorAll('dd')[1]!;
    expect(quantity.querySelector('del')!.textContent).toBe('10');
    expect(quantity.querySelector('ins')!.textContent).toBe('8');
    expect(quantity.textContent).toBe('10改为8-2（-20%）');
  });

  it('onlyChanged 可以改默认；没有原记录（新建）时列表只有新值', () => {
    const table = mount(() => (
      <FieldCompare fields={fields} before={before} after={after} onlyChanged />
    ));
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3);

    const created = mount(() => (
      <FieldCompare fields={fields} before={null} after={after} layout="list" />
    ));
    expect(created.querySelectorAll('dt')).toHaveLength(4);
    expect(created.querySelector('del')).toBeNull();
  });

  it('没有改动时显示“没有改动”；不是数值的改动不出“变化”一列', () => {
    const same = mount(() => (
      <FieldCompare fields={fields} before={before} after={{ ...before }} layout="list" />
    ));
    expect(same.textContent).toBe('没有改动');

    const text = mount(() => (
      <FieldCompare fields={fields} before={before} after={{ ...before, supplier: '恒远' }} />
    ));
    expect([...text.querySelectorAll('th')].map((cell) => cell.textContent)).toEqual([
      '字段',
      '原值',
      '新值',
    ]);
  });
});
