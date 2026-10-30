/**
 * 服务端的请求处理（ROADMAP 13.3–13.7）：页面按模式输出整页 HTML（ssr、static 渲染正文交给浏览器水合，csr 只发空壳），
 * 另有几个接口——GET /_data（浏览器取页面数据）、POST /_action/<名字>（调用 action）、GET /_session（预渲染页取会话）、
 * GET /_invalidation（给了 invalidation 时：前端缓存的失效推送，SSE）。
 * 每个请求先建请求上下文（createContext），loader、action 在它里面执行；页面与 action 要求的权限在这里拦。
 * 渲染出错时记下错误、改发空壳，页面照样能用（浏览器渲染）。Nitro 的服务端入口把请求交给它：
 *
 *   import assets from './entry-client.ts?assets=client';
 *   export default { fetch: createRenderer({ ...app, assets, loaders, actions, createContext, session }) };
 */
import { renderStyleTag } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { builtinThemeBootColors, themeBootScript } from '@zerodep-dev/vue-tsx-pro-ui/theme-boot';
import { createSSRApp, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createMemoryHistory } from 'vue-router';
import { ACTION_PATH, ActionError, runAction, type Actions } from './action.ts';
import type { AppDefinition } from './app.ts';
import { runInContext } from './context.ts';
import {
  DATA_PATH,
  encodeBootData,
  encodeDataResponse,
  PAGE_DATA_ID,
  providePageData,
  routePattern,
  type Loaders,
  type PageData,
} from './data.ts';
import { INVALIDATION_PATH } from './invalidation.ts';
import type { InvalidationHub } from './invalidation-hub.ts';
import { pageTitle } from './page.ts';
import { createSession, provideSession, SESSION_PATH, type SessionData } from './session.ts';

/** Nitro 给的浏览器入口资源（`?assets=client`）：入口地址、要预加载的模块与样式表 */
export interface ClientAssets {
  entry?: string;
  js: readonly Record<string, string>[];
  css: readonly Record<string, string>[];
}

/** createRenderer 的选项：应用的定义加上浏览器入口的资源与服务端的部分 */
export interface RendererOptions<C extends object> extends AppDefinition {
  assets: ClientAssets;
  loaders?: Loaders;
  actions?: Actions;
  /** 每个请求的上下文（当前用户、租户、db……）；loader、action 里用 currentContext() 取 */
  createContext?: (request: Request) => C | Promise<C>;
  /** 由上下文算出会话（写进页面，浏览器据此藏按钮、生成菜单） */
  session?: (context: C) => SessionData;
  /** 'csr' 时整站改成浏览器渲染（服务端渲染出问题时的总开关，部署时用环境变量切换）；默认按各页的 mode */
  renderMode?: 'auto' | 'csr';
  /** 前端缓存的失效推送（createInvalidationHub）：给了才开 GET /_invalidation，浏览器用 listenInvalidation 连上 */
  invalidation?: InvalidationHub;
  /** 模块：各自带来的 loader、action 并进来，start 在服务端第一次处理请求前执行一次（作业轮询这类常驻的事） */
  modules?: readonly KitModule[];
}

/**
 * 框架的模块（ROADMAP 15.3）：一块能力（流程引擎的命令与查询、某个业务域）自带的 loader、action 与启动时要做的事。
 * 和应用自己的 loader、action 合在一起；名字重复时报错，免得一个悄悄盖掉另一个
 *
 *   createRenderer({ ...app, assets, loaders, actions, modules: [flowModule] });
 */
export interface KitModule {
  readonly name: string;
  readonly loaders?: Loaders;
  readonly actions?: Actions;
  readonly start?: () => void;
}

/** 把几份登记表并成一份，名字重复时报错 */
function mergeNamed<T>(
  what: string,
  own: Readonly<Record<string, T>>,
  modules: readonly KitModule[],
  pick: (m: KitModule) => Readonly<Record<string, T>> | undefined,
) {
  const merged: Record<string, T> = { ...own };
  for (const module of modules) {
    for (const [name, value] of Object.entries(pick(module) ?? {})) {
      if (Object.hasOwn(merged, name)) {
        throw new Error(`模块 ${module.name} 的 ${what} ${name} 与已有的重名`);
      }
      merged[name] = value;
    }
  }
  return merged;
}

const ANONYMOUS: SessionData = { user: null, permissions: [] };

const escape = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const attributes = (record: Record<string, string>) =>
  Object.entries(record)
    .map(([name, value]) => ` ${name}="${escape(value)}"`)
    .join('');

