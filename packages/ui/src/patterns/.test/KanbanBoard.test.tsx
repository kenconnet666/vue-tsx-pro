// KanbanBoard：列与计数、把手；键盘拿起、换列、放下、取消，能不能放由 canMove 决定（指针拖动见文档站）
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { KanbanBoard, type KanbanColumn } from '../KanbanBoard';

interface Card {
  id: string;
  title: string;
  stage: string;
}

const columns: KanbanColumn[] = [
  { key: 'todo', label: '待处理' },
  { key: 'doing', label: '处理中' },
  { key: 'done', label: '已完成' },
];

const key = (element: HTMLElement, name: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

function renderBoard() {
  const onMove = vi.fn();
  const onReject = vi.fn();
  const cards: Card[] = [
    { id: 'a', title: '写文档', stage: 'todo' },
    { id: 'b', title: '修 bug', stage: 'doing' },
  ];
  const root = mount(() => (
    <KanbanBoard
      aria-label="看板"
      columns={columns}
      items={cards}
      getKey={(card) => card.id}
      getColumn={(card) => card.stage}
      getLabel={(card) => card.title}
      canMove={(card, to) =>
        columns.findIndex((column) => column.key === to) ===
        columns.findIndex((column) => column.key === card.stage) + 1
          ? null
          : '只能到下一列'
      }
      onMove={onMove}
      onReject={onReject}
    >
      {(card) => <span>{card.title}</span>}
    </KanbanBoard>
  ));
  const handle = (title: string) =>
    root.querySelector<HTMLButtonElement>(`[aria-label="移动 ${title}"]`)!;
  const live = () => root.querySelector('[aria-live]')!.textContent;
  return { root, handle, live, onMove, onReject };
}

describe('KanbanBoard', () => {
  it('一列一个 section（列名是它的名称），列名旁是卡片数；空列写“没有”', () => {
    const { root } = renderBoard();
    const sections = root.querySelectorAll('section');
    expect(sections).toHaveLength(3);
    const first = sections[0]!;
    expect(root.querySelector(`#${first.getAttribute('aria-labelledby')}`)!.textContent).toBe(
      '待处理',
    );
    expect(first.textContent).toContain('1');
    expect(sections[2]!.querySelector('li')!.textContent).toBe('没有');
  });

  it('键盘：拿起、→ 换到下一列、放下，报告 onMove 并播报', async () => {
    const { handle, live, onMove } = renderBoard();
    key(handle('写文档'), ' ');
    await nextTick();
    expect(handle('写文档').getAttribute('aria-pressed')).toBe('true');
    expect(live()).toContain('写文档');
    key(handle('写文档'), 'ArrowRight');
    await nextTick();
    expect(live()).toContain('处理中');
    key(handle('写文档'), 'Enter');
    await nextTick();
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'doing', 0);
  });

  it('不能放的列：经过时那一列标出原因，放下时弹回、报告 onReject 而不是 onMove', async () => {
    const { root, handle, live, onMove, onReject } = renderBoard();
    key(handle('写文档'), ' ');
    key(handle('写文档'), 'ArrowRight');
    key(handle('写文档'), 'ArrowRight');
    await nextTick();
    const done = root.querySelectorAll('section')[2]!;
    expect(done.dataset.drop).toBe('denied');
    expect(done.textContent).toContain('只能到下一列');
    key(handle('写文档'), ' ');
    await nextTick();
    expect(onMove).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a' }),
      'done',
      '只能到下一列',
    );
    expect(live()).toContain('只能到下一列');
  });

  it('换到别的列后 ↑ / ↓ 调整落点：插入线跟着走，onMove 带上位置', async () => {
    const { root, handle, live, onMove } = renderBoard();
    key(handle('写文档'), ' ');
    key(handle('写文档'), 'ArrowRight');
    await nextTick();
    const doing = () => root.querySelectorAll('section')[1]!;
    const indicatorIndex = () =>
      [...doing().querySelectorAll('li')].findIndex((li) => li.getAttribute('aria-hidden'));
    expect(doing().dataset.drop).toBe('allowed');
    expect(indicatorIndex()).toBe(0);
    key(handle('写文档'), 'ArrowDown');
    await nextTick();
    expect(indicatorIndex()).toBe(1);
    expect(live()).toContain('处理中 第 2 位');
    key(handle('写文档'), ' ');
    await nextTick();
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'doing', 1);
    expect(doing().querySelector('li[aria-hidden="true"]')).toBeNull();
  });

  it('给了 onReorder 时列内用 ↑ / ↓ 排序，写回整个数组', async () => {
    let cards: Card[] = [
      { id: 'a', title: '写文档', stage: 'todo' },
      { id: 'b', title: '修 bug', stage: 'doing' },
      { id: 'c', title: '发版', stage: 'todo' },
    ];
    const root = mount(() => (
      <KanbanBoard
        aria-label="看板"
        columns={columns}
        items={cards}
        getKey={(card) => card.id}
        getColumn={(card) => card.stage}
        getLabel={(card) => card.title}
        onMove={() => {}}
        onReorder={(next) => (cards = next)}
      >
        {(card) => <span>{card.title}</span>}
      </KanbanBoard>
    ));
    const handle = root.querySelector<HTMLButtonElement>('[aria-label="移动 写文档"]')!;
    key(handle, ' ');
    key(handle, 'ArrowDown');
    await nextTick();
    expect(cards.map((card) => card.id)).toEqual(['b', 'c', 'a']);
  });

  it('Esc 取消：不报告，卡片留在原来的列', async () => {
    const { handle, live, onMove, onReject } = renderBoard();
    key(handle('修 bug'), 'Enter');
    key(handle('修 bug'), 'ArrowRight');
    key(handle('修 bug'), 'Escape');
    await nextTick();
    expect(handle('修 bug').getAttribute('aria-pressed')).toBe('false');
    expect(onMove).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
    expect(live()).toContain('处理中');
  });
});
