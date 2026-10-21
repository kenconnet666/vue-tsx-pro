// NumberRangeField：两端各自输入，起比止大时对调；在 Field 里标签指向第一个框，组以标签为名称
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { NumberRangeField, type NumberRange } from '../NumberRangeField';

const type = async (input: HTMLInputElement, text: string) => {
  input.dispatchEvent(new FocusEvent('focus'));
  input.value = text;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new FocusEvent('blur'));
  await nextTick();
};

describe('NumberRangeField', () => {
  it('两端各自写回；起比止大时自动对调；一端可以清空', async () => {
    let range = _state<NumberRange>([null, null]);
    const root = mount(() => <NumberRangeField value={_bind(range)} aria-label="架次" />);
    const [start, end] = root.querySelectorAll('input');
    await type(start!, '50');
    expect(range).toEqual([50, null]);
    await type(end!, '10');
    expect(range).toEqual([10, 50]);
    await type(start!, '');
    expect(range).toEqual([null, 50]);
  });

  it('在 Field 里：标签指向第一个框，组以标签为名称；两个框念最小值、最大值', () => {
    const root = mount(() => (
      <Field label="预期收益量级">
        <NumberRangeField />
      </Field>
    ));
    const label = root.querySelector('label')!;
    const group = root.querySelector('[role="group"]')!;
    const [start, end] = root.querySelectorAll('input');
    expect(label.getAttribute('for')).toBe(start!.id);
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect([start!.getAttribute('aria-label'), end!.getAttribute('aria-label')]).toEqual([
      '最小值',
      '最大值',
    ]);
    expect(end!.id).not.toBe(start!.id);
  });
});
