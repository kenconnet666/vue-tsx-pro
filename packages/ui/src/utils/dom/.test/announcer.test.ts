// 共用的读屏播报区：常驻、稍后写入、同一句话连说两次也念、有模态对话框时挂进去
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { announced } from '../../.test/mount';
import { announce } from '../announcer';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('两个常驻的区域（polite、assertive），写入前先清空，稍后再写', () => {
  announce('已选 3 项');
  const polite = document.querySelector('[data-live-announcer="polite"]')!;
  expect(polite.getAttribute('aria-live')).toBe('polite');
  expect(polite.getAttribute('aria-atomic')).toBe('true');
  expect(announced()).toBe('');
  vi.advanceTimersByTime(100);
  expect(announced()).toBe('已选 3 项');

  announce('保存失败', 'assertive');
  vi.advanceTimersByTime(100);
  expect(announced('assertive')).toBe('保存失败');
  expect(document.querySelectorAll('[data-live-announcer]')).toHaveLength(2);
});

it('同一句话再说一遍：先清空再写回，读屏会再念一次；空字符串不播报', () => {
  announce('已复制');
  vi.advanceTimersByTime(100);
  announce('已复制');
  expect(announced()).toBe('');
  vi.advanceTimersByTime(100);
  expect(announced()).toBe('已复制');
  announce('');
  expect(announced()).toBe('已复制');
});
