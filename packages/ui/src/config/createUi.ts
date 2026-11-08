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
  type ObjectPlugin,
} from 'vue';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  ConfigContext,
  defaultConfig,
  type Highlighter,
  type TextMatcher,
  type UiPermissions,
  type UiRouter,
} from './context';
import { splitComponents, type ComponentsOptions } from './components';
import { mergeStyles } from './styles';
import { defineLang, type Lang } from './lang/lang';
import { usePrefersDark } from '../utils/dom/media-query';
import type { FormSources } from '../form/schema-fields';
import type { WorkCalendar } from '../utils/data/workdays';
import type { HttpClient } from '../utils/request/http';
import { resolveTheme, themeVariables, type Theme, type ThemeInput } from './theme/theme';

/** 应用级配置；theme 与 lang 可以传 ref 或 getter，运行时切换，其余在安装时确定 */
export interface UiOptions {
  /** 主题；不写时用亮色主题，也不改动页面根元素 */
  theme?: MaybeRefOrGetter<ThemeInput>;
  /** 只写要改的字段，其余用简体中文的默认值 */
  lang?: MaybeRefOrGetter<Partial<Lang>>;
  /** 代码高亮器（CodeBlock 用），如 `@zerodep-dev/vue-tsx-pro-ui/shiki` 的 createShikiHighlighter()；不写时显示纯文本 */
  highlighter?: Highlighter;
  /** 额外的文字匹配，如 `@zerodep-dev/vue-tsx-pro-ui/pinyin` 的 createPinyinMatcher()：选项过滤、命令面板认拼音；不写时只按字面匹配 */
  textMatcher?: TextMatcher;
  /**
   * 组件的定制：各组件档位的默认值、追加的样式与档位的样式（见 components.ts），如
   * `{ Button: { defaults: { variant: 'outline' }, styles: { root: { letterSpacing: '0.02em' } } } }`
   */
  components?: ComponentsOptions;
  /** 路由适配：站内链接不刷新页面地跳转、导航组件判断当前页（见 UiRouter） */
  router?: UiRouter;
  /** 权限判断：`(权限点) => 用户有没有`，Can、useCan 据此控制按钮等界面；不写时一律放行（见 UiPermissions） */
  permissions?: UiPermissions;
  /** 请求客户端：createHttpClient({ baseURL, onRequest, onResponse })，或包一层 axios、ky（见 HttpClient） */
  http?: HttpClient;
  /** 工作日历：createWorkCalendar({ holidays, workdays }) 带上法定节假日与调休；不写时只按周末算 */
  workCalendar?: WorkCalendar;
  /** 表单的数据来源：SchemaForm 的字典与远程选项（meta 的 source）、人员（control: 'people'）、上传（control: 'file'） */
  formSources?: FormSources;
  /** 按下时的波纹效果，默认 true；关掉后组件的 ripple prop 仍可单独打开 */
  ripple?: boolean;
  /**
   * 页面根元素也用主题的背景色、文字色与字体，并去掉 body 的默认外边距，默认 false。
   * 整页都由组件库主题管理的站点（如文档站）打开：页面边缘、回弹滚动露出的地方不再是浏览器的默认色，
   * AppShell 贴满窗口、四周不留 8px 的白边；配合 themeBootScript 时接手它写的行内颜色
   */
  paintDocument?: boolean;
  /**
   * 内容安全策略（CSP）的 nonce：页面的 style-src 不允许 'unsafe-inline' 时，样式引擎建的 `<style>` 带上它。
   * Vite 配了 `html.cspNonce` 时样式引擎自动读到，不必再写；服务端渲染时把每个请求的 nonce 交给 renderStyleTag
   */
  nonce?: string;
}

