// TextField 与 Field：值的双向绑定、清空、显示密码、Field 的关联与状态
import { describe, expect, it } from 'vitest';
import { nextTick, reactive, shallowRef } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { CharacterCount } from '../CharacterCount';
import { TextField } from '../TextField';
import { Textarea } from '../Textarea';

describe('TextField', () => {
  it('未声明的属性落到 input；外壳用 propsRoot；清空后写回并聚焦 input', async () => {
    let value = _state('vue');
    const root = mount(() => (
      <TextField _value={value} clearable placeholder="搜索" propsRoot={{ class: 'shell' }} />
    ));
    const input = root.querySelector('input')!;
    expect(input.placeholder).toBe('搜索');
    expect(root.querySelector('.shell')!.contains(input)).toBe(true);
    root.querySelector<HTMLButtonElement>('button[aria-label="清空"]')!.click();
    await nextTick();
    expect(value).toBe('');
    expect(input.value).toBe('');
    // 没有内容时不显示清空按钮
    expect(root.querySelector('button')).toBeNull();
  });

  it('不可用、只读时不显示清空按钮', () => {
    const root = mount(() => (
      <>
        <TextField _value="x" clearable disabled />
        <TextField _value="x" clearable readonly />
      </>
    ));
    expect(root.querySelectorAll('button')).toHaveLength(0);
    const [disabled, readonly] = root.querySelectorAll('input');
    expect([disabled!.disabled, readonly!.readOnly]).toEqual([true, true]);
  });

  it('密码框：切换按钮名称不变，用 aria-pressed 表示状态，切换 input 的 type', async () => {
    const root = mount(() => <TextField type="password" _value="secret" />);
    const input = root.querySelector('input')!;
    const reveal = root.querySelector('button')!;
    expect([input.type, reveal.getAttribute('aria-label')]).toEqual(['password', '显示密码']);
    reveal.click();
    await nextTick();
    expect([input.type, reveal.getAttribute('aria-pressed')]).toEqual(['text', 'true']);
  });
});

describe('Field', () => {
  it('标签的 for 指向控件；说明与错误信息经 aria-describedby 关联；有错误时控件出错', () => {
    const root = mount(() => (
      <Field label="邮箱" description="用于找回密码" error="格式不对" required>
        <TextField _value="a@" />
      </Field>
    ));
    const label = root.querySelector('label')!;
    const input = root.querySelector('input')!;
    expect(label.htmlFor).toBe(input.id);
    expect(label.querySelector('svg')).not.toBeNull(); // 必填标记
    const described = input.getAttribute('aria-describedby')!.split(' ');
    expect(described.map((id) => root.querySelector(`[id="${id}"]`)!.textContent)).toEqual([
      '用于找回密码',
      '格式不对',
    ]);
    expect([input.getAttribute('aria-invalid'), input.required]).toEqual(['true', true]);
  });

  it('控件上显式写的状态优先于 Field；invalid={false} 时不显示错误', () => {
    const root = mount(() => (
      <Field label="名字" error="必填" invalid={false} disabled>
        <TextField _value="" disabled={false} />
      </Field>
    ));
    const input = root.querySelector('input')!;
    expect(input.disabled).toBe(false);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(root.textContent).not.toContain('必填');
  });
});

describe('前后缀与字数计数', () => {
  it('TextField：前后缀是部件，不算在值里；是指向输入框的 label，在 Field 里念进名称', () => {
    const root = mount(() => (
      <TextField
        _value="example"
        prefix="https://"
        suffix=".com"
        propsPrefix={{ class: 'pre' }}
        aria-label="网址"
      />
    ));
    expect(root.querySelector('.pre')!.textContent).toBe('https://');
    expect(root.textContent).toBe('https://.com');
    const input = root.querySelector('input')!;
    expect(input.value).toBe('example');
    expect([...input.labels!].map((label) => label.textContent)).toEqual(['https://', '.com']);

    const inField = mount(() => (
      <Field label="金额">
        <TextField suffix="万元" />
      </Field>
    ));
    const amount = inField.querySelector('input')!;
    expect([...amount.labels!].map((label) => label.textContent)).toEqual(['金额', '万元']);
  });

  it('showCount：上限取 maxlength，读屏经 aria-describedby 念出；超出时标记 data-over', async () => {
    const value = shallowRef('你好');
    const root = mount(() => (
      <TextField _value={value.value} showCount maxlength={3} aria-label="昵称" />
    ));
    const input = root.querySelector('input')!;
    const count = document.getElementById(input.getAttribute('aria-describedby')!)!;
    expect(count.querySelector('[aria-hidden]')!.textContent).toBe('2 / 3');
    expect(count.textContent).toContain('已输入 2 个字符，最多 3 个');
    value.value = '你好世界';
    await nextTick();
    expect(count.dataset.over).toBe('true');
  });

  it('Textarea：showCount 没有上限时只显示字数；在 Field 里与说明一起关联', () => {
    const root = mount(() => (
      <Field label="简介" description="写点什么">
        <Textarea _value="abc" showCount />
      </Field>
    ));
    const textarea = root.querySelector('textarea')!;
    const ids = textarea.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[1]!)!.querySelector('[aria-hidden]')!.textContent).toBe('3');
  });

  it('CharacterCount 的部件属性：看得见的字数始终对读屏隐藏，读屏的句子另是一个部件', () => {
    const root = mount(() => (
      <CharacterCount
        count={2}
        max={3}
        propsValue={{ class: 'value' }}
        propsLabel={{ class: 'label' }}
      />
    ));
    const value = root.querySelector('.value')!;
    expect([value.textContent, value.getAttribute('aria-hidden')]).toEqual(['2 / 3', 'true']);
    expect(root.querySelector('.label')!.textContent).toBe('已输入 2 个字符，最多 3 个');
  });
});

describe('Textarea 的 clearable', () => {
  it('有内容时显示清空按钮，清空后回到空字符串', async () => {
    const state = reactive({ note: '第一行\n第二行' });
    const root = mount(() => <Textarea _value={state.note} clearable aria-label="备注" />);
    const clear = root.querySelector<HTMLButtonElement>('button[aria-label="清空"]')!;
    clear.click();
    await nextTick();
    expect(state.note).toBe('');
    expect(root.querySelector('button[aria-label="清空"]')).toBeNull();
  });
});
