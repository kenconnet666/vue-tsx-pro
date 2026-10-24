// form.Field 自动绑定值（value、checked、写了值的照旧）与错误汇总（提交失败后列出、按字段顺序、点了跳到控件、改对就消失）
import { describe, expect, it } from 'vitest';
import { _component } from '@vue-tsx-pro/tsx';
import { defineComponent, h, nextTick } from 'vue';
import * as z from 'zod';
import { Switch } from '../../input/Switch';
import { TextField } from '../../input/TextField';
import { mount } from '../../utils/.test/mount';
import { Form } from '../Form';
import { FormErrorSummary } from '../FormErrorSummary';
import { useForm, type FormController } from '../useForm';

const flush = async () => {
  for (let i = 0; i < 5; i++) await nextTick();
};

interface Values {
  name: string;
  email: string;
  agree: boolean;
}

const schema = z.object({
  name: z.string().min(1, '请填写姓名'),
  email: z.email('邮箱格式不对'),
  agree: z.boolean().refine((value) => value, '请同意协议'),
});

function setup() {
  let form!: FormController<Values>;
  let explicit = '';
  const root = mount(() =>
    h(
      defineComponent({
        setup() {
          form = useForm({ initial: { name: '', email: 'x', agree: false }, schema });
          return () => (
            <Form controller={form}>
              <FormErrorSummary />
              <form.Field name="name" label="姓名">
                <TextField />
              </form.Field>
              <form.Field name="email" label="邮箱">
                <TextField
                  value={explicit || form.values.email}
                  {...{ 'onUpdate:value': (value: string) => (explicit = value) }}
                />
              </form.Field>
              <form.Field name="agree" label="同意协议">
                <Switch />
              </form.Field>
            </Form>
          );
        },
      }),
    ),
  );
  return { root, form: () => form };
}

describe('form.Field 自动绑定值', () => {
  it('只有一个控件、没写值时绑定 form.values：输入写回；Switch 写的是 checked', async () => {
    const { root, form } = setup();
    await flush();
    const [name] = root.querySelectorAll('input');
    name!.value = '林小满';
    name!.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    expect(form().values.name).toBe('林小满');
    form().values.name = '周一航';
    await flush();
    expect(name!.value).toBe('周一航');

    root.querySelector<HTMLElement>('[role="switch"]')!.click();
    await flush();
    expect(form().values.agree).toBe(true);
  });

  it('控件上自己写了值时不覆盖', async () => {
    const { root, form } = setup();
    await flush();
    const email = root.querySelectorAll('input')[1]!;
    email.value = 'a@b.cn';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    expect(form().values.email).toBe('x');
  });
});

describe('FormErrorSummary', () => {
  it('提交失败后列出显示着的错误（按字段顺序，带字段名），焦点在汇总上；点链接跳到控件；改对一项就少一项', async () => {
    const { root, form } = setup();
    await flush();
    expect(root.querySelector('[data-form-error-summary]')).toBeNull();
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    // 提交里的校验是异步的（zod 的 safeParseAsync）：等它跑完、焦点移好
    await new Promise((resolve) => setTimeout(resolve));
    await flush();
    const summary = root.querySelector<HTMLElement>('[data-form-error-summary]')!;
    expect(document.activeElement).toBe(summary);
    expect(summary.textContent).toContain('有 3 项需要修改');
    const links = [...summary.querySelectorAll('a')];
    expect(links.map((link) => link.textContent)).toEqual([
      '姓名：请填写姓名',
      '邮箱：邮箱格式不对',
      '同意协议：请同意协议',
    ]);
    links[0]!.click();
    expect(document.activeElement).toBe(root.querySelectorAll('input')[0]);

    form().values.name = '林小满';
    await flush();
    expect(summary.textContent).toContain('有 2 项需要修改');
  });
});
