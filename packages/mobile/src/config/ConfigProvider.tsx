/**
 * 全局配置：主题（亮色、暗色、跟随系统）与语言。包在应用（或某一块）外面，里面的组件读它：
 *
 *   <ConfigProvider theme="system" lang={enUS}>
 *     <App />
 *   </ConfigProvider>
 *
 * 主题是根元素上只改变量的类，换主题不重新渲染组件；根元素也给出页面的字体、字号、文字颜色。
 * 不包时组件用简体中文、亮色主题。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { darkTheme, systemTheme } from '../theme/dark';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { zhCN, type MobileLang } from './lang';

/** 组件读到的配置 */
export interface MobileConfig {
  /** 语言包 */
  readonly lang: MobileLang;
}

/** 配置的上下文：组件里 `useConfig()` 读 */
export const ConfigContext = createContext<MobileConfig>('ConfigProvider');

const defaultConfig: MobileConfig = { lang: zhCN };

/** 当前的配置；不在 ConfigProvider 里时是默认配置 */
export const useConfig = (): MobileConfig => ConfigContext.inject(defaultConfig);

/** 主题：light 亮色，dark 暗色，system 跟随系统 */
export interface MobileThemes {
  /** 亮色 */
  light: unknown;
  /** 暗色 */
  dark: unknown;
  /** 跟随系统的暗色偏好 */
  system: unknown;
}

/** 未声明的属性落到根元素（div）上；lang 是语言包，不是元素的 lang 属性 */
export interface ConfigProviderProps extends PartProps<'div', 'lang'> {
  /**
   * 主题
   * @default 'light'
   */
  theme?: keyof MobileThemes;
  /**
   * 语言包
   * @default zhCN
   */
  lang?: MobileLang;
  /** 内容 */
  children?: VNodeChild;
}

/** ConfigProvider 的样式：root */
export const configProviderStyles = css.create({
  root: {
    fontFamily: '_sans',
    fontSize: '_md',
    lineHeight: '_normal',
    color: '_text',
    WebkitTapHighlightColor: 'transparent',
    textSizeAdjust: '100%',
  },
});

/** 全局配置：主题与语言；根元素是一个 div */
export const ConfigProvider = _component(
  ({ theme = 'light', lang = zhCN, children, ...rest }: ConfigProviderProps) => {
    ConfigContext.provide({
      get lang() {
        return lang;
      },
    });
    return () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              configProviderStyles.root,
              theme === 'dark' && darkTheme,
              theme === 'system' && systemTheme,
            ],
          },
          rest,
          dataAttrs({ 'data-theme': theme }),
        )}
      >
        {children}
      </div>
    );
  },
);
