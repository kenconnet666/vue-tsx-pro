/**
 * 服务端按页面的模式输出整页 HTML（ROADMAP 13.3）：ssr、static 渲染正文交给浏览器水合，csr 只发空壳；
 * 渲染出错时记下错误、改发空壳，页面照样能用（浏览器渲染）。Nitro 的服务端入口把请求交给它：
 *
 *   import assets from './entry-client.ts?assets=client';
 *   export default { fetch: createRenderer({ ...app, assets }) };
 */
import { renderStyleTag } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { builtinThemeBootColors, themeBootScript } from '@zerodep-dev/vue-tsx-pro-ui/theme-boot';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createMemoryHistory } from 'vue-router';
import type { AppDefinition } from './app.ts';
import {
  DATA_PATH,
  encodeDataResponse,
  encodePageData,
  PAGE_DATA_ID,
  providePageData,
  routePattern,
  type Loaders,
} from './data.ts';
import { pageTitle } from './page.ts';

/** Nitro 给的浏览器入口资源（`?assets=client`）：入口地址、要预加载的模块与样式表 */
export interface ClientAssets {
  entry?: string;
  js: readonly Record<string, string>[];
  css: readonly Record<string, string>[];
}

/** createRenderer 的选项：应用的定义加上浏览器入口的资源、页面的 loader */
export interface RendererOptions extends AppDefinition {
  assets: ClientAssets;
  loaders?: Loaders;
  /** 'csr' 时整站改成浏览器渲染（服务端渲染出问题时的总开关，部署时用环境变量切换）；默认按各页的 mode */
  renderMode?: 'auto' | 'csr';
}

const escape = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const attributes = (record: Record<string, string>) =>
  Object.entries(record)
    .map(([name, value]) => ` ${name}="${escape(value)}"`)
    .join('');

/** 渲染页面的请求处理函数 */
export function createRenderer(options: RendererOptions): (request: Request) => Promise<Response> {
  const { App, assets, loaders = {} } = options;
  const patterns = Object.keys(loaders);

  /** 地址解析成路由，找到它的 loader */
  async function resolve(path: string, request: Request) {
    const router = options.createRouter(createMemoryHistory());
    await router.push(path);
    await router.isReady();
    const route = router.currentRoute.value;
    const pattern = routePattern(route);
    const load = Object.hasOwn(loaders, pattern) ? loaders[pattern] : undefined;
    const run = load && (() => load({ params: route.params, query: route.query, request }));
    return { router, route, pattern, run };
  }

  return async (request) => {
    const url = new URL(request.url);
    // 浏览器换页、csr 页面取数据：GET /_data?path=/orders/1
    if (url.pathname === DATA_PATH) {
      const { route, pattern, run } = await resolve(url.searchParams.get('path') ?? '/', request);
      if (!run) return Response.json({ error: `${route.path} 没有 loader` }, { status: 404 });
      return Response.json(encodeDataResponse(pattern, await run()));
    }

    const { router, route, pattern, run } = await resolve(url.pathname + url.search, request);
    const ui = options.createUi(router);
    const csr = options.renderMode === 'csr' || route.meta.mode === 'csr';
    // csr 的数据由浏览器经接口取；ssr、static 在这里取好写进页面
    const data = run && !csr ? { pattern, value: await run() } : null;

    let body = '';
    let teleports = '';
    if (!csr) {
      try {
        const context: { teleports?: Record<string, string> } = {};
        const app = createSSRApp(App).use(router).use(ui);
        if (data) providePageData(app, data.pattern, data.value);
        // 组件里的错误 Vue 在生产环境只记一笔、照样渲染完（缺了一块的页面）：记下第一个，当作渲染失败
        let failure: unknown;
        app.config.errorHandler = (error) => (failure ??= error ?? new Error('渲染出错'));
        body = await renderToString(app, context);
        if (failure !== undefined) throw failure;
        teleports = context.teleports?.['body'] ?? '';
      } catch (error) {
        console.error(`服务端渲染 ${url.pathname} 出错，改发空壳由浏览器渲染`, error);
        body = teleports = '';
      }
    }

    const attrs = ui.documentAttrs();
    const htmlAttrs = { lang: 'zh-CN', ...attrs.html };
    const styles = renderStyleTag(
      `<html${attributes(htmlAttrs)}><body${attributes(attrs.body)}>${teleports}${body}</body></html>`,
    );
    const links = [
      ...assets.css.map((link) => `<link rel="stylesheet"${attributes(link)} />`),
      ...assets.js.map((link) => `<link rel="modulepreload"${attributes(link)} />`),
    ];
    // Teleport 到 body 的内容紧挨着 <body> 放在最前：Vue 水合时从 body 的第一个子节点开始找它（中间不能有空白）
    const html = `<!doctype html>
<html${attributes(htmlAttrs)}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(pageTitle(route.meta.title, options.siteName))}</title>
    <script>${themeBootScript({ themes: builtinThemeBootColors })}</script>
    ${styles}
    ${links.join('\n    ')}
    <script type="module" src="${escape(assets.entry ?? '')}"></script>
  </head>
  <body${attributes(attrs.body)}>${teleports}<div id="app">${body}</div><script type="application/json" id="${PAGE_DATA_ID}">${encodePageData(patterns, data)}</script></body>
</html>`;
    return new Response(html, {
      status: route.matched.length > 0 ? 200 : 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  };
}
