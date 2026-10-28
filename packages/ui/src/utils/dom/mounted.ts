/** 组件挂载了没有：服务端渲染与水合时为 false，挂载后变成 true */
import { onMounted, shallowRef, type ShallowRef } from 'vue';

/**
 * 挂载后才变成 true 的状态（在 setup 里调用）。只能在浏览器里判断的东西（某个 API 支不支持、量出来的尺寸）
 * 在挂载前按服务端的结果渲染，水合时两边一致；挂载后再换成浏览器里的结果
 */
export function useMounted(): Readonly<ShallowRef<boolean>> {
  const mounted = shallowRef(false);
  onMounted(() => (mounted.value = true));
  return mounted;
}
