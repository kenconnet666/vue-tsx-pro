/**
 * 随时间更新的“现在”（RelativeTime、Countdown 共用）：每隔 interval 毫秒更新一次，对齐到整秒、整分，
 * 同一页上的几个计时器一起跳；页面隐藏时停下，回来时立刻更新（后台标签页里的定时器本来就不准，还白白耗电）。
 *
 *   const now = useNow((current) => (current >= end ? null : 1000));   // 渲染里读 now.value；null 时不再更新
 *   <time {...nowAttrs(now.value)}>…</time>                              // 根元素带上渲染时的“现在”
 *
 * interval 拿到当前的 now，每次更新后重新计算：相对时间从“秒”变成“分钟”时，更新的频率跟着降下来。
 *
 * 服务端渲染：服务端的“现在”和浏览器水合时的不同（静态站点相差几天），直接渲染会对不上（“16 天前”与“17 天前”）。
 * 根元素用 nowAttrs 写上渲染时的“现在”，水合时 useNow 先取这个值、渲染出和服务端一样的内容，挂载后再换成真实的现在
 * （参考 Nuxt 的 NuxtTime）。
 */
import { getCurrentInstance, onMounted, onScopeDispose, shallowRef, watch, type Ref } from 'vue';
import { isHydrating } from '../utils/dom/mounted';
import { usePageVisible } from '../utils/dom/page-visibility';

const NOW_ATTR = 'data-now';

/** 根元素上记下渲染时的“现在”，水合时据此对齐服务端的内容 */
export const nowAttrs = (now: number) => ({ [NOW_ATTR]: now });

/** 正在水合时，服务端渲染的根元素上记下的“现在”；不是水合（客户端渲染、服务端）时为 undefined */
export function hydratingNow(): number | undefined {
  if (!isHydrating()) return undefined;
  // 根节点可能不是元素（片段的注释节点）：按 nodeType 判断
  const el = getCurrentInstance()!.vnode.el as Element;
  const value = el.nodeType === 1 ? el.getAttribute(NOW_ATTR) : null;
  return value == null ? undefined : Number(value);
}

/** 现在的时间戳（毫秒），按 interval 更新；interval 为 null 时停在最后一次的值（在 setup 里调用） */
export function useNow(interval: (now: number) => number | null): Readonly<Ref<number>> {
  // 服务端只渲染一次：不起定时器（组件在服务端不会卸载，定时器会一直自己续下去）
  if (typeof document === 'undefined') return shallowRef(Date.now());
  const hydrating = hydratingNow();
  const now = shallowRef(hydrating ?? Date.now());
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

  if (hydrating != null) onMounted(() => (now.value = Date.now()));
  schedule();
  // 间隔变了（倒计时的终点从过去改到将来、精度换了）：先对一次表，不然到下一跳之前是按停下时的时刻算的
  watch(
    () => interval(now.value),
    () => {
      now.value = Date.now();
      schedule();
    },
  );
  watch(visible, (shown) => {
    if (shown) now.value = Date.now();
    schedule();
  });
  onScopeDispose(() => clearTimeout(timer));
  return now;
}
