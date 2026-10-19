// CopyButton：复制后换成对勾、播报“已复制”，timeout 后复原；value 可以是函数
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { CopyButton } from '../CopyButton';

const writeText = vi.fn<(text: string) => Promise<void>>();
beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => vi.useRealTimers());

it('复制后 data-state="copied"、播报“已复制”，timeout 后复原', async () => {
  const onCopied = vi.fn();
  const root = mount(() => (
    <CopyButton value={() => 'secret'} timeout={1000} onCopied={onCopied} />
  ));
  const button = root.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('复制');
  expect(button.type).toBe('button');
  vi.useFakeTimers();
  button.click();
  await vi.waitFor(() => expect(onCopied).toHaveBeenCalledWith(true));
  await nextTick();
  expect(writeText).toHaveBeenCalledWith('secret');
  expect(button.dataset.state).toBe('copied');
  expect(button.querySelector('[aria-live="polite"]')!.textContent).toBe('已复制');
  vi.advanceTimersByTime(1000);
  await nextTick();
  expect(button.dataset.state).toBe('idle');
  expect(button.querySelector('[aria-live="polite"]')!.textContent).toBe('');
});

it('aria-label 可以改；复制失败时回调拿到 false', async () => {
  writeText.mockRejectedValue(new Error('denied'));
  const onCopied = vi.fn();
  const root = mount(() => <CopyButton value="x" aria-label="复制链接" onCopied={onCopied} />);
  const button = root.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('复制链接');
  button.click();
  await vi.waitFor(() => expect(onCopied).toHaveBeenCalledWith(false));
  expect(button.dataset.state).toBe('idle');
});
