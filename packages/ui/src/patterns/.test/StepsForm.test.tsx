// StepsForm：“下一步”只校验这一步的字段、通过才走，换步后焦点到内容上；上一步；提交没通过时跳到第一个有错的步骤并标成出错
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import * as z from 'zod';
import { TextField } from '../../input/TextField';
import { useForm, type FormController } from '../../form/useForm';
import { mount } from '../../utils/.test/mount';
import { StepsForm } from '../StepsForm';

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve));
  for (let i = 0; i < 5; i++) await nextTick();
};

interface Values {
  company: string;
  password: string;
}

function setup(onSubmit = vi.fn()) {
  let form!: FormController<Values>;
  let step = 0;
  const root = mount(() =>
    h(
      defineComponent({
        setup() {
          form = useForm({
            initial: { company: '', password: '' },
            schema: z.object({
              company: z.string().min(2, '至少 2 个字'),
              password: z.string().min(8, '至少 8 位'),
            }),
            onSubmit,
          });
          let current = _state(0);
          return () => (
            <StepsForm
              form={form}
              current={_bind(
                () => current,
                (next: number) => {
                  current = next;
                  step = next;
                },
              )}
              steps={[
                {
                  title: '企业信息',
                  fields: ['company'],
                  content: () => (
                    <form.Field name="company" label="企业名称">
                      <TextField />
                    </form.Field>
                  ),
                },
                {
                  title: '账号',
                  fields: ['password'],
                  content: () => (
                    <form.Field name="password" label="密码">
                      <TextField type="password" />
                    </form.Field>
                  ),
                },
              ]}
            />
          );
        },
      }),
    ),
  );
  const button = (text: string) =>
    [...root.querySelectorAll('button')].find((item) => item.textContent === text)!;
  return { root, form: () => form, step: () => step, button };
}

describe('StepsForm', () => {
  it('下一步只校验这一步：没通过留在原地并显示错误；通过后到下一步、焦点在内容上；上一步回来', async () => {
    const { root, form, step, button } = setup();
    await flush();
    button('下一步').click();
    await flush();
    expect(step()).toBe(0);
    expect(root.textContent).toContain('至少 2 个字');
    // 第二步的字段不受影响
    expect(form().visibleError('password')).toBeUndefined();

    form().values.company = '华辰精密';
    button('下一步').click();
    await flush();
    expect(step()).toBe(1);
    const panel = root.querySelector('[role="group"]')!;
    expect(document.activeElement).toBe(panel);
    expect(panel.getAttribute('aria-label')).toBe('第 2 步，共 2 步');
    expect(button('提交').type).toBe('submit');

    button('上一步').click();
    await flush();
    expect(step()).toBe(0);
  });

  it('提交没通过：跳到第一个有错的步骤，步骤条上标成出错；都通过才调用 onSubmit', async () => {
    const onSubmit = vi.fn();
    const { root, form, step, button } = setup(onSubmit);
    await flush();
    form().values.company = '华辰精密';
    button('下一步').click();
    await flush();
    // 第二步时把第一步的值改坏（如服务端退回后），再提交
    form().values.company = '华';
    form().values.password = '12345678';
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(step()).toBe(0);
    expect(root.querySelector('ol li')!.textContent).toContain('出错');

    form().values.company = '华辰精密';
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(onSubmit).toHaveBeenCalledWith({ company: '华辰精密', password: '12345678' });
  });
});
