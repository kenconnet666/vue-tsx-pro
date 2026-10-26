// useLayoutAnimation：时长为 0（减少动态效果、读不到主题）时只改数据；容器没挂载时也照样改（位移动画见浏览器测试）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { shallowRef } from 'vue';
import { expect, it } from 'vitest';
import { mount } from '../../.test/mount';
import { useLayoutAnimation, type LayoutAnimation } from '../layout';

it('读不到主题时直接改数据，DOM 更新后完成', async () => {
  const items = shallowRef([1, 2, 3]);
  let layout!: LayoutAnimation;
  const List = _component(() => {
    const list = shallowRef<HTMLElement | null>(null);
    layout = useLayoutAnimation(() => list.value);
    return () => (
      <ul ref={list}>
        {items.value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  });
  const host = mount(() => <List />);
  await layout.change(() => (items.value = [3, 1]));
  expect([...host.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['3', '1']);
});

it('容器还没挂载时照样改数据', async () => {
  let done = false;
  const Probe = _component(() => {
    void useLayoutAnimation(() => null).change(() => (done = true));
    return () => null;
  });
  mount(() => <Probe />);
  expect(done).toBe(true);
});
