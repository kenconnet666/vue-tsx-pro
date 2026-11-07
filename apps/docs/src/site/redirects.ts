/**
 * 合并、挪走了的文档页：旧地址 → 新页的对应小节，站内外的旧链接、收藏不失效。
 * 线上没有对应文件的地址回落到 spa.html（wrangler.jsonc 的 404-page），由路由在浏览器里跳转
 */
export const redirects: Readonly<Record<string, string>> = {
  '/components/icon-button': '/components/button#icon-buttons',
};
