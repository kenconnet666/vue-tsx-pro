// Field / Form：输入写回、字数上限、清除；提交时校验、出错显示消息、改对后消失、回车提交；小程序端的输入与提交
import { mountPage } from '@zerodep-dev/vue-tsx-pro-mini/testing';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { Button } from '../../base/Button';
import { mount } from '../../utils/.test/mount';
import { Field } from '../Field';
import { Form } from '../Form';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const type = (input: HTMLInputElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('Field（H5）', () => {
  it('输入写回绑定的值；超过 maxlength 截掉；字数显示；聚焦时有内容才出现清除按钮', async () => {
    const value = ref('');
    const root = mount(() => (
      <Field label="昵称" _value={value.value} maxlength={5} showWordLimit clearable />
    ));
    const input = root.querySelector('input')!;
    type(input, '莱恩');
    expect(value.value).toBe('莱恩');
    type(input, '一二三四五六');
    expect(value.value).toBe('一二三四五');
    await nextTick();
    expect(input.value).toBe('一二三四五');
    expect(root.textContent).toContain('5/5');

    expect(root.querySelector('button[aria-label="清除"]')).toBeNull();
    input.dispatchEvent(new Event('focus'));
    await nextTick();
    root.querySelector<HTMLButtonElement>('button[aria-label="清除"]')!.click();
    expect(value.value).toBe('');
  });

  it('数字类型：文本框加 inputmode；多行是 textarea', () => {
    const root = mount(() => [
      <Field type="number" />,
      <Field type="digit" />,
      <Field multiline rows={3} />,
    ]);
    const [number, digit] = root.querySelectorAll('input');
    expect(number!.type).toBe('text');
    expect(number!.getAttribute('inputmode')).toBe('decimal');
    expect(digit!.getAttribute('inputmode')).toBe('numeric');
    expect(root.querySelector('textarea')!.getAttribute('rows')).toBe('3');
  });
});

describe('Form（H5）', () => {
  it('提交时校验：必填与格式的消息，改对之后消息消失，全部通过时 onSubmit 收到值', async () => {
    const phone = ref('');
    const code = ref('');
    const onSubmit = vi.fn();
    const onFailed = vi.fn();
    const root = mount(() => (
      <Form onSubmit={onSubmit} onFailed={onFailed}>
        <Field
          name="phone"
          label="手机号"
          _value={phone.value}
          rules={[{ required: true }, { pattern: /^1\d{10}$/, message: '手机号格式不对' }]}
        />
        <Field name="code" label="验证码" _value={code.value} rules={[{ required: true }]} />
        <Button type="submit">登录</Button>
      </Form>
    ));
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await wait();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onFailed.mock.calls[0]![0].errors).toEqual([
      { name: 'phone', message: '请填写手机号' },
      { name: 'code', message: '请填写验证码' },
    ]);
    expect([...root.querySelectorAll('[role="alert"]')].map((node) => node.textContent)).toEqual([
      '请填写手机号',
      '请填写验证码',
    ]);
    // 必填的项标题前有星号
    expect(root.textContent).toContain('*手机号');

    const [phoneInput, codeInput] = root.querySelectorAll('input');
    type(phoneInput!, '123');
    await wait();
    expect(root.querySelector('[role="alert"]')!.textContent).toBe('手机号格式不对');
    type(phoneInput!, '13800000000');
    type(codeInput!, '6666');
    await wait();
    expect(root.querySelectorAll('[role="alert"]')).toHaveLength(0);

    // 输入框里按回车也提交
    codeInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await wait();
    expect(onSubmit).toHaveBeenCalledWith({ phone: '13800000000', code: '6666' });
  });

  it('失焦时校验 blur 规则；异步的校验器', async () => {
    const name = ref('admin');
    const root = mount(() => (
      <Form>
        <Field
          name="name"
          label="用户名"
          _value={name.value}
          rules={[{ validator: async (value) => value !== 'admin' || '用户名已被占用' }]}
        />
      </Form>
    ));
    root.querySelector('input')!.dispatchEvent(new Event('blur'));
    await wait();
    await nextTick();
    expect(root.querySelector('[role="alert"]')!.textContent).toBe('用户名已被占用');
  });
});

describe('Form（小程序）', () => {
  it('输入框的 input 事件写回值；点提交按钮校验并提交', async () => {
    const phone = ref('');
    const submitted = ref<Record<string, unknown> | null>(null);
    const Demo = defineComponent(() => () => (
      <Form onSubmit={(values) => (submitted.value = values)}>
        <Field name="phone" label="手机号" _value={phone.value} rules={[{ required: true }]} />
        <Button type="submit">提交</Button>
      </Form>
    ));
    const page = mountPage(Demo);
    await page.settle();
    const input = page.find((node) => node.t === 'input')!;
    await page.dispatch(input, 'input', { value: '13800000000' });
    expect(phone.value).toBe('13800000000');
    // 直接包着文字的节点（按钮的内容层），点击从它冒泡到按钮、再到表单
    const submit = page.find((node) => node.cn?.some((child) => child.v === '提交') ?? false)!;
    await page.tap(submit);
    await wait();
    expect(submitted.value).toEqual({ phone: '13800000000' });
  });
});
