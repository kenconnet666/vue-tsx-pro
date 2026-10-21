// useClipboard：复制成功后 copied 一段时间再复原；失败时记下原因
import { effectScope } from 'vue';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useClipboard } from '../clipboard';

const writeText = vi.fn<(text: string) => Promise<void>>();
beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => vi.useRealTimers());

it('复制成功：copied 为 true，timeout 后复原', async () => {
  const scope = effectScope();
  const clipboard = scope.run(() => useClipboard({ timeout: 1000 }))!;
  expect(await clipboard.copy('hello')).toBe(true);
  expect(writeText).toHaveBeenCalledWith('hello');
  expect(clipboard.copied).toBe(true);
  vi.advanceTimersByTime(1000);
  expect(clipboard.copied).toBe(false);
  scope.stop();
});

it('复制失败：返回 false，error 是原因，copied 保持 false', async () => {
  const reason = new Error('denied');
  writeText.mockRejectedValue(reason);
  const scope = effectScope();
  const clipboard = scope.run(() => useClipboard())!;
  expect(await clipboard.copy('x')).toBe(false);
  expect(clipboard.copied).toBe(false);
  expect(clipboard.error).toBe(reason);
  scope.stop();
});

it('没有 Clipboard API（http 部署）：退回 execCommand，焦点还给原来的按钮；对话框里放进对话框', async () => {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  let selected = '';
  let parent: Element | null = null;
  const execCommand = vi.fn(() => {
    const textarea = document.querySelector('textarea')!;
    expect(document.activeElement).toBe(textarea);
    selected = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    parent = textarea.parentElement;
    return true;
  });
  Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
  const dialog = document.body.appendChild(document.createElement('dialog'));
  const button = dialog.appendChild(document.createElement('button'));
  button.focus();

  const scope = effectScope();
  const clipboard = scope.run(() => useClipboard())!;
  expect(await clipboard.copy('code')).toBe(true);
  expect(execCommand).toHaveBeenCalledWith('copy');
  expect([selected, parent]).toEqual(['code', dialog]);
  expect(document.activeElement).toBe(button);
  expect(dialog.querySelector('textarea')).toBeNull();

  execCommand.mockReturnValue(false);
  expect(await clipboard.copy('code')).toBe(false);
  expect(String(clipboard.error)).toMatch(/不是安全上下文/);
  scope.stop();
  dialog.remove();
});
