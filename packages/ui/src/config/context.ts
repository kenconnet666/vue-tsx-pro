/**
 * 组件库配置（主题与语言）的上下文：应用级由 createUi 提供，局部由 <Provider> 覆盖；
 * 都没有时使用默认值（亮色主题 + 简体中文），组件单独使用也能工作。
 */
import { createContext } from '@vue-tsx-pro/tsx';
import { zhCN } from '../lang/zh-CN';
import type { Lang } from '../lang/types';
import { lightTheme, type Theme } from '../theme/themes';

/** 提供方用 getter 暴露当前值，读取方在渲染或 computed 里读取即可跟随变化 */
export interface UiConfig {
  readonly theme: Theme;
  readonly lang: Lang;
}

export const ConfigContext = createContext<UiConfig>('Provider');

const defaults: UiConfig = { theme: lightTheme, lang: zhCN };

export function useConfig(): UiConfig {
  return ConfigContext.inject(defaults);
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
