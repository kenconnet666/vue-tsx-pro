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
import { toElement } from '../dom/overlay';
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
