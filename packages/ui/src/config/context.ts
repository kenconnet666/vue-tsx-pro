/**
 * 组件库配置（主题与语言）的上下文：应用级由 createUi 提供，局部由 <Provider> 覆盖；
 * 都没有时使用默认值（亮色主题 + 简体中文），组件单独使用也能工作。
 */
import { createContext } from '@vue-tsx-pro/tsx';
import type { WorkCalendar } from '../utils/data/workdays';
import type { HttpClient } from '../utils/request/http';
import type { ComponentDefaults } from './defaults';
import type { Lang } from './lang/lang';
import { zhCN } from './lang/zh-CN';
import { lightTheme } from './theme/light';
import type { Theme } from './theme/theme';

/**
 * 代码高亮器：代码 + 语言 → 高亮后的行内 HTML（只含 span 与换行的 br，不含 pre、code），交给 CodeBlock。
 * 组件库不依赖具体实现；Shiki 的实现见子路径 `@vue-tsx-pro/ui/shiki` 的 createShikiHighlighter。
 * 返回的 HTML 直接写进页面，实现方负责转义代码里的文字。
 */
export type Highlighter = (code: string, lang: string) => Promise<string>;

/**
 * 路由适配（参考 React Aria 的 RouterProvider 与 useHref）：组件库不依赖具体的路由库。
 * Link、LinkButton、导航组件渲染的仍是 <a href>；普通左键点击站内链接时改由 navigate 跳转（不刷新页面），
 * 新窗口打开、按着修饰键、外部链接、下载照常交给浏览器。
 *
 *   createUi({ router: { navigate: (href) => router.push(href), isActive: (href) => route.path === href } })
 */
export interface UiRouter {
  /** 站内跳转；收到的是组件上写的原文（/orders），不是 resolve 之后的地址 */
  navigate: (href: string) => void;
  /**
   * 站内链接渲染到 <a href> 上的真实地址：补上路由的 base（/admin/orders）、hash 模式的 #（#/orders），
   * 新标签页打开、复制链接才对。不写时原样渲染
   */
  resolve?: (href: string) => string;
  /** href 是不是当前页：导航组件据此加 aria-current="page"。在渲染时调用，读路由的响应式状态就能跟随变化 */
  isActive?: (href: string) => boolean;
  /**
   * 站内跳转之前问一下（useLeaveConfirmation 用）：guard 返回 false（或 resolve 成 false）时不跳转；返回注销函数。
   * 只在路径变了时问，同一页里换 query、锚点不问
   */
  beforeLeave?: (guard: () => boolean | Promise<boolean>) => () => void;
}

/** 提供方用 getter 暴露当前值，读取方在渲染或 computed 里读取即可跟随变化 */
export interface UiConfig {
  /** 当前主题（明暗已按系统设置选定） */
  readonly theme: Theme;
  /** 当前语言：地区格式与界面文案 */
  readonly lang: Lang;
  /** 代码高亮器；没有时 CodeBlock 显示纯文本 */
  readonly highlighter?: Highlighter;
  /** 组件默认值（见 defaults.ts） */
  readonly defaults: ComponentDefaults;
  /** 路由适配；没有时链接就是普通的页面跳转 */
  readonly router?: UiRouter;
  /** 请求客户端（远程选项、上传、列表查询用）；没有时 useHttp 给一个默认的 createHttpClient() */
  readonly http?: HttpClient;
  /** 工作日历（时限、剩余工作日用）；没有时只按周末算 */
  readonly workCalendar?: WorkCalendar;
  /** 可点击组件按下时的波纹效果，默认开启；组件的 ripple prop 可以单独覆盖 */
  readonly ripple: boolean;
}

/** 配置的注入键：createUi 在应用级提供，Provider 在局部覆盖 */
export const ConfigContext = createContext<UiConfig>('Provider');

/** 默认配置：亮色主题 + 简体中文 */
export const defaultConfig: UiConfig = {
  theme: lightTheme,
  lang: zhCN,
  defaults: {},
  ripple: true,
};

/** 当前的主题与语言配置；没有 createUi 与 Provider 时为默认配置 */
export function useConfig(): UiConfig {
  return ConfigContext.inject(defaultConfig);
}

/**
 * 当前语言：`const lang = useLang()`，之后 `lang.confirm`、`lang.timeZone`。
 * 返回的对象总是转发到最新配置，在渲染函数里读取即可随 Provider 切换语言。
 */
export function useLang(): Lang {
  const config = useConfig();
  // 所有读取都转发到当前语言，展开与 Object.keys 也能拿到完整字段
  return new Proxy({} as Lang, {
    get: (_, key) => Reflect.get(config.lang, key),
    has: (_, key) => Reflect.has(config.lang, key),
    ownKeys: () => Reflect.ownKeys(config.lang),
    getOwnPropertyDescriptor: (_, key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(config.lang, key);
      return descriptor && { ...descriptor, configurable: true };
    },
  });
}
