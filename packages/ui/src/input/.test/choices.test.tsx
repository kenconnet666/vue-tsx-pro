// Checkbox / CheckboxGroup、RadioGroup / Radio、Switch：原生 input 的状态、写回与 Field 关联
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Field } from '../Field';
import { mount } from '../../utils/.test/mount';
import { Checkbox, CheckboxGroup } from '../Checkbox';
import { Radio, RadioGroup } from '../Radio';
import { Switch } from '../Switch';

const click = async (element: HTMLElement) => {
  element.click();
  await nextTick();
};

describe('Checkbox', () => {
  it('原生 checkbox：点击写回；indeterminate 是 DOM 属性；文字在 label 里', async () => {
    let agreed = _state(false);
    const root = mount(() => (
      <>
        <Checkbox checked={_bind(agreed)} name="agree">
          同意
        </Checkbox>
        <Checkbox indeterminate>全选</Checkbox>
      </>
    ));
    const [single, partial] = root.querySelectorAll('input');
    expect([single!.type, single!.name, single!.closest('label')!.textContent]).toEqual([
      'checkbox',
      'agree',
      '同意',
    ]);
    await click(single!);
    expect(agreed).toBe(true);
    expect(partial!.indeterminate).toBe(true);
    expect(partial!.closest('label')!.dataset.state).toBe('indeterminate');
  });

  it('复选组：value 是勾选项的数组；组是 role="group"，以 Field 的标签为名称', async () => {
    let channels = _state<string[]>(['email']);
    const root = mount(() => (
      <Field label="通知方式" description="至少选一项">
        <CheckboxGroup value={_bind(channels)} name="channels">
          <Checkbox value="email">邮件</Checkbox>
          <Checkbox value="sms">短信</Checkbox>
        </CheckboxGroup>
      </Field>
    ));
    const group = root.querySelector('[role="group"]')!;
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent).toBe(
      '通知方式',
    );
    expect(group.getAttribute('aria-describedby')).not.toBeNull();
    const [email, sms] = root.querySelectorAll('input');
    expect([email!.checked, sms!.checked, sms!.name]).toEqual([true, false, 'channels']);
    await click(sms!);
    expect(channels).toEqual(['email', 'sms']);
    await click(email!);
    expect(channels).toEqual(['sms']);
  });
});

describe('RadioGroup', () => {
  it('同组的 radio 共用自动生成的 name；选中写回；整组不可用', async () => {
    let shipping = _state<string | undefined>('express');
    let off = _state(false);
    const root = mount(() => (
      <RadioGroup value={_bind(shipping)} disabled={off} aria-label="配送">
        <Radio value="express">快递</Radio>
        <Radio value="pickup">自提</Radio>
      </RadioGroup>
    ));
    expect(root.querySelector('[role="radiogroup"]')).not.toBeNull();
    const [express, pickup] = root.querySelectorAll('input');
    expect(express!.name).toBe(pickup!.name);
    expect(express!.name).not.toBe('');
    expect(express!.checked).toBe(true);
    await click(pickup!);
    expect(shipping).toBe('pickup');
    off = true;
    await nextTick();
    expect([express!.disabled, pickup!.disabled]).toEqual([true, true]);
  });
});

describe('Switch', () => {
  it('role="switch" 的原生 checkbox；在 Field 里时 for 指向它', async () => {
    let on = _state(false);
    const root = mount(() => (
      <Field label="通知" error="需要打开">
        <Switch checked={_bind(on)} />
      </Field>
    ));
    const input = root.querySelector('input')!;
    expect([input.getAttribute('role'), input.type]).toEqual(['switch', 'checkbox']);
    expect(root.querySelector('label')!.htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    await click(input);
    expect(on).toBe(true);
  });
});
