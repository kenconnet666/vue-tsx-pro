/**
 * 一个元素的样式组合成类：片段按段（BOUNDARY 分开，见 runtime.ts 的 layers）各合成一个组合类，固定类（主题、标记）原样挂上。
 * attrs 渲染时用它；元素上的绑定换了其中一段时也用它就地算出新类（bindings.ts）。
 */
import { CLASS, FRAGMENT, segmentClass, type ClassStyle, type Fragment } from './fragment';
import { SEGMENT_LIMIT } from './sheet';

/** 组合的结果：交给元素的 class（没有样式时为空对象） */
export type Composed = Readonly<{ class?: string }>;

/** 段的分界：attrs 收集样式时插在每组 layers 的前后 */
export const BOUNDARY: object = Object.freeze({});

/** 组合缓存：按参与的对象（片段、主题、标记、分界）逐层索引 */
interface CacheNode {
  next?: WeakMap<object, CacheNode>;
  result?: Composed;
}
const cache: CacheNode = {};

/**
 * 一组样式（按书写顺序，可以夹着分界）→ 元素的类。按参与的对象逐层查缓存，命中时不拼字符串、不算哈希，
 * 同样的组合返回同一个结果对象（Vue 比对 class 相同就不碰 DOM）
 */
export function compose(parts: readonly object[]): Composed {
  let node = cache;
  for (const part of parts) {
    node.next ??= new WeakMap();
    let child = node.next.get(part);
    if (!child) node.next.set(part, (child = {}));
    node = child;
  }
  return (node.result ??= resolve(parts));
}

/** 缓存没命中：按分界切成段，每段合成一个类（空段不算）；固定类按去重键后者覆盖前者 */
function resolve(parts: readonly object[]): Composed {
  const segments: Fragment[][] = [[]];
  const fixed = new Map<string, string>();
  for (const part of parts) {
    if (part === BOUNDARY) {
      if (segments.at(-1)!.length) segments.push([]);
    } else if (FRAGMENT in part) segments.at(-1)!.push(part as Fragment);
    else if (CLASS in part) {
      const [key, className] = (part as ClassStyle)[CLASS];
      fixed.delete(key);
      fixed.set(key, className);
    } else throw new Error('attrs：不认识的样式，只收 create、createTheme、defineMarker 的结果');
  }
  if (!segments.at(-1)!.length) segments.pop();
  // 超出层数的段并进最后一段（顺序不变，合并语义同一段里的后者覆盖前者）
  if (segments.length > SEGMENT_LIMIT) segments.push(segments.splice(SEGMENT_LIMIT - 1).flat());
  const classes = [
    ...segments.map((_, index) => segmentClass(segments, index)),
    ...fixed.values(),
  ].filter(Boolean);
  return Object.freeze(classes.length ? { class: classes.join(' ') } : {});
}
