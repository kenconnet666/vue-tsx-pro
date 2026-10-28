/**
 * 页面的数据（ROADMAP 13.4）：loader 写在只在服务端的文件里，按路由的地址模式登记；页面用 usePageData 取，不知道自己是哪种渲染模式。
 * - 服务端渲染（ssr、static）时直接调用 loader，结果经 json-wire 写进页面，水合时直接用、不再请求
 * - 浏览器里换页、csr 的页面：经 GET /_data?path=… 调用同一个 loader，换页等数据到了才切过去
 *
 *   // src/loaders.ts（只在服务端）
 *   export const loaders = defineLoaders({ '/': async () => ({ greeting: '你好' }) });
 *   // src/data.ts
 *   export const usePageData = pageDataHook<typeof loaders>();
 *   // 页面里
 *   const data = usePageData('/'); data.value?.greeting
 */
import { fromWire, toWire } from '@zerodep-dev/vue-tsx-pro-ui';
import { inject, shallowRef, type App, type InjectionKey, type ShallowRef } from 'vue';
import type { RouteLocationNormalized, Router } from 'vue-router';
import type { SessionData } from './session.ts';

/** loader 拿到的：路由参数、查询参数与原始请求 */
export interface LoadContext {
  params: Record<string, string | string[]>;
  query: Record<string, unknown>;
  request: Request;
}

/** 一个页面的 loader */
export type Loader = (context: LoadContext) => unknown;

/** 地址模式 → loader（只在服务端导入） */
export type Loaders = Record<string, Loader>;

/** 声明 loader（只为类型推导，原样返回） */
export const defineLoaders = <const T extends Loaders>(loaders: T): T => loaders;

/** 服务端写进页面的启动数据（每页都有，csr 的空壳也有）：放在这个 id 的 <script type="application/json"> 里 */
export const PAGE_DATA_ID = '__page_data__';
/** 浏览器取数据的接口 */
export const DATA_PATH = '/_data';

/** 当前页面的数据：哪个地址模式的、数据本身 */
export interface PageData {
  pattern: string;
  value: unknown;
}

/** 页面数据在应用里的样子：当前数据，加上重新取当前页数据的函数（action 改了数据之后） */
interface PageDataState {
  current: ShallowRef<PageData | null>;
  reload: () => Promise<void>;
}

const PageDataKey: InjectionKey<PageDataState> = Symbol('page-data');

/** 路由匹配到的地址模式（最里层的那条路由） */
export const routePattern = (route: RouteLocationNormalized): string =>
  route.matched.at(-1)?.path ?? route.path;

/**
 * 服务端写进页面、浏览器启动时读的：有 loader 的地址模式（浏览器据此决定换页时要不要取数据）、
 * 这一页的数据（csr 时没有）、会话
 */
export interface BootData {
  patterns: string[];
  current: PageData | null;
  /** 预渲染的页面没有（构建时不知道是谁），浏览器挂载后经 /_session 取 */
  session: SessionData | null;
}

/**
 * 写进页面的 JSON 文字（json-wire：bigint、Decimal、日期原样到浏览器）。
 * < 写成 <：数据里的 "</script>" 不会提前结束脚本
 */
export const encodeBootData = (boot: BootData): string =>
  JSON.stringify(toWire(boot)).replaceAll('<', '\\u003c');

/** 浏览器：读服务端写进页面的数据 */
export function readBootData(): BootData {
  const text = document.getElementById(PAGE_DATA_ID)?.textContent;
  if (!text)
    throw new Error(`页面里没有 #${PAGE_DATA_ID}：页面要经服务端入口（createRenderer）发出`);
  return fromWire<BootData>(JSON.parse(text));
}

/** 接口的响应：一页的数据 */
export const encodeDataResponse = (pattern: string, value: unknown): unknown =>
  toWire({ pattern, value } satisfies PageData);

/** 服务端：把这一页的数据交给应用（渲染前调用） */
export function providePageData(app: App, data: PageData | null): void {
  app.provide(PageDataKey, { current: shallowRef(data), reload: async () => {} });
}

/**
 * 浏览器：接管服务端写进页面的数据；之后每次换页、以及首屏没有数据（csr、服务端出错）时经接口取。
 * 有 loader 的地址等数据到了才切过去；取失败时照常换页，页面拿到 null
 */
export function installClientPageData(app: App, router: Router, boot: BootData): void {
  const current = shallowRef(boot.current);

  async function fetchFor(to: RouteLocationNormalized): Promise<void> {
    const pattern = routePattern(to);
    try {
      const response = await fetch(`${DATA_PATH}?path=${encodeURIComponent(to.fullPath)}`);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      current.value = fromWire<PageData>(await response.json());
    } catch (error) {
      console.error(`取 ${to.fullPath} 的数据失败`, error);
      current.value = { pattern, value: null };
    }
  }

  app.provide(PageDataKey, { current, reload: () => fetchFor(router.currentRoute.value) });
  let first = true;
  router.beforeResolve(async (to) => {
    const pattern = routePattern(to);
    // 首屏：服务端已经给了这一页的数据
    const given = first && current.value?.pattern === pattern;
    first = false;
    if (!given && boot.patterns.includes(pattern)) await fetchFor(to);
  });
}

/**
 * 按 loader 的类型生成取数据的组合式函数：usePageData('/orders/:id') 的类型就是那个 loader 的返回值。
 * 数据不是这个地址模式的（还没取到、取失败）时 value 是 undefined；reload() 重新取（action 改了数据之后）
 */
export function pageDataHook<L extends Loaders>() {
  return <P extends keyof L & string>(pattern: P) => {
    const state = inject(PageDataKey, null);
    if (!state) throw new Error('usePageData：应用没有页面数据（服务端入口与浏览器入口会提供它）');
    return {
      get value(): Awaited<ReturnType<L[P]>> | undefined {
        const data = state.current.value;
        return data?.pattern === pattern ? (data.value as Awaited<ReturnType<L[P]>>) : undefined;
      },
      reload: state.reload,
    };
  };
}
