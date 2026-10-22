// 时限标记：按工作日算剩余、到期、超时，颜色随状态；工作日历取自配置
import { describe, expect, it } from 'vitest';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { createWorkCalendar } from '../../utils/data/workdays';
import { DeadlineTag } from '../DeadlineTag';

// 2026-10-21 是周三
const TODAY = '2026-10-21';
const tag = (node: Parameters<typeof mount>[0]) => {
  const badge = mount(node).querySelector<HTMLElement>('[data-state]')!;
  return {
    // 看得见的文字：去掉给读屏的那一段
    text: [...badge.childNodes]
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => child.textContent)
      .join('')
      .trim(),
    state: badge.dataset.state,
    title: badge.title,
    reader: badge.textContent,
  };
};

describe('DeadlineTag', () => {
  it('还早、快到期、今天到期、超时：文字与状态；悬停与读屏有截止日', () => {
    expect(tag(() => <DeadlineTag due="2026-10-30" today={TODAY} />)).toMatchObject({
      text: '剩 7 个工作日',
      state: 'pending',
      title: '截止 2026-10-30',
    });
    expect(tag(() => <DeadlineTag due="2026-10-23" today={TODAY} />)).toMatchObject({
      text: '剩 2 个工作日',
      state: 'soon',
    });
    expect(tag(() => <DeadlineTag due={TODAY} today={TODAY} />)).toMatchObject({
      text: '今天到期',
      state: 'due',
    });
    const late = tag(() => <DeadlineTag due="2026-10-16" today={TODAY} />);
    expect(late).toMatchObject({ text: '超时 3 个工作日', state: 'overdue' });
    expect(late.reader).toContain('截止 2026-10-16');
  });

  it('开始日加几个工作日；完成了显示按时或超时完成', () => {
    // 周五开始，加 2 个工作日是下周二
    expect(tag(() => <DeadlineTag start="2026-10-16" workdays={2} today={TODAY} />).title).toBe(
      '截止 2026-10-20',
    );
    expect(
      tag(() => <DeadlineTag due="2026-10-20" done="2026-10-19" today={TODAY} />),
    ).toMatchObject({ text: '按时完成', state: 'done' });
    expect(tag(() => <DeadlineTag due="2026-10-16" done="2026-10-20" />).text).toBe(
      '超时 2 个工作日完成',
    );
  });

  it('节假日不算工作日：按 Provider 的工作日历', () => {
    const calendar = createWorkCalendar({ holidays: [['2026-10-22', '2026-10-23']] });
    const result = tag(() => (
      <Provider workCalendar={calendar}>
        <DeadlineTag due="2026-10-26" today={TODAY} />
      </Provider>
    ));
    expect(result.text).toBe('剩 1 个工作日');
  });

  it('没有截止日时什么都不画', () => {
    expect(mount(() => <DeadlineTag due={null} />).querySelector('span')).toBeNull();
  });
});
