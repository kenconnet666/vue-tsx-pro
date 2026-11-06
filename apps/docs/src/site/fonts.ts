/**
 * 文档站的字体：默认是系统自带的（主题的字体栈：苹方、微软雅黑……），顶栏的字体按钮可以换成等距更纱黑体 SC、
 * 霞鹜文楷等宽（rune-ui-font），选择记在 localStorage。换的是主题的 fonts（正文、标题、代码一起换），
 * 主题编辑器的字体设置再叠在上面；网页字体选到时才加载（挂载之后），分片按页面上出现的字下载，到之前先用系统字体。
 */
import {
  defineTheme,
  usePersistentState,
  type Theme,
  type ThemeOverrides,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { lxgwWenKaiMonoFonts, sarasaMonoScFonts } from 'rune-ui-font';
import { effectScope, watch } from 'vue';

export type SiteFontName = 'system' | 'sarasa' | 'wenkai';

interface SiteFont {
  label: string;
  /** 换进主题的字体族；系统字体不换，用主题本来的 */
  fonts?: ThemeOverrides['fonts'];
  /** 加载字体的 @font-face */
  load?: () => Promise<unknown>;
}

/** 菜单里按这个顺序列出 */
export const siteFonts: Record<SiteFontName, SiteFont> = {
  system: { label: '系统字体（苹方、微软雅黑）' },
  sarasa: {
    label: '等距更纱黑体 SC',
    fonts: sarasaMonoScFonts,
    load: () => import('rune-ui-font/sarasa-mono-sc.css'),
  },
  wenkai: {
    label: '霞鹜文楷等宽',
    fonts: lxgwWenKaiMonoFonts,
    load: () => import('rune-ui-font/lxgw-wenkai-mono.css'),
  },
};

export const siteFont = usePersistentState<SiteFontName>('vue-tsx-pro-font', 'system', {
  validate: (value): value is SiteFontName => typeof value === 'string' && value in siteFonts,
});

// 同一套主题、同一种字体只合一次：主题对象不变，Provider 就不必重写 CSS 变量
const themed = new WeakMap<Theme, Map<SiteFontName, Theme>>();

/** 主题换上选中的字体 */
export function withSiteFont(theme: Theme): Theme {
  const name = siteFont.value;
  const { fonts } = siteFonts[name];
  if (!fonts) return theme;
  let byFont = themed.get(theme);
  if (!byFont) themed.set(theme, (byFont = new Map()));
  let result = byFont.get(name);
  if (!result) byFont.set(name, (result = defineTheme(theme, { fonts })));
  return result;
}

/** 挂载后调用：加载选中的字体，之后换到哪种就加载哪种（加载过的不再下载） */
export function loadSiteFonts(): void {
  effectScope(true).run(() => {
    watch(siteFont, (name) => void siteFonts[name].load?.(), { immediate: true });
  });
}
