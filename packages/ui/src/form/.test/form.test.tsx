// useForm + Form + Field：zod 校验、何时显示错误、提交、重置、聚焦第一个出错的控件、schema 推出的字段约束
import { describe, expect, it, vi } from 'vitest';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { nextTick } from 'vue';
import * as z from 'zod';
import { Provider } from '../../config/Provider';
import { enUS } from '../../config/lang/en-US';
import { Checkbox } from '../../input/Checkbox';
import { NumberField } from '../../input/NumberField';
import { NumberRangeField } from '../../input/NumberRangeField';
import { TextField } from '../../input/TextField';
import { visuallyHiddenStyles } from '../../base/VisuallyHidden';
import { hasStyles, mount } from '../../utils/.test/mount';
import { Field } from '../Field';
import { Form } from '../Form';
import { HttpError } from '../../utils/request/http';
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

  it('没写提示时报错跟随语言包：空值（null、空字符串、空数组）是“必填”，其余取 zod 的语言包；schema 写的提示优先', async () => {
    const form = useForm({
      initial: {
        // 清空后的选择控件是 null；schema 忘了写 nullable 时读起来也是“必填”
        city: null as unknown as string,
        name: '',
        tags: [] as string[],
        email: 'x',
        age: 3,
        note: '',
      },
      schema: z.object({
        city: z.string(),
        name: z.string().min(1),
        tags: z.array(z.string()).min(1),
        email: z.email(),
        age: z.number().min(18),
        note: z.string().min(1, '请写备注'),
      }),
    });
    expect(await form.validate()).toBe(false);
    const { city, name, tags, email, age, note } = form.errors;
    expect([city, name, tags, note]).toEqual(['必填', '必填', '必填', '请写备注']);
    expect(email).toContain('电子邮件');
    expect(age).toContain('18');

    let english!: ReturnType<typeof useForm<{ city: string }>>;
    const Probe = _component(() => {
      english = useForm({
        initial: { city: null as unknown as string },
        schema: z.object({ city: z.string() }),
      });
      return () => null;
    });
    mount(() => (
      <Provider lang={enUS}>
        <Probe />
      </Provider>
    ));
    expect(await english.validate()).toBe(false);
    expect(english.errors.city).toBe('Required');
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

  it('onSubmit 抛带码的错误：明细标到字段，没有明细时是 formError，submit 返回 false；别的错误原样抛出', async () => {
    const request = { url: '/signup' };
    let failure: unknown = new HttpError('表单校验不通过', {
      code: 'flow.validation-failed',
      errors: [
        { field: 'email', code: 'app.email-taken' },
        { field: 'profile.name', message: '名字已被占用' },
        { code: 'x' },
      ],
      request,
    });
    const form = useForm({
      initial: { email: 'ada@example.com', profile: { name: 'Ada' } },
      schema,
      onSubmit: () => Promise.reject(failure),
    });
    expect(await form.submit()).toBe(false);
    // 码没有文案时用码本身：至少能看出是哪条规则
    expect([form.errors.email, form.errors['profile.name'], form.formError]).toEqual([
      'app.email-taken',
      '名字已被占用',
      undefined,
    ]);
    failure = new HttpError('stale', { code: 'query.unexpected-row-count', request });
    expect(await form.submit()).toBe(false);
    expect(form.formError).toBe('数据已被他人修改或删除，请刷新后重试');
    failure = new TypeError('bug');
    await expect(form.submit()).rejects.toBe(failure);
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

  it('不属于字段的错误（refine 没写 path）是 formError：提交过之后才有，提交不通过', async () => {
    const form = useForm({
      initial: { start: 5, end: 3 },
      schema: z
        .object({ start: z.number(), end: z.number() })
        .refine((value) => value.start <= value.end, '开始不能晚于结束'),
    });
    expect(await form.validate()).toBe(false);
    expect(form.formError).toBeUndefined();
    expect(await form.submit()).toBe(false);
    expect(form.formError).toBe('开始不能晚于结束');
    form.values.end = 9;
    await flush();
    expect(form.formError).toBeUndefined();
  });

  it('setError 给的错误：校验不会冲掉，这个字段的值改了就消失；提交时也算不通过', async () => {
    const onSubmit = vi.fn();
    const form = useForm({
      initial: { email: 'ada@example.com', profile: { name: 'Ada' } },
      schema,
      onSubmit,
    });
    form.setError('email', '邮箱已注册');
    form.blur('profile.name');
    await flush();
    expect(form.errors.email).toBe('邮箱已注册');
    expect(await form.submit()).toBe(false);
    expect(form.visibleError('email')).toBe('邮箱已注册');
    form.values.email = 'grace@example.com';
    await flush();
    expect(form.visibleError('email')).toBeUndefined();
    expect(await form.submit()).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('失焦过的字段随输入更新：改对了错误立刻消失，不用再失焦一次', async () => {
    const form = useForm({ initial: { email: 'x', profile: { name: 'Ada' } }, schema });
    form.blur('email');
    await flush();
    expect(form.visibleError('email')).toBe('邮箱格式不对');
    form.values.email = 'ada@example.com';
    await flush();
    expect(form.visibleError('email')).toBeUndefined();
  });

  it('提交进行中再次提交（连按回车）：拿到同一个结果，onSubmit 只调用一次', async () => {
    const onSubmit = vi.fn();
    const form = useForm({
      initial: { email: 'ada@example.com', profile: { name: 'Ada' } },
      schema,
      onSubmit,
    });
    const [first, second] = [form.submit(), form.submit()];
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('Form + Field', () => {
  it('Field 的 error、说明、标签写成 cond && … 条件不成立时（false、空字符串）当作没写', () => {
    const root = mount(() => (
      <Field label="" description={false} error={false}>
        <TextField />
      </Field>
    ));
    const input = root.querySelector('input')!;
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(root.querySelector('label')).toBeNull();
  });

  it('Field 按 name 显示表单的错误；提交不通过时焦点移到第一个出错的控件', async () => {
    const form = useForm({ initial: { email: '', profile: { name: '' } }, schema });
    const root = mount(() => (
      <Form controller={form}>
        <Field name="email" label="邮箱">
          <TextField _value={form.values.email} />
        </Field>
        <Field name="profile.name" label="名字">
          <TextField _value={form.values.profile.name} />
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
    await vi.waitFor(() => expect(document.activeElement).toBe(email));
  });

  it('焦点离开字段时报告失焦，显示这个字段的错误；form.Field 就是 Field（name 带类型）', async () => {
    const form = useForm({ initial: { email: 'x', profile: { name: '' } }, schema });
    const root = mount(() => (
      <Form controller={form}>
        <form.Field name="email" label="邮箱">
          <TextField _value={form.values.email} />
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
          <TextField _value={form.values.email} />
        </form.Field>
        <form.Field name="nickname" label="昵称">
          <TextField _value={form.values.nickname} />
        </form.Field>
        <form.Field name="count" label="数量">
          <NumberField _value={form.values.count} />
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

  it('控件里再嵌的控件不接 Field：区间的第二个框没有 Field 的 id、说明与必填', () => {
    const root = mount(() => (
      <Field label="预算" description="单位：万元" required>
        <NumberRangeField />
      </Field>
    ));
    const [start, end] = root.querySelectorAll('input');
    const label = root.querySelector('label')!;
    expect(start!.id).toBe(label.htmlFor);
    expect(start!.required).toBe(true);
    expect(end!.id).not.toBe(start!.id);
    expect([end!.required, end!.hasAttribute('aria-describedby')]).toEqual([false, false]);
    expect(root.querySelector('[role="group"]')!.getAttribute('aria-describedby')).toBeTruthy();
  });
});

describe('字段布局与整组状态（field-layout）', () => {
  const values = { email: 'ada@example.com', profile: { name: 'Ada' } };

  it('Form 统一把标签放到起始边：控件、说明、错误包进控件列；Field 上写的优先', () => {
    const form = useForm({ initial: values, schema });
    const root = mount(() => (
      <Form controller={form} labelPlacement="start" labelWidth={96}>
        <Field label="邮箱" description="用于找回密码">
          <TextField _value={form.values.email} />
        </Field>
        <Field label="名字" labelPlacement="top">
          <TextField _value={form.values.profile.name} />
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

  it('一个 Field 里几个控件：只有第一个拿 Field 的 id 与标签，其余留着自己的名字，id 不重复', () => {
    const root = mount(() => (
      <Field label="允许的操作">
        <Checkbox>转办</Checkbox>
        <Checkbox>委派</Checkbox>
      </Field>
    ));
    const label = root.querySelector('label')!;
    const [first, second] = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(label.htmlFor).toBe(first!.id);
    expect(second!.id).not.toBe(first!.id);
    expect(second!.getAttribute('aria-labelledby')).toBeNull();
  });

  it('labelHidden：标签视觉上隐藏、仍指向控件；不占标签列', () => {
    const root = mount(() => (
      <Field label="手机" labelHidden labelPlacement="start">
        <TextField _value="13800001234" />
      </Field>
    ));
    const label = root.querySelector('label')!;
    const input = root.querySelector('input')!;
    expect(label.textContent).toBe('手机');
    expect(label.htmlFor).toBe(input.id);
    expect(hasStyles(label, visuallyHiddenStyles.hidden)).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-label-placement]')!.dataset.labelPlacement).toBe(
      'start',
    );
    // 标签列不排：控件不包进控件列
    expect(input.closest('div[data-label-placement]')!.children[1]!.tagName).not.toBe('LABEL');
  });

  it('Form 只读、不可用下发到字段与不在 Field 里的控件；控件上显式写的优先', async () => {
    const form = useForm({ initial: { email: 'ada@example.com', agreed: true } });
    let state = _state({ readonly: true, disabled: false });
    const root = mount(() => (
      <Form controller={form} readonly={state.readonly} disabled={state.disabled}>
        <Field label="邮箱">
          <TextField _value={form.values.email} />
        </Field>
        <Checkbox _checked={form.values.agreed}>同意</Checkbox>
        <Field label="备注" readonly={false}>
          <TextField _value="" />
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

describe('局部校验与字段联动', () => {
  const signup = z
    .object({
      name: z.string().min(1, '请填写名字'),
      address: z.object({ city: z.string().min(1, '请填写城市') }),
      password: z.string().min(6, '至少 6 位'),
      confirm: z.string(),
    })
    .refine((values) => values.confirm === values.password, {
      path: ['confirm'],
      message: '两次输入的密码不一致',
    });

  it('validate(paths)：只看这些字段（含子路径），立即显示它们的错误，别的字段不显示', async () => {
    const form = useForm({
      initial: { name: '', address: { city: '' }, password: '', confirm: '' },
      schema: signup,
    });
    expect(await form.validate(['name', 'address'])).toBe(false);
    expect(form.visibleError('name')).toBe('请填写名字');
    expect(form.visibleError('address.city')).toBe('请填写城市');
    expect(form.visibleError('password')).toBeUndefined();
    form.values.name = '林';
    form.values.address.city = '杭州';
    // 第一步的字段都填好了：通过，即使后面的字段还有错
    expect(await form.validate(['name', 'address'])).toBe(true);
    expect(await form.validate()).toBe(false);
  });

  it('dependencies：依赖的字段改了，填过的字段重新校验并显示错误；没填过的不打扰', async () => {
    const form = useForm({
      initial: { name: '林', address: { city: '杭州' }, password: '', confirm: '' },
      schema: signup,
      dependencies: { confirm: ['password'] },
    });
    form.values.password = 'secret1';
    await flush();
    // confirm 还空着、没失焦过：不显示
    expect(form.visibleError('confirm')).toBeUndefined();
    form.values.confirm = 'secret1';
    await flush();
    form.values.password = 'secret2';
    await flush();
    expect(form.visibleError('confirm')).toBe('两次输入的密码不一致');
    form.values.password = 'secret1';
    await flush();
    expect(form.visibleError('confirm')).toBeUndefined();
  });

  it('dependencies：依赖的字段改了，单字段校验跟着重跑', async () => {
    vi.useFakeTimers();
    try {
      const validate = vi.fn((end: string, values: { start: string }) =>
        end && end < values.start ? '结束日期不能早于开始日期' : undefined,
      );
      const form = useForm({
        initial: { start: '2026-10-01', end: '2026-10-05' },
        fields: { end: { validate, debounce: 0 } },
        dependencies: { end: ['start'] },
      });
      form.values.start = '2026-10-09';
      await nextTick();
      await vi.advanceTimersByTimeAsync(0);
      await flush();
      expect(validate).toHaveBeenCalledTimes(1);
      expect(form.errors.end).toBe('结束日期不能早于开始日期');
      expect(form.visibleError('end')).toBe('结束日期不能早于开始日期');
    } finally {
      vi.useRealTimers();
    }
  });
});
