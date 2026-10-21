// useHotkeys：Mod 按平台取 ⌘ / Ctrl；没写的修饰键不能按下；输入框里默认不触发；卸载后注销
import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ariaKeyShortcut, formatHotkey, matchesHotkey, useHotkeys } from '../hotkeys';

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
});
