import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { ConfigContext, useConfig, type Highlighter } from './context';
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
  children?: VNodeChild;
}

const styles = stylex.create({
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
export const Provider = _component(({ theme, lang, highlighter, children }: ProviderProps) => {
  const parent = useConfig();
  const prefersDark = usePrefersDark();
  const currentTheme = _derived(theme ? resolveTheme(theme, prefersDark.value) : parent.theme);
  const currentLang = _derived(lang ? defineLang(parent.lang, lang) : parent.lang);
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
  });

  return () => (
    <div
      {...(theme ? themeAttrs(currentTheme) : {})}
      {...stylex.attrs(styles.root, theme != null && styles.themed)}
      lang={currentLang.code}
      dir={currentLang.direction}
    >
      {children}
    </div>
  );
});
