/**
 * 键盘快捷键：在 document 上监听，组件卸载时注销。
 *
 *   useHotkeys(() => ({ 'Mod+K': openSearch, 'Shift+?': showHelp, Escape: close }));
 *   formatHotkey('Mod+K')   // macOS 上 '⌘K'，其他系统 'Ctrl+K'：Menu 等显示用
 *
 * 写法：修饰键（Mod、Ctrl、Alt、Shift、Meta）加一个键，用 + 连接，不分大小写；
 * Mod 在 macOS 上是 ⌘（Meta），其他系统是 Ctrl。键名同 KeyboardEvent.key（Enter、ArrowUp、/）；
 * 字母按物理键也能匹配（macOS 上 Option 会改变 key）。没写的修饰键必须没按下；符号键（? ! 等）不检查 Shift。
 * 焦点在输入框、可编辑区域里时默认不触发，输入法组字时也不触发。
 */
import { onScopeDispose } from 'vue';

/** useHotkeys 的选项 */
export interface HotkeyOptions {
  /** 焦点在输入框、文本框、下拉框、可编辑区域里时也触发，默认 false */
  inInputs?: boolean;
}

/** 快捷键 → 处理函数；匹配时先 preventDefault 再调用 */
export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

interface Hotkey {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

/** 是否 Apple 平台：Mod 取 ⌘ */
export function isApplePlatform(): boolean {
  const nav = globalThis.navigator as
    (Navigator & { userAgentData?: { platform: string } }) | undefined;
  const platform = nav?.userAgentData?.platform ?? nav?.platform ?? '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

// 好写的别名 → KeyboardEvent.key
const KEY_ALIASES: Record<string, string> = {
  space: ' ',
  esc: 'escape',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
};

/** 'Mod+Shift+K' → 各修饰键与键名（小写） */
export function parseHotkey(combo: string): Hotkey {
  const parts = combo.split('+').map((part) => part.trim());
  // 'Mod++' 这类以加号为键的写法：split 后末尾是两个空串
  const name = (combo.endsWith('++') ? '+' : parts.pop()!).toLowerCase();
  const key = KEY_ALIASES[name] ?? name;
  const modifiers = new Set(parts.filter(Boolean).map((part) => part.toLowerCase()));
  const apple = isApplePlatform();
  return {
    key,
    ctrl: modifiers.has('ctrl') || (modifiers.has('mod') && !apple),
    alt: modifiers.has('alt') || modifiers.has('option'),
    shift: modifiers.has('shift'),
    meta: modifiers.has('meta') || modifiers.has('cmd') || (modifiers.has('mod') && apple),
  };
}

/** 事件是否匹配这个快捷键 */
export function matchesHotkey(event: KeyboardEvent, combo: string | Hotkey): boolean {
  const hotkey = typeof combo === 'string' ? parseHotkey(combo) : combo;
  const letter = /^[a-z]$/.test(hotkey.key);
  const symbol = hotkey.key.length === 1 && !letter && !/^\d$/.test(hotkey.key);
  if (
    event.ctrlKey !== hotkey.ctrl ||
    event.altKey !== hotkey.alt ||
    event.metaKey !== hotkey.meta
  ) {
    return false;
  }
  if (!symbol && event.shiftKey !== hotkey.shift) return false;
  const key = event.key.toLowerCase();
  return key === hotkey.key || (letter && event.code === `Key${hotkey.key.toUpperCase()}`);
}

// 小写的键名 → KeyboardEvent.key 的写法（多个单词的每个词首字母大写）
const KEY_NAMES: Record<string, string> = {
  ' ': 'Space',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  pageup: 'PageUp',
  pagedown: 'PageDown',
};
const keyName = (key: string) =>
  KEY_NAMES[key] ??
  (key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1));
const modifiersOf = (hotkey: Hotkey) =>
  (['ctrl', 'alt', 'shift', 'meta'] as const).filter((name) => hotkey[name]);

const SYMBOLS: Record<string, string> = { ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' };
const ARROWS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

/** 快捷键的显示文字：macOS 上用符号（⌘⇧K），其他系统用 Ctrl+Shift+K；方向键显示成箭头 */
export function formatHotkey(combo: string): string {
  const hotkey = parseHotkey(combo);
  const key = keyName(hotkey.key);
  const shown = ARROWS[key] ?? key;
  if (isApplePlatform())
    return (
      modifiersOf(hotkey)
        .map((name) => SYMBOLS[name])
        .join('') + shown
    );
  const names = { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Win' };
  return [...modifiersOf(hotkey).map((name) => names[name]), shown].join('+');
}

/**
 * 快捷键的 aria-keyshortcuts 写法（读屏念出来）：'Mod+K' → 'Control+K'，macOS 上 'Meta+K'。
 * 显示快捷键的 Kbd 对读屏隐藏、改由这个属性提供时，按钮的名称与看得见的文字才对得上
 */
export function ariaKeyShortcut(combo: string): string {
  const hotkey = parseHotkey(combo);
  const names = { ctrl: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' };
  return [...modifiersOf(hotkey).map((name) => names[name]), keyName(hotkey.key)].join('+');
}

/** 事件目标是不是可编辑的元素（输入框、文本域、下拉、contenteditable）：方向键、字母键这时留给它 */
export function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName);
}

/** 注册快捷键（在 setup 里调用）；read 在按键时读取，处理函数总是最新的 */
export function useHotkeys(read: () => HotkeyMap, { inInputs = false }: HotkeyOptions = {}): void {
  if (typeof document === 'undefined') return;
  const onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.defaultPrevented) return;
    if (!inInputs && isEditable(event.target)) return;
    for (const [combo, handler] of Object.entries(read())) {
      if (!matchesHotkey(event, combo)) continue;
      event.preventDefault();
      handler(event);
      return;
    }
  };
  document.addEventListener('keydown', onKeydown);
  onScopeDispose(() => document.removeEventListener('keydown', onKeydown));
}
