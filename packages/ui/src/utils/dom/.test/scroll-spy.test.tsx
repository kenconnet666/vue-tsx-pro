// useScrollSpy：越过阅读线的最后一节是当前节；滚动容器挂载后才传入时按新容器重新算
import { afterEach, expect, it } from 'vitest';
import { _component } from '@vue-tsx-pro/tsx';
import { nextTick, ref } from 'vue';
import { mount } from '../../.test/mount';
import { useScrollSpy } from '../scroll-spy';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** 一个元素：getBoundingClientRect 的 top 由 read 给出 */
function box(id: string, read: () => number, height = 100) {
  const element = document.createElement('div');
  element.id = id;
  element.getBoundingClientRect = () =>
    ({ top: read(), bottom: read() + height, height }) as DOMRect;
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
});

it('换成滚动容器后按容器的位置重新计算', async () => {
  // 容器在页面下方 500px：按窗口算，三节都还没到阅读线；按容器算，第一节已经在顶上
  const container = box('container', () => 500, 300);
  Object.defineProperties(container, {
    scrollTop: { value: 0 },
    clientHeight: { value: 300 },
    scrollHeight: { value: 900 },
  });
  box('a', () => 500);
  box('b', () => 700);
  box('c', () => 900);
  const root = ref<HTMLElement | null>(null);
  let current: { value: string | undefined } = { value: undefined };
  const Spy = _component(() => {
    current = useScrollSpy(() => ({ ids: ['a', 'b', 'c'], root: root.value }));
    return () => null;
  });
  mount(() => <Spy />);
  await nextFrame();
  // happy-dom 里窗口没有滚动高度、总算作滚到底：高亮视口里的最后一节
  expect(current.value).toBe('b');

  root.value = container;
  await nextTick();
  await nextFrame();
  expect(current.value).toBe('a');
});
