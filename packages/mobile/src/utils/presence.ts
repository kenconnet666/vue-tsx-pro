/**
 * 进出场：弹层先以关闭的样子挂上，等它画到屏幕上（宿主的 nextFrame）再换成打开的样子，样式里的过渡（transition）就会播；
 * 关闭时先换回关闭的样子，等过渡播完再卸载。不用 Vue 的 <Transition>：它在运行时 DOM 里，小程序的渲染器用不了。
 *
 *   const presence = usePresence(() => open, DURATION);
 *   return () => presence.mounted && <div data-state={presence.visible ? 'open' : 'closed'} …/>;
 */
import { onBeforeUnmount, shallowRef, watch } from 'vue';
import { useHost } from './host';

/** 弹层的过渡时长（ms），与 token 的 durations.lg 一致 */
export const OVERLAY_DURATION = 300;

/** 进出场的状态 */
export interface Presence {
  /** 要不要渲染：关闭后等过渡播完才变成 false */
  readonly mounted: boolean;
  /** 是不是打开的样子：挂上并画出来之后才变成 true */
  readonly visible: boolean;
}

/** 跟着 open 安排挂载与显示；duration 是离场过渡的时长（ms） */
export function usePresence(open: () => boolean, duration = OVERLAY_DURATION): Presence {
  const host = useHost();
  const mounted = shallowRef(false);
  const visible = shallowRef(false);
  let cancel = () => {};
  const update = (next: boolean) => {
    cancel();
    if (next) {
      mounted.value = true;
      cancel = host.nextFrame(() => (visible.value = true));
    } else {
      visible.value = false;
      const timer = setTimeout(() => (mounted.value = false), duration);
      cancel = () => clearTimeout(timer);
    }
  };
  watch(open, update, { immediate: true });
  onBeforeUnmount(() => cancel());
  return {
    get mounted() {
      return mounted.value;
    },
    get visible() {
      return visible.value;
    },
  };
}
