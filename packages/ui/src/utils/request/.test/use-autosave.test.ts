// useAutosave：改了停一会儿才存、和基准相同不存、冲突后停下、start 重新开始
import { afterEach, expect, it, vi } from 'vitest';
import { createApp, defineComponent, nextTick, shallowRef } from 'vue';
import { useAutosave, type Autosave } from '../use-autosave';

afterEach(() => vi.useRealTimers());

/** 在一个组件的 setup 里建（useAutosave 要组件的生命周期） */
function mountAutosave(
  save: (content: string) => Promise<string>,
  isConflict?: (error: unknown) => boolean,
) {
  const text = shallowRef('a');
  let autosave!: Autosave<string>;
  const app = createApp(
    defineComponent({
      setup: () => (
        (autosave = useAutosave({ content: () => text.value, save, delay: 100, isConflict })),
        () => null
      ),
    }),
  );
  app.mount(document.createElement('div'));
  return { text, autosave, app };
}

it('start 之后改了停一会儿才存；和基准一样不存', async () => {
  vi.useFakeTimers();
  const save = vi.fn(async (content: string) => `saved:${content}`);
  const { text, autosave, app } = mountAutosave(save);
  text.value = 'b';
  await nextTick();
  await vi.advanceTimersByTimeAsync(200);
  expect(save).not.toHaveBeenCalled(); // 还没 start
  autosave.start();
  text.value = 'c';
  await nextTick();
  await vi.advanceTimersByTimeAsync(50);
  expect(save).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(100);
  expect(save).toHaveBeenCalledWith('c');
  expect(autosave.status).toMatchObject({ state: 'saved', saved: 'saved:c' });
  await autosave.flush();
  expect(save).toHaveBeenCalledTimes(1); // 没有新的改动
  app.unmount();
});

it('冲突后停下，start 之后接着存', async () => {
  vi.useFakeTimers();
  const conflict = new Error('conflict');
  const save = vi.fn(async () => {
    throw conflict;
  });
  const { text, autosave, app } = mountAutosave(save, (error) => error === conflict);
  autosave.start();
  text.value = 'b';
  await autosave.flush();
  expect(autosave.status).toMatchObject({ state: 'conflict', error: conflict });
  text.value = 'c';
  await autosave.flush();
  expect(save).toHaveBeenCalledTimes(1);
  autosave.start();
  expect(autosave.status.state).toBe('idle');
  app.unmount();
});
