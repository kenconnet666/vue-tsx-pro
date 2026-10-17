import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { defineLang, type Lang } from '../lang/types';
import { themeAttrs, type Theme } from '../theme/themes';
import { colors, fonts, sizes } from '../theme/tokens.stylex';
import { ConfigContext, useConfig } from './context';
import { usePrefersDark } from './prefers-dark';

/** 一个主题，或明暗两套主题（跟随系统 prefers-color-scheme 切换） */
export type ThemeInput = Theme | { readonly light: Theme; readonly dark: Theme };

export interface ProviderProps {
  /** 主题；不写时沿用上层配置 */
  theme?: ThemeInput;
  /** 语言；只写要改的字段，其余沿用上层配置 */
  lang?: Partial<Lang>;
  children?: VNodeChild;
}

const styles = stylex.create({
  // 不产生盒子，不影响布局；主题变量与文字样式照常由子元素继承
  root: { display: 'contents' },
  themed: { color: colors.text, fontFamily: fonts.family, fontSize: sizes.fontSize },
});

export function resolveTheme(input: ThemeInput, prefersDark: boolean): Theme {
  return 'light' in input ? (prefersDark ? input.dark : input.light) : input;
}

/**
 * 局部配置主题与语言，可以嵌套：内层只写要改的部分，其余继承外层。
 * 应用级配置见 createUi。
 */
export const Provider = _component(({ theme, lang, children }: ProviderProps) => {
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
