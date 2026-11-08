// SchemaView：按 schema 只读地显示值——选项显示文字、开关显示是否、人员与附件显示名字、对象展开、明细表带合计；
// access 与 visibleWhen 不显示的不列，分组各一块
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { z } from 'zod';
import { mount } from '../../utils/.test/mount';
import { SchemaView } from '../SchemaView';
import type { FieldAccessMap } from '../useForm';

const schema = z.object({
  title: z.string().meta({ title: '标题' }),
  kind: z.enum(['travel', 'meal']).meta({
    title: '类型',
    options: { travel: '差旅', meal: '招待' },
  }),
  center: z.string().meta({ title: '成本中心', source: 'centers' }),
  urgent: z.boolean().meta({ title: '加急', control: 'switch' }),
  days: z.number().meta({ title: '天数', unit: '天' }),
  memo: z.string().optional().meta({ title: '备注' }),
  guests: z
    .string()
    .optional()
    .meta({ title: '宾客', visibleWhen: { field: 'kind', op: 'eq', value: 'meal' } }),
  owner: z.array(z.unknown()).meta({ title: '经办人', control: 'people' }),
  files: z.array(z.unknown()).meta({ title: '附件', control: 'file', group: '附件' }),
  address: z.object({ city: z.string().meta({ title: '城市' }) }).meta({ title: '地址' }),
  lines: z
    .array(
      z.object({
        item: z.string().meta({ title: '项目' }),
        cost: z.number().meta({ title: '金额', total: 'sum' }),
      }),
    )
    .meta({ title: '明细', control: 'table' }),
});
type Values = z.input<typeof schema>;

const values: Values = {
  title: '出差',
  kind: 'travel',
  center: 'rd',
  urgent: true,
  days: 3,
  guests: '张三',
  owner: [{ id: 'u1', type: 'user', name: '李四' }],
  files: [{ name: '发票.pdf', url: '/files/1' }],
  address: { city: '上海' },
  lines: [
    { item: '高铁', cost: 0.1 },
    { item: '酒店', cost: 0.2 },
  ],
};

async function setup(access?: FieldAccessMap) {
  const root = mount(() =>
    h(SchemaView, {
      schema,
      values,
      sources: { options: { centers: [{ value: 'rd', label: '研发中心' }] } },
      ...(access ? { access } : {}),
    }),
  );
  await nextTick();
  return root;
}

/** 标签 → 值的文字 */
function pairs(root: Element) {
  const labels = [...root.querySelectorAll('dt')].map((dt) => dt.textContent?.trim() ?? '');
  const texts = [...root.querySelectorAll('dd')].map((dd) => dd.textContent?.trim() ?? '');
  return Object.fromEntries(labels.map((label, i) => [label, texts[i]]));
}

describe('SchemaView', () => {
  it('选项、开关、单位、人员、附件、对象显示成能读的文字；没有值显示占位', async () => {
    const root = await setup();
    expect(pairs(root)).toMatchObject({
      标题: '出差',
      类型: '差旅',
      成本中心: '研发中心',
      加急: '是',
      天数: '3 天',
      备注: '—',
      经办人: '李四',
      '地址 · 城市': '上海',
    });
    // 附件是新窗口打开的链接（文字后面跟着给读屏的提示）
    expect(root.querySelector('a[href="/files/1"]')?.textContent).toMatch(/^发票\.pdf/);
  });

  it('明细表排成表格，写了 total 的列有精确合计', async () => {
    const root = await setup();
    const foot = [...root.querySelectorAll('tfoot td')].map((td) => td.textContent?.trim());
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(foot).toEqual(['合计', '0.3']);
  });

  it('visibleWhen 不满足的、access 隐藏的不列；分组各一块', async () => {
    const root = await setup({ days: 'hidden' });
    const labels = Object.keys(pairs(root));
    expect(labels).not.toContain('宾客');
    expect(labels).not.toContain('天数');
    expect(root.textContent).toContain('附件');
    expect(root.querySelectorAll('dl').length).toBeGreaterThanOrEqual(2);
  });
});
