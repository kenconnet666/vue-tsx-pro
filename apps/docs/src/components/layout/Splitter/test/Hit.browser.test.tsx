// 分隔条按得到：指针落在分隔条上（收起按钮以外）时命中的是分隔条自己（分隔条那一格的伪元素曾经叠在它上面，鼠标拖不动）
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import MasterDetail from '../demo/MasterDetail';
import Vertical from '../demo/Vertical';

const hitsHandle = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('[data-scope="splitter"][data-part="handle"]')].map(
    (handle) => {
      const { x, y, width, height } = handle.getBoundingClientRect();
      // 中间叠着收起按钮，取沿分隔条四分之一处
      const hit = document.elementFromPoint(
        x + (width > height ? width / 4 : width / 2),
        y + (height > width ? height / 4 : height / 2),
      );
      return !!hit && handle.contains(hit);
    },
  );

it('左右排的分隔条：按得到分隔条', () => {
  const result = hitsHandle(mount(MasterDetail));
  expect(result.length).toBeGreaterThan(0);
  expect(result.every(Boolean)).toBe(true);
});

it('上下排的分隔条：按得到分隔条', () => {
  const result = hitsHandle(mount(Vertical));
  expect(result.length).toBeGreaterThan(0);
  expect(result.every(Boolean)).toBe(true);
});
