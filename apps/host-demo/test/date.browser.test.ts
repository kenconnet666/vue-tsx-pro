// 日期组件在真实浏览器里：日历的键盘与焦点、区间的悬停预览、分段输入的真实键盘输入（beforeinput）、axe（演示页 /date）
import axe from 'axe-core';
import { afterTransitions } from '@vue-tsx-pro/ui';
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let app: App;
let root: HTMLElement;

beforeEach(async () => {
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/date');
  await host.router.isReady();
  root = document.createElement('div');
  document.body.append(root);
  app = host.app;
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
});

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
const day = (calendar: string, date: string) =>
  $<HTMLButtonElement>(`${calendar} [data-date="${date}"]`);

async function checkAxe(context: Element) {
  const result = await axe.run(context, { resultTypes: ['violations'] });
  expect(result.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

describe('Calendar', () => {
  it('Tab 进入时落在已选日期上；方向键移动焦点，跨月时翻页并把焦点交给新格子', async () => {
    const selected = day('.calendar-demo', '2026-10-20');
    expect(selected.tabIndex).toBe(0);
    selected.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.activeElement).toBe(day('.calendar-demo', '2026-11-03'));
    expect($('.calendar-demo [role="grid"]').getAttribute('aria-label')).toBe('2026年11月');
    await userEvent.keyboard('{Home}');
    expect((document.activeElement as HTMLElement).dataset.date).toBe('2026-11-02');
    await userEvent.keyboard('{Enter}');
    expect($('.calendar-summary').textContent).toContain('出发：2026-11-02');
  });

  it('不越过最小日期；点标题切到月份视图，点一个月回到它的日期', async () => {
    day('.calendar-demo', '2026-10-05').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect((document.activeElement as HTMLElement).dataset.date).toBe('2026-10-05');
    await userEvent.click($('.calendar-demo [aria-label^="选择月份"]'));
    expect($('.calendar-demo').dataset.view).toBe('month');
    await userEvent.click(day('.calendar-demo', '2026-12-01'));
    expect($('.calendar-demo').dataset.view).toBe('day');
    expect($('.calendar-demo [role="grid"]').getAttribute('aria-label')).toBe('2026年12月');
  });

  it('axe-core 没有违规', async () => {
    await checkAxe($('.calendar-demo'));
  });
});

describe('RangeCalendar', () => {
  it('点开始、悬停预览、点结束；订满的日子挡住另一侧', async () => {
    await userEvent.click(day('.range-calendar-demo', '2026-10-12'));
    await userEvent.hover(day('.range-calendar-demo', '2026-10-15'));
    expect(day('.range-calendar-demo', '2026-10-14').closest('td')!.dataset.inRange).toBe('true');
    expect(day('.range-calendar-demo', '2026-10-20').getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(day('.range-calendar-demo', '2026-10-15'));
    expect($('.calendar-summary').textContent).toContain('入住：2026-10-12 至 2026-10-15');
  });

  it('两个月并排，axe-core 没有违规', async () => {
    expect(root.querySelectorAll('.range-calendar-demo [role="grid"]')).toHaveLength(2);
    await checkAxe($('.range-calendar-demo'));
  });
});

describe('DateField、TimeField', () => {
  it('真实键盘输入：打数字逐段填写、自动跳段，填全后写回', async () => {
    const year = $('.date-field-demo [data-type="year"]');
    await userEvent.click(year);
    expect(document.activeElement).toBe(year);
    await userEvent.keyboard('19900315');
    expect($('.field-summary').textContent).toContain('生日：1990-03-15');
    expect(document.activeElement).toBe($('.date-field-demo [data-type="day"]'));
    // 段里的文字由组件渲染，浏览器没有插入别的字符
    expect($('.date-field-demo [role="group"]').textContent).toBe('1990/03/15');
  });

  it('↑↓ 加减、Backspace 删空回到上一段、Tab 依次经过各段', async () => {
    const hour = $('.time-field-demo [data-type="hour"]');
    hour.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect($('.field-summary').textContent).toContain('提醒：10:30');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe($('.time-field-demo [data-type="minute"]'));
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}');
    expect($('.field-summary').textContent).toContain('提醒：未填');
    expect(document.activeElement).toBe(hour);
  });

  it('axe-core 没有违规', async () => {
    await checkAxe($('.date-field-demo'));
    await checkAxe($('.time-field-demo'));
  });
});

describe('DatePicker', () => {
  const openPanel = () => document.querySelector<HTMLElement>('[role="dialog"]:popover-open');

  it('按钮打开贴着输入框的日历，焦点落在已选那天；Enter 选中后关闭、写回、焦点回到按钮', async () => {
    const button = $<HTMLButtonElement>('.date-picker-demo button[aria-haspopup="dialog"]');
    await userEvent.click(button);
    await expect.poll(() => openPanel()).not.toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect((document.activeElement as HTMLElement).dataset.date).toBe('2026-10-20');
    const shell = button.parentElement!.getBoundingClientRect();
    // 锚点是整个输入框外壳（不是按钮）：弹层贴着外壳的起始边，在它下方（空间不够时翻到上方）
    const panel = openPanel()!.getBoundingClientRect();
    expect(panel.top >= shell.bottom || panel.bottom <= shell.top).toBe(true);
    expect(panel.left).toBeLessThan(shell.left + shell.width / 2);
    // 等弹出的过渡结束：半透明时 axe 会算错对比度
    await afterTransitions(openPanel()!);
    await checkAxe(openPanel()!);
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(openPanel()).toBeNull();
    expect($('.picker-summary').textContent).toContain('出发：2026-10-21');
    expect(document.activeElement).toBe(button);
  });

  it('分段里 Alt + ↓ 打开、Esc 关闭；带时间时选完日期保留时间，焦点去“时”那一段', async () => {
    $('.date-time-picker-demo [data-type="day"]').focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await expect.poll(() => openPanel()).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    expect(openPanel()).toBeNull();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await expect.poll(() => openPanel()).not.toBeNull();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect($('.picker-summary').textContent).toContain('会议：2026-10-27T14:30');
    expect((document.activeElement as HTMLElement).dataset.type).toBe('hour');
  });
});
