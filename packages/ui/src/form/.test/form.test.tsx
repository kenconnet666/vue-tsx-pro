// useForm + Form + Field：zod 校验、何时显示错误、提交、重置、聚焦第一个出错的控件、schema 推出的字段约束
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import * as z from 'zod';
import { Checkbox } from '../../input/Checkbox';
import { NumberField } from '../../input/NumberField';
import { TextField } from '../../input/TextField';
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

  it('焦点离开字段时报告失焦，显示这个字段的错误；form.Field 就是 Field（name 带类型）', async () => {
    const form = useForm({ initial: { email: 'x', profile: { name: '' } }, schema });
    const root = mount(() => (
      <Form controller={form}>
        <form.Field name="email" label="邮箱">
          <TextField value={_bind(form.values.email)} />
        </form.Field>
      </Form>
    ));
    expect(form.Field).toBe(Field);
    const input = root.querySelector('input')!;
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await flush();
    expect(root.textContent).toContain('邮箱格式不对');
    expect(root.textContent).not.toContain('请填写名字');
  });

  it('schema 推出约束：必填标记、输入框的 type 与 maxlength、NumberField 的范围；onSubmit 拿到解析后的值', async () => {
    const onSubmit = vi.fn();
    const form = useForm({
      schema: z.object({
        email: z.email('邮箱格式不对'),
        nickname: z.string().max(12),
        count: z.number().int().min(1).max(9),
        age: z.coerce.number().int().min(18),
      }),
      initial: { email: 'ada@lovelace.dev', nickname: '', count: 1, age: '20' },
      onSubmit,
    });
    const root = mount(() => (
      <Form controller={form}>
        <form.Field name="email" label="邮箱">
          <TextField value={_bind(form.values.email)} />
        </form.Field>
        <form.Field name="nickname" label="昵称">
          <TextField value={_bind(form.values.nickname)} />
        </form.Field>
        <form.Field name="count" label="数量">
          <NumberField value={_bind(form.values.count)} />
        </form.Field>
      </Form>
    ));
    const [emailLabel, nicknameLabel] = root.querySelectorAll('label');
    const [email, nickname, count] = root.querySelectorAll('input');
    expect(emailLabel!.querySelector('svg')).not.toBeNull();
    expect(nicknameLabel!.querySelector('svg')).toBeNull();
    expect([email!.type, email!.required]).toEqual(['email', true]);
    expect([nickname!.required, nickname!.getAttribute('maxlength')]).toEqual([false, '12']);
    expect([count!.getAttribute('aria-valuemin'), count!.getAttribute('aria-valuemax')]).toEqual([
      '1',
      '9',
    ]);
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ada@lovelace.dev',
      nickname: '',
      count: 1,
      age: 20,
    });
  });
});

describe('字段布局与整组状态（field-layout）', () => {
  const values = { email: 'ada@example.com', profile: { name: 'Ada' } };

  it('Form 统一把标签放到起始边：控件、说明、错误包进控件列；Field 上写的优先', () => {
    const form = useForm({ initial: values, schema });
    const root = mount(() => (
      <Form controller={form} labelPlacement="start" labelWidth={96}>
        <Field label="邮箱" description="用于找回密码">
          <TextField value={_bind(form.values.email)} />
        </Field>
        <Field label="名字" labelPlacement="top">
          <TextField value={_bind(form.values.profile.name)} />
        </Field>
        <Field>
          <Checkbox>记住我</Checkbox>
        </Field>
      </Form>
    ));
    const [email, name, remember] = root.querySelectorAll<HTMLElement>('form > div');
    expect(email!.dataset.labelPlacement).toBe('start');
    // 标签、控件列两个子元素；说明在控件列里
    expect(email!.children).toHaveLength(2);
    expect(email!.children[1]!.textContent).toContain('用于找回密码');
    expect(name!.dataset.labelPlacement).toBe('top');
    // 没有标签时控件列仍在第二列，只有一个子元素
    expect(remember!.children).toHaveLength(1);
  });

  it('Form 只读、不可用下发到字段与不在 Field 里的控件；控件上显式写的优先', async () => {
    const form = useForm({ initial: { email: 'ada@example.com', agreed: true } });
    let state = _state({ readonly: true, disabled: false });
    const root = mount(() => (
      <Form controller={form} readonly={state.readonly} disabled={state.disabled}>
        <Field label="邮箱">
          <TextField value={_bind(form.values.email)} />
        </Field>
        <Checkbox checked={_bind(form.values.agreed)}>同意</Checkbox>
        <Field label="备注" readonly={false}>
          <TextField value="" />
        </Field>
      </Form>
    ));
    const [email, , remark] = root.querySelectorAll('input');
    const agree = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(email!.readOnly).toBe(true);
    expect(remark!.readOnly).toBe(false);
    expect(agree.getAttribute('aria-readonly')).toBe('true');
    // 只读的复选框点了不变
    agree.click();
    await flush();
    expect(agree.checked).toBe(true);
    expect(form.values.agreed).toBe(true);

    state = { readonly: false, disabled: true };
    await flush();
    expect(email!.disabled).toBe(true);
    expect(agree.disabled).toBe(true);
    expect(agree.hasAttribute('aria-readonly')).toBe(false);
  });
});

