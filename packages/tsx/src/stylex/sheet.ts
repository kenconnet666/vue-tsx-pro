/**
 * 运行时样式引擎的样式表：一张 <style>，规则按名字（类名、关键帧名）登记，同样的内容只插一次；
 * 记下规则原文（SSR 输出、测试断言用），热更新时按名字换掉。
 */

/**
 * 插过的规则：类名（关键帧名、变量名）→ 规则原文与 CSSOM 里的规则。同样的内容只插一次；
 * 原文给 SSR 输出 <style>，也不依赖 CSSOM 的序列化（浏览器、测试用的 DOM 会丢掉不认识的声明）；
 * CSSOM 的规则留着，热更新时按类名换掉
 */
const inserted = new Map<string, { texts: readonly string[]; rules: CSSRule[] }>();
let sheet: CSSStyleSheet | null | undefined;

/** 引擎自己的样式表：放在 head 最前面，宿主页面后加载的同等特异性的 CSS 能盖过组件库 */
function styleSheet(): CSSStyleSheet | null {
  if (sheet !== undefined) return sheet;
  if (typeof document === 'undefined') return (sheet = null);
  const element = document.createElement('style');
  element.dataset.vueTsxPro = '';
  document.head.prepend(element);
  return (sheet = element.sheet);
}

/** 插入一个名字的规则（已有时先删掉旧的：热更新改写规则） */
export function insert(name: string, texts: readonly string[]) {
  const target = styleSheet();
  const previous = inserted.get(name);
  if (previous && target) {
    for (const rule of previous.rules) {
      const index = Array.prototype.indexOf.call(target.cssRules, rule);
      if (index >= 0) target.deleteRule(index);
    }
  }
  const rules: CSSRule[] = [];
  if (target) {
    for (const text of texts) {
      // 浏览器不认的规则（测试环境的 DOM 不认的语法）跳过，同 StyleX 的 inject；样式表里写错的 CSS 本来也会被忽略
      try {
        rules.push(target.cssRules[target.insertRule(text, target.cssRules.length)]!);
      } catch {}
    }
  }
  inserted.set(name, { texts, rules });
}

/** 这个名字的规则插过没有 */
export const isInserted = (name: string) => inserted.has(name);

/** 已插入的全部规则原文，一条一行（SSR 输出 <style> 用） */
export function styleText(): string {
  return [...inserted.values()].flatMap((record) => record.texts).join('\n');
}

/** murmurhash2（同 @emotion/hash、StyleX 的 createHash），转 36 进制 */
export function hash(text: string): string {
  let h = 0;
  let i = 0;
  let length = text.length;
  for (; length >= 4; ++i, length -= 4) {
    let k =
      (text.charCodeAt(i) & 0xff) |
      ((text.charCodeAt(++i) & 0xff) << 8) |
      ((text.charCodeAt(++i) & 0xff) << 16) |
      ((text.charCodeAt(++i) & 0xff) << 24);
    k = (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16);
    k ^= k >>> 24;
    h =
      ((k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16)) ^
      ((h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16));
  }
  // 剩下不足 4 个字符的尾巴（同原算法的 switch 穿透）
  if (length >= 3) h ^= (text.charCodeAt(i + 2) & 0xff) << 16;
  if (length >= 2) h ^= (text.charCodeAt(i + 1) & 0xff) << 8;
  if (length >= 1) {
    h ^= text.charCodeAt(i) & 0xff;
    h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16);
  }
  h ^= h >>> 13;
  h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16);
  return ((h ^ (h >>> 15)) >>> 0).toString(36);
}
