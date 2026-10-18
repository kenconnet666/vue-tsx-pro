/**
 * 组件库配置（主题与语言）的上下文：应用级由 createUi 提供，局部由 <Provider> 覆盖；
 * 都没有时使用默认值（亮色主题 + 简体中文），组件单独使用也能工作。
 */
import { createContext } from '@vue-tsx-pro/tsx';
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

/** 提供方用 getter 暴露当前值，读取方在渲染或 computed 里读取即可跟随变化 */
export interface UiConfig {
  /** 当前主题（明暗已按系统设置选定） */
  readonly theme: Theme;
  /** 当前语言：地区格式与界面文案 */
  readonly lang: Lang;
  /** 代码高亮器；没有时 CodeBlock 显示纯文本 */
  readonly highlighter?: Highlighter;
}

/** 配置的注入键：createUi 在应用级提供，Provider 在局部覆盖 */
export const ConfigContext = createContext<UiConfig>('Provider');

/** 默认配置：亮色主题 + 简体中文 */
export const defaultConfig: UiConfig = { theme: lightTheme, lang: zhCN };

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
