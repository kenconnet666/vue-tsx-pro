# @zerodep-dev/storage

可插拔的前端存储与缓存：一套异步驱动接口，底下可以是 IndexedDB、localStorage / sessionStorage、微信、支付宝等小程序的存储、内存；
缓存建在驱动之上，换存储不换用法。零依赖、不绑框架。

```ts
import { createCache, indexedDbDriver, memoryDriver, webStorageDriver } from '@zerodep-dev/storage';

const drafts = indexedDbDriver({ name: 'app', store: 'drafts' });
await drafts.set('order:7', { title: '…', savedAt: new Date() }); // 结构化克隆原样存，Date 还是 Date
await drafts.get('order:7');
await drafts.delete(await drafts.keys('order:'));

const cache = createCache(indexedDbDriver({ name: 'app' }), { ttl: 60_000, stale: 86_400_000 });
await cache.load('provinces', () => api.get('/provinces')); // 新鲜的直接给，否则请求并写回
await cache.read('user:7'); // { value, fresh }：过期但还在 stale 窗口里也给
await cache.invalidatePrefix('user:');
```

## 驱动

| 驱动                                    | 值                               | 跨标签页         | 说明                                                                                                                                 |
| --------------------------------------- | -------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `indexedDbDriver({ name, store })`      | 结构化克隆（Date、Map、Blob）    | BroadcastChannel | 打不开时退回 `fallback`（默认内存，`available()` 查得到）；`durability: 'relaxed'` 适合缓存                                          |
| `webStorageDriver({ storage, prefix })` | 经 `codec` 写成文字（默认 JSON） | storage 事件     | 约 5MB；`prefix` 把数据和页面上别的键分开                                                                                            |
| `miniProgramDriver({ api, prefix })`    | 经 `codec` 写成文字（默认 JSON） | 没有             | 微信写法（wx、tt、qq、swan、ks、jd、uni、Taro）与支付宝写法（my、dd），不给 api 时按全局对象找；与 mobile 的 `useStorage` 同一种格式 |
| `memoryDriver()`                        | 结构化克隆                       | 没有             | 测试、服务端渲染、兜底                                                                                                               |

自己写驱动实现 `StorageDriver`（`get` / `set` / `delete` / `keys` / `clear`，可选 `watch`）。写入 `undefined` 等于删除；
`watch` 只回调别处（别的标签页）的写入。`persistStorage()` 申请持久存储：Safari 会清掉 7 天没打开过的网站数据，装到主屏的 PWA 例外。

小程序存储的容量（2026-10 官方文档）：微信单个键 1MB、总共 10MB；支付宝单条 200KB、同一用户同一小程序总共 10MB。启动时别大量同步读写。

## 缓存

`createCache(driver, { prefix, ttl, stale })`：存进驱动的是 `{ value, expires, until }`，过期时间在这里算，驱动不用支持 TTL。

- `get` 只给新鲜的；`read` 还给过期但在 `stale` 窗口里的（`fresh: false`），窗口过了删掉
- `load(键, loader)` 新鲜的直接给，否则调 loader 写回；同一个键并发只调一次，失败不写
- `invalidate(键)` / `invalidatePrefix(前缀)`；`watch` 收到别的标签页改了或失效的键

组件库的 `useRequest` 的 `cache` 选项按 `read` / `set` 对接：有缓存先显示，新鲜的不再请求，过期的后台刷新。

## 与 easy-query 的二级缓存

`cacheStore(driver)` 把任意驱动变成 easy-query-ts-cache 的 `CacheStore`（浏览器里跑 PGlite、SQLite WASM 时用）；
反方向，easy-query 的 `createCache({ onEvict })` 在服务端失效时收到删掉的键，可以经 SSE、WebSocket 推给前端，前端 `cache.invalidate(keys)`。
