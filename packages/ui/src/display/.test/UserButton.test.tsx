// UserButton：头像 + 名字 + 箭头；有说明时占满一行、箭头换成上下双箭头；只剩头像时名字是按钮的名称；能当菜单的触发器
import { describe, expect, it } from 'vitest';
import { Menu, MenuItem } from '../../overlay/Menu';
import { mount } from '../../utils/.test/mount';
import { UserButton } from '../UserButton';

const part = (root: Element, name: string) =>
  root.querySelector(`[data-scope="user-button"][data-part="${name}"]`);

describe('UserButton', () => {
  it('头像、名字、箭头；名称来自看得见的名字', () => {
    const root = mount(() => <UserButton name="林小满" />);
    const button = root.querySelector('button')!;
    expect(button.getAttribute('data-part')).toBe('root');
    expect(part(root, 'name')!.textContent).toBe('林小满');
    expect(part(root, 'avatar')).not.toBeNull();
    expect(part(root, 'indicator')).not.toBeNull();
    expect(part(root, 'description')).toBeNull();
    expect(button.hasAttribute('aria-label')).toBe(false);
  });

  it('有说明时多一行；compact 只剩头像，名字成了 aria-label', () => {
    const root = mount(() => (
      <>
        <UserButton name="林小满" description="采购部 · 管理员" />
        <UserButton name="周一航" compact />
      </>
    ));
    const [full, compact] = [...root.querySelectorAll('button')];
    expect(full!.textContent).toContain('采购部 · 管理员');
    expect(compact!.getAttribute('aria-label')).toBe('周一航');
    expect(part(compact!, 'name')).toBeNull();
    expect(part(compact!, 'indicator')).toBeNull();
  });

  it('indicator={false} 不要箭头；部件属性合并到对应的节点', () => {
    const root = mount(() => (
      <UserButton
        name="林小满"
        indicator={false}
        propsName={{ class: 'who' }}
        propsAvatar={{ class: 'face' }}
      />
    ));
    expect(part(root, 'indicator')).toBeNull();
    expect(root.querySelector('.who')!.textContent).toBe('林小满');
    expect(root.querySelector('.face')).not.toBeNull();
  });

  it('当菜单的触发器：触发器的属性（aria-haspopup、aria-expanded）落到按钮上', () => {
    const root = mount(() => (
      <Menu lazy={false} trigger={(props) => <UserButton {...props} name="林小满" />}>
        <MenuItem>退出登录</MenuItem>
      </Menu>
    ));
    const button = root.querySelector('button')!;
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
