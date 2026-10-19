// AvatarGroup：超过 max 折叠成 +N（total 优先）；组里的头像知道自己在组里；v-for 的数组、Fragment 都能数
import { expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Avatar } from '../Avatar';
import { AvatarGroup } from '../AvatarGroup';

const names = ['张三', '李四', '王五', '赵六', '钱七'];

it('超过 max 的折叠成“+N”，读屏念“还有 N 人”', () => {
  const root = mount(() => (
    <AvatarGroup max={3} aria-label="协作者">
      {names.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  ));
  const group = root.firstElementChild!;
  expect(group.getAttribute('role')).toBe('group');
  const items = [...group.children];
  expect(items).toHaveLength(4);
  expect(items.at(-1)!.getAttribute('aria-label')).toBe('还有 2 人');
  expect(items.at(-1)!.textContent).toBe('+2');
});

it('total 给了时按它算；没超过 max 时不折叠', () => {
  const root = mount(() => (
    <>
      <AvatarGroup max={3} total={40} class="partial">
        <Avatar name="A" />
        <>
          <Avatar name="B" />
          <Avatar name="C" />
          <Avatar name="D" />
        </>
      </AvatarGroup>
      <AvatarGroup max={3} class="all">
        <Avatar name="A" />
      </AvatarGroup>
    </>
  ));
  expect(root.querySelector('.partial')!.lastElementChild!.textContent).toBe('+37');
  expect(root.querySelector('.all')!.children).toHaveLength(1);
});
