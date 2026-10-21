// usePersistentState：读出记住的值（类型不对用 initial，对象按字段合并）；改了写回；别的标签页改了跟着变；存不了只在这次有效
import { afterEach, describe, expect, it } from 'vitest';
import { effectScope, nextTick } from 'vue';
import { usePersistentState } from '../storage';

afterEach(() => localStorage.clear());

function run<T>(create: () => T) {
  const scope = effectScope();
  const value = scope.run(create)!;
  return { value, stop: () => scope.stop() };
}

describe('usePersistentState', () => {
  it('没有记住的值时是 initial；改了写回 JSON（深层修改也写）', async () => {
    const { value: state, stop } = run(() =>
      usePersistentState('t.widths', {} as Record<string, number>),
    );
    expect(state.value).toEqual({});
    state.value.name = 240;
    await nextTick();
    expect(JSON.parse(localStorage.getItem('t.widths')!)).toEqual({ name: 240 });
    stop();
  });

  it('读出来的类型与 initial 不同时用 initial；对象按字段合并在 initial 上', () => {
    localStorage.setItem('t.size', '"20"');
    localStorage.setItem('t.sidebar', '{"open":true}');
    localStorage.setItem('t.broken', '{not json');
    const { value, stop } = run(() => ({
      size: usePersistentState('t.size', 10),
      sidebar: usePersistentState('t.sidebar', { open: false, width: 256 }),
      broken: usePersistentState('t.broken', ['a']),
    }));
    expect(value.size.value).toBe(10);
    expect(value.sidebar.value).toEqual({ open: true, width: 256 });
    expect(value.broken.value).toEqual(['a']);
    stop();
  });

  it('别的标签页写了同一个键：跟着变，且不再写回去', async () => {
    const { value: state, stop } = run(() => usePersistentState('t.density', 'standard'));
    localStorage.setItem('t.density', '"compact"');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 't.density', storageArea: localStorage }),
    );
    expect(state.value).toBe('compact');
    stop();
  });

  it('存储不可用（隐私模式）：只在这次有效，不报错', async () => {
    const { value: state, stop } = run(() =>
      usePersistentState('t.x', 1, {
        storage: () => {
          throw new Error('denied');
        },
      }),
    );
    state.value = 2;
    await nextTick();
    expect(state.value).toBe(2);
    stop();
  });
});
