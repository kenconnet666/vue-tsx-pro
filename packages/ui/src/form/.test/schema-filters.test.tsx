// 查询栏的条件按 schema 生成：一组 Field 读写传进来的对象；高级筛选的字段与它同一份描述
import { describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue';
import { z } from 'zod';
import { mount } from '../../utils/.test/mount';
import { schemaFilters } from '../SchemaForm';
import { emptyValues, schemaConditionFields } from '../schema-fields';

const filters = z.object({
  keyword: z.string().meta({ title: '关键字', placeholder: '单号或供应商' }),
  status: z
    .enum(['draft', 'ordered'])
    .nullable()
    .meta({ title: '状态', options: { draft: '草稿', ordered: '已下单' } }),
  urgent: z.boolean().meta({ title: '只看加急', control: 'checkbox' }),
  amount: z.number().optional().meta({ title: '金额' }),
  address: z.object({ city: z.string() }),
});

describe('schemaFilters', () => {
  it('按 pick 的顺序给出 Field，值读写传进来的对象；文字可以清空；嵌套对象不生成', async () => {
    const values = reactive(emptyValues(filters));
    const root = mount(() => <div>{schemaFilters(filters, values, { omit: ['amount'] })}</div>);
    await nextTick();
    const input = root.querySelector<HTMLInputElement>('input[type="text"]')!;
    expect(input.placeholder).toBe('单号或供应商');
    input.value = 'PO-1031';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(values.keyword).toBe('PO-1031');
    expect(root.textContent).toContain('只看加急');
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.click();
    await nextTick();
    expect(values.urgent).toBe(true);
    expect(root.querySelectorAll('[role="combobox"]')).toHaveLength(1);
    expect(root.textContent).not.toContain('address');
  });

  it('fields 换掉某个条件的控件', () => {
    const values = reactive(emptyValues(filters));
    const root = mount(() => (
      <div>
        {schemaFilters(filters, values, {
          pick: ['status'],
          fields: { status: () => <output data-custom /> },
        })}
      </div>
    ));
    expect(root.querySelector('[data-custom]')).not.toBeNull();
    expect(root.textContent).toContain('状态');
  });
});

describe('schemaConditionFields', () => {
  it('标签、类型、可选值来自同一份描述；嵌套对象不能当条件', () => {
    expect(schemaConditionFields(filters, { omit: ['keyword'] })).toEqual([
      {
        name: 'status',
        label: '状态',
        type: 'select',
        options: [
          { value: 'draft', label: '草稿' },
          { value: 'ordered', label: '已下单' },
        ],
      },
      { name: 'urgent', label: '只看加急', type: 'boolean' },
      { name: 'amount', label: '金额', type: 'number' },
    ]);
  });
});
