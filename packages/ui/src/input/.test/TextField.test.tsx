// TextField 与 Field：值的双向绑定、清空、显示密码、Field 的关联与状态
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { TextField } from '../TextField';

describe('TextField', () => {
  it('未声明的属性落到 input；外壳用 propsRoot；清空后写回并聚焦 input', async () => {
    let value = _state('vue');
    const root = mount(() => (
      <TextField value={_bind(value)} clearable placeholder="搜索" propsRoot={{ class: 'shell' }} />
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
        <TextField value="x" clearable disabled />
        <TextField value="x" clearable readonly />
      </>
    ));
    expect(root.querySelectorAll('button')).toHaveLength(0);
    const [disabled, readonly] = root.querySelectorAll('input');
    expect([disabled!.disabled, readonly!.readOnly]).toEqual([true, true]);
  });

  it('密码框：切换按钮名称不变，用 aria-pressed 表示状态，切换 input 的 type', async () => {
    const root = mount(() => <TextField type="password" value="secret" />);
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
        <TextField value="a@" />
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
        <TextField value="" disabled={false} />
      </Field>
    ));
    const input = root.querySelector('input')!;
    expect(input.disabled).toBe(false);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(root.textContent).not.toContain('必填');
  });
});
