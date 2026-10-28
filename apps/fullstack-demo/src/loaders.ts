/**
 * 页面的 loader（只在服务端导入：服务端入口直接调用；浏览器经 /_data 接口调用）。
 * 页面里用 src/client.ts 的 usePageData 取结果，类型从这里推导
 */
import { defineLoaders } from './framework/data.ts';
import { db, Todo } from './server/db.ts';

export const loaders = defineLoaders({
  '/': () => ({
    // bigint、Date 这类 JSON 装不下的值经 json-wire 原样到浏览器
    visits: 9_007_199_254_740_993n,
    renderedAt: new Date().toISOString(),
    tips: [
      '页面不知道自己是服务端渲染还是浏览器渲染',
      '水合时不重复请求',
      '站内换页经 /_data 取数据',
    ],
  }),
  // 只有当前租户的：tenant 拦截器自动加条件
  '/todos': () =>
    db
      .queryable(Todo)
      .orderBy((t) => t.id)
      .select((t) => ({ id: t.id, title: t.title, done: t.done }))
      .toList(),
});
