// useForm + Form + Field：Standard Schema（zod）校验、何时显示错误、提交、重置、聚焦第一个出错的控件
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import * as z from 'zod';
import { TextField } from '../TextField';
import { mount } from '../../utils/.test/mount';
import { Field } from '../Field';
import { Form } from '../Form';
import { useForm } from '../useForm';

const schema = z.object({
  email: z.email('邮箱格式不对'),
  profile: z.object({ name: z.string().min(1, '请填写名字') }),
});

const flush = async () => {
  for (let i = 0; i < 5; i++) await nextTick();
};

describe('useForm', () => {
  it('issue 的路径点连接；失焦或提交过之后才显示错误', async () => {
    const form = useForm({ initial: { email: 'x', profile: { name: '' } }, schema });
    expect(await form.validate()).toBe(false);
    expect(form.errors).toEqual({ email: '邮箱格式不对', 'profile.name': '请填写名字' });
    expect(form.visibleError('email')).toBeUndefined();
    form.blur('email');
    await flush();
    expect(form.visibleError('email')).toBe('邮箱格式不对');
    expect(form.visibleError('profile.name')).toBeUndefined();
  });

  it('提交：校验不通过不调用 onSubmit；之后随输入实时更新；通过后 submitting 直到完成', async () => {
    let finish!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const form = useForm({ initial: { email: '', profile: { name: 'Ada' } }, schema, onSubmit });
    expect(await form.submit()).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.visibleError('email')).toBe('邮箱格式不对');

    form.values.email = 'ada@example.com';
    await flush();
    expect(form.errors).toEqual({});

    const submitted = form.submit();
    await flush();
    expect(form.submitting).toBe(true);
    finish();
    expect(await submitted).toBe(true);
    expect(form.submitting).toBe(false);
    expect(onSubmit).toHaveBeenCalledWith(form.values);
  });

  it('自定义 validate 与 schema 合并；setError 写入服务端错误；reset 回到初始值并清空', async () => {
    const form = useForm({
      initial: { email: 'ada@example.com', profile: { name: 'Ada' } },
      schema,
      validate: (values) => ({
        email: values.email.endsWith('@example.com') ? '不能用示例邮箱' : undefined,
      }),
    });
    expect(await form.validate()).toBe(false);
    expect(form.errors.email).toBe('不能用示例邮箱');
    form.setError('profile.name', '名字已被占用');
    expect(form.errors['profile.name']).toBe('名字已被占用');
    form.values.email = 'changed';
    form.reset();
    expect(form.values.email).toBe('ada@example.com');
    expect(form.errors).toEqual({});
  });
});

describe('Form + Field', () => {
  it('Field 按 name 显示表单的错误；提交不通过时焦点移到第一个出错的控件', async () => {
    const form = useForm({ initial: { email: '', profile: { name: '' } }, schema });
    const root = mount(() => (
      <Form controller={form}>
        <Field name="email" label="邮箱">
          <TextField value={_bind(form.values.email)} />
        </Field>
        <Field name="profile.name" label="名字">
          <TextField value={_bind(form.values.profile.name)} />
        </Field>
        <button type="submit">提交</button>
      </Form>
    ));
    expect(root.textContent).not.toContain('邮箱格式不对');
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    const [email] = root.querySelectorAll('input');
    expect(root.textContent).toContain('邮箱格式不对');
    expect(root.textContent).toContain('请填写名字');
    expect(email!.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(email);
  });

  it('焦点离开字段时报告失焦，显示这个字段的错误', async () => {
    const form = useForm({ initial: { email: 'x', profile: { name: '' } }, schema });
    const root = mount(() => (
      <Form controller={form}>
        <Field name="email" label="邮箱">
          <TextField value={_bind(form.values.email)} />
        </Field>
      </Form>
    ));
    const input = root.querySelector('input')!;
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await flush();
    expect(root.textContent).toContain('邮箱格式不对');
    expect(root.textContent).not.toContain('请填写名字');
  });
});
