// OtpField：一个原生 input（验证码自动填充、数字键盘）；只留数字或字母数字，填满时 onComplete；格子显示字符、遮罩、分组
import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { OtpField } from '../OtpField';

describe('OtpField', () => {
  it('一个原生 input：one-time-code、数字键盘、最多 length 位；在 Field 里由标签命名', () => {
    const root = mount(() => (
      <Field label="短信验证码">
        <OtpField />
      </Field>
    ));
    const inputs = root.querySelectorAll('input');
    expect(inputs).toHaveLength(1);
    const input = inputs[0]!;
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('maxlength')).toBe('6');
    expect(root.querySelector('label')!.htmlFor).toBe(input.id);
    expect(root.querySelectorAll('[data-state="empty"]')).toHaveLength(6);
  });

  it('输入（含粘贴）只留数字，填满时调用 onComplete；格子显示字符', async () => {
    const onComplete = vi.fn();
    const state = reactive({ code: '' });
    const root = mount(() => (
      <OtpField _value={_bind(state.code)} onComplete={onComplete} aria-label="验证码" />
    ));
    const input = root.querySelector('input')!;
    input.value = '12a3';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(state.code).toBe('123');
    expect(input.value).toBe('123');
    expect(onComplete).not.toHaveBeenCalled();
    input.value = '123 456 789';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(state.code).toBe('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
    const slots = [...root.querySelectorAll('[data-state]')].map((slot) => slot.textContent);
    expect(slots).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('字母数字转大写；mask 显示圆点、type=password；groups 在组之间加分隔', async () => {
    const state = reactive({ code: '' });
    const root = mount(() => (
      <OtpField
        _value={_bind(state.code)}
        length={4}
        type="alphanumeric"
        groups={[2, 2]}
        mask
        aria-label="恢复码"
      />
    ));
    const input = root.querySelector('input')!;
    expect(input.type).toBe('password');
    input.value = 'ab-9';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(state.code).toBe('AB9');
    expect(root.querySelector('[data-state="filled"]')!.textContent).toBe('•');
    // 4 格 + 1 道分隔 + input
    expect(root.firstElementChild!.children).toHaveLength(6);
  });
});
