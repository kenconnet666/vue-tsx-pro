/**
 * 只在浏览器里渲染的内容：服务端渲染与水合时画 fallback（默认什么都不画），挂载后才画 children。
 * 给只有浏览器才画得出来的东西用：按量出来的尺寸排版、canvas、依赖当前时刻或本机设置的显示，免得服务端与浏览器的结果对不上。
 * 没有服务端渲染的应用里，它只是晚一拍（挂载后的下一次渲染）才画出内容。
 *
 *   <ClientOnly fallback={<Skeleton height="12rem" />}>
 *     <WorldMap data={sales} />
 *   </ClientOnly>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { useMounted } from '../utils/dom/mounted';

/** ClientOnly 的属性 */
export interface ClientOnlyProps {
  /** 只在浏览器里渲染的内容 */
  children?: VNodeChild;
  /** 服务端渲染与水合时先画的占位（骨架屏一类），默认什么都不画 */
  fallback?: VNodeChild;
}

/** 只在浏览器里渲染的内容 */
export const ClientOnly = _component(({ children, fallback }: ClientOnlyProps) => {
  const mounted = useMounted();
  return () => (mounted.value ? children : fallback);
});
