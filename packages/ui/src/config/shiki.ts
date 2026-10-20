/**
 * Shiki 代码高亮器（子路径 `@vue-tsx-pro/ui/shiki`；shiki 是可选的 peer 依赖，用到才安装）：
 *
 *   app.use(createUi({ highlighter: createShikiHighlighter() }))
 *
 * - 正则引擎用 JavaScript 版（不加载 wasm），语法不完全支持的语言尽量高亮而不是报错
 * - 语言按需加载：第一次遇到某种语言时才下载它的语法；不认识的语言按纯文本显示
 * - 颜色用 Shiki 的 CSS 变量主题（另加类型、标签名、属性名三类），默认值指向组件库的代码高亮 tokens（colors.code*）：
 *   切换主题、覆盖 tokens 都不需要重新高亮；使用方也可以用 --shiki-token-keyword 这类变量单独调整
 */
import { createCssVariablesTheme, createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { LanguageInput } from 'shiki/types';
import type { Highlighter } from './context';
import { colors } from './theme/tokens.stylex';

/** createShikiHighlighter 的选项 */
export interface ShikiHighlighterOptions {
  /**
   * 可用的语言：语言名（含别名，如 ts）→ 加载语法的函数。不传时用 Shiki 自带的全部语言（第一次高亮时才加载这张表），
   * 构建时每种语言单独成块、用到才下载。只用几种语言时传上（Shiki 推荐的细粒度写法），开发服务器不用处理两百多种语法：
   * `{ ts: () => import('@shikijs/langs/typescript'), tsx: () => import('@shikijs/langs/tsx') }`
   */
  languages?: Record<string, () => Promise<LanguageInput>>;
}

const THEME = 'vue-tsx-pro';

// colors.x 在运行时是 var(--哈希) 字符串，作为 Shiki 变量的默认值：跟随当前主题
const base = createCssVariablesTheme({
  name: THEME,
  variableDefaults: {
    foreground: String(colors.text),
    background: 'transparent',
    'token-comment': String(colors.codeComment),
    'token-punctuation': String(colors.codeComment),
    'token-keyword': String(colors.codeKeyword),
    'token-link': String(colors.codeKeyword),
    'token-string': String(colors.codeString),
    'token-string-expression': String(colors.codeString),
    'token-constant': String(colors.codeNumber),
    'token-function': String(colors.codeFunction),
    'token-parameter': String(colors.text),
    'token-inserted': String(colors.codeString),
    'token-deleted': String(colors.dangerText),
    'token-changed': String(colors.codeNumber),
  },
});

/** Shiki 的 CSS 变量主题不区分类型、标签名、属性名：追加几条规则，同样可以用 --shiki-token-* 覆盖 */
const extraTokenColors = [
  {
    scope: [
      'entity.name.type',
      'entity.name.class',
      'support.type',
      'support.class',
      'entity.other.inherited-class',
    ],
    settings: { foreground: `var(--shiki-token-type, ${String(colors.codeType)})` },
  },
  {
    scope: ['entity.name.tag', 'support.class.component'],
    settings: { foreground: `var(--shiki-token-tag, ${String(colors.codeTag)})` },
  },
  {
    scope: ['entity.other.attribute-name'],
    settings: { foreground: `var(--shiki-token-attribute, ${String(colors.codeAttribute)})` },
  },
];
const theme = { ...base, tokenColors: [...(base.tokenColors ?? []), ...extraTokenColors] };

/** 生成高亮器；Shiki 本身在第一次高亮时才创建，同一个高亮器里的语言只加载一次 */
export function createShikiHighlighter(options: ShikiHighlighterOptions = {}): Highlighter {
  // 全部语言的表有两百多项、每项一个动态导入：传了 languages 的应用不加载它
  type LanguageTable = Record<string, () => Promise<LanguageInput>>;
  let languages: Promise<LanguageTable> | undefined;
  const languageTable = (): Promise<LanguageTable> =>
    (languages ??= options.languages
      ? Promise.resolve(options.languages)
      : import('shiki/langs').then((module): LanguageTable => module.bundledLanguages));
  let core: Promise<HighlighterCore> | undefined;
  const loading = new Map<string, Promise<boolean>>();

  /** 加载语言，返回能否高亮；不认识的语言返回 false */
  const ensureLanguage = async (highlighter: HighlighterCore, lang: string) => {
    if (highlighter.getLoadedLanguages().includes(lang)) return true;
    const load = (await languageTable())[lang];
    if (!load) return false;
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
