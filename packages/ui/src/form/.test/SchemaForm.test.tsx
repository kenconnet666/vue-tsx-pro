// 按 schema 生成表单：标签与控件、分组、换掉控件、pick / omit、列表的增删、提交
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { z } from 'zod';
import { mount } from '../../utils/.test/mount';
import { Form } from '../Form';
import { SchemaFields, SchemaForm } from '../SchemaForm';
import { emptyValues } from '../schema-fields';
import { useForm, type FormController } from '../useForm';

const flush = async () => {
  for (let i = 0; i < 6; i++) await nextTick();
};

const schema = z.object({
  company: z.string().min(2, '请填写公司全称').meta({ title: '公司全称' }),
  category: z.enum(['machined', 'plastic']).meta({ title: '品类' }),
  days: z.number().int().optional().meta({ title: '天数', unit: '天' }),
  agreed: z.boolean().meta({ title: '同意' }),
  city: z.string().meta({ title: '城市', group: '地址' }),
  contacts: z
    .array(z.object({ name: z.string().min(1).meta({ title: '姓名' }) }))
    .meta({ title: '联系人' }),
});
type Values = z.input<typeof schema>;

function setup(render: (form: FormController<Values>) => unknown, onSubmit = vi.fn()) {
  let form!: FormController<Values>;
  const root = mount(() =>
    h(
      defineComponent({
        setup() {
          form = useForm({ schema, initial: emptyValues(schema), onSubmit });
          return () => render(form);
        },
      }),
    ),
  );
  return { root, form: () => form, onSubmit };
}

/** 字段的标签（输入框结束边的单位也是 label，不算） */
const labels = (root: Element) =>
  [...root.querySelectorAll('label[id$="-label"]')].map((label) =>
    label.textContent?.replace('*', '').trim(),
  );

describe('SchemaForm', () => {
  it('按 schema 生成标签与控件：文字、下拉、带单位的数字、开关；分组是带标题的一组；最后是重置与提交', async () => {
    const { root } = setup((form) => <SchemaForm controller={form} />);
    await flush();
    expect(labels(root)).toEqual(
      expect.arrayContaining(['公司全称', '品类', '天数', '同意', '城市']),
    );
    expect(root.querySelector('input[type="text"]')).not.toBeNull();
    expect(root.querySelector('[role="combobox"]')).not.toBeNull();
    expect(root.querySelector('[role="switch"]')).not.toBeNull();
    expect(root.textContent).toContain('天');
    expect([...root.querySelectorAll('h2, h3, h4')].map((heading) => heading.textContent)).toEqual(
      expect.arrayContaining(['地址', '联系人']),
    );
    const buttons = [...root.querySelectorAll('button')].map((button) => button.textContent);
    expect(buttons).toEqual(expect.arrayContaining(['重置', '提交', '添加联系人']));
  });

  it('列表：添加一行出现这一行的字段与删除按钮，删掉后没有了', async () => {
    const { root, form } = setup((form) => <SchemaForm controller={form} />);
    await flush();
    const add = [...root.querySelectorAll('button')].find((b) => b.textContent === '添加联系人')!;
    add.click();
    add.click();
    await flush();
    expect(form().values.contacts).toEqual([{ name: '' }, { name: '' }]);
    expect(labels(root).filter((label) => label === '姓名')).toHaveLength(2);
    root.querySelector<HTMLButtonElement>('button[aria-label="删除第 1 个联系人"]')!.click();
    await flush();
    expect(form().values.contacts).toHaveLength(1);
  });

  it('fields 换掉控件（仍然自动绑定），pick 只生成这几个并按它的顺序', async () => {
    const { root } = setup((form) => (
      <Form controller={form}>
        <SchemaFields
          controller={form}
          pick={['category', 'company']}
          fields={{ category: () => <input data-custom="category" /> }}
        />
      </Form>
    ));
    await flush();
    expect(labels(root)).toEqual(['品类', '公司全称']);
    expect(root.querySelector('[data-custom="category"]')).not.toBeNull();
  });

  it('omit 不生成这几个', async () => {
    const { root } = setup((form) => (
      <Form controller={form}>
        <SchemaFields controller={form} omit={['contacts', 'city', 'agreed']} />
      </Form>
    ));
    await flush();
    expect(labels(root)).toEqual(['公司全称', '品类', '天数']);
  });

  it('提交：没通过时不调用 onSubmit；填好后拿到解析后的值', async () => {
    const { root, form, onSubmit } = setup((form) => <SchemaForm controller={form} />);
    await flush();
    root.querySelector('form')!.requestSubmit();
    await flush();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(root.textContent).toContain('请填写公司全称');
    Object.assign(form().values, { company: '华东精密', category: 'plastic', city: '苏州' });
    root.querySelector('form')!.requestSubmit();
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ company: '华东精密', category: 'plastic' });
  });
});
