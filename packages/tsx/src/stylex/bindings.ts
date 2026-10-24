/**
 * 元素上的响应式绑定（stylex.bind 交给 attrs 之后）：元素挂上时起一个 effect，参数变化时只改元素上的 CSS 变量，
 * 组件不重新渲染；组件因别的原因重新渲染时复用元素上的 effect，卸载时停掉。
 */
import { getCurrentInstance, ReactiveEffect, type ComponentInternalInstance } from 'vue';
import { EVALUATE, type Binding, type Fragment } from './fragment';

/** 一次渲染里的一个绑定：渲染时算出的片段，与它写在行内的变量（effect 只管这些，同一元素上别的动态样式的变量不碰） */
export interface BindingEntry {
  /** 绑定本身：动态样式与读参数的函数 */
  binding: Binding;
  /** 渲染时算出的片段（参数让属性多出或消失时会变，effect 据此判断要不要重新渲染） */
  fragment: Fragment;
  /** 渲染时算出、交给 Vue 写进行内样式的变量 */
  initial: Readonly<Record<string, string>>;
}

/** 一个元素上的响应式绑定：重新渲染时复用（只换读取函数），卸载时停掉 */
interface BoundElement {
  bindings: readonly BindingEntry[];
  /** 元素已卸载、effect 已停 */
  stopped: boolean;
  /** 现在写在元素上的变量与值（比对用它，不读 DOM） */
  applied: Map<string, string>;
  effect: ReactiveEffect;
  /** 形状变了时请它重新渲染 */
  instance: ComponentInternalInstance | null;
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

/** 读绑定的参数、只改元素上变了的变量；形状变了（多出、少了属性）时类也要换，请组件重新渲染 */
function apply(element: HTMLElement, bound: BoundElement) {
  const next = new Map<string, string>();
  let reshaped = false;
  for (const { binding, fragment } of bound.bindings) {
    const evaluated = binding.style[EVALUATE](binding.args());
    if (evaluated.fragment !== fragment) reshaped = true;
    for (const name in evaluated.inline) {
      const value = evaluated.inline[name]!;
      next.set(name, value);
      if (bound.applied.get(name) !== value) element.style.setProperty(name, value);
    }
  }
  for (const name of bound.applied.keys()) if (!next.has(name)) element.style.removeProperty(name);
  bound.applied = next;
  if (reshaped) bound.instance?.proxy?.$forceUpdate();
}

/**
 * 元素的 ref：挂上时起一个 effect（Vue 公开的 ReactiveEffect，依赖变化时排进微任务）；
 * 组件重新渲染会给一个新的 ref 函数，同一个元素就复用原来的 effect，换上这次的读取函数重跑一次（重新收集依赖）；
 * 卸载时 Vue 用 null 调用 ref，停掉 effect。（ref 函数换了时 Vue 不会用 null 调旧的那个，所以状态按元素存）
 */
export function watchBindings(bindings: readonly BindingEntry[]) {
  const instance = getCurrentInstance();
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
      // Vue 刚按这次渲染算出的值写过行内样式。读取函数读的来源没变（稳定、同一个动态样式）时只换上新的读取函数，
      // 否则重跑一次 effect 重新收集依赖（求值有记忆，值没变时不碰 DOM）
      const same = sameSources(existing.bindings, bindings);
      existing.bindings = bindings;
      existing.instance = instance;
      existing.applied = initialValues(bindings);
      if (!same) existing.effect.run();
      return;
    }
    const target = current as HTMLElement;
    const bound: BoundElement = {
      bindings,
      stopped: false,
      applied: initialValues(bindings),
      instance,
      effect: new ReactiveEffect(() => apply(target, bound)),
    };
    bound.effect.scheduler = () => schedule(bound);
    boundElements.set(target, bound);
    bound.effect.run();
  };
}

/** 两次渲染的绑定读的是同一批来源：个数、动态样式都相同，而且读取函数都是稳定的 */
function sameSources(previous: readonly BindingEntry[], next: readonly BindingEntry[]) {
  return (
    previous.length === next.length &&
    next.every(
      ({ binding }, index) => binding.stable && previous[index]!.binding.style === binding.style,
    )
  );
}

/** 这次渲染交给 Vue 写进行内样式的变量 */
function initialValues(bindings: readonly BindingEntry[]) {
  const values = new Map<string, string>();
  for (const { initial } of bindings) for (const name in initial) values.set(name, initial[name]!);
  return values;
}
