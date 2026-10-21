// CopyButton：复制后换成对勾、播报“已复制”，timeout 后复原；value 可以是函数，异步时转圈
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

it('aria-label 可以改；复制失败时回调拿到 false 与原因', async () => {
  const denied = new Error('denied');
  writeText.mockRejectedValue(denied);
  const onCopied = vi.fn();
  const root = mount(() => <CopyButton value="x" aria-label="复制链接" onCopied={onCopied} />);
  const button = root.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('复制链接');
  button.click();
  await vi.waitFor(() => expect(onCopied).toHaveBeenCalledWith(false, denied));
  expect(button.dataset.state).toBe('idle');
});

it('异步取值出错：回调拿到 false 与原因，不留下没人处理的 rejection', async () => {
  const failed = new Error('offline');
  const onCopied = vi.fn();
  const root = mount(() => <CopyButton value={() => Promise.reject(failed)} onCopied={onCopied} />);
  root.querySelector('button')!.click();
  await vi.waitFor(() => expect(onCopied).toHaveBeenCalledWith(false, failed));
  expect(root.querySelector('button')!.getAttribute('aria-busy')).toBeNull();
});

it('异步取值：等待时转圈（aria-busy），重复点击不再取值', async () => {
  let resolve!: (text: string) => void;
  const value = vi.fn(() => new Promise<string>((done) => (resolve = done)));
  const onCopied = vi.fn();
  const root = mount(() => <CopyButton value={value} onCopied={onCopied} />);
  const button = root.querySelector('button')!;
  button.click();
  await nextTick();
  expect(button.getAttribute('aria-busy')).toBe('true');
  button.click();
  expect(value).toHaveBeenCalledTimes(1);
  resolve('later');
  await vi.waitFor(() => expect(onCopied).toHaveBeenCalledWith(true));
  await nextTick();
  expect(writeText).toHaveBeenCalledWith('later');
  expect(button.hasAttribute('aria-busy')).toBe(false);
});
