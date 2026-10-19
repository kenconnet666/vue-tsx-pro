// 通知控制器：计时、暂停、更新、promise；显示区域的交互在浏览器测试里（apps/host-demo/test/feedback.browser.test.ts）
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createToaster } from '../Toast';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const closing = (toaster: ReturnType<typeof createToaster>, id: string) =>
  toaster.toasts.find((toast) => toast.id === id)?.closing;

describe('createToaster', () => {
  it('到时自动关闭（进入离场，等显示区域移除）；duration 为 Infinity 时不关闭', () => {
    const toaster = createToaster({ duration: 1000 });
    const short = toaster.show({ title: '已保存' });
    const sticky = toaster.show({ title: '一直在', duration: Infinity });
    vi.advanceTimersByTime(999);
    expect(closing(toaster, short)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(closing(toaster, short)).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(closing(toaster, sticky)).toBe(false);
    toaster.remove(short);
    expect(toaster.toasts.map((toast) => toast.id)).toEqual([sticky]);
  });

  it('暂停时剩余时间保留，继续后接着计时', () => {
    const toaster = createToaster({ duration: 1000 });
    const id = toaster.show({ title: 'x' });
    vi.advanceTimersByTime(600);
    toaster.pause();
    vi.advanceTimersByTime(5000);
    expect(closing(toaster, id)).toBe(false);
    toaster.resume();
    vi.advanceTimersByTime(399);
    expect(closing(toaster, id)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(closing(toaster, id)).toBe(true);
  });

  it('暂停期间新加的通知也等继续后才开始计时', () => {
    const toaster = createToaster({ duration: 1000 });
    toaster.pause();
    const id = toaster.show({ title: 'x' });
    vi.advanceTimersByTime(5000);
    expect(closing(toaster, id)).toBe(false);
    toaster.resume();
    vi.advanceTimersByTime(1000);
    expect(closing(toaster, id)).toBe(true);
  });

  it('dismiss 不给编号时关闭全部；关闭后 update 不再生效', () => {
    const toaster = createToaster();
    const a = toaster.show({ title: 'a' });
    toaster.show({ title: 'b' });
    toaster.dismiss();
    expect(toaster.toasts.every((toast) => toast.closing)).toBe(true);
    toaster.update(a, { title: 'changed' });
    expect(toaster.toasts[0]!.title).toBe('a');
  });

  it('promise：加载中不自动关闭；成功后换成结果并重新计时', async () => {
    const toaster = createToaster({ duration: 1000 });
    let finish!: (value: number) => void;
    const result = toaster.promise(new Promise<number>((resolve) => (finish = resolve)), {
      loading: { title: '上传中' },
      success: (count) => ({ title: `已上传 ${count} 个` }),
      error: { title: '失败' },
    });
    const [toast] = toaster.toasts;
    expect([toast!.loading, toast!.closable]).toEqual([true, false]);
    vi.advanceTimersByTime(60_000);
    expect(toast!.closing).toBe(false);

    finish(3);
    await expect(result).resolves.toBe(3);
    expect([toast!.title, toast!.tone, toast!.loading, toast!.closable]).toEqual([
      '已上传 3 个',
      'success',
      false,
      true,
    ]);
    vi.advanceTimersByTime(1000);
    expect(toast!.closing).toBe(true);
  });

  it('promise：失败时换成错误色调，并照样抛出', async () => {
    const toaster = createToaster();
    const failure = new Error('断网');
    const result = toaster.promise(Promise.reject(failure), {
      loading: { title: '上传中' },
      success: { title: '完成' },
      error: (reason) => ({ title: (reason as Error).message }),
    });
    await expect(result).rejects.toBe(failure);
    expect([toaster.toasts[0]!.title, toaster.toasts[0]!.tone]).toEqual(['断网', 'danger']);
  });
});
