// ControlGroup：role="group"，里面的输入框外壳与按钮相连（横排时输入框分剩余宽度、选择框按内容宽），竖排换一组样式
import { describe, expect, it } from 'vitest';
import { Button } from '../../base/Button';
import { Field } from '../../form/Field';
import { attachedStyles } from '../../utils/style/attached';
import { hasStyles, mount } from '../../utils/.test/mount';
import { inputRecipe } from '../control';
import { ControlGroup } from '../ControlGroup';
import { Select } from '../Select';
import { TextField } from '../TextField';

// 横排相连的档位给外壳加的样式（分掉剩余宽度）：配方结果里排在基础样式之后的那一段
const grow = inputRecipe({ attached: 'horizontal' }).root.slice(1);

describe('ControlGroup', () => {
  it('组里的输入框、选择框、按钮都相连；输入框分剩余宽度', () => {
    const root = mount(() => (
      <ControlGroup aria-label="搜索">
        <Select items={['全部', '标题']} _value="全部" aria-label="范围" />
        <TextField _value="" aria-label="关键词" />
        <Button>搜索</Button>
      </ControlGroup>
    ));
    const group = root.firstElementChild as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('搜索');
    // 选择框的弹出面板是它外壳的兄弟，不算
    const [select, field, button] = [...group.children].filter(
      (child) => !child.hasAttribute('popover'),
    ) as HTMLElement[];
    expect(
      [select!, field!, button!].map((part) => hasStyles(part, attachedStyles.horizontal)),
    ).toEqual([true, true, true]);
    expect(hasStyles(field!, grow)).toBe(true);
  });

  it('竖排：上下相连；不在组里的输入框不相连', () => {
    const root = mount(() => (
      <div>
        <ControlGroup orientation="vertical" aria-label="地址">
          <TextField _value="" aria-label="省市区" />
          <TextField _value="" aria-label="详细地址" />
        </ControlGroup>
        <TextField _value="" aria-label="备注" />
      </div>
    ));
    const [group, alone] = [...root.firstElementChild!.children] as HTMLElement[];
    expect(hasStyles(group!.firstElementChild!, attachedStyles.vertical)).toBe(true);
    expect(hasStyles(group!.firstElementChild!, grow)).toBe(false);
    expect(hasStyles(alone!, attachedStyles.horizontal)).toBe(false);
  });

  it('放在 Field 里：组接 Field 的标签与说明，里面的控件不重复拿 Field 的 id', () => {
    const root = mount(() => (
      <Field label="合同金额" description="按当天中间价换算">
        <ControlGroup>
          <Select items={['USD', 'CNY']} _value="USD" aria-label="币种" />
          <TextField _value="" aria-label="金额" />
        </ControlGroup>
      </Field>
    ));
    const group = root.querySelector<HTMLElement>('[role="group"]')!;
    const label = root.querySelector('label')!;
    expect(label.htmlFor).toBe(group.id);
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
    const ids = [...root.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(root.querySelector('input')!.id).not.toBe(group.id);
  });
});
