// 布局偏好：默认值、记住选择、不合法的存储内容、其他标签页同步、reset
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createLayoutPreference } from '../preference';

const KEY = 'test-layout';

afterEach(() => localStorage.clear());

describe('createLayoutPreference', () => {
  it('没记过时用默认值，可以用 defaults 改', () => {
    const layout = createLayoutPreference({ storageKey: KEY });
    expect({ ...layout }).toMatchObject({
      mode: 'docked',
      side: 'start',
      open: false,
      width: 256,
      height: 320,
      collapsed: false,
    });
    const custom = createLayoutPreference({
      storageKey: KEY,
      defaults: { mode: 'overlay', side: 'bottom' },
    });
    expect([custom.mode, custom.side]).toEqual(['overlay', 'bottom']);
  });

  it('改了就存盘，下次创建沿用', async () => {
    const first = createLayoutPreference({ storageKey: KEY });
    first.mode = 'overlay';
    first.side = 'end';
    first.width = 300;
    await nextTick();
    expect(JSON.parse(localStorage.getItem(KEY)!)).toMatchObject({
      mode: 'overlay',
      side: 'end',
      width: 300,
    });
    const second = createLayoutPreference({ storageKey: KEY });
    expect([second.mode, second.side, second.width]).toEqual(['overlay', 'end', 300]);
  });

  it('存的内容不合法时只丢掉不合法的项', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ mode: 'sideways', side: 'top', open: 'yes', width: -5, height: 400 }),
    );
    const layout = createLayoutPreference({ storageKey: KEY });
    expect([layout.mode, layout.side, layout.open, layout.width, layout.height]).toEqual([
      'docked',
      'top',
      false,
      256,
      400,
    ]);
    localStorage.setItem(KEY, '{坏掉的');
    expect(createLayoutPreference({ storageKey: KEY }).side).toBe('start');
  });

  it('其他标签页改了：跟着变，并且不写回去', async () => {
    const layout = createLayoutPreference({ storageKey: KEY });
    await nextTick();
    localStorage.setItem(KEY, JSON.stringify({ side: 'bottom', mode: 'overlay' }));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    await nextTick();
    expect([layout.mode, layout.side]).toEqual(['overlay', 'bottom']);
    // 别的键的改动不理会
    window.dispatchEvent(new StorageEvent('storage', { key: 'other' }));
    expect(layout.side).toBe('bottom');
  });

  it('storageKey 为 false 时不存；reset 回到默认值并清掉记住的内容', async () => {
    const memory = createLayoutPreference({ storageKey: false });
    memory.side = 'end';
    await nextTick();
    expect(localStorage.length).toBe(0);

    const layout = createLayoutPreference({ storageKey: KEY, defaults: { mode: 'overlay' } });
    layout.side = 'top';
    await nextTick();
    expect(localStorage.getItem(KEY)).not.toBeNull();
    layout.reset();
    expect([layout.mode, layout.side]).toEqual(['overlay', 'start']);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('对外只有各项和 reset，没有别的', () => {
    const layout = createLayoutPreference({ storageKey: false });
    expect(Object.keys(layout).sort()).toEqual(
      ['collapsed', 'height', 'mode', 'open', 'reset', 'side', 'width'].sort(),
    );
  });
});
