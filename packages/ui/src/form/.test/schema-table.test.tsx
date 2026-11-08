// 明细表（control: 'table'）：表头是列标签，一行一条、能增删行；写了 total 的列在表底精确合计；只读时不能增删行，整列不显示时不出这一列
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { z } from 'zod';
import { mount } from '../../utils/.test/mount';
import { SchemaForm } from '../SchemaForm';
import { useForm, type FieldAccessMap, type FormController } from '../useForm';

const flush = async () => {
  for (let i = 0; i < 6; i++) await nextTick();
};

const schema = z.object({
  lines: z
    .array(
      z.object({
        item: z.string().meta({ title: '项目' }),
        cost: z.number().meta({ title: '金额', total: 'sum' }),
        memo: z.string().optional().meta({ title: '备注' }),
      }),
    )
    .meta({ title: '明细', control: 'table' }),
});
type Values = z.input<typeof schema>;

function setup(lines: Values['lines'], access?: FieldAccessMap) {
  let form!: FormController<Values>;
  const root = mount(() =>
    h(
      defineComponent({
        setup() {
          form = useForm({ schema, initial: { lines }, ...(access ? { access } : {}) });
          return () => <SchemaForm controller={form} />;
        },
      }),
    ),
  );
  return { root, form: () => form };
}

const headers = (root: Element) =>
  [...root.querySelectorAll('thead th')].map((th) => th.textContent?.trim());
const total = (root: Element) =>
  [...root.querySelectorAll('tfoot td')].map((td) => td.textContent?.trim());

describe('明细表', () => {
  it('表头是列标签，一行一条；金额列在表底精确合计', async () => {
    const { root } = setup([
      { item: '高铁', cost: 0.1 },
      { item: '酒店', cost: 0.2 },
      { item: '退票', cost: -1000 },
    ]);
    await flush();
    expect(headers(root)).toEqual(['项目', '金额', '备注', '操作']);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(total(root)).toEqual(['合计', '-999.7', '', '']);
  });

  it('添加、删除行，合计跟着变；没有行时显示暂无数据', async () => {
    const { root, form } = setup([{ item: '高铁', cost: 553 }]);
    await flush();
    const add = [...root.querySelectorAll('button')].find((b) => b.textContent === '添加明细')!;
    add.click();
    await flush();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    form().setValue('lines.1.cost', 1200);
    await flush();
    expect(total(root)[1]).toBe('1,753');
    (root.querySelector('button[aria-label="删除第 1 个明细"]') as HTMLButtonElement).click();
    (root.querySelector('button[aria-label="删除第 1 个明细"]') as HTMLButtonElement).click();
    await flush();
    expect(root.querySelector('tbody')?.textContent).toBe('暂无数据');
  });

  it('只读时不能增删行；整列不显示时不出这一列', async () => {
    const { root } = setup([{ item: '高铁', cost: 553 }], {
      lines: 'readonly',
      'lines.memo': 'hidden',
    });
    await flush();
    expect(headers(root)).toEqual(['项目', '金额']);
    expect(root.textContent).not.toContain('添加明细');
    expect(root.querySelectorAll('tbody input[readonly]').length).toBeGreaterThan(0);
  });
});
