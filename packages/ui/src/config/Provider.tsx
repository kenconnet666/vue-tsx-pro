import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import {
  ConfigContext,
  useConfig,
  type Highlighter,
  type TextMatcher,
  type UiPermissions,
  type UiRouter,
} from './context';
import { mergeDefaults, type ComponentDefaults } from './defaults';
import { mergeStyles, type ComponentStyles } from './styles';
import { defineLang, type Lang } from './lang/lang';
import { usePrefersDark } from '../utils/dom/media-query';
import type { WorkCalendar } from '../utils/data/workdays';
import type { HttpClient } from '../utils/request/http';
import { resolveTheme, themeAttrs, type ThemeInput } from './theme/theme';

/** 局部配置；都不写时只是透明的容器，沿用上层配置 */
export interface ProviderProps {
  /** 主题；不写时沿用上层配置 */
  theme?: ThemeInput;
  /** 语言；只写要改的字段，其余沿用上层配置 */
  lang?: Partial<Lang>;
  /** 代码高亮器（CodeBlock 用）；不写时沿用上层配置 */
  highlighter?: Highlighter;
  /** 额外的文字匹配（拼音）；不写时沿用上层配置 */
  textMatcher?: TextMatcher;
  /** 组件默认值：按组件逐个与上层合并，只写要改的 */
  defaults?: ComponentDefaults;
  /** 组件的主题定制：追加在上层的定制之后（见 styles.ts） */
  styles?: ComponentStyles;
  /** 路由适配；不写时沿用上层配置 */
  router?: UiRouter;
  /** 权限判断；不写时沿用上层配置 */
  permissions?: UiPermissions;
  /** 请求客户端；不写时沿用上层配置 */
  http?: HttpClient;
  /** 工作日历；不写时沿用上层配置 */
  workCalendar?: WorkCalendar;
  /** 波纹效果的开关；不写时沿用上层配置 */
  ripple?: boolean;
  children?: VNodeChild;
}

/** Provider 的样式：root、themed */
export const providerStyles = css.create({
  // 不产生盒子，不影响布局；主题变量与文字样式照常由子元素继承
  root: { display: 'contents' },
  themed: {
    color: '_text',
    fontFamily: '_sans',
    fontSize: '_md',
    lineHeight: '_normal',
  },
});

/**
 * 局部配置主题与语言，可以嵌套：内层只写要改的部分，其余继承外层。
 * 应用级配置见 createUi。
 */
export const Provider = _component(
  ({
    theme,
    lang,
    highlighter,
    textMatcher,
    defaults,
    styles,
    router,
    permissions,
    http,
    workCalendar,
    ripple,
    children,
  }: ProviderProps) => {
    const parent = useConfig();
    const prefersDark = usePrefersDark();
    const currentTheme = _derived(theme ? resolveTheme(theme, prefersDark.value) : parent.theme);
    const currentLang = _derived(lang ? defineLang(parent.lang, lang) : parent.lang);
    const currentDefaults = _derived(mergeDefaults(parent.defaults, defaults));
    const currentStyles = _derived(mergeStyles(parent.styles, styles));
    ConfigContext.provide({
      get theme() {
        return currentTheme;
      },
      get lang() {
        return currentLang;
      },
      get highlighter() {
        return highlighter ?? parent.highlighter;
      },
      get textMatcher() {
        return textMatcher ?? parent.textMatcher;
      },
      get defaults() {
        return currentDefaults;
      },
      get styles() {
        return currentStyles;
      },
      get router() {
        return router ?? parent.router;
      },
      get permissions() {
        return permissions ?? parent.permissions;
      },
      get http() {
        return http ?? parent.http;
      },
      get workCalendar() {
        return workCalendar ?? parent.workCalendar;
      },
      get ripple() {
        return ripple ?? parent.ripple;
      },
    });

    return () => (
      <div
        {...(theme ? themeAttrs(currentTheme) : {})}
        {...css.attrs(providerStyles.root, theme != null && providerStyles.themed)}
        lang={currentLang.code}
        dir={currentLang.direction}
      >
        {children}
      </div>
    );
  },
);

/** ConfigScope 的 props */
export interface ConfigScopeProps {
  children?: VNodeChild;
}

/**
 * 给移出 Provider 的内容（Teleport 到 body 的 Toaster 等）重新带上当前的主题、语言与文字方向：
 * 主题变量、lang、dir 都挂在 Provider 的元素上，传送出去的元素不再是它的后代。
 */
export const ConfigScope = _component(({ children }: ConfigScopeProps) => {
  const config = useConfig();
  return () => (
    <div
      {...themeAttrs(config.theme)}
      {...css.attrs(providerStyles.root, providerStyles.themed)}
      lang={config.lang.code}
      dir={config.lang.direction}
    >
      {children}
    </div>
  );
});