/** 请求处理函数 */
export function createRenderer<C extends object>(
  options: RendererOptions<C>,
): (request: Request) => Promise<Response> {
  const modules = options.modules ?? [];
  const loaders = mergeNamed('loader', options.loaders ?? {}, modules, (m) => m.loaders);
  const actions = mergeNamed('action', options.actions ?? {}, modules, (m) => m.actions);
  let started = false;
  const patterns = Object.keys(loaders);

  /** 地址解析成路由，找到它的 loader */
  async function resolve(path: string, request: Request) {
    const router = options.createRouter(createMemoryHistory());
    await router.push(path);
    await router.isReady();
    const route = router.currentRoute.value;
    const pattern = routePattern(route);
    const load = Object.hasOwn(loaders, pattern) ? loaders[pattern] : undefined;
    const run =
      load &&
      (async (): Promise<PageData> => ({
        pattern,
        value: await load({ params: route.params, query: route.query, request }),
      }));
    return { router, route, run };
  }

  return async (request) => {
    if (!started) {
      started = true;
      for (const module of modules) module.start?.();
    }
    const context = (await options.createContext?.(request)) ?? {};
    const sessionData = options.session?.(context as C) ?? ANONYMOUS;
    const session = createSession(sessionData);
    return runInContext(context, async () => {
      const url = new URL(request.url);
      if (url.pathname === SESSION_PATH) return Response.json(sessionData);
      if (url.pathname === INVALIDATION_PATH && options.invalidation) {
        return options.invalidation.connect(request);
      }
      if (url.pathname.startsWith(ACTION_PATH) && request.method === 'POST') {
        return callAction(url.pathname.slice(ACTION_PATH.length), request, session.can);
      }
      if (url.pathname === DATA_PATH) {
        const { route, run } = await resolve(url.searchParams.get('path') ?? '/', request);
        if (!session.can(route.meta.permission)) {
          return Response.json({ message: `没有权限：${route.meta.permission}` }, { status: 403 });
        }
        if (!run) return Response.json({ message: `${route.path} 没有 loader` }, { status: 404 });
        const { pattern, value } = await run();
        return Response.json(encodeDataResponse(pattern, value));
      }
      return renderPage(url, request, sessionData);
    });
  };

  async function callAction(
    name: string,
    request: Request,
    can: (permission: string | undefined) => boolean,
  ): Promise<Response> {
    try {
      return Response.json(await runAction(actions, name, await request.json(), can));
    } catch (error) {
      if (error instanceof ActionError) {
        return Response.json(
          { message: error.message, issues: error.issues },
          { status: error.status },
        );
      }
      console.error(`action ${name} 出错`, error);
      return Response.json({ message: `action ${name} 出错` }, { status: 500 });
    }
  }

  async function renderPage(
    url: URL,
    request: Request,
    sessionData: SessionData,
  ): Promise<Response> {
    const { router, route, run } = await resolve(url.pathname + url.search, request);
    const ui = options.createUi(router);
    // 预渲染的页面构建时只渲染一次，不能带某个用户的会话：按没登录渲染，浏览器挂载后经 /_session 取
    const prerendered = route.meta.mode === 'static';
    const session = createSession(prerendered ? ANONYMOUS : sessionData);
    const allowed = session.can(route.meta.permission);
    const csr = options.renderMode === 'csr' || route.meta.mode === 'csr';
    // csr 的数据由浏览器经接口取；ssr、static 在这里取好写进页面；没有权限时不取
    const data = run && allowed && !csr ? await run() : null;

    let body = '';
    let teleports = '';
    if (!csr) {
      try {
        const ssrContext: { teleports?: Record<string, string> } = {};
        const app = createSSRApp(options.App).use(router).use(ui);
        providePageData(app, data);
        provideSession(app, shallowRef(session));
        // 组件里的错误 Vue 在生产环境只记一笔、照样渲染完（缺了一块的页面）：记下第一个，当作渲染失败
        let failure: unknown;
        app.config.errorHandler = (error) => (failure ??= error ?? new Error('渲染出错'));
        body = await renderToString(app, ssrContext);
        if (failure !== undefined) throw failure;
        teleports = ssrContext.teleports?.['body'] ?? '';
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
      ...options.assets.css.map((link) => `<link rel="stylesheet"${attributes(link)} />`),
      ...options.assets.js.map((link) => `<link rel="modulepreload"${attributes(link)} />`),
    ];
    const boot = encodeBootData({
      patterns,
      current: data,
      session: prerendered ? null : sessionData,
    });
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
    <script type="module" src="${escape(options.assets.entry ?? '')}"></script>
  </head>
  <body${attributes(attrs.body)}>${teleports}<div id="app">${body}</div><script type="application/json" id="${PAGE_DATA_ID}">${boot}</script></body>
</html>`;
    const status = route.matched.length === 0 ? 404 : allowed ? 200 : 403;
    return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
}