describe('数组字段、dirty、单字段异步校验', () => {
  it('array：增删、插入、移动，key 稳定；错误与失焦记录跟着下标移动', async () => {
    const form = useForm({ initial: { items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] } });
    const items = form.array('items');
    const [a, b, c] = items.keys;
    form.setError('items.2.name', '重复');
    form.blur('items.2.name');
    items.remove(0);
    expect(items.items.map((item) => item.name)).toEqual(['b', 'c']);
    expect(items.keys).toEqual([b, c]);
    expect(form.errors).toEqual({ 'items.1.name': '重复' });
    items.move(1, 0);
    expect(items.keys).toEqual([c, b]);
    expect(form.visibleError('items.0.name')).toBe('重复');
    items.insert(1, { name: 'x' });
    items.append({ name: 'y' });
    expect(form.values.items.map((item) => item.name)).toEqual(['c', 'x', 'b', 'y']);
    expect(items.keys[0]).toBe(c);
    expect(new Set(items.keys).size).toBe(4);
    expect(items.keys).not.toContain(a);
  });

  it('dirty：与初始值比较；reset(form.values) 之后以它为准', async () => {
    const form = useForm({ initial: { name: 'a', tags: ['x'] } });
    expect(form.dirty).toBe(false);
    form.values.tags.push('y');
    expect(form.dirty).toBe(true);
    expect(form.isDirty('tags')).toBe(true);
    expect(form.isDirty('name')).toBe(false);
    form.reset(form.values);
    expect(form.dirty).toBe(false);
    form.values.name = 'b';
    expect(form.dirty).toBe(true);
    form.values.name = 'a';
    expect(form.dirty).toBe(false);
  });

  it('单字段校验：防抖、只采用最后一次结果；提交时等它完成', async () => {
    vi.useFakeTimers();
    try {
      const resolvers: ((message: string | undefined) => void)[] = [];
      const validate = vi.fn(
        (_name: string, _values: unknown, signal: AbortSignal) =>
          new Promise<string | undefined>((resolve) => {
            resolvers.push(resolve);
            signal.addEventListener('abort', () => resolve(undefined));
          }),
      );
      const onSubmit = vi.fn();
      const form = useForm({
        initial: { username: '' },
        fields: { username: { validate, debounce: 200 } },
        onSubmit,
      });
      form.values.username = 'ad';
      await nextTick();
      form.values.username = 'admin';
      await nextTick();
      await vi.advanceTimersByTimeAsync(200);
      // 防抖：只按最后的值校验一次
      expect(validate).toHaveBeenCalledTimes(1);
      expect(validate.mock.calls[0]![0]).toBe('admin');
      expect(form.validating('username')).toBe(true);
      resolvers[0]!('用户名已占用');
      await flush();
      expect(form.validating()).toBe(false);
      expect(form.errors.username).toBe('用户名已占用');
      // 值没变：提交时直接用上次的结果，不再请求
      expect(await form.submit()).toBe(false);
      expect(validate).toHaveBeenCalledTimes(1);

      form.values.username = 'ada';
      const submitted = form.submit();
      await flush();
      expect(validate).toHaveBeenCalledTimes(2);
      resolvers[1]!(undefined);
      expect(await submitted).toBe(true);
      expect(onSubmit).toHaveBeenCalledWith({ username: 'ada' });
    } finally {
      vi.useRealTimers();
    }
  });
});
