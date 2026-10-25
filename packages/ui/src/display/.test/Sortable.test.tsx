// Sortable：把手的名称与说明；键盘拿起、移动、放下、取消，顺序写回并播报（指针拖动见浏览器测试）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Sortable } from '../Sortable';

interface Task {
  id: string;
  title: string;
}

const flush = async () => {
  for (let i = 0; i < 3; i++) await nextTick();
};
const key = (element: HTMLElement, name: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

function renderList() {
  let tasks = _state<Task[]>([
    { id: 'a', title: '写文档' },
    { id: 'b', title: '修 bug' },
    { id: 'c', title: '发版' },
  ]);
  const root = mount(() => (
    <Sortable
      _items={tasks}
      getKey={(task) => task.id}
      getLabel={(task) => task.title}
      aria-label="待办"
    >
      {(task) => <span>{task.title}</span>}
    </Sortable>
  ));
  const handle = (title: string) =>
    root.querySelector<HTMLButtonElement>(`[aria-label="移动 ${title}"]`)!;
  const live = () => root.querySelector('[aria-live]')!.textContent;
  return { root, handle, live, order: () => tasks.map((task) => task.id) };
}

describe('Sortable', () => {
  it('把手是带名称的按钮，经 aria-describedby 关联操作说明', () => {
    const { root, handle } = renderList();
    const button = handle('写文档');
    expect(button.type).toBe('button');
    const description = document.getElementById(button.getAttribute('aria-describedby')!);
    expect(description!.textContent).toContain('按空格拿起');
    expect(root.querySelector('ul')!.getAttribute('aria-label')).toBe('待办');
  });

  it('空格拿起、↓ 移动一位、空格放下：顺序写回，每一步都播报', async () => {
    const { handle, live, order } = renderList();
    const button = handle('写文档');
    button.focus();
    key(button, ' ');
    await flush();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(live()).toBe('已拿起 写文档，在第 1 位，共 3 项');
    key(button, 'ArrowDown');
    await flush();
    expect(order()).toEqual(['b', 'a', 'c']);
    expect(live()).toBe('写文档 移到第 2 位，共 3 项');
    expect(document.activeElement).toBe(handle('写文档'));
    key(handle('写文档'), 'End');
    await flush();
    expect(order()).toEqual(['b', 'c', 'a']);
    key(handle('写文档'), ' ');
    await flush();
    expect(handle('写文档').getAttribute('aria-pressed')).toBe('false');
    expect(live()).toBe('已放下 写文档，在第 3 位，共 3 项');
  });

  it('Esc 取消：回到拿起时的位置', async () => {
    const { handle, live, order } = renderList();
    const button = handle('发版');
    button.focus();
    key(button, 'Enter');
    key(button, 'ArrowUp');
    await flush();
    key(handle('发版'), 'ArrowUp');
    await flush();
    expect(order()).toEqual(['c', 'a', 'b']);
    key(handle('发版'), 'Escape');
    await flush();
    expect(order()).toEqual(['a', 'b', 'c']);
    expect(live()).toBe('已取消，发版 回到第 3 位');
  });
});
