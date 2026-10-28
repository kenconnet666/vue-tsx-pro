/**
 * 让一个元素全屏（Fullscreen API）：表格、看板、图表的“全屏”按钮。按 Esc 或浏览器的退出全屏时 active 跟着变。在组件的 setup 里调用。
 *
 *   const fullscreen = useFullscreen(() => panel);
 *   <IconButton icon={fullscreen.active ? Minimize : Maximize} onClick={fullscreen.toggle} />
 *
 * 浏览器不支持（iOS Safari 的非视频元素）或被拒绝时什么也不做，supported 为 false 时可以不显示按钮。
 * 挂载前 supported 总是 false：服务端渲染与水合时都不出按钮，两边一致。
 */
import { onBeforeUnmount, onMounted, shallowRef } from 'vue';

/** useFullscreen 的返回值 */
export interface Fullscreen {
  /** 这个元素正在全屏 */
  readonly active: boolean;
  /** 浏览器支持全屏（挂载后才判断） */
  readonly supported: boolean;
  /** 进入或退出全屏 */
  toggle(): Promise<void>;
}

/** 元素的全屏状态与切换 */
export function useFullscreen(target: () => HTMLElement | null | undefined): Fullscreen {
  const active = shallowRef(false);
  const supported = shallowRef(false);

  const sync = () => {
    const element = target();
    active.value = !!element && document.fullscreenElement === element;
  };
  onMounted(() => {
    supported.value = document.fullscreenEnabled === true;
    document.addEventListener('fullscreenchange', sync);
  });
  onBeforeUnmount(() => document.removeEventListener('fullscreenchange', sync));

  return {
    get active() {
      return active.value;
    },
    get supported() {
      return supported.value;
    },
    async toggle() {
      const element = target();
      if (!supported.value || !element) return;
      try {
        if (document.fullscreenElement === element) await document.exitFullscreen();
        else await element.requestFullscreen();
      } catch (error) {
        // 被浏览器拒绝（不是用户手势触发、权限策略）：保持原样，留下记录
        console.warn('全屏切换被浏览器拒绝', error);
      }
    },
  };
}
