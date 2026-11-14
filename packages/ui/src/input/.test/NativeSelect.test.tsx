// NativeSelect：原生 select 放在输入框的外壳里——选项、分组、占位项；改了写回；只读时换不了；放进 Field 自动关联
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { NativeSelect } from '../NativeSelect';

const items = [
  '中国',
  { value: 'jp', label: '日本' },
  { value: 'de', label: '德国', group: '欧洲' },
  { value: 'fr', label: '法国', group: '欧洲', disabled: true },
];

function choose(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('NativeSelect', () => {
  it('选项与分组：字符串的值就是文字，带 group 的排进 optgroup；占位项选不了、没选时显示它', () => {
    const root = mount(() => (
      <NativeSelect items={items} placeholder="选择国家" aria-label="国家" data-x="1" />
    ));
    const select = root.querySelector('select')!;
    expect(select.getAttribute('aria-label')).toBe('国家');
    expect(select.getAttribute('data-x')).toBe('1');
    const [placeholder, china, japan] = [...select.children] as HTMLOptionElement[];
    expect(placeholder!.textContent).toBe('选择国家');
    expect(placeholder!.disabled).toBe(true);
    expect(placeholder!.hidden).toBe(true);
    expect(placeholder!.selected).toBe(true);
    expect([china!.value, china!.textContent]).toEqual(['中国', '中国']);
    expect([japan!.value, japan!.textContent]).toEqual(['jp', '日本']);
    const group = select.querySelector('optgroup')!;
    expect(group.label).toBe('欧洲');
    expect([...group.children].map((option) => option.textContent)).toEqual(['德国', '法国']);
    expect((group.children[1] as HTMLOptionElement).disabled).toBe(true);
    // 外壳同别的输入框，后面有箭头
    expect(root.querySelector('[data-scope="input"][data-part="root"]')).not.toBeNull();
    expect(root.querySelector('svg')).not.toBeNull();
  });

  it('选了写回值；父级改值跟着选中', async () => {
    let country = _state<string | null>(null);
    const root = mount(() => <NativeSelect items={items} _value={country} placeholder="选择" />);
    const select = root.querySelector('select')!;
    choose(select, 'jp');
    await nextTick();
    expect(country).toBe('jp');
    country = 'de';
    await nextTick();
    expect(select.querySelector<HTMLOptionElement>('option[value="de"]')!.selected).toBe(true);
    expect(select.querySelector<HTMLOptionElement>('option[value="jp"]')!.selected).toBe(false);
  });

  it('只读：别的选项选不了、读屏念只读；不可用：select 是 disabled', async () => {
    const root = mount(() => (
      <>
        <NativeSelect items={items} _value="jp" readonly />
        <NativeSelect items={items} _value="jp" disabled />
      </>
    ));
    await nextTick();
    const [locked, off] = root.querySelectorAll('select');
    expect(locked!.getAttribute('aria-readonly')).toBe('true');
    expect(locked!.disabled).toBe(false);
    const options = [...locked!.querySelectorAll('option')];
    expect(options.filter((option) => !option.disabled).map((option) => option.value)).toEqual([
      'jp',
    ]);
    expect(off!.disabled).toBe(true);
  });

  it('放进 Field：标签指向它，必填、出错跟着 Field', () => {
    const root = mount(() => (
      <Field label="国家" required error="请选择国家">
        <NativeSelect items={items} placeholder="选择" />
      </Field>
    ));
    const select = root.querySelector('select')!;
    expect(root.querySelector('label')!.htmlFor).toBe(select.id);
    expect(select.required).toBe(true);
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBeTruthy();
  });
});
