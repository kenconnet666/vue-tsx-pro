// Checkbox / CheckboxGroup、RadioGroup / Radio、Switch：原生 input 的状态、写回与 Field 关联
import { describe, expect, it } from 'vitest';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { toneFillStyles } from '../../utils/style/tone-styles';
import { Field } from '../../form/Field';
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
    let shipping = _state<string | null>('express');
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

  it('loading：aria-busy，点击不切换；轨道里的文字对读屏隐藏，只显示当前状态那份', async () => {
    let on = _state(false);
    const root = mount(() => (
      <Switch checked={_bind(on)} loading checkedContent="开" uncheckedContent="关">
        自动保存
      </Switch>
    ));
    const input = root.querySelector('input')!;
    expect(input.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('label')!.dataset.loading).toBe('true');
    await click(input);
    expect(on).toBe(false);
    expect(input.checked).toBe(false);
    const contents = [...root.querySelectorAll('span[aria-hidden="true"]')].map(
      (span) => span.textContent,
    );
    expect(contents).toEqual(['开', '关']);
  });

  it('部件属性：轨道文字的外层与字号层分开；外层始终对读屏隐藏', () => {
    const root = mount(() => (
      <Switch
        checkedContent="开"
        uncheckedContent="关"
        propsContent={{ class: 'content' }}
        propsContentText={{ class: 'content-text' }}
      >
        自动保存
      </Switch>
    ));
    const contents = [...root.querySelectorAll('.content')];
    expect(contents.map((span) => span.getAttribute('aria-hidden'))).toEqual(['true', 'true']);
    expect(contents.map((span) => span.querySelector('.content-text')!.textContent)).toEqual([
      '开',
      '关',
    ]);
  });
});

describe('受控：父级不接受新值时，原生 input 回到父级的值', () => {
  // 写回交给一个什么都不做的 set：值一直不变，Vue 不会去动 DOM，要组件自己改回去
  const ignore = () => {};

  it('Switch 与 Checkbox', async () => {
    const root = mount(() => (
      <>
        <Switch checked={_bind(() => false, ignore)}>开关</Switch>
        <Checkbox checked={_bind(() => true, ignore)}>勾选</Checkbox>
      </>
    ));
    const [switchInput, checkbox] = root.querySelectorAll('input');
    switchInput!.click();
    checkbox!.click();
    await nextTick();
    await nextTick();
    expect([switchInput!.checked, checkbox!.checked]).toEqual([false, true]);
  });

  it('Radio：整组对回父级的值（浏览器已经取消了原来选中的那个）', async () => {
    const root = mount(() => (
      <RadioGroup value={_bind(() => 'a', ignore)} aria-label="选项">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>
    ));
    const [a, b] = root.querySelectorAll('input');
    b!.click();
    await nextTick();
    await nextTick();
    expect([a!.checked, b!.checked]).toEqual([true, false]);
  });
});

describe('色调', () => {
  const hasTone = (element: Element, tone: keyof typeof toneFillStyles) =>
    stylex
      .props(toneFillStyles[tone])
      .className!.split(' ')
      .every((name) => element.classList.contains(name));

  it('tone 加在外层 label 上；不写时 accent，defaults.Choice 统一改，显式写的优先', () => {
    const root = mount(() => (
      <>
        <Checkbox class="plain">a</Checkbox>
        <Switch tone="success">b</Switch>
        <RadioGroup tone="warning">
          <Radio value="x">c</Radio>
        </RadioGroup>
        <Provider defaults={{ Choice: { tone: 'danger' } }}>
          <Checkbox>d</Checkbox>
          <Checkbox tone="info">e</Checkbox>
        </Provider>
      </>
    ));
    const [plain, toggle, radio, configured, explicit] = root.querySelectorAll('label');
    expect(hasTone(plain!, 'accent')).toBe(true);
    expect(hasTone(toggle!, 'success')).toBe(true);
    expect(hasTone(radio!, 'warning')).toBe(true);
    expect(hasTone(configured!, 'danger')).toBe(true);
    expect(hasTone(explicit!, 'info')).toBe(true);
  });
});
