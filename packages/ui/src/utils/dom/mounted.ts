/** 组件挂载了没有：服务端渲染与水合时为 false，挂载后变成 true */
import { getCurrentInstance, onMounted, shallowRef, type ShallowRef } from 'vue';

/**
 * 挂载后才变成 true 的状态（在 setup 里调用）。只能在浏览器里判断的东西（某个 API 支不支持、量出来的尺寸）
 * 在挂载前按服务端的结果渲染，水合时两边一致；挂载后再换成浏览器里的结果
 */
export function useMounted(): Readonly<ShallowRef<boolean>> {
  const mounted = shallowRef(false);
  onMounted(() => (mounted.value = true));
  return mounted;
}

/**
 * 这个组件是不是正在水合（接管服务端渲染出来的节点）；在 setup 里调用，不在组件里、客户端渲染、服务端都是 false。
 * 只有浏览器里才读得到的初始状态（存下来的值、媒体查询）水合时先按服务端的值渲染，挂载后再换成真实的：
 * 直接用真实值渲染，节点和服务端的对不上，而生产构建里属性、样式的不一致 Vue 不会改回来，界面就停在服务端的样子
 */
export function isHydrating(): boolean {
  // 水合时组件的 vnode.el 在 setup 之前就指向服务端渲染的节点
  return typeof document !== 'undefined' && getCurrentInstance()?.vnode.el != null;
}
