// 菜单的结构：MenuGroup、MenuRadioGroup 是带标题名称的 group，单选项跟着 _value 勾选、点了写回；
// MenuSub 是带子菜单的项（aria-haspopup、aria-expanded）；ContextMenu 右键时从指针位置打开
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { ContextMenu } from '../ContextMenu';
import { Menu, MenuGroup, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSub } from '../Menu';

describe('MenuGroup、MenuRadioGroup', () => {
  it('分组以标题为名称；单选项跟着 _value 勾选，点另一项写回', async () => {
    let sort = _state('name');
    mount(() => (
      <Menu lazy={false} trigger={(props) => <button {...props}>视图</button>}>
        <MenuGroup label="操作">
          <MenuItem>刷新</MenuItem>
        </MenuGroup>
        <MenuRadioGroup label="排序" _value={sort}>
          <MenuRadioItem value="name">名称</MenuRadioItem>
          <MenuRadioItem value="date">日期</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>
    ));
    const groups = [...document.querySelectorAll<HTMLElement>('[role="group"]')];
    const names = groups.map(
      (group) => document.getElementById(group.getAttribute('aria-labelledby')!)?.textContent,
    );
    expect(names).toEqual(['操作', '排序']);

    const radios = () => [...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    expect(radios().map((radio) => radio.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    radios()[1]!.click();
    await nextTick();
    expect(sort).toBe('date');
    expect(radios().map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'true']);
  });
});

describe('MenuSub', () => {
  it('是带子菜单的项：aria-haspopup="menu"，点了展开', async () => {
    mount(() => (
      <Menu lazy={false} trigger={(props) => <button {...props}>更多</button>}>
        <MenuSub label="导出为">
          <MenuItem>PDF</MenuItem>
          <MenuItem>Excel</MenuItem>
        </MenuSub>
      </Menu>
    ));
    const sub = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((item) =>
      item.textContent?.includes('导出为'),
    )!;
    expect(sub.getAttribute('aria-haspopup')).toBe('menu');
    expect(sub.getAttribute('aria-expanded')).toBe('false');
    sub.click();
    await nextTick();
    expect(sub.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('ContextMenu', () => {
  it('在区域里右键打开菜单（阻止浏览器自己的）；在菜单上右键不再打开', async () => {
    let open = false;
    const root = mount(() => (
      <ContextMenu
        onOpenChange={(next) => (open = next)}
        menu={<MenuItem>重命名</MenuItem>}
        propsMenu={{ lazy: false }}
      >
        <button>文件</button>
      </ContextMenu>
    ));
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 40,
      clientY: 20,
    });
    root.querySelector('button')!.dispatchEvent(event);
    await nextTick();
    expect(event.defaultPrevented).toBe(true);
    expect(open).toBe(true);
  });

  it('disabled 时不弹出，浏览器的右键菜单照常', async () => {
    let open = false;
    const root = mount(() => (
      <ContextMenu
        disabled
        onOpenChange={(next) => (open = next)}
        menu={<MenuItem>重命名</MenuItem>}
      >
        <button>文件</button>
      </ContextMenu>
    ));
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    root.querySelector('button')!.dispatchEvent(event);
    await nextTick();
    expect(event.defaultPrevented).toBe(false);
    expect(open).toBe(false);
  });
});
