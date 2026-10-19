/**
 * 未保存离开的提醒：read() 为 true 时，关闭标签页、刷新、跳到别的网站前浏览器会问一下（beforeunload）。
 *
 *   useLeaveConfirmation(() => form.dirty && !form.submitting);
 *
 * 浏览器只显示自己的固定文案，不能自定义。单页应用内的路由跳转不经过 beforeunload：由使用方在路由守卫里接，
 * 如 vue-router 的 onBeforeRouteLeave(() => !form.dirty || confirm('有未保存的修改，确定离开？'))。
 */
import { onScopeDispose, watch } from 'vue';

/** 有未保存的修改时拦住页面卸载（在 setup 里调用，组件卸载时自动解除） */
export function useLeaveConfirmation(read: () => boolean): void {
  if (typeof window === 'undefined') return;
  const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
  // 只在需要时注册：注册了 beforeunload 的页面进不了往返缓存（bfcache）
  const stop = watch(
    read,
    (blocking) => {
      if (blocking) window.addEventListener('beforeunload', onBeforeUnload);
      else window.removeEventListener('beforeunload', onBeforeUnload);
    },
    { immediate: true },
  );
  onScopeDispose(() => {
    stop();
    window.removeEventListener('beforeunload', onBeforeUnload);
  });
}
