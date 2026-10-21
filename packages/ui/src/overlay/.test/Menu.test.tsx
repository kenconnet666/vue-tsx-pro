// Menu：菜单项的说明（description）只作描述、不进名称；没有说明时不加关联（键盘、定位见浏览器测试）
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Menu, MenuCheckboxItem, MenuItem, MenuLinkItem } from '../Menu';

describe('Menu 的说明', () => {
  it('有说明时名称指向文字、描述指向说明；没有说明时两者都不加', () => {
    const root = mount(() => (
      <Menu lazy={false} trigger={(props) => <button {...props}>新建</button>}>
        <MenuItem description="空白的文字文档" propsDescription={{ class: 'hint' }}>
          文档
        </MenuItem>
        <MenuCheckboxItem description="显示行号与折叠">代码视图</MenuCheckboxItem>
        <MenuLinkItem href="/help" description="使用说明">
          帮助
        </MenuLinkItem>
        <MenuItem>文件夹</MenuItem>
      </Menu>
    ));
    const items = [
      ...root.ownerDocument.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemcheckbox"]',
      ),
    ];
    const relation = (item: HTMLElement) => {
      const label = item.getAttribute('aria-labelledby');
      const description = item.getAttribute('aria-describedby');
      return [
        label && root.ownerDocument.getElementById(label)?.textContent,
        description && root.ownerDocument.getElementById(description)?.textContent,
      ];
    };
    expect(items.map(relation)).toEqual([
      ['文档', '空白的文字文档'],
      ['代码视图', '显示行号与折叠'],
      ['帮助', '使用说明'],
      [null, null],
    ]);
    expect(root.ownerDocument.querySelector('.hint')!.textContent).toBe('空白的文字文档');
  });
});
