// 通知中心：未读数、按类型与只看未读筛选、点一条与全部标为已读（弹出层的开关见浏览器测试；这里 lazy={false} 直接看内容）
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { NotificationCenter, NotificationList, type NotificationItem } from '../NotificationCenter';

const NOW = Date.parse('2026-10-21T10:00:00+08:00');
const items: NotificationItem[] = [
  {
    id: '1',
    title: '新的待办：资料审核',
    description: 'PO-2026-0012',
    time: '2026-10-21T09:30:00+08:00',
    type: 'todo',
    read: false,
  },
  {
    id: '2',
    title: '被退回：方案设计',
    time: '2026-10-20T16:00:00+08:00',
    type: 'returned',
    read: false,
    tone: 'warning',
  },
  { id: '3', title: '催办', time: '2026-10-18T10:00:00+08:00', type: 'remind', read: true },
];
const types = [
  { key: 'todo', label: '待办' },
  { key: 'returned', label: '退回' },
  { key: 'remind', label: '催办' },
];

const titles = (root: Element) =>
  [...root.querySelectorAll('li [data-state]')].map((item) => item.getAttribute('data-state'));

describe('NotificationCenter', () => {
  it('铃铛的名称带未读数；打开后新的在前，未读的给读屏标“未读”，时间写成相对现在', async () => {
    const root = mount(() => (
      <NotificationCenter items={items} types={types} lazy={false} now={NOW} />
    ));
    // 弹出层的面板挂载后的下一次渲染才出现
    await nextTick();
    const bell = document.querySelector('button[aria-label^="通知"]')!;
    expect(bell.getAttribute('aria-label')).toBe('通知，未读 2 条');
    const panel = document.body;
    expect(titles(panel)).toEqual(['unread', 'unread', 'read']);
    expect(panel.textContent).toContain('未读 新的待办：资料审核');
    expect(panel.querySelector('time')!.textContent).toBe('30分钟前');
    root.remove();
  });

  it('点一条：报告读过了、交给 onItemClick；全部标为已读报告全部未读的', async () => {
    const onRead = vi.fn();
    const onItemClick = vi.fn();
    mount(() => (
      <NotificationCenter
        items={items}
        lazy={false}
        now={NOW}
        onRead={onRead}
        onItemClick={onItemClick}
      />
    ));
    await nextTick();
    document.querySelector<HTMLElement>('li [data-state="unread"]')!.click();
    expect(onRead).toHaveBeenCalledWith(['1']);
    expect(onItemClick).toHaveBeenCalledWith(items[0]);
    onRead.mockClear();
    await nextTick();
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent === '全部标为已读')!
      .click();
    expect(onRead).toHaveBeenCalledWith(['1', '2']);
  });

  it('按类型筛选、只看未读；筛完没有时显示“没有符合条件的通知”', async () => {
    document.body.innerHTML = '';
    mount(() => <NotificationCenter items={items} types={types} lazy={false} now={NOW} />);
    await nextTick();
    const button = (text: string) =>
      [...document.querySelectorAll('button')].find((item) => item.textContent === text)!;
    button('催办').click();
    await nextTick();
    expect(titles(document.body)).toEqual(['read']);
    document
      .querySelector<HTMLInputElement>('input[role="switch"], input[type="checkbox"]')!
      .click();
    await nextTick();
    // 有通知、只是筛掉了：不说“没有通知”
    expect(document.body.textContent).toContain('没有符合条件的通知');
  });
});

describe('NotificationList', () => {
  it('放在页面里（不用铃铛）：有 href 的是链接，没有的是按钮，Enter 与点击一样报告读过了', async () => {
    const read: string[][] = [];
    const root = mount(() => (
      <NotificationList
        items={[
          ...items,
          {
            id: '4',
            title: '查看报表',
            time: '2026-10-21T09:50:00+08:00',
            read: false,
            href: '/reports',
          },
        ]}
        now={NOW}
        onRead={(ids) => read.push(ids)}
      />
    ));
    const link = [...root.querySelectorAll<HTMLElement>('li > a[href]')];
    const buttons = [...root.querySelectorAll<HTMLElement>('li > [role="button"]')];
    expect(link.map((item) => item.textContent?.includes('查看报表'))).toEqual([true]);
    expect(buttons).toHaveLength(3);
    const todo = buttons.find((item) => item.textContent?.includes('资料审核'))!;
    todo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();
    expect(read).toEqual([['1']]);
  });
});
