/**
 * 离场动画的统一流程：关闭后先保持挂载、写 data-state="closed"，等离场（CSS 过渡或 Anime.js）结束再卸载。
 *
 *   const presence = usePresence(() => open, { onExited: () => emit('removed') });
 *   return () => presence.mounted && <div ref={presence.ref} data-state={presence.state} … />;
 *   // 样式里按 state 写离场的终值与过渡：presence.state === 'closed' && styles.leaving
 *
 * 离场中又打开了就停在打开状态，不卸载、不调用 onExited。元素自己决定是否卸载时（Toast、Tag）只用 state 与 onExited。
 */
import { computed, nextTick, onScopeDispose, shallowRef, watch } from 'vue';
import { toElement } from '../dom/element';
import { afterTransitions } from '../style/transitions';

/** usePresence 的返回值 */
export interface Presence {
  /** 是否渲染：打开时，以及关闭后离场还没结束时 */
  readonly mounted: boolean;
  /** 打开还是正在离场（写到 data-state） */
  readonly state: 'open' | 'closed';
  /** 离场过渡所在的元素（或组件）的 ref：等它与子元素上的过渡结束 */
  ref: (element: unknown) => void;
}

/** usePresence 的选项 */
export interface PresenceOptions {
  /** 离场结束、mounted 变为 false 之后调用 */
  onExited?: () => void;
  /** JS 离场动画（如 Anime.js）：关闭状态渲染后调用，等它结束；CSS 过渡不用写，会自动等 */
  exit?: (element: HTMLElement) => PromiseLike<unknown> | void;
}

/** 关闭后等离场结束再卸载（在 setup 里调用） */
export function usePresence(
  read: () => boolean,
  { onExited, exit }: PresenceOptions = {},
): Presence {
  const open = computed(read);
  const mounted = shallowRef(open.value);
  let element: HTMLElement | null = null;
  // 每次开关换一个编号：离场途中又打开（或组件卸载）时，旧的离场流程作废
  let generation = 0;
  onScopeDispose(() => generation++);

  watch(open, async (value) => {
    const current = ++generation;
    if (value) {
      mounted.value = true;
      return;
    }
    // 等关闭状态写进 DOM，过渡才开始
    await nextTick();
    if (element) {
      await exit?.(element);
      await afterTransitions(element);
    }
    if (current !== generation) return;
    mounted.value = false;
    onExited?.();
  });

  return {
    get mounted() {
      return mounted.value;
    },
    get state() {
      return open.value ? 'open' : 'closed';
    },
    ref: (value) => (element = toElement(value)),
  };
}

/**
 * 内容延迟渲染：lazy 时第一次打开前不渲染，打开过之后一直保留（再次打开、离场过渡都不必重建）。
 * 在 setup 里调用，返回的函数在渲染时调用；渲染本来就读 open，打开时会重新渲染，所以不需要响应式状态。
 *
 *   const showContent = useLazyContent(() => open, () => lazy);
 *   <div popover>{showContent() && children}</div>
 *
 * 浮层（Popover、HoverCard、Menu、对话框与抽屉）默认延迟：一百个关闭的菜单挂载 118ms → 12ms；
 * Collapse、Tabs 默认不延迟（收起的内容页内搜索要找得到）。Tooltip 不延迟：它被触发器的 aria-describedby 引用。
 */
export function useLazyContent(open: () => boolean, lazy: () => boolean): () => boolean {
  let opened = false;
  return () => {
    if (open()) opened = true;
    return opened || !lazy();
  };
}

/** 浮层的内容延迟渲染（Popover、HoverCard、Menu、对话框与抽屉共用） */
export interface LazyContentOptions {
  /**
   * 第一次打开前不渲染内容，打开过后保留，默认 true。
   * 内容要一直在 DOM 里（页内搜索、关闭时也要查询其中的元素）时设为 false
   */
  lazy?: boolean;
}