/** paintDocument 时页面根元素的样式 */
const documentStyles = css.create({
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

/** 服务端渲染时 `<html>` 与 `<body>` 要带的属性（createUi 在浏览器里写到页面根元素上的那些） */
export interface DocumentAttrs {
  /**
   * `<html>` 的属性：主题的类、变量（style）、data-theme，传了 lang 时还有 lang、dir。
   * data-theme-classes 记下主题的类，防闪烁脚本和浏览器接管时据此换掉，不留下旧主题的类
   */
  html: Record<string, string>;
  /** `<body>` 的属性：paintDocument 时去掉外边距的类 */
  body: Record<string, string>;
}

/** themeClassBoot 的结果 */
export interface ThemeClassBoot {
  /** 内联到 <head> 的脚本，放在 themeBootScript 之后 */
  script: string;
  /** 候选主题的类：交给 renderStyleTag 的 include，它们的规则才在首屏样式里 */
  classes: readonly string[];
}

/** createUi 的结果：Vue 插件，另外能给出服务端渲染时页面根元素的属性 */
export interface UiPlugin extends ObjectPlugin {
  /**
   * 服务端渲染：`<html>`、`<body>` 要带的属性，首屏就是这套主题与语言，不等客户端接管后再变。
   * 服务端不知道系统的明暗，跟随系统的主题按亮色给；`themeBootScript` 在页面加载前按用户的选择改过来
   */
  documentAttrs(): DocumentAttrs;
  /**
   * 服务端渲染的防闪烁：`themeBootScript` 只设底色和文字色，正文里的组件读的是主题变量，要把 <html> 上的主题类也换掉，
   * 否则暗色系统上会先看到暗底配亮色主题的深色字，要等水合才对。主题按这里给的候选表选，规则随首屏样式一起输出：
   *
   *   const boot = ui.themeClassBoot(builtinThemes);
   *   const styles = renderStyleTag(page, { include: boot.classes });
   *   // <head>：<script>themeBootScript(…)</script> <script>boot.script</script> styles
   */
  themeClassBoot(themes: Readonly<Record<string, Theme>>): ThemeClassBoot;
}

/**
 * 应用级配置的 Vue 插件：`app.use(createUi({ theme: { light: lightTheme, dark: darkTheme } }))`。
 * 主题的 CSS 变量写在页面根元素上，所有 TSX 页面共享；应用卸载时撤销。
 */
export function createUi(options: UiOptions = {}): UiPlugin {
  return {
    documentAttrs() {
      const html: Record<string, string> = {};
      const body: Record<string, string> = {};
      if (options.lang) {
        const lang = defineLang(defaultConfig.lang, toValue(options.lang));
        html.lang = lang.code;
        html.dir = lang.direction;
      }
      if (options.theme || options.paintDocument) {
        const theme = resolveTheme(toValue(options.theme) ?? defaultConfig.theme, false);
        const { classes, variables } = rootThemeAttrs(theme, options.paintDocument ?? false);
        if (classes.length) html.class = html['data-theme-classes'] = classes.join(' ');
        const style = Object.entries(variables)
          .map(([name, value]) => `${name}:${value}`)
          .join(';');
        if (style) html.style = style;
        html['data-theme'] = theme.name;
        if (options.paintDocument) body.class = css.attrs(documentStyles.body).class ?? '';
      }
      return { html, body };
    },
    themeClassBoot(themes) {
      const table = Object.fromEntries(
        Object.entries(themes).map(([name, theme]) => [
          name,
          rootThemeAttrs(theme, options.paintDocument ?? false),
        ]),
      );
      return {
        script: themeClassBootScript(table),
        classes: [...new Set(Object.values(table).flatMap(({ classes }) => classes))],
      };
    },
    install(app) {
      if (options.nonce) css.setStyleNonce(options.nonce);
      const configured = splitComponents(options.components);
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
          textMatcher: options.textMatcher,
          defaults: configured?.defaults ?? {},
          styles: mergeStyles({}, configured?.styles),
          router: options.router,
          permissions: options.permissions,
          http: options.http,
          workCalendar: options.workCalendar,
          formSources: options.formSources,
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
        // 应用级没有容器元素，主题变量挂在页面根元素上；变量名带 vtp- 前缀，不会与宿主冲突。
        // 只开 paintDocument、不传主题时用默认主题（整页也要有底色、字体，body 去掉外边距）
        if ((options.theme || options.paintDocument) && typeof document !== 'undefined') {
          const root = document.documentElement;
          // themeBootScript 在应用加载前写的行内颜色：交给主题的 class
          if (options.paintDocument) root.style.removeProperty('background-color');
          if (options.paintDocument) root.style.removeProperty('color');
          // 服务端或防闪烁脚本写的主题类交给 applyTheme：留着的话，旧主题的类和新主题的类同时生效，谁赢全看规则的先后
          const rendered = root.dataset.themeClasses;
          if (rendered) root.classList.remove(...rendered.split(' '));
          delete root.dataset.themeClasses;
          watchEffect((onCleanup) =>
            onCleanup(applyTheme(root, theme.value, options.paintDocument ?? false)),
          );
          if (options.paintDocument && document.body) {
            const body = document.body;
            const classes = css.attrs(documentStyles.body).class?.split(' ') ?? [];
            body.classList.add(...classes);
            app.onUnmount(() => body.classList.remove(...classes));
          }
        }
      });
    },
  };
}

/** 主题挂到页面根元素上的类与 CSS 变量；paint 时加上整页的底色与字体（浏览器里写到元素上，服务端写进 HTML） */
function rootThemeAttrs(theme: Theme, paint: boolean) {
  const classes =
    css
      .attrs(...theme.styles, paint && documentStyles.page)
      .class?.split(' ')
      .filter(Boolean) ?? [];
  return { classes, variables: themeVariables(theme) };
}

/**
 * 防闪烁脚本的第二段：themeBootScript 已按用户的偏好写好 data-theme，这里把服务端写的主题类换成那套主题的。
 * data-theme 不在候选表里时不动（用户自己定制的主题，水合后才有）
 */
function themeClassBootScript(themes: Record<string, ReturnType<typeof rootThemeAttrs>>): string {
  // 主题名来自调用方，写进内联脚本要防 </script>
  const table = JSON.stringify(themes).replaceAll('<', '\\u003c');
  return `(()=>{const c=${table};const r=document.documentElement;const t=c[r.dataset.theme];if(!t)return;const o=r.dataset.themeClasses;if(o)r.classList.remove(...o.split(' '));r.classList.add(...t.classes);r.dataset.themeClasses=t.classes.join(' ');for(const n in t.variables)r.style.setProperty(n,t.variables[n])})()`;
}

/** 把主题的 class、CSS 变量与 data-theme 写到元素上，返回撤销函数 */
function applyTheme(element: HTMLElement, theme: Theme, paint: boolean) {
  const { classes, variables } = rootThemeAttrs(theme, paint);
  element.classList.add(...classes);
  for (const [name, value] of Object.entries(variables)) element.style.setProperty(name, value);
  element.dataset.theme = theme.name;
  return () => {
    element.classList.remove(...classes);
    for (const name of Object.keys(variables)) element.style.removeProperty(name);
    delete element.dataset.theme;
  };
}
