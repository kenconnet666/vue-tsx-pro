/**
 * 失效推送（ROADMAP 22.9）：服务端知道哪些表改了（easy-query-ts-cache 的 tableChanges / onEvict），经 SSE 推给浏览器，
 * 前端缓存（@zerodep-dev/storage 的 createCache）按表名标签失效，正显示着的 useRequest 跟着重新请求。
 *
 *   // 服务端
 *   const hub = createInvalidationHub();
 *   const db = createDb({ …, interceptors: [tableChanges((tables) => hub.publish(tables))] });
 *   createRenderer({ …, invalidation: hub });   // GET /_invalidation
 *   // 浏览器
 *   listenInvalidation((tags) => (tags ? cache.invalidateTag(tags) : cache.invalidatePrefix('')));
 *
 * 推出去的只有标签（表名），不带数据；按标签失效对所有连着的浏览器都一样，多失效几条只是多请求一次。
 * 断线重连时浏览器带上最后收到的编号，这边补发错过的；隔得太久（超出保留的条数）或服务端重启过时发 reset，浏览器全部失效。
 * 多实例部署时每个实例只看得到自己的写入：tableChanges 里改发 db.notify，各实例 listen 到后各自 publish。
 */

/** 浏览器连接推送的地址 */
export const INVALIDATION_PATH = '/_invalidation';

/**
 * 收听服务端的失效推送（浏览器里调用；服务端渲染时什么也不做）。tags 为 undefined 时说不清漏了哪些（断线太久、服务端重启过），
 * 应当全部失效。EventSource 断线后自己重连。返回停止收听的函数
 */
export function listenInvalidation(
  onInvalidate: (tags: readonly string[] | undefined) => void,
  url = INVALIDATION_PATH,
): () => void {
  if (typeof EventSource === 'undefined') return () => {};
  const source = new EventSource(url);
  source.onmessage = (event: MessageEvent<string>) =>
    onInvalidate(JSON.parse(event.data) as string[]);
  source.addEventListener('reset', () => onInvalidate(undefined));
  return () => source.close();
}
