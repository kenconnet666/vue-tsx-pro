/**
 * 键盘快捷键：在 document 上监听，组件卸载时注销。
 *
 *   useHotkeys(() => ({ 'Mod+K': openSearch, 'Shift+?': showHelp, Escape: close, 'G I': goInbox }));
 *   formatHotkey('Mod+K')   // macOS 上 '⌘K'，其他系统 'Ctrl+K'：Menu 等显示用
 *
 * 写法：修饰键（Mod、Ctrl、Alt、Shift、Meta）加一个键，用 + 连接，不分大小写；
 * Mod 在 macOS 上是 ⌘（Meta），其他系统是 Ctrl。键名同 KeyboardEvent.key（Enter、ArrowUp、/）；
 * 字母按物理键也能匹配（macOS 上 Option 会改变 key）。没写的修饰键必须没按下；符号键（? ! 等）不检查 Shift。
 * 焦点在输入框、可编辑区域里时默认不触发，输入法组字时也不触发。
 *
 * 序列键用空格分隔（'G I'：先按 g 再按 i，两次之间不超过 1.5 秒，同 GitHub 的 hotkey）；序列比单键优先。
 * 所以组合键里的 + 两边不要加空格（写 'Mod+K'，不写 'Mod + K'）。
 * 作用域：默认在整个页面上监听，但有模态对话框打开时只认对话框里的按键（页面已经不可操作）；
 * target 让快捷键只在某个区域里有焦点时生效（编辑器、表格）。
 */
import { useEventListener } from './event-listener';
import { topModal } from './overlay';

/** useHotkeys 的选项 */
export interface HotkeyOptions {
  /** 焦点在输入框、文本框、下拉框、可编辑区域里时也触发，默认 false */
  inInputs?: boolean;
  /** 只在这个元素（或它里面）有焦点时生效；默认整个页面 */
  target?: () => HTMLElement | null | undefined;
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

const parsed = new Map<string, Hotkey>();

/** 'Mod+Shift+K' → 各修饰键与键名（小写）；同一个写法只解析一次 */
export function parseHotkey(combo: string): Hotkey {
  // Mod 按平台解析：平台也算进键里
  const key = `${isApplePlatform() ? 'apple' : 'other'}:${combo}`;
  let hotkey = parsed.get(key);
  if (!hotkey) parsed.set(key, (hotkey = parse(combo)));
  return hotkey;
}

function parse(combo: string): Hotkey {
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
  return combo.trim().split(/\s+/).map(formatStep).join(' ');
}

function formatStep(combo: string): string {
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
 * 显示快捷键的 Kbd 对读屏隐藏、改由这个属性提供时，按钮的名称与看得见的文字才对得上。
 * 序列键（'G I'）表达不了（aria-keyshortcuts 里空格表示“或”）：返回 undefined，显示的文字就别对读屏隐藏
 */
export function ariaKeyShortcut(combo: string): string | undefined {
  if (/\s/.test(combo.trim())) return undefined;
  const hotkey = parseHotkey(combo);
  const names = { ctrl: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' };
  return [...modifiersOf(hotkey).map((name) => names[name]), keyName(hotkey.key)].join('+');
}

/**
 * 这次按键属于输入法的组合输入（拼音选词时的回车、方向键、空格）：快捷键与列表的键盘操作都不该处理它。
 * Chrome、Firefox 组合中是 isComposing；Safari 先派发 compositionend、再派发确认用的 keydown，只能看 keyCode 229
 */
export function isComposingKey(event: KeyboardEvent): boolean {
  return event.isComposing || event.keyCode === 229;
}

/** 事件目标是不是可编辑的元素（输入框、文本域、下拉、contenteditable）：方向键、字母键这时留给它 */
export function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName);
}

/** 序列键两次按键之间最多隔多久（毫秒） */
const SEQUENCE_TIMEOUT = 1500;

/** 注册快捷键（在 setup 里调用）；read 在按键时读取，处理函数总是最新的 */
export function useHotkeys(
  read: () => HotkeyMap,
  { inInputs = false, target }: HotkeyOptions = {},
): void {
  if (typeof document === 'undefined') return;
  // 最近的按键（序列键用）：超过时限的丢掉
  let recent: { event: KeyboardEvent; at: number }[] = [];
  const onKeydown = (event: KeyboardEvent) => {
    if (isComposingKey(event) || event.defaultPrevented) return;
    if (!inInputs && isEditable(event.target)) return;
    // 页面级的快捷键：模态对话框打开时只认对话框里的按键
    const modal = topModal();
    if (!target && modal && !(event.target instanceof Node && modal.contains(event.target))) return;
    const now = performance.now();
    recent = [
      ...recent.filter((item) => now - item.at < SEQUENCE_TIMEOUT),
      { event, at: now },
    ].slice(-4);
    const entries = Object.entries(read()).map(([combo, handler]) => ({
      steps: combo.trim().split(/\s+/),
      handler,
    }));
    // 序列比单键优先：'G I' 按完时不再触发单独的 'I'
    entries.sort((a, b) => b.steps.length - a.steps.length);
    for (const { steps, handler } of entries) {
      const tail = recent.slice(-steps.length);
      if (tail.length < steps.length) continue;
      if (!steps.every((step, index) => matchesHotkey(tail[index]!.event, step))) continue;
      event.preventDefault();
      recent = [];
      handler(event);
      return;
    }
  };
  useEventListener(target ?? document, 'keydown', onKeydown);
}
