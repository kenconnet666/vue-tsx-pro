// Select：只读（自己的 readonly 或 Field 的）不能打开、不能清空；前置图标与其他输入框一样画在外壳里
// （打开后的列表、键盘见浏览器测试）
import { Globe } from '@lucide/icons';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Field } from '../../form/Field';
import { mount } from '../../utils/.test/mount';
import { Select } from '../Select';

const cities = ['北京', '上海', '广州'];

describe('Select', () => {
  it('只读：点击、按键都不打开，没有清空按钮，触发按钮带 aria-readonly；Field 的 readonly 同样生效', async () => {
    let open = _state(false);
    const root = mount(() => (
      <>
        <Select
          items={cities}
          value="上海"
          readonly
          clearable
          open={_bind(open)}
          aria-label="城市"
        />
        <Field label="出发地" readonly>
          <Select items={cities} value="北京" />
        </Field>
      </>
    ));
    const [own, fromField] = [
      ...root.querySelectorAll<HTMLButtonElement>('button[role="combobox"]'),
    ];
    own!.click();
    own!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();
    expect(open).toBe(false);
    expect(own!.getAttribute('aria-readonly')).toBe('true');
    expect(fromField!.getAttribute('aria-readonly')).toBe('true');
    expect(root.querySelector('button[aria-label="清空"]')).toBeNull();
    expect(own!.textContent).toBe('上海');
  });

  it('单选的值是空字符串时算没有选中：显示占位文字，没有清空按钮', () => {
    const root = mount(() => (
      <Select items={cities} value="" placeholder="全部" clearable aria-label="城市" />
    ));
    expect(root.querySelector('button[role="combobox"]')!.textContent).toBe('全部');
    expect(root.querySelector('button[aria-label="清空"]')).toBeNull();
  });

  it('清空：单选写回 null（同日期、数字控件的空值），多选写回空数组', async () => {
    let city = _state<string | null>('上海');
    let cityList = _state(['北京', '广州']);
    const root = mount(() => (
      <>
        <Select items={cities} value={_bind(city)} clearable aria-label="城市" />
        <Select
          items={cities}
          selectionMode="multiple"
          value={_bind(cityList)}
          clearable
          aria-label="途经"
        />
      </>
    ));
    for (const clear of root.querySelectorAll<HTMLButtonElement>('button[aria-label="清空"]')) {
      clear.click();
    }
    await nextTick();
    expect([city, cityList]).toEqual([null, []]);
  });

  it('不可搜索时弹层没有头部（不留空的分隔线）；可搜索时头部是搜索框', () => {
    const root = mount(() => (
      <>
        <Select items={cities} aria-label="城市" />
        <Select items={cities} searchable aria-label="出发地" />
      </>
    ));
    const [plain, searchable] = [...root.querySelectorAll('[popover]')];
    expect(plain!.firstElementChild!.querySelector('[role="listbox"]')).not.toBeNull();
    expect(searchable!.firstElementChild!.querySelector('input')).not.toBeNull();
  });

  it('前置图标在触发按钮之前，propsIcon 透传', () => {
    const root = mount(() => (
      <Select items={cities} icon={Globe} propsIcon={{ class: 'lead' }} aria-label="城市" />
    ));
    const icon = root.querySelector('.lead')!;
    expect(icon.nextElementSibling!.getAttribute('role')).toBe('combobox');
  });
});
