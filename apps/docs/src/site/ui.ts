/** 文档站的组件库配置：浏览器入口（main.ts）与服务端渲染入口（entry-server.ts）共用，两边渲染出同样的东西 */
import { createUi, type UiPlugin } from '@zerodep-dev/vue-tsx-pro-ui';
import { createPinyinMatcher } from '@zerodep-dev/vue-tsx-pro-ui/pinyin';
import { createShikiHighlighter } from '@zerodep-dev/vue-tsx-pro-ui/shiki';
import { vueRouterAdapter } from '@zerodep-dev/vue-tsx-pro-ui/vue-router';
import type { Router } from 'vue-router';
import { siteTheme } from './theme';

/** 创建文档站的 createUi 插件 */
export function createDocsUi(router: Router): UiPlugin {
  return createUi({
    theme: siteTheme,
    // 整页由主题管理：页面边缘、回弹滚动露出的地方也是主题的底色与字体
    paintDocument: true,
    // 只加载文档里用到的语言（Shiki 的细粒度写法）：默认的全量语言表有两百多种，开发服务器第一次处理要几十秒
    highlighter: createShikiHighlighter({
      languages: {
        tsx: () => import('@shikijs/langs/tsx'),
        ts: () => import('@shikijs/langs/typescript'),
        typescript: () => import('@shikijs/langs/typescript'),
        js: () => import('@shikijs/langs/javascript'),
        javascript: () => import('@shikijs/langs/javascript'),
        json: () => import('@shikijs/langs/json'),
        bash: () => import('@shikijs/langs/shellscript'),
        sh: () => import('@shikijs/langs/shellscript'),
        css: () => import('@shikijs/langs/css'),
        html: () => import('@shikijs/langs/html'),
      },
    }),
    // 选项过滤、站内搜索认拼音（“xlk”搜到“下拉框”）
    textMatcher: createPinyinMatcher(),
    router: vueRouterAdapter(router),
  });
}
