/**
 * Shiki 代码高亮器（子路径 `@vue-tsx-pro/ui/shiki`；shiki 是可选的 peer 依赖，用到才安装）：
 *
 *   app.use(createUi({ highlighter: createShikiHighlighter() }))
 *
 * - 正则引擎用 JavaScript 版（不加载 wasm），语法不完全支持的语言尽量高亮而不是报错
 * - 语言按需加载：第一次遇到某种语言时才下载它的语法；不认识的语言按纯文本显示
 * - 颜色用 Shiki 的 CSS 变量主题，默认值指向组件库的颜色 tokens：明暗切换、主题覆盖不需要重新高亮；
 *   使用方也可以用 --shiki-token-keyword 这类变量单独调整
 */
import { createCssVariablesTheme, createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { bundledLanguages } from 'shiki/langs';
import type { LanguageInput } from 'shiki/types';
import type { Highlighter } from '../config/context';
import { colors } from '../config/theme/tokens.stylex';

/** createShikiHighlighter 的选项 */
export interface ShikiHighlighterOptions {
  /**
   * 可用的语言：语言名（含别名，如 ts）→ 加载语法的函数。默认是 Shiki 自带的全部语言，
   * 构建时每种语言单独成块、用到才下载；只想打包少数几种时传 `{ ts: () => import('@shikijs/langs/typescript') }`
   */
  languages?: Record<string, () => Promise<LanguageInput>>;
}

const THEME = 'vue-tsx-pro';

// colors.x 在运行时是 var(--哈希) 字符串，作为 Shiki 变量的默认值：跟随当前主题
const theme = createCssVariablesTheme({
  name: THEME,
  variableDefaults: {
    foreground: String(colors.text),
    background: 'transparent',
    'token-comment': String(colors.textMuted),
    'token-punctuation': String(colors.textMuted),
    'token-keyword': String(colors.accentText),
    'token-link': String(colors.accentText),
    'token-string': String(colors.successText),
    'token-string-expression': String(colors.successText),
    'token-constant': String(colors.infoText),
    'token-function': String(colors.warningText),
    'token-parameter': String(colors.text),
    'token-inserted': String(colors.successText),
    'token-deleted': String(colors.dangerText),
    'token-changed': String(colors.warningText),
  },
});

/** 生成高亮器；Shiki 本身在第一次高亮时才创建，同一个高亮器里的语言只加载一次 */
export function createShikiHighlighter(options: ShikiHighlighterOptions = {}): Highlighter {
  const languages: Record<string, () => Promise<LanguageInput>> =
    options.languages ?? bundledLanguages;
  let core: Promise<HighlighterCore> | undefined;
  const loading = new Map<string, Promise<boolean>>();

  /** 加载语言，返回能否高亮；不认识的语言返回 false */
  const ensureLanguage = (highlighter: HighlighterCore, lang: string) => {
    if (highlighter.getLoadedLanguages().includes(lang)) return Promise.resolve(true);
    const load = languages[lang];
    if (!load) return Promise.resolve(false);
    let pending = loading.get(lang);
    if (!pending) {
      pending = load().then(
        async (grammar) => {
          await highlighter.loadLanguage(grammar);
          return true;
        },
        (error: unknown) => {
          // 下载失败（如断网）不缓存，下次再试
          loading.delete(lang);
          throw error;
        },
      );
      loading.set(lang, pending);
    }
    return pending;
  };

  return async (code, lang) => {
    const highlighter = await (core ??= createHighlighterCore({
      themes: [theme],
      langs: [],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    }));
    const name = lang.toLowerCase();
    const known = await ensureLanguage(highlighter, name);
    return highlighter.codeToHtml(code, {
      lang: known ? name : 'text',
      theme: THEME,
      // 只要行内的 span 与 br，外层的 pre、code 由 CodeBlock 渲染
      structure: 'inline',
    });
  };
}
