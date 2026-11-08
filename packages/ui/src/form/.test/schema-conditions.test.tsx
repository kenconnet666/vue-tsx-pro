// 字段的条件与权限：visibleWhen、requiredWhen、readonlyWhen 写在 meta 里，useForm 的 access 按字段路径给权限；
// 不显示的不渲染、不校验，条件必填的空着报“必填”，只读的控件只读，明细表的列没写权限时跟着明细表
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { z } from 'zod';
import { mount } from '../../utils/.test/mount';
import { SchemaForm } from '../SchemaForm';
import { emptyValues } from '../schema-fields';
import { useForm, type FieldAccessMap, type FormController } from '../useForm';

const flush = async () => {
  for (let i = 0; i < 6; i++) await nextTick();
};

const schema = z.object({
  kind: z.enum(['goods', 'service']).meta({ title: '类型' }),
  // 只有“货物”才问数量；数量超过 100 时要写理由
  quantity: z
    .number()
    .optional()
    .meta({
      title: '数量',
      visibleWhen: { field: 'kind', op: 'eq', value: 'goods' },
    }),
  reason: z
    .string()
    .optional()
    .meta({
      title: '理由',
      requiredWhen: { field: 'quantity', op: 'gt', value: 100 },
    }),
  code: z
    .string()
    .optional()
    .meta({ title: '编号', readonlyWhen: { field: 'kind', op: 'eq', value: 'service' } }),
  lines: z
    .array(z.object({ name: z.string().optional().meta({ title: '品名' }) }))
    .meta({ title: '明细' }),
});
type Values = z.input<typeof schema>;

function setup(access?: FieldAccessMap) {
  let form!: FormController<Values>;
  const root = mount(() =>
    h(
      defineComponent({
        setup() {
          form = useForm({
            schema,
            initial: { ...emptyValues(schema), kind: 'goods', lines: [{ name: '' }] },
            ...(access ? { access } : {}),
          });
          return () => <SchemaForm controller={form} />;
        },
      }),
    ),
  );
  return { root, form: () => form };
}

const labels = (root: Element) =>
  [...root.querySelectorAll('label[id$="-label"]')].map((label) =>
    label.textContent?.replace('*', '').trim(),
  );

describe('字段的条件与权限', () => {
  it('显示条件不成立时不渲染、不校验；成立时出现', async () => {
    const { root, form } = setup();
    await flush();
    expect(labels(root)).toContain('数量');
    form().setValue('kind', 'service');
    await flush();
    expect(labels(root)).not.toContain('数量');
    expect(form().fieldState('quantity').visible).toBe(false);
  });

  it('必填条件成立时空着报“必填”，不成立时不报', async () => {
    const { form } = setup();
    form().setValue('quantity', 5);
    await form().validate();
    expect(form().errors.reason).toBeUndefined();
    form().setValue('quantity', 500);
    await form().validate();
    expect(form().errors.reason).toBe('必填');
    expect(form().fieldState('reason').required).toBe(true);
  });

  it('只读条件成立时控件只读', async () => {
    const { root, form } = setup();
    form().setValue('kind', 'service');
    await flush();
    expect(form().fieldState('code').readonly).toBe(true);
    expect(root.querySelectorAll('input[readonly]')).toHaveLength(1);
  });

  it('权限：hidden 不显示，required 必填，readonly 只读；明细表的列没写时跟着明细表，只读的明细表不能增删行', async () => {
    const { root, form } = setup({ code: 'hidden', reason: 'required', lines: 'readonly' });
    await flush();
    expect(labels(root)).not.toContain('编号');
    await form().validate();
    expect(form().errors.reason).toBe('必填');
    expect(form().fieldState('lines.0.name').readonly).toBe(true);
    expect(root.textContent).not.toContain('添加明细');
  });
});
