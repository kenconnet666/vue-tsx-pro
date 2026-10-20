import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { ConfigContext, useConfig, type Highlighter, type UiRouter } from './context';
import { mergeDefaults, type ComponentDefaults } from './defaults';
import { defineLang, type Lang } from './lang/lang';
import { usePrefersDark } from './theme/prefers-dark';
import { resolveTheme, themeAttrs, type ThemeInput } from './theme/theme';

/** 局部配置；都不写时只是透明的容器，沿用上层配置 */
export interface ProviderProps {
  /** 主题；不写时沿用上层配置 */
  theme?: ThemeInput;
  /** 语言；只写要改的字段，其余沿用上层配置 */
  lang?: Partial<Lang>;
  /** 代码高亮器（CodeBlock 用）；不写时沿用上层配置 */
  highlighter?: Highlighter;
  /** 组件默认值：按组件逐个与上层合并，只写要改的 */
  defaults?: ComponentDefaults;
  /** 路由适配；不写时沿用上层配置 */
  router?: UiRouter;
  /** 波纹效果的开关；不写时沿用上层配置 */
  ripple?: boolean;
  children?: VNodeChild;
}

/** Provider 的样式：root、themed */
export const providerStyles = stylex.create({
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
  ({ theme, lang, highlighter, defaults, router, ripple, children }: ProviderProps) => {
    const parent = useConfig();
    const prefersDark = usePrefersDark();
    const currentTheme = _derived(theme ? resolveTheme(theme, prefersDark.value) : parent.theme);
    const currentLang = _derived(lang ? defineLang(parent.lang, lang) : parent.lang);
    const currentDefaults = _derived(mergeDefaults(parent.defaults, defaults));
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
      get defaults() {
        return currentDefaults;
      },
      get router() {
        return router ?? parent.router;
      },
      get ripple() {
        return ripple ?? parent.ripple;
      },
    });

    return () => (
      <div
        {...(theme ? themeAttrs(currentTheme) : {})}
        {...stylex.attrs(providerStyles.root, theme != null && providerStyles.themed)}
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
      {...stylex.attrs(providerStyles.root, providerStyles.themed)}
      lang={config.lang.code}
      dir={config.lang.direction}
    >
      {children}
    </div>
  );
});
