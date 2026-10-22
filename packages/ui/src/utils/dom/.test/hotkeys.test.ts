// useHotkeys：Mod 按平台取 ⌘ / Ctrl；没写的修饰键不能按下；输入框里默认不触发；卸载后注销
import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ariaKeyShortcut, formatHotkey, matchesHotkey, useHotkeys } from '../hotkeys';
import { trackModal } from '../overlay';

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

function onPlatform(platform: string) {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('matchesHotkey', () => {
  it('Mod 在 macOS 上是 Meta，其他系统是 Ctrl', () => {
    onPlatform('MacIntel');
    expect(matchesHotkey(new KeyboardEvent('keydown', { key: 'k', metaKey: true }), 'Mod+K')).toBe(
      true,
    );
    expect(matchesHotkey(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), 'Mod+K')).toBe(
      false,
    );
    onPlatform('Win32');
    expect(matchesHotkey(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), 'Mod+K')).toBe(
      true,
    );
  });

  it('多按了修饰键不匹配；符号键不检查 Shift；字母也按物理键匹配；别名', () => {
    onPlatform('Win32');
    expect(
      matchesHotkey(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true }),
        'Ctrl+K',
      ),
    ).toBe(false);
    expect(matchesHotkey(new KeyboardEvent('keydown', { key: '?', shiftKey: true }), '?')).toBe(
      true,
    );
    expect(
      matchesHotkey(
        new KeyboardEvent('keydown', { key: '˚', code: 'KeyK', altKey: true }),
        'Alt+K',
      ),
    ).toBe(true);
    expect(matchesHotkey(new KeyboardEvent('keydown', { key: ' ' }), 'Space')).toBe(true);
    expect(matchesHotkey(new KeyboardEvent('keydown', { key: '+', ctrlKey: true }), 'Ctrl++')).toBe(
      true,
    );
  });
});

it('formatHotkey：macOS 用符号，其他系统用文字', () => {
  onPlatform('MacIntel');
  expect(formatHotkey('Mod+Shift+K')).toBe('⇧⌘K');
  onPlatform('Win32');
  expect(formatHotkey('Mod+Shift+K')).toBe('Ctrl+Shift+K');
  expect(formatHotkey('Escape')).toBe('Escape');
  // 方向键显示成箭头，多词的键名不是只大写首字母（PageDown 而不是 Pagedown）
  expect(formatHotkey('Alt+Up')).toBe('Alt+↑');
  expect(formatHotkey('PageDown')).toBe('PageDown');
});

it('ariaKeyShortcut：aria-keyshortcuts 的写法，Mod 按平台换成 Meta 或 Control', () => {
  onPlatform('MacIntel');
  expect(ariaKeyShortcut('Mod+K')).toBe('Meta+K');
  onPlatform('Win32');
  expect(ariaKeyShortcut('Mod+Shift+K')).toBe('Control+Shift+K');
  expect(ariaKeyShortcut('Alt+ArrowUp')).toBe('Alt+ArrowUp');
  expect(ariaKeyShortcut('Space')).toBe('Space');
});

describe('useHotkeys', () => {
  it('匹配时 preventDefault 并调用；输入框里默认不触发；卸载后注销', () => {
    onPlatform('Win32');
    const open = vi.fn();
    const scope = effectScope();
    scope.run(() => useHotkeys(() => ({ 'Mod+K': open })));
    expect(press('k', { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(open).toHaveBeenCalledTimes(1);

    const input = document.createElement('input');
    document.body.append(input);
    press('k', { ctrlKey: true }, input);
    expect(open).toHaveBeenCalledTimes(1);

    scope.stop();
    press('k', { ctrlKey: true });
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('inInputs 时输入框里也触发；输入法组字时不触发', () => {
    const save = vi.fn();
    const scope = effectScope();
    scope.run(() => useHotkeys(() => ({ Enter: save }), { inInputs: true }));
    const input = document.createElement('input');
    document.body.append(input);
    press('Enter', {}, input);
    press('Enter', { isComposing: true }, input);
    expect(save).toHaveBeenCalledTimes(1);
    scope.stop();
  });

  it('序列键：先按 g 再按 i（1.5 秒内）；序列优先于单键；超时就断开', () => {
    vi.useFakeTimers();
    const inbox = vi.fn();
    const info = vi.fn();
    const scope = effectScope();
    scope.run(() => useHotkeys(() => ({ I: info, 'G I': inbox })));
    press('g');
    press('i');
    expect([inbox.mock.calls.length, info.mock.calls.length]).toEqual([1, 0]);
    press('g');
    vi.advanceTimersByTime(2000);
    vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 2000);
    press('i');
    expect([inbox.mock.calls.length, info.mock.calls.length]).toEqual([1, 1]);
    scope.stop();
    vi.useRealTimers();
  });

  it('模态对话框打开时，页面级的快捷键只认对话框里的按键；target 让快捷键只在区域里生效', () => {
    const search = vi.fn();
    const edit = vi.fn();
    const editor = document.body.appendChild(document.createElement('div'));
    editor.tabIndex = 0;
    const scope = effectScope();
    scope.run(() => {
      useHotkeys(() => ({ '/': search }));
      useHotkeys(() => ({ 'Mod+B': edit }), { target: () => editor });
    });
    onPlatform('Win32');
    press('b', { ctrlKey: true });
    press('b', { ctrlKey: true }, editor);
    expect(edit).toHaveBeenCalledTimes(1);

    // 模态对话框由组件库打开（openModalDialog 登记成最上层的模态）
    const dialog = document.body.appendChild(document.createElement('dialog'));
    const untrack = trackModal(dialog);
    press('/');
    press('/', {}, dialog);
    expect(search).toHaveBeenCalledTimes(1);
    untrack();
    scope.stop();
  });
});

describe('序列键的显示与读屏', () => {
  it('显示时每一步分开写；aria-keyshortcuts 表达不了序列，返回 undefined', () => {
    expect(formatHotkey('G I')).toBe('G I');
    expect(ariaKeyShortcut('G I')).toBeUndefined();
  });
});
