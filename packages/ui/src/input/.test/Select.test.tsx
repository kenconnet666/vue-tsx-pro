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

  it('前置图标在触发按钮之前，propsIcon 透传', () => {
    const root = mount(() => (
      <Select items={cities} icon={Globe} propsIcon={{ class: 'lead' }} aria-label="城市" />
    ));
    const icon = root.querySelector('.lead')!;
    expect(icon.nextElementSibling!.getAttribute('role')).toBe('combobox');
  });
});
