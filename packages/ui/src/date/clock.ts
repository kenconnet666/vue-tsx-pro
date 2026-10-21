/**
 * 随时间更新的“现在”（RelativeTime、Countdown 共用）：每隔 interval 毫秒更新一次，对齐到整秒、整分，
 * 同一页上的几个计时器一起跳；页面隐藏时停下，回来时立刻更新（后台标签页里的定时器本来就不准，还白白耗电）。
 *
 *   const now = useNow((current) => (current >= end ? null : 1000));   // 渲染里读 now.value；null 时不再更新
 *
 * interval 拿到当前的 now，每次更新后重新计算：相对时间从“秒”变成“分钟”时，更新的频率跟着降下来。
 */
import { onScopeDispose, shallowRef, watch, type Ref } from 'vue';
import { usePageVisible } from '../utils/dom/page-visibility';

/** 现在的时间戳（毫秒），按 interval 更新；interval 为 null 时停在最后一次的值（在 setup 里调用） */
export function useNow(interval: (now: number) => number | null): Readonly<Ref<number>> {
  const now = shallowRef(Date.now());
  const visible = usePageVisible();
  let timer: ReturnType<typeof setTimeout> | undefined;

  function schedule() {
    clearTimeout(timer);
    const every = interval(now.value);
    if (every == null || !visible.value) return;
    // 对齐到 interval 的整数倍：多个计时器同一刻跳，倒计时的秒数不会一会儿快一会儿慢
    timer = setTimeout(
      () => {
        now.value = Date.now();
        schedule();
      },
      every - (Date.now() % every),
    );
  }

  watch(() => interval(now.value), schedule, { immediate: true });
  watch(visible, (shown) => {
    if (shown) now.value = Date.now();
    schedule();
  });
  onScopeDispose(() => clearTimeout(timer));
  return now;
}
