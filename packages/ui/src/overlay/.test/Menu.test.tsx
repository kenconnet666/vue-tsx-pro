// Menu：菜单项的说明（description）只作描述、不进名称；没有说明时不加关联（键盘、定位见浏览器测试）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Menu, MenuCheckboxItem, MenuItem, MenuLinkItem } from '../Menu';
import { Popover } from '../Popover';

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

describe('弹层的名称', () => {
  it('默认以触发器的文字为名称；写了 aria-label 时不再加 aria-labelledby（它会盖过 aria-label）', async () => {
    const root = mount(() => (
      <>
        <Menu lazy={false} trigger={(props) => <button {...props}>更多</button>}>
          <MenuItem>复制</MenuItem>
        </Menu>
        <Menu lazy={false} aria-label="行操作" trigger={(props) => <button {...props}>…</button>}>
          <MenuItem>删除</MenuItem>
        </Menu>
        <Popover trigger={(props) => <button {...props}>筛选</button>}>内容</Popover>
        <Popover aria-label="筛选条件" trigger={(props) => <button {...props}>筛选</button>}>
          内容
        </Popover>
      </>
    ));
    await nextTick();
    const [byTrigger, own] = root.ownerDocument.querySelectorAll('[role="menu"]');
    const trigger = root.querySelector('button')!;
    expect(byTrigger!.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(own!.hasAttribute('aria-labelledby')).toBe(false);
    expect(own!.getAttribute('aria-label')).toBe('行操作');
    const [popover, named] = root.ownerDocument.querySelectorAll('[role="dialog"]');
    expect(popover!.hasAttribute('aria-labelledby')).toBe(true);
    expect([named!.hasAttribute('aria-labelledby'), named!.getAttribute('aria-label')]).toEqual([
      false,
      '筛选条件',
    ]);
  });
});
