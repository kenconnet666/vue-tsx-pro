// CalendarBoard：数据按天放进格子（跨天的每天都有）、超出的收成“还有 N 项”（点了选中那天）、
// 日期数字的读屏名称带日程数、键盘移动焦点、翻页写回 month、日期旁边的小字与 renderDay
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { CalendarBoard } from '../CalendarBoard';

interface Item {
  title: string;
  date: string;
  end?: string;
}

const items: Item[] = [
  { title: '周会', date: '2026-10-19' },
  { title: '评审', date: '2026-10-19T14:00' },
  { title: '复盘', date: '2026-10-19' },
  { title: '预算', date: '2026-10-19' },
  { title: '出差', date: '2026-10-14', end: '2026-10-16' },
];

const flush = async () => {
  for (let index = 0; index < 4; index++) await nextTick();
};
const cell = (root: HTMLElement, date: string) =>
  root.querySelector<HTMLElement>(`td[data-date="${date}"]`)!;
const texts = (root: HTMLElement, date: string) =>
  [...cell(root, date).querySelectorAll('li')].map((item) => item.textContent);

describe('CalendarBoard', () => {
  it('数据按天放进格子，跨天的每天都有；超出 maxEvents 的收成“还有 N 项”，点了选中那天', async () => {
    let day = _state<string | null>(null);
    const root = mount(() => (
      <CalendarBoard
        events={items}
        getEventDate={(item) => item.date}
        getEventEnd={(item) => item.end ?? item.date}
        getEventLabel={(item) => item.title}
        value={_bind(day)}
        month="2026-10"
        maxEvents={3}
        aria-label="日程"
      />
    ));
    await flush();
    expect(texts(root, '2026-10-19')).toEqual(['周会', '评审', '复盘', '还有 1 项']);
    expect(texts(root, '2026-10-15')).toEqual(['出差']);
    expect(texts(root, '2026-10-16')).toEqual(['出差']);
    expect(texts(root, '2026-10-17')).toEqual([]);
    const button = cell(root, '2026-10-19').querySelector<HTMLButtonElement>('[data-day]')!;
    expect(button.getAttribute('aria-label')).toContain('4 项日程');
    [...cell(root, '2026-10-19').querySelectorAll('button')].at(-1)!.click();
    await flush();
    expect(day).toBe('2026-10-19');
    expect(cell(root, '2026-10-19').getAttribute('aria-selected')).toBe('true');
  });

  it('键盘：→ 移到下一天，Page Down 翻到下个月并写回 month', async () => {
    let month = _state('2026-10');
    const root = mount(() => (
      <CalendarBoard value="2026-10-30" month={_bind(month)} aria-label="日程" />
    ));
    await flush();
    const focused = () => root.querySelector<HTMLElement>('[data-day][data-focused]')!;
    focused().focus();
    focused().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await flush();
    expect(focused().closest('td')!.dataset.date).toBe('2026-10-31');
    focused().dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    await flush();
    expect(month).toBe('2026-11');
    expect(focused().closest('td')!.dataset.date).toBe('2026-11-30');
  });

  it('getDayNote 是日期旁边的小字；renderDay 拿到这一天的状态', async () => {
    const root = mount(() => (
      <CalendarBoard
        month="2026-10"
        getDayNote={(date) => (date === '2026-10-01' ? '国庆节' : undefined)}
        renderDay={(date, state) => (state.weekend && !state.outside ? <i>周末 {date}</i> : null)}
        aria-label="排班"
      />
    ));
    await flush();
    expect(cell(root, '2026-10-01').textContent).toContain('国庆节');
    // 2026-10-03 是周六
    expect(cell(root, '2026-10-03').querySelector('i')!.textContent).toBe('周末 2026-10-03');
    expect(cell(root, '2026-10-05').querySelector('i')).toBeNull();
  });
});
