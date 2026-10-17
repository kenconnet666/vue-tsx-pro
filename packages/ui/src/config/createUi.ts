/**
 * 应用级配置：在宿主入口里 `app.use(createUi({ theme, lang }))`，所有 TSX 页面共享，不必逐页包裹 Provider。
 * 传入 ref 或 getter 即可在运行时切换主题与语言。
 */
import {
  computed,
  effectScope,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
  type Plugin,
} from 'vue';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { defineLang, type Lang } from '../lang/types';
import { zhCN } from '../lang/zh-CN';
import { lightTheme, themeVariables, type Theme } from '../theme/themes';
import { ConfigContext } from './context';
import { resolveTheme, type ThemeInput } from './Provider';
import { usePrefersDark } from './prefers-dark';

export interface UiOptions {
  theme?: MaybeRefOrGetter<ThemeInput>;
  /** 只写要改的字段，其余用简体中文的默认值 */
  lang?: MaybeRefOrGetter<Partial<Lang>>;
}

export function createUi(options: UiOptions = {}): Plugin {
  return {
    install(app) {
      const scope = effectScope();
      app.onUnmount(() => scope.stop());
      scope.run(() => {
        const prefersDark = usePrefersDark();
        const theme = computed(() =>
          resolveTheme(toValue(options.theme) ?? lightTheme, prefersDark.value),
        );
        const lang = computed(() => defineLang(zhCN, toValue(options.lang) ?? {}));
        app.provide(ConfigContext.key, {
          get theme() {
            return theme.value;
          },
          get lang() {
            return lang.value;
          },
        });
        // 应用级没有容器元素，主题变量挂在页面根元素上；变量名经过 StyleX 哈希，不会与宿主冲突
        if (options.theme && typeof document !== 'undefined') {
          watchEffect((onCleanup) => onCleanup(applyTheme(document.documentElement, theme.value)));
        }
      });
    },
  };
}

/** 把主题的 class、CSS 变量与 data-theme 写到元素上，返回撤销函数 */
function applyTheme(element: HTMLElement, theme: Theme) {
  const classes = stylex.attrs(theme.styles).class?.split(' ').filter(Boolean) ?? [];
  const variables = themeVariables(theme);
  element.classList.add(...classes);
  for (const [name, value] of Object.entries(variables)) element.style.setProperty(name, value);
  element.dataset.theme = theme.name;
  return () => {
    element.classList.remove(...classes);
    for (const name of Object.keys(variables)) element.style.removeProperty(name);
    delete element.dataset.theme;
  };
}
