// ControlGroup：role="group"，里面的输入框外壳与按钮相连（横排时输入框分剩余宽度、选择框按内容宽），竖排换一组样式
import { describe, expect, it } from 'vitest';
import { Button } from '../../base/Button';
import { attachedStyles } from '../../utils/style/attached';
import { hasStyles, mount } from '../../utils/.test/mount';
import { controlShellStyles } from '../control';
import { ControlGroup } from '../ControlGroup';
import { Select } from '../Select';
import { TextField } from '../TextField';

describe('ControlGroup', () => {
  it('组里的输入框、选择框、按钮都相连；输入框分剩余宽度', () => {
    const root = mount(() => (
      <ControlGroup aria-label="搜索">
        <Select items={['全部', '标题']} value="全部" aria-label="范围" />
        <TextField value="" aria-label="关键词" />
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
    expect(hasStyles(field!, controlShellStyles.grow)).toBe(true);
  });

  it('竖排：上下相连；不在组里的输入框不相连', () => {
    const root = mount(() => (
      <div>
        <ControlGroup orientation="vertical" aria-label="地址">
          <TextField value="" aria-label="省市区" />
          <TextField value="" aria-label="详细地址" />
        </ControlGroup>
        <TextField value="" aria-label="备注" />
      </div>
    ));
    const [group, alone] = [...root.firstElementChild!.children] as HTMLElement[];
    expect(hasStyles(group!.firstElementChild!, attachedStyles.vertical)).toBe(true);
    expect(hasStyles(group!.firstElementChild!, controlShellStyles.grow)).toBe(false);
    expect(hasStyles(alone!, attachedStyles.horizontal)).toBe(false);
  });
});
