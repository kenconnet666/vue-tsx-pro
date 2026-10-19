/**
 * 加载指示防闪烁：很快完成的加载不出现指示，出现了就至少显示一段时间（同 Ant Design Spin 的 delay、
 * React Spectrum 的进度延迟）。只管视觉：aria-busy、禁止点击等仍按真实的 loading 立即生效。
 *
 *   const shown = useDelayedLoading(() => loading);   // 渲染里用 shown.value 决定显示骨架、进度条
 *
 * 挂载时已经在加载就立即显示（没有内容可看，空白比指示更糟）。
 */
import { onScopeDispose, shallowRef, watch, type Ref } from 'vue';

/** useDelayedLoading 的选项 */
export interface DelayedLoadingOptions {
  /** 开始加载后过多久才显示（毫秒），默认 200 */
  delay?: number;
  /** 显示后至少保持多久（毫秒），默认 500 */
  minDuration?: number;
}

/** 加载指示是否显示（在 setup 里调用） */
export function useDelayedLoading(
  read: () => boolean,
  { delay = 200, minDuration = 500 }: DelayedLoadingOptions = {},
): Readonly<Ref<boolean>> {
  const shown = shallowRef(read());
  let shownAt = shown.value ? Date.now() : 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (wait: number, next: boolean) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      shown.value = next;
      if (next) shownAt = Date.now();
    }, wait);
  };

  watch(read, (loading) => {
    if (loading) {
      // 正在等着隐藏时又开始加载：取消隐藏，继续显示
      if (shown.value) clearTimeout(timer);
      else schedule(delay, true);
      return;
    }
    if (!shown.value) return clearTimeout(timer);
    schedule(Math.max(0, shownAt + minDuration - Date.now()), false);
  });
  onScopeDispose(() => clearTimeout(timer));
  return shown;
}
