/**
 * 元素上的响应式绑定（css.bind、css.select 交给 attrs 之后）：元素挂上时起一个 effect，参数变化时只改元素上的
 * CSS 变量；选中的样式或动态样式的形状变了时就地换组合类。组件不重新渲染；组件因别的原因重新渲染时复用元素上的
 * effect，卸载时停掉。
 */
import { ReactiveEffect } from 'vue';
import { compose } from './compose';
import { CLASS, EVALUATE, FRAGMENT, type Binding, type StylePart } from './fragment';

/** 一次渲染里的一个绑定：渲染时读到的参数与算出的结果（effect 只管这些，同一元素上别的动态样式的变量不碰） */
export interface BindingEntry {
  /** 绑定本身：动态样式（或选择）与读参数的函数 */
  binding: Binding;
  /** 在这次 attrs 的样式里排第几（换类时替换这一段） */
  index: number;
  /** 渲染时读到的参数：effect 读到同样的就不再求值 */
  args: readonly unknown[];
  /** 渲染时算出、交给 Vue 写进行内样式的变量 */
  inline: Readonly<Record<string, string>>;
}

/** 一个元素上的响应式绑定：重新渲染时复用（换上这次的样式与读取函数），卸载时停掉 */
interface BoundElement {
  /** 这次渲染的绑定；args、inline 随 effect 更新成元素上现在的 */
  bindings: BindingEntry[];
  /** 这次 attrs 参与组合的全部样式（绑定的那几段随 effect 更新） */
  parts: StylePart[];
  /** 元素上现在由引擎给的类（组合类与主题、标记的类），空格分隔 */
  className: string;
  /** 元素已卸载、effect 已停 */
  stopped: boolean;
  effect: ReactiveEffect;
}
const boundElements = new WeakMap<Element, BoundElement>();

/** 变了的绑定攒到同一个微任务里批量更新（同一轮里改几次参数只改一次 DOM） */
const dirty = new Set<BoundElement>();
function schedule(bound: BoundElement) {
  if (!dirty.size) queueMicrotask(flush);
  dirty.add(bound);
}
function flush() {
  // 先取出再清空：某个绑定出错时，之后的更新照样能排进新的微任务
  const batch = [...dirty];
  dirty.clear();
  for (const bound of batch) if (!bound.stopped) bound.effect.run();
}

/**
 * 读绑定的参数（effect 借此收集依赖）；参数没变的不再求值，变了的只改元素上变了的变量。
 * 选中的样式或形状变了（多出、少了属性）时按换过的那组样式重新组合，就地换掉元素上的类
 */
function apply(element: HTMLElement, bound: BoundElement) {
  let reshaped = false;
  for (const entry of bound.bindings) {
    const args = entry.binding.args();
    if (sameArgs(args, entry.args)) continue;
    const { part, inline } = entry.binding.style[EVALUATE](args);
    entry.args = args;
    if (part !== bound.parts[entry.index]) {
      bound.parts[entry.index] = part;
      reshaped = true;
    }
    const previous = entry.inline;
    entry.inline = inline;
    for (const name in inline) {
      if (previous[name] !== inline[name]) element.style.setProperty(name, inline[name]!);
    }
    for (const name in previous) {
      if (!(name in inline) && !ownedByOthers(bound, entry, name))
        element.style.removeProperty(name);
    }
  }
  if (reshaped) swapClass(element, bound, compose(bound.parts).class ?? '');
}

/** 同一元素上别的绑定也写着这个变量（同一个动态样式绑了两次）：不删 */
const ownedByOthers = (bound: BoundElement, self: BindingEntry, name: string) =>
  bound.bindings.some((entry) => entry !== self && name in entry.inline);

/**
 * 就地换类：只动引擎给的那几个类，元素上别的类（使用方的 class、过渡类）不碰。
 * Vue 的虚拟节点里还是渲染时的类；组件之后因别的原因重新渲染时按当时的状态算出类，与元素上的一致
 */
function swapClass(element: HTMLElement, bound: BoundElement, next: string) {
  const before = bound.className ? bound.className.split(' ') : [];
  const after = next ? next.split(' ') : [];
  const removed = before.filter((name) => !after.includes(name));
  const added = after.filter((name) => !before.includes(name));
  // 一换一（多半只是组合类换了）用 replace：元素的 class 只改一次
  const pairs = Math.min(removed.length, added.length);
  for (let index = 0; index < pairs; index++)
    element.classList.replace(removed[index]!, added[index]!);
  for (const name of removed.slice(pairs)) element.classList.remove(name);
  for (const name of added.slice(pairs)) element.classList.add(name);
  bound.className = next;
}

/**
 * 参数没变：每一项相同，并且都是原始值或样式本身。对象参数（动态样式读它的属性）即使是同一个也要重新求值，
 * 读它属性的那些依赖是求值时收集的
 */
function sameArgs(next: readonly unknown[], previous: readonly unknown[]) {
  if (next.length !== previous.length) return false;
  for (let index = 0; index < next.length; index++) {
    const value = next[index];
    if (!Object.is(value, previous[index])) return false;
    if (typeof value === 'object' && value !== null && !(FRAGMENT in value) && !(CLASS in value))
      return false;
    if (typeof value === 'function') return false;
  }
  return true;
}

/**
 * 元素的 ref：挂上时起一个 effect（Vue 公开的 ReactiveEffect，依赖变化时排进微任务）。第一次运行只为收集依赖：
 * 读到的参数与渲染时相同，就不再求值、不碰 DOM（挂载时参数只算一次）。
 * 组件重新渲染会给一个新的 ref 函数，同一个元素就复用原来的 effect，换上这次的样式与读取函数；读取函数读的来源
 * 可能变了（不稳定的绑定）时重跑一次重新收集依赖。卸载时 Vue 用 null 调用 ref，停掉 effect。
 * （ref 函数换了时 Vue 不会用 null 调旧的那个，所以状态按元素存）
 */
export function watchBindings(bindings: BindingEntry[], parts: StylePart[], className: string) {
  let current: Element | undefined;
  return (element: unknown) => {
    if (!element) {
      if (!current) return;
      const bound = boundElements.get(current);
      if (bound) {
        bound.stopped = true;
        bound.effect.stop();
      }
      boundElements.delete(current);
      current = undefined;
      return;
    }
    current = element as HTMLElement;
    const existing = boundElements.get(current);
    if (existing) {
      // Vue 刚按这次渲染算出的类与行内变量写过元素：换上这次的状态
      const same = sameSources(existing.bindings, bindings);
      existing.bindings = bindings;
      existing.parts = parts;
      existing.className = className;
      if (!same) existing.effect.run();
      return;
    }
    const target = current as HTMLElement;
    const bound: BoundElement = {
      bindings,
      parts,
      className,
      stopped: false,
      effect: new ReactiveEffect(() => apply(target, bound)),
    };
    bound.effect.scheduler = () => schedule(bound);
    boundElements.set(target, bound);
    bound.effect.run();
  };
}

/** 两次渲染的绑定读的是同一批来源：个数、求值入口都相同，而且读取函数都是稳定的 */
function sameSources(previous: readonly BindingEntry[], next: readonly BindingEntry[]) {
  return (
    previous.length === next.length &&
    next.every(
      ({ binding }, index) => binding.stable && previous[index]!.binding.style === binding.style,
    )
  );
}
