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
import { ConfigContext, defaultConfig, type Highlighter, type UiRouter } from './context';
import type { ComponentDefaults } from './defaults';
import { defineLang, type Lang } from './lang/lang';
import { usePrefersDark } from '../utils/dom/media-query';
import type { WorkCalendar } from '../utils/data/workdays';
import type { HttpClient } from '../utils/request/http';
import { resolveTheme, themeVariables, type Theme, type ThemeInput } from './theme/theme';

/** 应用级配置；theme 与 lang 可以传 ref 或 getter，运行时切换，其余在安装时确定 */
export interface UiOptions {
  /** 主题；不写时用亮色主题，也不改动页面根元素 */
  theme?: MaybeRefOrGetter<ThemeInput>;
  /** 只写要改的字段，其余用简体中文的默认值 */
  lang?: MaybeRefOrGetter<Partial<Lang>>;
  /** 代码高亮器（CodeBlock 用），如 `@vue-tsx-pro/ui/shiki` 的 createShikiHighlighter()；不写时显示纯文本 */
  highlighter?: Highlighter;
  /** 组件默认值，如 `{ Button: { variant: 'outline' } }`（见 defaults.ts） */
  defaults?: ComponentDefaults;
  /** 路由适配：站内链接不刷新页面地跳转、导航组件判断当前页（见 UiRouter） */
  router?: UiRouter;
  /** 请求客户端：createHttpClient({ baseURL, onRequest, onResponse })，或包一层 axios、ky（见 HttpClient） */
  http?: HttpClient;
  /** 工作日历：createWorkCalendar({ holidays, workdays }) 带上法定节假日与调休；不写时只按周末算 */
  workCalendar?: WorkCalendar;
  /** 按下时的波纹效果，默认 true；关掉后组件的 ripple prop 仍可单独打开 */
  ripple?: boolean;
  /**
   * 页面根元素也用主题的背景色、文字色与字体，并去掉 body 的默认外边距，默认 false。
   * 整页都由组件库主题管理的站点（如文档站）打开：页面边缘、回弹滚动露出的地方不再是浏览器的默认色，
   * AppShell 贴满窗口、四周不留 8px 的白边；配合 themeBootScript 时接手它写的行内颜色
   */
  paintDocument?: boolean;
}

/** paintDocument 时页面根元素的样式 */
export const documentStyles = stylex.create({
  // 字号不设：根元素的字号是 rem 的基准，留给浏览器（用户的字号设置）
  page: {
    backgroundColor: '_background',
    color: '_text',
    fontFamily: '_sans',
    lineHeight: '_normal',
    // macOS 上用灰度抗锯齿，深色底上的浅色文字不发虚；其他系统忽略
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  // 浏览器给 body 的 8px 外边距：整页的外壳（AppShell）要贴满窗口
  body: { margin: 0 },
});

/**
 * 应用级配置的 Vue 插件：`app.use(createUi({ theme: { light: lightTheme, dark: darkTheme } }))`。
 * 主题的 CSS 变量写在页面根元素上，所有 TSX 页面共享；应用卸载时撤销。
 */
export function createUi(options: UiOptions = {}): Plugin {
  return {
    install(app) {
      const scope = effectScope();
      app.onUnmount(() => scope.stop());
      scope.run(() => {
        const prefersDark = usePrefersDark();
        const theme = computed(() =>
          resolveTheme(toValue(options.theme) ?? defaultConfig.theme, prefersDark.value),
        );
        const lang = computed(() => defineLang(defaultConfig.lang, toValue(options.lang) ?? {}));
        app.provide(ConfigContext.key, {
          get theme() {
            return theme.value;
          },
          get lang() {
            return lang.value;
          },
          highlighter: options.highlighter,
          defaults: options.defaults ?? {},
          router: options.router,
          http: options.http,
          workCalendar: options.workCalendar,
          ripple: options.ripple ?? true,
        });
        // 应用级的语言也写在页面根元素上（Provider 写在自己的元素上）：读屏按 lang 选发音，
        // 从右到左的语言靠 dir 镜像排版与滚动条；没传 lang 时不动，宿主自己管
        if (options.lang && typeof document !== 'undefined') {
          const root = document.documentElement;
          const previous = { lang: root.lang, dir: root.dir };
          watchEffect(() => {
            root.lang = lang.value.code;
            root.dir = lang.value.direction;
          });
          app.onUnmount(() => Object.assign(root, previous));
        }
        // 应用级没有容器元素，主题变量挂在页面根元素上；变量名经过 StyleX 哈希，不会与宿主冲突
        if (options.theme && typeof document !== 'undefined') {
          const root = document.documentElement;
          // themeBootScript 在应用加载前写的行内颜色：交给主题的 class
          if (options.paintDocument) root.style.removeProperty('background-color');
          if (options.paintDocument) root.style.removeProperty('color');
          watchEffect((onCleanup) =>
            onCleanup(applyTheme(root, theme.value, options.paintDocument ?? false)),
          );
          if (options.paintDocument && document.body) {
            const body = document.body;
            const classes = stylex.attrs(documentStyles.body).class?.split(' ') ?? [];
            body.classList.add(...classes);
            app.onUnmount(() => body.classList.remove(...classes));
          }
        }
      });
    },
  };
}

/** 把主题的 class、CSS 变量与 data-theme 写到元素上，返回撤销函数 */
function applyTheme(element: HTMLElement, theme: Theme, paint: boolean) {
  const classes =
    stylex
      .attrs(...theme.styles, paint && documentStyles.page)
      .class?.split(' ')
      .filter(Boolean) ?? [];
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
