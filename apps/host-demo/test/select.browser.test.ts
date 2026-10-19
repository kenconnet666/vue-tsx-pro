// Select、Combobox：焦点留在触发框 / 输入框，高亮项经 aria-activedescendant（演示页 /base）
import axe from 'axe-core';
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let app: App;
let root: HTMLElement;

beforeEach(async () => {
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/base');
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
const popoverOf = (control: Element) =>
  document.getElementById(control.getAttribute('aria-controls')!)!.parentElement!;
const activeText = (control: Element) =>
  document.getElementById(control.getAttribute('aria-activedescendant') ?? '')?.textContent;

describe('Select', () => {
  it('点击打开，与外壳同宽；焦点留在触发按钮上；方向键跳过不可用项，Enter 选中并关闭', async () => {
    const trigger = $('.select-demo').querySelector('button')!;
    expect(trigger.getAttribute('role')).toBe('combobox');
    await userEvent.click(trigger);
    const popover = popoverOf(trigger);
    await expect.poll(() => popover.matches(':popover-open')).toBe(true);
    // 第一次定位完成后才写入最小宽度
    await expect
      .poll(() => popover.getBoundingClientRect().width)
      .toBeGreaterThanOrEqual($('.select-demo').getBoundingClientRect().width - 1);
    expect(document.activeElement).toBe(trigger);
    expect(activeText(trigger)).toBe('北京');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    // 南京不可用，被跳过
    expect(activeText(trigger)).toBe('广州');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => popover.matches(':popover-open')).toBe(false);
    expect(trigger.textContent).toBe('广州');
    expect($<HTMLInputElement>('.select-demo input[type=hidden]').value).toBe('gz');
  });

  it('多选：高亮落在已选项上，空格切换后不关闭；Esc 关闭', async () => {
    const trigger = $('.select-multiple-demo').querySelector('button')!;
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const popover = popoverOf(trigger);
    await expect.poll(() => popover.matches(':popover-open')).toBe(true);
    expect(activeText(trigger)).toBe('上海');
    await userEvent.keyboard('{ArrowDown} ');
    expect(trigger.textContent).toContain('杭州');
    expect(popover.matches(':popover-open')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => popover.matches(':popover-open')).toBe(false);
  });

  it('打开时 axe-core 没有违规', async () => {
    const trigger = $('.select-demo').querySelector('button')!;
    await userEvent.click(trigger);
    const popover = popoverOf(trigger);
    await expect.poll(() => popover.matches(':popover-open')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const form = await axe.run(root.querySelector('.form-demo')!);
    expect(
      form.violations.map(
        (violation) =>
          `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
      ),
    ).toEqual([]);
    const list = await axe.run(popover);
    expect(
      list.violations.map(
        (violation) =>
          `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
      ),
    ).toEqual([]);
  });
});

describe('Combobox', () => {
  it('输入过滤（忽略大小写），高亮第一项，Enter 选中后显示选项文字', async () => {
    const input = $<HTMLInputElement>('.combobox-demo input');
    await userEvent.click(input);
    await userEvent.keyboard('script');
    const popover = popoverOf(input);
    await expect.poll(() => popover.matches(':popover-open')).toBe(true);
    const options = () =>
      [...popover.querySelectorAll('[role="option"]')].map((option) => option.textContent);
    expect(options()).toEqual(['TypeScript', 'JavaScript']);
    expect(activeText(input)).toBe('TypeScript');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.poll(() => popover.matches(':popover-open')).toBe(false);
    expect(input.value).toBe('JavaScript');
    expect(document.activeElement).toBe(input);
  });

  it('失焦时文字不是选项则恢复成已选项；↓ 打开时显示全部选项', async () => {
    const input = $<HTMLInputElement>('.combobox-demo input');
    await userEvent.click(input);
    await userEvent.keyboard('go{Enter}');
    expect(input.value).toBe('Go');
    await userEvent.keyboard('{Backspace}xyz');
    $('.select-demo button').focus();
    await expect.poll(() => input.value).toBe('Go');
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    const popover = popoverOf(input);
    await expect.poll(() => popover.matches(':popover-open')).toBe(true);
    expect(popover.querySelectorAll('[role="option"]')).toHaveLength(6);
  });
});
