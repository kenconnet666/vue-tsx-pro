// 表单的数据来源：meta 的 source 按名字取登记的选项（字典是列表、远程搜索是函数），control: 'people' / 'file' 用 PeoplePicker / Upload；
// createUi（这里用 Provider）登记一次，SchemaFields 的 sources 局部覆盖
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { z } from 'zod';
import { mount } from '../../utils/.test/mount';
import { Provider } from '../../config/Provider';
import { SchemaForm } from '../SchemaForm';
import { emptyValues, type FormSources } from '../schema-fields';
import { useForm } from '../useForm';
import type { PeopleSource } from '../../input/people';

const flush = async () => {
  for (let i = 0; i < 6; i++) await nextTick();
};

const schema = z.object({
  costCenter: z.string().optional().meta({ title: '成本中心', source: 'costCenters' }),
  supplier: z.string().optional().meta({ title: '供应商', source: 'suppliers' }),
  owner: z.array(z.unknown()).meta({ title: '经办人', control: 'people' }),
  files: z.array(z.unknown()).meta({ title: '附件', control: 'file' }),
});

const people: PeopleSource = { children: async () => [] };

function setup(global: FormSources, local?: FormSources) {
  return mount(() =>
    h(
      Provider,
      { formSources: global },
      {
        default: () =>
          h(
            defineComponent({
              setup() {
                const form = useForm({ schema, initial: emptyValues(schema) });
                return () => (
                  <SchemaForm controller={form} {...(local ? { sources: local } : {})} />
                );
              },
            }),
          ),
      },
    ),
  );
}

describe('表单的数据来源', () => {
  it('字典是列表、远程搜索是函数；人员与附件用对应的控件', async () => {
    const suppliers = vi.fn(async () => [{ value: 's1', label: '华东钢材' }]);
    const root = setup({
      options: { costCenters: [{ value: 'c1', label: '研发中心' }], suppliers },
      people,
    });
    await flush();
    const combos = [...root.querySelectorAll('[role="combobox"]')];
    expect(combos.length).toBeGreaterThanOrEqual(2);
    // 人员选择器：触发框打开选人的对话框
    expect(root.querySelector('[aria-haspopup="dialog"]')).not.toBeNull();
    expect(root.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('SchemaFields 的 sources 覆盖登记的同名来源', async () => {
    const root = setup(
      { options: { costCenters: [{ value: 'c1', label: '研发中心' }] }, people },
      { options: { costCenters: [{ value: 'c9', label: '本地中心' }] } },
    );
    await flush();
    const trigger = root.querySelectorAll('[role="combobox"]')[0] as HTMLElement;
    trigger.click();
    await flush();
    expect(document.body.textContent).toContain('本地中心');
    expect(document.body.textContent).not.toContain('研发中心');
  });

  it('人员控件没有登记 people 时报错，说清楚要在哪里给', () => {
    expect(() => setup({})).toThrow(/formSources/);
  });
});
