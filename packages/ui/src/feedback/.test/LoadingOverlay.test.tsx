// LoadingOverlay：aria-busy 立即生效；遮罩防闪烁，过了 delay 才出现，结束后离场再移除；内容一直在
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { mount } from '../../utils/.test/mount';
import { LoadingOverlay } from '../LoadingOverlay';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('开始加载：aria-busy 立即写上，遮罩过了 delay 才出现；结束后至少显示一会儿再移除', async () => {
  const loading = shallowRef(false);
  const root = mount(() => (
    <LoadingOverlay loading={loading.value}>
      <p>内容</p>
    </LoadingOverlay>
  )).firstElementChild as HTMLElement;
  const overlay = () => root.querySelector('[data-state]');

  loading.value = true;
  await nextTick();
  expect(root.getAttribute('aria-busy')).toBe('true');
  expect(overlay()).toBeNull();
  vi.advanceTimersByTime(200);
  await nextTick();
  expect(overlay()!.getAttribute('data-state')).toBe('open');
  expect(root.querySelector('[role="status"]')!.textContent).toBe('加载中');

  loading.value = false;
  await nextTick();
  expect(root.hasAttribute('aria-busy')).toBe(false);
  vi.advanceTimersByTime(500);
  await vi.waitFor(() => expect(overlay()).toBeNull());
  expect(root.querySelector('p')!.textContent).toBe('内容');
});

it('挂载时已在加载：遮罩立即出现，说明文字可以改', () => {
  const root = mount(() => <LoadingOverlay loading label="正在保存" />);
  expect(root.querySelector('[role="status"]')!.textContent).toBe('正在保存');
});
